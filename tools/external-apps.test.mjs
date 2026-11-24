// Tests : `yarn test:tools` (node --test tools/*.test.mjs, aucune dépendance)
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCK_FILE, LOCK_VERSION, checkRoutes, loadExternalApps, sha256, slugify } from './external-apps.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SPA = '/egen-civitas/spa';
const tmp = () => mkdtempSync(join(tmpdir(), 'egen-ext-'));

/** Fabrique un dossier d'apps externes + verrou. */
function fixture({ routes = { pages: [{ component: 'root', route: 'x' }], frameworkRange: '>=4.0.0' }, name = '@acme/esm-hello-app', bundle, lockPatch = {} } = {}) {
  const dir = tmp();
  const appDir = 'acme-esm-hello-app-1.0.0';
  mkdirSync(join(dir, appDir), { recursive: true });
  const content = bundle ?? `var ${slugify(name)}; /* exposes ./start */`;
  writeFileSync(join(dir, appDir, 'acme-esm-hello-app.js'), content);
  if (routes) writeFileSync(join(dir, appDir, 'routes.json'), JSON.stringify(routes));
  const entry = { kind: 'hosted', version: '1.0.0', dir: appDir, entry: 'acme-esm-hello-app.js', sha256: sha256(Buffer.from(content)), ...lockPatch };
  writeFileSync(join(dir, LOCK_FILE), JSON.stringify({ lockVersion: LOCK_VERSION, apps: { [name]: entry } }));
  return dir;
}
const load = (dir, extra = {}) => loadExternalApps({ dir, spaPath: SPA, ...extra });

test('slugify = calcul de importDynamic', () => {
  assert.equal(slugify('@acme/esm-hello-app'), '_acme_esm_hello_app');
});

test('app conforme : publiée avec URL servie par le Core', () => {
  const r = load(fixture());
  assert.equal(r.apps[0].status, 'accepted');
  assert.equal(r.importMap['@acme/esm-hello-app'], `${SPA}/external/acme-esm-hello-app-1.0.0/acme-esm-hello-app.js`);
  assert.equal(r.routes['@acme/esm-hello-app'].version, '1.0.0');
  assert.ok(r.mounts.has('acme-esm-hello-app-1.0.0'));
});

test('dossier sans verrou : rien à publier, pas d\'erreur', () => {
  assert.deepEqual(load(tmp()).apps, []);
});

test('nom déjà pris par une app interne : rejetée', () => {
  const r = load(fixture(), { internalNames: new Set(['@acme/esm-hello-app']) });
  assert.equal(r.apps[0].status, 'rejected');
  assert.deepEqual(r.importMap, {});
});

test('containerDomId inconnu : rejetée (ferait échouer le Shell)', () => {
  const r = load(fixture({ routes: { pages: [{ component: 'root', route: 'x', containerDomId: 'inexistant' }] } }));
  assert.equal(r.apps[0].status, 'rejected');
});

test('pages non tableau : rejetée (invaliderait tout le registry)', () => {
  const r = load(fixture({ routes: { pages: { component: 'root' } } }));
  assert.equal(r.apps[0].status, 'rejected');
});

test('bundle modifié depuis le verrou : rejetée (empreinte)', () => {
  const dir = fixture();
  writeFileSync(join(dir, 'acme-esm-hello-app-1.0.0', 'acme-esm-hello-app.js'), 'var autre;');
  const r = load(dir);
  assert.equal(r.apps[0].status, 'rejected');
  assert.match(r.apps[0].errors.join(' '), /SHA-256/);
});

test('traversée de chemin dans le verrou : rejetée', () => {
  const r = load(fixture({ lockPatch: { dir: '../etc' } }));
  assert.equal(r.apps[0].status, 'rejected');
});

test('conteneur MF absent du bundle : publiée avec réserve', () => {
  const r = load(fixture({ bundle: 'console.log(1)' }));
  assert.equal(r.apps[0].status, 'accepted-with-warnings');
  assert.ok(r.importMap['@acme/esm-hello-app']);
});

test('sans routes.json : publiée mais signalée', () => {
  const r = load(fixture({ routes: null }));
  assert.equal(r.apps[0].status, 'accepted-with-warnings');
  assert.deepEqual(r.routes, {});
});

test('checkRoutes : « routes » pluriel signalé', () => {
  const i = checkRoutes({ pages: [{ component: 'a', routes: 'x' }], frameworkRange: '>=1' });
  assert.ok(i.some((x) => /pluriel/.test(x.message)));
});

