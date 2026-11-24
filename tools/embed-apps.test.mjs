// Tests : `yarn test:tools` — apps embarquées (kind: "embed"), docs/integration-apps/17 et 18
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMBED_APP_NAME, buildEmbedConfig, buildEmbedRegistry, checkApproved, checkEmbedManifest, checkLimits, embedWarnings } from './embed-apps.mjs';
import { LOCK_FILE, LOCK_VERSION, loadExternalApps, sha256 } from './external-apps.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SPA = '/egen-civitas/spa';
const tmp = () => mkdtempSync(join(tmpdir(), 'egen-embed-'));

const manifest = (over = {}) => ({
  manifestVersion: 1,
  name: '@civitas/esm-studio-app',
  version: '1.2.0',
  title: 'Theme Studio',
  url: 'https://studio.exemple.org',
  route: 'studio',
  technology: 'nextjs',
  navigation: { mode: 'history', basePath: '/' },
  placement: { rail: 'left', icon: 'Palette' },
  capabilities: { theme: {}, notifications: {}, events: { publish: ['app.studio.*'] } },
  ...over,
});

/** Dossier externe + verrou contenant une ou plusieurs apps embarquées. */
function fixture(entries) {
  const dir = tmp();
  mkdirSync(join(dir, 'embed', 'manifests'), { recursive: true });
  const apps = {};
  entries.forEach((e, i) => {
    const m = e.manifest ?? manifest();
    const raw = Buffer.from(JSON.stringify(m));
    const file = `embed/manifests/m${i}.json`;
    writeFileSync(join(dir, file), e.rawOverride ?? raw);
    apps[e.lockName ?? m.name] = { kind: 'embed', version: m.version, manifestFile: file, manifestSha256: e.sha ?? sha256(raw), approved: e.approved ?? { notifications: {}, events: { publish: ['app.*'] } }, ...(e.limits ? { limits: e.limits } : {}) };
  });
  writeFileSync(join(dir, LOCK_FILE), JSON.stringify({ lockVersion: LOCK_VERSION, apps }));
  return dir;
}
const load = (dir, extra = {}) => loadExternalApps({ dir, spaPath: SPA, ...extra });

test('manifeste : cas nominal et erreurs', () => {
  assert.deepEqual(checkEmbedManifest(manifest()), []);
  const errs = checkEmbedManifest(manifest({ url: 'http://x.org', route: 'A B', technology: 'cobol', capabilities: { zzz: {} }, navigation: { mode: 'x' } }));
  assert.ok(errs.length >= 5, errs.join('|'));
  assert.deepEqual(checkEmbedManifest(manifest({ url: 'http://localhost:3000' }), { allowHttp: true }), []);
  assert.ok(checkEmbedManifest(manifest({ url: 'https://u:p@x.org' })).length);
  assert.ok(checkEmbedManifest(null).length);
});

test('plafond approuvé et limites', () => {
  assert.deepEqual(checkApproved({ api: { hosts: ['https://a.org'] }, flags: false }), []);
  assert.ok(checkApproved({ nope: {} }).length);
  assert.ok(checkApproved({ api: 'oui' }).length);
  assert.deepEqual(checkLimits({ requestsPerSecond: 50 }), []);
  assert.ok(checkLimits({ inconnue: 1 }).length);
  assert.ok(checkLimits({ requestsPerSecond: -1 }).length);
});

test('réserves : demandée non approuvée / approuvée non demandée', () => {
  const w = embedWarnings(manifest(), { events: {}, flags: {} });
  assert.ok(w.some((x) => x.includes('notifications') && x.includes('refusée')));
  assert.ok(w.some((x) => x.includes('flags') && x.includes('sans effet')));
  assert.deepEqual(embedWarnings(manifest({ capabilities: { theme: {} } }), {}), []);
});

test('chargeur : une app embarquée est acceptée, sans entrée d’import map ni routes propres', () => {
  const r = load(fixture([{}]));
  assert.equal(r.apps[0].status, 'accepted');
  assert.equal(r.apps[0].kind, 'embed');
  assert.deepEqual(r.importMap, {});
  assert.deepEqual(r.routes, {});
  assert.equal(r.embed.length, 1);
  assert.equal(r.embed[0].manifest.route, 'studio');
  assert.deepEqual(r.embed[0].approved, { notifications: {}, events: { publish: ['app.*'] } });
});

