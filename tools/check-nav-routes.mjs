#!/usr/bin/env node
// Test de cohérence : chaque entrée de navigation déclarée sur le slot
// `topbar-level2-nav` doit pointer vers une route réellement déclarée dans un
// `pages[].route` d'une app (route exacte ou sous-route d'une page).
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SLOT = 'topbar-level2-nav';
const appsDir = 'packages/apps';
const norm = (r) => String(r).replace(/^\/+|\/+$/g, '');

const routesFiles = readdirSync(appsDir)
  .map((d) => join(appsDir, d, 'src', 'routes.json'))
  .filter(existsSync);

const pageRoutes = [];
const entries = [];
for (const file of routesFiles) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  for (const p of json.pages ?? []) if (typeof p.route === 'string') pageRoutes.push(norm(p.route));
  for (const e of json.extensions ?? []) if (e.slot === SLOT) entries.push({ file, e });
}

const errors = [];
for (const { file, e } of entries) {
  const m = e.meta ?? {};
  for (const k of ['section', 'group', 'label', 'route']) {
    if (typeof m[k] !== 'string' || !m[k]) errors.push(`${file}: "${e.name}" — meta.${k} manquant`);
  }
  if (typeof m.route === 'string') {
    const r = norm(m.route);
    if (!pageRoutes.some((p) => r === p || r.startsWith(p + '/'))) {
      errors.push(`${file}: "${e.name}" — route "${m.route}" ne correspond à aucun pages[].route`);
    }
  }
}

if (errors.length) {
  console.error(`Navigation incohérente (${errors.length}) :\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Navigation OK : ${entries.length} entrée(s) sur ${routesFiles.length} routes.json.`);
