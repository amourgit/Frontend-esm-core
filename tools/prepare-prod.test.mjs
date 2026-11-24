import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Racine de test : les outils copiés, une app interne (compilée ou non). */
function root({ built = true } = {}) {
  const r = mkdtempSync(join(tmpdir(), 'egen-prep-'));
  mkdirSync(join(r, 'tools'));
  for (const f of ['prepare-prod.mjs', 'runtime-config.mjs', 'sync-external-apps.mjs', 'external-apps.mjs', 'embed-apps.mjs', 'precompress.mjs']) {
    cpSync(join(HERE, f), join(r, 'tools', f));
  }
  const app = join(r, 'packages/apps/esm-int-app');
  mkdirSync(join(app, 'src'), { recursive: true });
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: '@egen/esm-int-app', version: '1.0.0', browser: 'dist/egen-esm-int-app.js' }));
  if (built) {
    mkdirSync(join(app, 'dist'), { recursive: true });
    writeFileSync(join(app, 'dist/egen-esm-int-app.js'), 'x'.repeat(5000));
  }
  return r;
}

function prepare(r, { env = {}, args = [] } = {}) {
  const res = spawnSync(process.execPath, [join(r, 'tools/prepare-prod.mjs'), '--no-color', ...args], {
    cwd: r,
    env: { ...process.env, EGEN_CONFIG_FILE: '', ...env },
    encoding: 'utf8',
    timeout: 60000,
  });
  return { code: res.status, out: res.stdout + res.stderr };
}

test('tout est prêt : 5 étapes, précompression faite, commande de démarrage affichée (code 0)', () => {
  const r = root();
  const { code, out } = prepare(r);
  assert.equal(code, 0, out);
  for (const n of [1, 2, 3, 4, 5]) assert.match(out, new RegExp(`\\[${n}/5\\]`));
  assert.match(out, /1\/1 apps compilées/);
  assert.match(out, /aucune app externe à synchroniser/);
  assert.match(out, /EGEN_CONFIG_FILE non défini/);
  assert.match(out, /fichiers \.br/);
  assert.match(out, /Prêt en .* Démarrer/);
  assert.match(out, /yarn start:prod/);
  assert.ok(existsSync(join(r, 'packages/apps/esm-int-app/dist/egen-esm-int-app.js.br')), 'le .br existe');
});

test('sortie sans séquences de couleur quand elle n\'est pas un terminal', () => {
  const { out } = prepare(root());
  assert.doesNotMatch(out, /\x1b\[/);
});

test('aucune app compilée : échec à l\'étape 1 avec le conseil « yarn build:prod », le reste non exécuté (code 1)', () => {
  const { code, out } = prepare(root({ built: false }));
  assert.equal(code, 1);
  assert.match(out, /aucune des 1 apps du Core n'est compilée/);
  assert.match(out, /yarn build:prod/);
  assert.match(out, /INTERROMPUE à l'étape « Applications compilées »/);
  assert.equal((out.match(/non exécutée/g) || []).length >= 4, true, 'les 4 étapes suivantes sont signalées non exécutées');
});

test('EGEN_CONFIG_FILE valide : l\'app configurée est nommée, la commande de démarrage le reprend', () => {
  const r = root();
  writeFileSync(join(r, 'conf.json'), JSON.stringify({ '@civitas/esm-penpot-app': { penpotUrl: 'https://d.exemple.org' } }));
  const { code, out } = prepare(r, { env: { EGEN_CONFIG_FILE: 'conf.json' } });
  assert.equal(code, 0, out);
  assert.match(out, /conf\.json valide — 1 app\(s\) configurée\(s\) : @civitas\/esm-penpot-app/);
  assert.match(out, /EGEN_CONFIG_FILE=conf\.json yarn start:prod/);
});

test('EGEN_CONFIG_FILE invalide : échec rapide à l\'étape 2, rien n\'est synchronisé ni précompressé (code 1)', () => {
  const r = root();
  writeFileSync(join(r, 'bad.json'), JSON.stringify({ '@a/b': 'pas un objet' }));
  const { code, out } = prepare(r, { env: { EGEN_CONFIG_FILE: 'bad.json' } });
  assert.equal(code, 1);
  assert.match(out, /doit être un objet/);
  assert.match(out, /INTERROMPUE à l'étape « Configuration runtime »/);
  assert.doesNotMatch(out, /fichiers \.br/);
  assert.equal(existsSync(join(r, 'packages/apps/esm-int-app/dist/egen-esm-int-app.js.br')), false);
});

test('EGEN_CONFIG_FILE absent du disque : échec explicite (code 1)', () => {
  const { code, out } = prepare(root(), { env: { EGEN_CONFIG_FILE: 'nope.json' } });
  assert.equal(code, 1);
  assert.match(out, /illisible/);
});

test('synchronisation en échec : étape 3 nommée, vérification et précompression non exécutées (code 1)', () => {
  const r = root();
  writeFileSync(join(r, 'external-apps.json'), JSON.stringify({ apps: { '@x/esm-y-app': 'file:/chemin/inexistant.tgz' } }));
  const { code, out } = prepare(r);
  assert.equal(code, 1, out);
  assert.match(out, /INTERROMPUE à l'étape « Apps externes \(synchronisation\) »/);
  assert.match(out, /la synchronisation a échoué/);
  assert.doesNotMatch(out, /fichiers \.br/);
});

test('--skip-precompress : étape 5 ignorée, aucun .br produit', () => {
  const r = root();
  const { code, out } = prepare(r, { args: ['--skip-precompress'] });
  assert.equal(code, 0, out);
  assert.match(out, /ignorée \(--skip-precompress\)/);
  assert.equal(existsSync(join(r, 'packages/apps/esm-int-app/dist/egen-esm-int-app.js.br')), false);
});

test('app partiellement compilée : avertissement, mais pas d\'échec', () => {
  const r = root();
  const second = join(r, 'packages/apps/esm-autre-app');
  mkdirSync(second, { recursive: true });
  writeFileSync(join(second, 'package.json'), JSON.stringify({ name: '@egen/esm-autre-app', version: '1.0.0' }));
  const { code, out } = prepare(r);
  assert.equal(code, 0, out);
  assert.match(out, /1\/2 apps compilées/);
  assert.match(out, /1 app\(s\) sans dist\/.*esm-autre-app/);
});