test('distante : https accepté, http refusé', () => {
  const dir = tmp();
  mkdirSync(join(dir, 'remote', 'routes'), { recursive: true });
  const routes = Buffer.from(JSON.stringify({ pages: [{ component: 'root', route: 'p' }], frameworkRange: '>=4.0.0' }));
  writeFileSync(join(dir, 'remote/routes/partner-x.json'), routes);
  const mk = (bundle) => writeFileSync(join(dir, LOCK_FILE), JSON.stringify({ lockVersion: LOCK_VERSION, apps: {
    '@partner/x': { kind: 'remote', version: '2.0.0', bundle, routesFile: 'remote/routes/partner-x.json', routesSha256: sha256(routes) } } }));
  mk('https://cdn.partner.org/x.js');
  let r = load(dir);
  assert.equal(r.apps[0].status, 'accepted');
  assert.equal(r.importMap['@partner/x'], 'https://cdn.partner.org/x.js');
  mk('http://cdn.partner.org/x.js');
  r = load(dir);
  assert.equal(r.apps[0].status, 'rejected');
  r = load(dir, { allowHttp: true });
  assert.equal(r.apps[0].status, 'accepted');
});

// ── Intégration : serve-prod dans une racine temporaire ─────────────────────
async function waitFor(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return r; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`serveur injoignable : ${url}`);
}

test('serve-prod : publie, héberge et recharge à chaud une app externe', async () => {
  const root = tmp();
  mkdirSync(join(root, 'tools'));
  for (const f of ['serve-prod.mjs', 'external-apps.mjs', 'embed-apps.mjs', 'runtime-config.mjs']) cpSync(join(HERE, f), join(root, 'tools', f));
  // app interne minimale
  mkdirSync(join(root, 'packages/apps/esm-int-app/dist'), { recursive: true });
  mkdirSync(join(root, 'packages/apps/esm-int-app/src'), { recursive: true });
  writeFileSync(join(root, 'packages/apps/esm-int-app/package.json'), JSON.stringify({ name: '@egen/esm-int-app', version: '1.0.0', browser: 'dist/egen-esm-int-app.js' }));
  writeFileSync(join(root, 'packages/apps/esm-int-app/dist/egen-esm-int-app.js'), 'var _egen_esm_int_app;');
  writeFileSync(join(root, 'packages/apps/esm-int-app/src/routes.json'), JSON.stringify({ pages: [{ component: 'root', route: 'int' }] }));
  // shell factice
  mkdirSync(join(root, 'shell'));
  writeFileSync(join(root, 'shell/index.html'), '<html><script>initializeSpa({})</script></html>');
  // externes : verrou vide au départ
  const ext = join(root, 'external-apps');
  mkdirSync(ext);

  const port = 18000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, [join(root, 'tools/serve-prod.mjs')], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', EGEN_SHELL_DIR: join(root, 'shell') },
    stdio: 'ignore',
  });
  try {
    const base = `http://127.0.0.1:${port}${SPA}`;
    await waitFor(`http://127.0.0.1:${port}/healthz`);
    let im = await (await fetch(`${base}/importmap.json`)).json();
    assert.deepEqual(Object.keys(im.imports), ['@egen/esm-int-app']);
    assert.deepEqual(im.aliases, { '@egen-civitas/esm-int-app': '@egen/esm-int-app' }, 'alias namespace -> paquet (écart E2)');

    // dépôt d'une app externe puis SIGHUP
    const appDir = 'acme-esm-hello-app-1.0.0';
    mkdirSync(join(ext, appDir));
    const bundle = 'var _acme_esm_hello_app; /* ./start */';
    writeFileSync(join(ext, appDir, 'acme-esm-hello-app.js'), bundle);
    writeFileSync(join(ext, appDir, 'routes.json'), JSON.stringify({ pages: [{ component: 'root', route: 'hello' }], frameworkRange: '>=4.0.0' }));
    writeFileSync(join(ext, LOCK_FILE), JSON.stringify({ lockVersion: LOCK_VERSION, apps: {
      '@acme/esm-hello-app': { kind: 'hosted', version: '1.0.0', dir: appDir, entry: 'acme-esm-hello-app.js', sha256: sha256(Buffer.from(bundle)) },
      '@egen/esm-int-app': { kind: 'hosted', version: '9.9.9', dir: appDir, entry: 'acme-esm-hello-app.js' },
    } }));
    child.kill('SIGHUP');
    await new Promise((r) => setTimeout(r, 500));

    im = await (await fetch(`${base}/importmap.json`)).json();
    assert.equal(im.imports['@acme/esm-hello-app'], `${SPA}/external/${appDir}/acme-esm-hello-app.js`);
    assert.match(im.imports['@egen/esm-int-app'], /\/apps\/esm-int-app\//, "l'app interne prime");
    const routes = await (await fetch(`${base}/routes.registry.json`)).json();
    assert.equal(routes['@acme/esm-hello-app'].version, '1.0.0');
    assert.equal(routes['@egen/esm-int-app'].version, '1.0.0');

    const js = await fetch(`${im.imports['@acme/esm-hello-app'].replace(SPA, base)}`);
    assert.equal(js.status, 200);
    assert.equal(await js.text(), bundle);
    assert.equal((await fetch(`${base}/external/${appDir}/../../package.json`)).status === 200, false);

    const status = await (await fetch(`${base}/external-apps.status.json`)).json();
    const byName = Object.fromEntries(status.apps.map((a) => [a.name, a.status]));
    assert.equal(byName['@acme/esm-hello-app'], 'accepted');
    assert.equal(byName['@egen/esm-int-app'], 'rejected');
  } finally {
    child.kill('SIGTERM');
    rmSync(root, { recursive: true, force: true });
  }
});