test('registry synthétique : une page par app et un panneau de rail', () => {
  const r = load(fixture([{}]));
  assert.deepEqual(r.embedRegistry.pages, [{ component: 'root', route: 'studio', online: true, offline: false }]);
  assert.equal(r.embedRegistry.extensions.length, 1);
  assert.equal(r.embedRegistry.extensions[0].slot, 'shell-rail-left-slot');
  assert.equal(r.embedRegistry.extensions[0].meta.route, 'studio');
  assert.equal(buildEmbedRegistry([{ name: '@a/b', manifest: manifest({ placement: undefined }) }]).extensions.length, 0);
  assert.deepEqual(buildEmbedConfig(r.embed).apps[0].route, 'studio');
});

test('chargeur : réserves sur l’écart demande / approbation', () => {
  const r = load(fixture([{ approved: {} }]));
  assert.equal(r.apps[0].status, 'accepted-with-warnings');
  assert.ok(r.apps[0].warnings.some((w) => w.includes('notifications')));
});

test('chargeur : rejets (empreinte, nom, route prise, route en double, capacité inconnue, plafond invalide)', () => {
  assert.match(load(fixture([{ sha: 'a'.repeat(64) }])).apps[0].errors.join(' '), /modifié depuis la synchronisation/);
  assert.match(load(fixture([{ lockName: '@autre/nom' }])).apps[0].errors.join(' '), /diffère du nom du verrou/);
  assert.match(load(fixture([{}]), { reservedRoutes: new Set(['studio']) }).apps[0].errors.join(' '), /déjà utilisée par une autre page/);
  const two = load(fixture([{}, { manifest: manifest({ name: '@civitas/esm-autre-app' }) }]));
  assert.deepEqual(two.apps.map((a) => a.status), ['accepted', 'rejected']);
  assert.match(two.apps[1].errors.join(' '), /autre app embarquée/);
  assert.equal(two.embed.length, 1);
  assert.equal(load(fixture([{ manifest: manifest({ capabilities: { zzz: {} } }) }])).apps[0].status, 'rejected');
  assert.equal(load(fixture([{ approved: { nope: {} } }])).apps[0].status, 'rejected');
  assert.equal(load(fixture([{}]), { internalNames: new Set(['@civitas/esm-studio-app']) }).apps[0].status, 'rejected');
});

test('chargeur : une entrée embed n’émet pas l’avertissement « aucun routes.json »', () => {
  const r = load(fixture([{ approved: { notifications: {}, events: { publish: ['app.*'] } } }]));
  assert.ok(!r.apps[0].warnings.some((w) => w.includes('routes.json')));
});

// ── sync : manifeste local, verrou, dérive ──────────────────────────────────
function syncRoot(cfg, m = manifest()) {
  const root = tmp();
  mkdirSync(join(root, 'tools'));
  for (const f of ['sync-external-apps.mjs', 'external-apps.mjs', 'embed-apps.mjs']) cpSync(join(HERE, f), join(root, 'tools', f));
  writeFileSync(join(root, 'egen-app.json'), JSON.stringify(m));
  writeFileSync(join(root, 'external-apps.json'), JSON.stringify(cfg));
  return root;
}
const runSync = (root, ...args) => spawnSync(process.execPath, [join(root, 'tools/sync-external-apps.mjs'), ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, EGEN_EXTERNAL_DIR: '', EGEN_EXTERNAL_APPS: '' } });

test('sync : écrit le manifeste figé et le verrou ; check conforme puis dérive détectée', () => {
  const root = syncRoot({ embed: [{ manifest: './egen-app.json', grants: { notifications: {} }, limits: { requestsPerSecond: 50 } }] });
  const r = runSync(root);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const lock = JSON.parse(readFileSync(join(root, 'external-apps', LOCK_FILE), 'utf8'));
  const e = lock.apps['@civitas/esm-studio-app'];
  assert.equal(e.kind, 'embed');
  assert.equal(e.version, '1.2.0');
  assert.deepEqual(e.approved, { notifications: {} });
  assert.deepEqual(e.limits, { requestsPerSecond: 50 });
  assert.match(e.manifestFile, /^embed\/manifests\/civitas-esm-studio-app\.json$/);
  assert.equal(sha256(readFileSync(join(root, 'external-apps', e.manifestFile))), e.manifestSha256);
  assert.equal(runSync(root, '--check').status, 0);
  writeFileSync(join(root, 'egen-app.json'), JSON.stringify(manifest({ version: '9.9.9' })));
  const drift = runSync(root, '--check');
  assert.equal(drift.status, 1);
  assert.match(drift.stdout + drift.stderr, /dérive : le manifeste/);
});

