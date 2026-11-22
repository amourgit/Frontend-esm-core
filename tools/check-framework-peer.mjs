#!/usr/bin/env node
/**
 * Garde-fou « plage de peer `@egen-civitas/esm-framework` » des apps du Core.
 *
 * Pourquoi : au build, `rspack-config` copie la plage du peer `@egen-civitas/esm-framework` dans
 * `dist/routes.json` (`frameworkRange`). Au chargement, le Shell écarte l'app si cette plage n'est pas
 * satisfaite par sa propre version du framework (`process.env.FRAMEWORK_VERSION`). Une plage trop large
 * (ex. `>=3.0.0`) ne protège de rien : elle accepte toute version future, majeures cassantes comprises.
 *
 * Règle imposée : le peer est une plage **caret sur une version complète** (`^M.m.p`), de **même majeure**
 * que le framework utilisé par le Core (`resolutions` du package.json racine), et **satisfaisable** par
 * celui-ci (`M.m.p` ≤ version utilisée). Ni `>=`, ni `*`, ni majeure différente.
 *
 *   node tools/check-framework-peer.mjs        échoue (code 1) si une app ne respecte pas la règle
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CARET = /^\^(\d+)\.(\d+)\.(\d+)$/;
const FRAMEWORK = '@egen-civitas/esm-framework';

const parse = (range) => {
  const m = CARET.exec(range ?? '');
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/**
 * @param {string} used  plage du framework utilisé par le Core (ex. `^5.0.1`)
 * @param {Record<string, string|undefined>} peers  app -> plage du peer
 * @returns {string[]} problèmes (vide si conforme)
 */
export function evaluate(used, peers) {
  const base = parse(used);
  if (!base) return [`plage du framework utilisé illisible dans le package.json racine : « ${used} » (forme ^M.m.p attendue)`];
  const problems = [];
  for (const [app, range] of Object.entries(peers)) {
    if (range === undefined) {
      problems.push(`${app} : peer ${FRAMEWORK} absent`);
      continue;
    }
    const v = parse(range);
    if (!v) problems.push(`${app} : « ${range} » n'est pas de la forme ^M.m.p (le garde-fou frameworkRange serait inopérant)`);
    else if (v[0] !== base[0]) problems.push(`${app} : majeure ${v[0]} ≠ majeure ${base[0]} du framework utilisé (${used})`);
    else if (cmp(v, base) > 0) problems.push(`${app} : « ${range} » n'est pas satisfaite par le framework utilisé (${used})`);
  }
  return problems;
}

function main() {
  const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
  const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const used = rootPkg.resolutions?.[FRAMEWORK] ?? rootPkg.dependencies?.[FRAMEWORK] ?? rootPkg.devDependencies?.[FRAMEWORK];
  const appsDir = join(root, 'packages', 'apps');
  const peers = {};
  for (const dir of readdirSync(appsDir)) {
    const f = join(appsDir, dir, 'package.json');
    if (existsSync(f)) peers[dir] = JSON.parse(readFileSync(f, 'utf8')).peerDependencies?.[FRAMEWORK];
  }
  const problems = evaluate(used, peers);
  if (problems.length) {
    console.error(`Plage de peer ${FRAMEWORK} non conforme (${problems.length}) :\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`Peer ${FRAMEWORK} conforme (${Object.keys(peers).length} apps, framework utilisé ${used}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