// ── Garde-fou de peer esm-framework ─────────────────────────────────────────
import { evaluate as evaluatePeers } from './check-framework-peer.mjs';

test('peer esm-framework : ^M.m.p de même majeure, satisfaisable → conforme', () => {
  assert.deepEqual(evaluatePeers('^5.0.1', { a: '^5.0.1', b: '^5.0.0' }), []);
});

test('peer esm-framework : plages larges, majeure différente ou non satisfaisable → refusées', () => {
  const p = evaluatePeers('^5.0.1', { large: '>=3.0.0', etoile: '*', ancienne: '^4.1.0', future: '^5.1.0', absent: undefined, tilde: '~5.0.1' });
  assert.equal(p.length, 6);
  assert.match(p.find((x) => x.startsWith('large')), /pas de la forme/);
  assert.match(p.find((x) => x.startsWith('ancienne')), /majeure 4/);
  assert.match(p.find((x) => x.startsWith('future')), /pas satisfaite/);
  assert.match(p.find((x) => x.startsWith('absent')), /absent/);
});

test('peer esm-framework : plage racine illisible → erreur explicite', () => {
  assert.match(evaluatePeers('>=5', { a: '^5.0.1' })[0], /illisible/);
});

test('le Core respecte la règle (28 apps)', async () => {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, [join(HERE, 'check-framework-peer.mjs')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /conforme/);
});

// ── serve-prod : dist/routes.json (estampillé) prime sur src/routes.json ─────
test('serve-prod publie le frameworkRange de dist/routes.json', async () => {
  const root = tmp();
  mkdirSync(join(root, 'tools'));
  for (const f of ['serve-prod.mjs', 'external-apps.mjs', 'embed-apps.mjs', 'runtime-config.mjs']) cpSync(join(HERE, f), join(root, 'tools', f));
  const app = join(root, 'packages/apps/esm-x-app');
  mkdirSync(join(app, 'dist'), { recursive: true });
  mkdirSync(join(app, 'src'), { recursive: true });
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: '@egen/esm-x-app', version: '2.0.0', browser: 'dist/egen-esm-x-app.js' }));
  writeFileSync(join(app, 'dist/egen-esm-x-app.js'), 'var _egen_esm_x_app;');
  writeFileSync(join(app, 'src/routes.json'), JSON.stringify({ pages: [{ component: 'root', route: 'src-version' }] }));
  writeFileSync(join(app, 'dist/routes.json'), JSON.stringify({ pages: [{ component: 'root', route: 'dist-version' }], frameworkRange: '^5.0.1', version: '2.0.0' }));
  mkdirSync(join(root, 'shell'));
  writeFileSync(join(root, 'shell/index.html'), '<html></html>');

  const run = async (extraEnv) => {
    const port = 19000 + Math.floor(Math.random() * 900);
    const child = spawn(process.execPath, [join(root, 'tools/serve-prod.mjs')], {
      env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', EGEN_SHELL_DIR: join(root, 'shell'), ...extraEnv },
      stdio: 'ignore',
    });
    try {
      await waitFor(`http://127.0.0.1:${port}/healthz`);
      return await (await fetch(`http://127.0.0.1:${port}${SPA}/routes.registry.json`)).json();
    } finally {
      child.kill('SIGTERM');
    }
  };
  try {
    const built = await run({});
    assert.equal(built['@egen/esm-x-app'].frameworkRange, '^5.0.1');
    assert.equal(built['@egen/esm-x-app'].pages[0].route, 'dist-version');
    const fromSrc = await run({ EGEN_ROUTES_FROM_SRC: 'true' });
    assert.equal(fromSrc['@egen/esm-x-app'].frameworkRange, undefined);
    assert.equal(fromSrc['@egen/esm-x-app'].pages[0].route, 'src-version');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
