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
  for (const k of ['section', 'label', 'route']) {
    if (typeof m[k] !== 'string' || !m[k]) errors.push(`${file}: "${e.name}" — meta.${k} manquant`);
  }
  // `group` est facultatif (entrée sans groupe = lien simple), mais s'il est présent il doit être valide.
  if (m.group !== undefined && (typeof m.group !== 'string' || !m.group)) {
    errors.push(`${file}: "${e.name}" — meta.group doit être une chaîne non vide (ou absent)`);
  }
  if (m.workspaces !== undefined && !(Array.isArray(m.workspaces) && m.workspaces.every((w) => typeof w === 'string' && w))) {
    errors.push(`${file}: "${e.name}" — meta.workspaces doit être un tableau d'identifiants d'espace`);
  }
  // `route` et `sectionRoute` doivent exister dans un pages[].route.
  for (const k of ['route', 'sectionRoute']) {
    if (m[k] === undefined) continue;
    if (typeof m[k] !== 'string' || !m[k]) {
      errors.push(`${file}: "${e.name}" — meta.${k} doit être une chaîne non vide`);
      continue;
    }
    const r = norm(m[k]);
    if (!pageRoutes.some((p) => r === p || r.startsWith(p + '/'))) {
      errors.push(`${file}: "${e.name}" — ${k} "${m[k]}" ne correspond à aucun pages[].route`);
    }
  }
}

if (errors.length) {
  console.error(`Navigation incohérente (${errors.length}) :\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Navigation OK : ${entries.length} entrée(s) sur ${routesFiles.length} routes.json.`);