test('sync : manifeste invalide, doublon et plafond invalide refusés', () => {
  let root = syncRoot({ embed: [{ manifest: './egen-app.json' }] }, { nope: 1 });
  let r = runSync(root);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /invalide/);
  root = syncRoot({ embed: [{ manifest: './egen-app.json' }, { manifest: './egen-app.json' }] });
  r = runSync(root);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /déclarée deux fois/);
  root = syncRoot({ embed: [{ manifest: './egen-app.json', grants: { nope: {} } }] });
  assert.equal(runSync(root).status, 1);
  root = syncRoot({ embed: [{ manifest: './absent.json' }] });
  assert.match(runSync(root).stdout + runSync(root).stderr, /introuvable/);
});

// ── serve-prod : registry fusionné et embed-apps.json ───────────────────────
async function waitFor(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return r; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`serveur injoignable : ${url}`);
}

async function withServer({ embedAppBuilt }, fn) {
  const root = tmp();
  mkdirSync(join(root, 'tools'));
  for (const f of ['serve-prod.mjs', 'external-apps.mjs', 'embed-apps.mjs', 'runtime-config.mjs']) cpSync(join(HERE, f), join(root, 'tools', f));
  const mkApp = (dir, name, pages) => {
    mkdirSync(join(root, 'packages/apps', dir, 'dist'), { recursive: true });
    mkdirSync(join(root, 'packages/apps', dir, 'src'), { recursive: true });
    writeFileSync(join(root, 'packages/apps', dir, 'package.json'), JSON.stringify({ name, version: '1.0.0', browser: `dist/${dir}.js` }));
    writeFileSync(join(root, 'packages/apps', dir, `dist/${dir}.js`), 'var x;');
    writeFileSync(join(root, 'packages/apps', dir, 'src/routes.json'), JSON.stringify({ pages }));
  };
  mkApp('esm-int-app', '@egen/esm-int-app', [{ component: 'root', route: 'int' }]);
  if (embedAppBuilt) mkApp('esm-embed-app', EMBED_APP_NAME, []);
  mkdirSync(join(root, 'shell'));
  writeFileSync(join(root, 'shell/index.html'), '<html><script>initializeSpa({})</script></html>');
  const ext = join(root, 'external-apps');
  mkdirSync(join(ext, 'embed/manifests'), { recursive: true });
  const m = manifest();
  const raw = Buffer.from(JSON.stringify(m));
  writeFileSync(join(ext, 'embed/manifests/m.json'), raw);
  writeFileSync(join(ext, LOCK_FILE), JSON.stringify({ lockVersion: LOCK_VERSION, apps: { [m.name]: { kind: 'embed', version: m.version, manifestFile: 'embed/manifests/m.json', manifestSha256: sha256(raw), approved: { notifications: {}, events: { publish: ['app.*'] } } } } }));
  const port = 18000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, [join(root, 'tools/serve-prod.mjs')], { env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', EGEN_SHELL_DIR: join(root, 'shell') }, stdio: 'ignore' });
  try {
    await waitFor(`http://127.0.0.1:${port}/healthz`);
    await fn(`http://127.0.0.1:${port}${SPA}`);
  } finally {
    child.kill();
  }
}

test('serve-prod : fusionne les pages embarquées dans le registry de l’app générique et publie embed-apps.json', async () => {
  await withServer({ embedAppBuilt: true }, async (base) => {
    const reg = await (await fetch(`${base}/routes.registry.json`)).json();
    assert.deepEqual(reg[EMBED_APP_NAME].pages, [{ component: 'root', route: 'studio', online: true, offline: false }]);
    assert.equal(reg[EMBED_APP_NAME].extensions[0].name, 'embed-civitas-esm-studio-app-rail');
    assert.deepEqual(reg['@egen/esm-int-app'].pages.map((p) => p.route), ['int']);
    const cfgRes = await fetch(`${base}/embed-apps.json`);
    assert.equal(cfgRes.headers.get('cache-control'), 'no-store');
    const cfg = await cfgRes.json();
    assert.equal(cfg.apps.length, 1);
    assert.equal(cfg.apps[0].manifest.url, 'https://studio.exemple.org');
    assert.deepEqual(cfg.apps[0].approved.events, { publish: ['app.*'] });
    const status = await (await fetch(`${base}/external-apps.status.json`)).json();
    assert.equal(status.apps[0].kind, 'embed');
  });
});

test('serve-prod : app générique non compilée → apps embarquées rejetées, rien d’exposé', async () => {
  await withServer({ embedAppBuilt: false }, async (base) => {
    const reg = await (await fetch(`${base}/routes.registry.json`)).json();
    assert.equal(reg[EMBED_APP_NAME], undefined);
    assert.deepEqual((await (await fetch(`${base}/embed-apps.json`)).json()).apps, []);
    const status = await (await fetch(`${base}/external-apps.status.json`)).json();
    assert.equal(status.apps[0].status, 'rejected');
    assert.match(status.apps[0].errors.join(' '), /non compilée/);
  });
});
