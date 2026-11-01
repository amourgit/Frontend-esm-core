#!/usr/bin/env node
// Test de cohérence : chaque entrée de navigation déclarée sur le slot
// `topbar-level2-nav` doit pointer vers une route réellement déclarée dans un
// `pages[].route` d'une app (route exacte ou sous-route d'une page).
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SLOT = 'topbar-level2-nav';
const RAIL_SLOTS = ['shell-rail-left-slot', 'shell-rail-bottom-slot', 'shell-rail-right-slot'];
const appsDir = 'packages/apps';
const norm = (r) => String(r).replace(/^\/+|\/+$/g, '');

const routesFiles = readdirSync(appsDir)
  .map((d) => join(appsDir, d, 'src', 'routes.json'))
  .filter(existsSync);

const pageRoutes = [];
const entries = [];
const railEntries = [];
for (const file of routesFiles) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  for (const p of json.pages ?? []) if (typeof p.route === 'string') pageRoutes.push(norm(p.route));
  for (const e of json.extensions ?? []) {
    if (e.slot === SLOT) entries.push({ file, e });
    if (RAIL_SLOTS.includes(e.slot)) railEntries.push({ file, e });
  }
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

// Options des rails (fenêtres d'outils) : `meta` exploitable par le shell (ToolWindowMeta).
for (const { file, e } of railEntries) {
  const m = e.meta ?? {};
  if (typeof m.title !== 'string' || !m.title) errors.push(`${file}: \"${e.name}\" (${e.slot}) — meta.title manquant`);
  if (m.icon !== undefined && typeof m.icon !== 'string') errors.push(`${file}: \"${e.name}\" — meta.icon doit être une chaîne`);
  if (m.order !== undefined && !Number.isFinite(m.order)) errors.push(`${file}: \"${e.name}\" — meta.order doit être un nombre`);
  if (m.global !== undefined && typeof m.global !== 'boolean') errors.push(`${file}: \"${e.name}\" — meta.global doit être un booléen`);
}

// Garde-fou : l'ancienne sidebar est supprimée du framework ; aucune app ne doit en monter une
// (la navigation passe par les rails/zones et la TopBar niveau 2).
const FORBIDDEN_SIDEBAR = [
  /\bSideNav\b/,
  /\b(setLeftNav|unsetLeftNav|useLeftNav|useLeftNavStore|LeftNavMenu|DashboardExtension|createDashboard)\b/,
  /(?<![\w-])nav-menu-slot\b/,
  /cds--side-nav/,
  /--egen-sidenav-width/,
  /active-left-nav-link/,
];
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const f = join(dir, n);
    if (n === 'node_modules' || n === 'dist') return [];
    return statSync(f).isDirectory() ? walk(f) : [f];
  });
for (const app of readdirSync(appsDir)) {
  const src = join(appsDir, app, 'src');
  if (!existsSync(src)) continue;
  for (const f of walk(src)) {
    if (!/\.(tsx?|scss|css|json)$/.test(f) || /\.test\.tsx?$/.test(f)) continue;
    const text = readFileSync(f, 'utf8');
    for (const re of FORBIDDEN_SIDEBAR) {
      if (re.test(text)) errors.push(`${f}: sidebar interdite (${re}) — utiliser un rail (shell-rail-*-slot) et topbar-level2-nav`);
    }
  }
}

if (errors.length) {
  console.error(`Navigation incohérente (${errors.length}) :\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `Navigation OK : ${entries.length} entrée(s) de TopBar et ${railEntries.length} option(s) de rail sur ${routesFiles.length} routes.json.`,
);
