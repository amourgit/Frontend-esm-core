import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RuntimeConfigError, buildConfigUrls, loadRuntimeConfig, validateRuntimeConfig } from './runtime-config.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'egen-rc-'));
const write = (name, content) => {
  const f = join(tmp, name);
  writeFileSync(f, typeof content === 'string' ? content : JSON.stringify(content));
  return f;
};

test('un fichier valide est chargé et resérialisé', () => {
  const f = write('ok.json', { '@civitas/esm-penpot-app': { penpotUrl: 'https://design.exemple.org' } });
  const { config, json } = loadRuntimeConfig(f);
  assert.equal(config['@civitas/esm-penpot-app'].penpotUrl, 'https://design.exemple.org');
  assert.deepEqual(JSON.parse(json), config);
});

test('un objet vide est valide (aucune configuration)', () => {
  assert.deepEqual(validateRuntimeConfig({}), {});
});

test('fichier absent : erreur explicite', () => {
  assert.throws(() => loadRuntimeConfig(join(tmp, 'absent.json')), (e) => e instanceof RuntimeConfigError && /illisible/.test(e.message));
});

test('JSON invalide : erreur explicite', () => {
  const f = write('bad.json', '{ "a": ');
  assert.throws(() => loadRuntimeConfig(f), (e) => e instanceof RuntimeConfigError && /JSON valide/.test(e.message));
});

for (const [label, value] of [
  ['tableau', []],
  ['chaîne', 'x'],
  ['null', null],
  ['nombre', 3],
]) {
  test(`racine invalide (${label}) refusée`, () => {
    assert.throws(() => validateRuntimeConfig(value), RuntimeConfigError);
  });
}

test('la configuration d’une app doit être un objet', () => {
  assert.throws(() => validateRuntimeConfig({ '@a/b': 'https://x' }), /doit être un objet/);
  assert.throws(() => validateRuntimeConfig({ '@a/b': [] }), /doit être un objet/);
  assert.throws(() => validateRuntimeConfig({ '@a/b': null }), /doit être un objet/);
});

test('un nom d’app vide est refusé', () => {
  assert.throws(() => validateRuntimeConfig({ '  ': {} }), /nom d'app vide/);
});

test('buildConfigUrls : rien par défaut (comportement historique)', () => {
  assert.deepEqual(buildConfigUrls({ spa: '/egen-civitas/spa', hasFile: false }), []);
});

test('buildConfigUrls : fichier local puis URLs supplémentaires, espaces et vides ignorés', () => {
  assert.deepEqual(
    buildConfigUrls({ spa: '/s', hasFile: true, extra: ' https://a.org/c.json , ,/b.json ' }),
    ['/s/config.json', 'https://a.org/c.json', '/b.json'],
  );
  assert.deepEqual(buildConfigUrls({ spa: '/s', hasFile: false, extra: '/b.json' }), ['/b.json']);
});

// ── serve-prod : le fichier de configuration est servi et donné au Shell ──────
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SPA = '/egen-civitas/spa';

function serverRoot() {
  const root = mkdtempSync(join(tmpdir(), 'egen-sp-'));
  mkdirSync(join(root, 'tools'));
  for (const f of ['serve-prod.mjs', 'external-apps.mjs', 'embed-apps.mjs', 'runtime-config.mjs']) cpSync(join(HERE, f), join(root, 'tools', f));
  // app interne minimale (serve-prod refuse de démarrer sans aucune app compilée)
  const app = join(root, 'packages/apps/esm-int-app');
  mkdirSync(join(app, 'dist'), { recursive: true });
  mkdirSync(join(app, 'src'), { recursive: true });
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: '@egen/esm-int-app', version: '1.0.0', browser: 'dist/egen-esm-int-app.js' }));
  writeFileSync(join(app, 'dist/egen-esm-int-app.js'), 'var _egen_esm_int_app;');
  writeFileSync(join(app, 'src/routes.json'), JSON.stringify({ pages: [{ component: 'root', route: 'int' }] }));
  mkdirSync(join(root, 'shell'));
  writeFileSync(join(root, 'shell/index.html'), '<html><script>initializeSpa({})</script></html>');
  return root;
}

async function waitFor(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url);
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error(`serveur injoignable : ${url}`);
}

test('serve-prod : sans EGEN_CONFIG_FILE, configUrls reste vide et config.json absent', async () => {
  const root = serverRoot();
  const port = 19000 + Math.floor(Math.random() * 900);
  const child = spawn(process.execPath, [join(root, 'tools/serve-prod.mjs')], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', EGEN_SHELL_DIR: join(root, 'shell') },
    stdio: 'ignore',
  });
  try {
    const page = await (await waitFor(`http://127.0.0.1:${port}${SPA}/`)).text();
    assert.match(page, /configUrls:\[\]/);
    assert.equal((await fetch(`http://127.0.0.1:${port}${SPA}/config.json`)).status, 404);
  } finally {
    child.kill();
  }
});

test('serve-prod : EGEN_CONFIG_FILE est servi (no-store) et déclaré dans configUrls', async () => {
  const root = serverRoot();
  const conf = { '@civitas/esm-penpot-app': { penpotUrl: 'https://design.exemple.org' } };
  const file = join(root, 'egen-config.json');
  writeFileSync(file, JSON.stringify(conf));
  const port = 19000 + Math.floor(Math.random() * 900);
  const child = spawn(process.execPath, [join(root, 'tools/serve-prod.mjs')], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', EGEN_SHELL_DIR: join(root, 'shell'), EGEN_CONFIG_FILE: 'egen-config.json', EGEN_CONFIG_URLS: '/autre.json' },
    stdio: 'ignore',
  });
  try {
    const page = await (await waitFor(`http://127.0.0.1:${port}${SPA}/`)).text();
    assert.ok(page.includes(`configUrls:["${SPA}/config.json","/autre.json"]`), page);
    const res = await fetch(`http://127.0.0.1:${port}${SPA}/config.json`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await res.json(), conf);
  } finally {
    child.kill();
  }
});

test('serve-prod : un EGEN_CONFIG_FILE invalide empêche le démarrage (code 1, message explicite)', () => {
  const root = serverRoot();
  writeFileSync(join(root, 'bad.json'), JSON.stringify({ '@a/b': 'pas un objet' }));
  const r = spawnSync(process.execPath, [join(root, 'tools/serve-prod.mjs')], {
    env: { ...process.env, PORT: '19999', EGEN_SHELL_DIR: join(root, 'shell'), EGEN_CONFIG_FILE: 'bad.json' },
    encoding: 'utf8',
    timeout: 15000,
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /doit être un objet/);
});
