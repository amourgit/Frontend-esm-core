#!/usr/bin/env node
// Aligne toutes les dépendances @egen-civitas/* (root, resolutions, apps, e2e, tools)
// sur la dernière version publiée sur npm.
//   node tools/sync-egen-deps.mjs          -> réécrit les package.json (puis lancer `yarn install`)
//   node tools/sync-egen-deps.mjs --check  -> n'écrit rien, échoue si une plage n'est pas à jour
//   node tools/sync-egen-deps.mjs --ignore @egen-civitas/esm-theme,@egen-civitas/esm-styleguide
//   node tools/sync-egen-deps.mjs --ignore=@egen-civitas/esm-theme --ignore=@egen-civitas/esm-styleguide
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const check = process.argv.includes('--check');
const ignoreArg = process.argv.find((arg) => arg.startsWith('--ignore='));
const ignorePackages = new Set(
  ignoreArg
    ? ignoreArg
        .split('=')[1]
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
    : [],
);
// Support --ignore package1 package2 (jusqu'à la prochaine option)
const ignoreIndex = process.argv.indexOf('--ignore');
if (ignoreIndex !== -1) {
  for (let i = ignoreIndex + 1; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--')) break;
    ignorePackages.add(arg);
  }
}
const SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'resolutions', 'overrides'];

const files = ['package.json'];
for (const dir of ['packages/apps', 'packages/tools', 'tools', 'e2e']) {
  if (!existsSync(dir)) continue;
  if (existsSync(join(dir, 'package.json'))) files.push(join(dir, 'package.json'));
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, d.name, 'package.json');
    if (d.isDirectory() && existsSync(f)) files.push(f);
  }
}

const docs = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));
const names = new Set();
for (const raw of docs.values()) {
  const d = JSON.parse(raw);
  for (const s of [...SECTIONS, 'peerDependencies']) {
    for (const k of Object.keys(d[s] ?? {})) {
      if (k.startsWith('@egen-civitas/') && !ignorePackages.has(k)) names.add(k);
    }
  }
}

// Noms présents dans yarn.lock (dépendances transitives incluses)
const lockText = existsSync('yarn.lock') ? readFileSync('yarn.lock', 'utf8') : '';
const lockBlocks = lockText.split('\n\n');
for (const m of lockText.matchAll(/"?(@egen-civitas\/[^@"\s,]+)@/g)) {
  if (!ignorePackages.has(m[1])) names.add(m[1]);
}

const latest = {};
await Promise.all(
  [...names].map(async (n) => {
    const res = await fetch(`https://registry.npmjs.org/${n}/latest`);
    if (!res.ok) throw new Error(`${n}: npm a répondu ${res.status}`);
    latest[n] = (await res.json()).version;
  }),
);

let stale = 0;
for (const [f, raw] of docs) {
  const d = JSON.parse(raw);
  let changed = false;
  for (const s of SECTIONS) {
    for (const [k, range] of Object.entries(d[s] ?? {})) {
      if (!latest[k] || range.startsWith('workspace:') || ignorePackages.has(k)) continue;
      const want = `^${latest[k]}`;
      if (range !== want) {
        console.log(`${f} [${s}] ${k}: ${range} -> ${want}`);
        d[s][k] = want;
        changed = true;
        stale++;
      }
    }
  }
  if (changed && !check) writeFileSync(f, JSON.stringify(d, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
}

// yarn.lock : une plage satisfaite par une ancienne version reste figée tant que le lock n'est pas rafraîchi
// (ex. esm-framework dépend de esm-api ^1.1.1 -> le lock garde 1.1.1 même si 1.1.2 existe).
let staleLock = 0;
for (const block of lockBlocks) {
  const head = block.match(/^"?([^\n]*?)"?:\n {2}version: (\S+)/);
  if (!head) continue;
  for (const key of head[1].split(', ')) {
    const m = key.replace(/"/g, '').match(/^(@egen-civitas\/[^@]+)@/);
    if (m && !ignorePackages.has(m[1]) && latest[m[1]] && latest[m[1]] !== head[2]) {
      console.log(`yarn.lock: ${key} -> ${head[2]} (latest ${latest[m[1]]})`);
      staleLock++;
    }
  }
}

if (check && (stale || staleLock)) {
  console.error(
    `${stale} plage(s) et ${staleLock} entrée(s) de yarn.lock @egen-civitas/* en retard. Lancer : yarn deps:egen`,
  );
  process.exit(1);
}
console.log(
  stale ? `${stale} plage(s) mises à jour.` : 'Toutes les plages @egen-civitas/* sont à jour.',
  staleLock ? `${staleLock} entrée(s) de yarn.lock à rafraîchir (yarn up -R).` : 'yarn.lock à jour.',
);

// Si pas en mode --check et qu'il y a des mises à jour, lancer yarn up -R
// en excluant les packages ignorés
if (!check && stale > 0) {
  const { execSync } = await import('node:child_process');
  let cmd = "yarn up -R '@egen-civitas/*'";
  if (ignorePackages.size > 0) {
    const ignoreFlags = [...ignorePackages].map((p) => `--ignore-pattern=${p}`).join(' ');
    cmd = `yarn up -R '@egen-civitas/*' ${ignoreFlags}`;
  }
  console.log(`\nExécution : ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
    console.error('Erreur lors de l\'exécution de yarn up:', error.message);
    process.exit(1);
  }
}
