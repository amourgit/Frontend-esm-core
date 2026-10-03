#!/usr/bin/env node
// Aligne toutes les dépendances @egen-civitas/* (root, resolutions, apps, e2e, tools)
// sur la dernière version publiée sur npm.
//   node tools/sync-egen-deps.mjs          -> réécrit les package.json (puis lancer `yarn install`)
//   node tools/sync-egen-deps.mjs --check  -> n'écrit rien, échoue si une plage n'est pas à jour
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const check = process.argv.includes('--check');
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
    for (const k of Object.keys(d[s] ?? {})) if (k.startsWith('@egen-civitas/')) names.add(k);
  }
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
      if (!latest[k] || range.startsWith('workspace:')) continue;
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

if (check && stale) {
  console.error(`${stale} plage(s) @egen-civitas/* en retard. Lancer : yarn deps:egen && yarn install`);
  process.exit(1);
}
console.log(
  stale ? `${stale} plage(s) mises à jour. Lancer \`yarn install\`.` : 'Toutes les plages @egen-civitas/* sont à jour.',
);
