import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Garde-fou : les niveaux de la TopBar sont DÉCLARÉS par les apps ; le kit n'en connaît aucun (ni numéro, ni nom), et
// aucun slot n'encode un niveau (`topbar-l<N>-<région>-slot`…). Si ce test échoue, un niveau s'est glissé dans le code : le
// déplacer dans la déclaration d'une app (`meta.topbar`) ou dans global/placement.ts.

const root = __dirname;
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk(root);
const sources = files.filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f));

describe('aucun niveau figé dans le code', () => {
  it('aucun nom de fichier ne porte un numéro de niveau', () => {
    const bad = files.map((f) => relative(root, f)).filter((f) => /(level|niveau)-?\d/i.test(f.split('/').pop()!));
    expect(bad).toEqual([]);
  });

  it('aucun identifiant ne porte un numéro de niveau (Level2, NavItem2, level1…)', () => {
    const offenders: string[] = [];
    for (const f of sources) {
      const code = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .replace(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g, "''");
      const hit = code.match(/\b[A-Za-z_]*(?:Level|level|Niveau|niveau|NavItem|Nav)[0-9]+[A-Za-z_]*\b/);
      if (hit) offenders.push(`${relative(root, f)} : ${hit[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('aucune branche ne teste un numéro de niveau précis (level === 1…)', () => {
    const offenders: string[] = [];
    for (const f of sources) {
      const code = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      const hit = code.match(/\blevel\s*[!=]==?\s*\d+|\b\d+\s*[!=]==?\s*level\b/);
      if (hit) offenders.push(`${relative(root, f)} : ${hit[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('aucun slot de la TopBar ne porte un niveau ou une région dans son nom (un seul slot neutre)', () => {
    const offenders: string[] = [];
    for (const f of files.filter((x) => /\.(ts|tsx|json|md)$/.test(x) && x !== __filename)) {
      const hit = readFileSync(f, 'utf8').match(/topbar-(?:l\d+|level\d*)-[a-z-]+|top-nav-level\d[a-z-]*/);
      if (hit) offenders.push(`${relative(root, f)} : ${hit[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('le kit ne nomme aucun niveau : les noms de niveaux ne vivent que dans les déclarations des apps', () => {
    const kit = sources.filter((f) => relative(root, f).startsWith('kit/'));
    const offenders: string[] = [];
    for (const f of kit) {
      const code = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      const hit = code.match(/['"`](?:main|navigation|primary|secondary|principal)['"`]/);
      if (hit) offenders.push(`${relative(root, f)} : ${hit[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('aucune app du monorepo ne déclare un slot figé sur un niveau : toutes passent par `topbar-slot` + `meta.topbar`', () => {
    const apps = join(root, '../../..');
    const offenders: string[] = [];
    for (const app of readdirSync(apps)) {
      let routes: { extensions?: Array<{ name: string; slot: string; meta?: { topbar?: unknown } }> };
      try {
        routes = JSON.parse(readFileSync(join(apps, app, 'src/routes.json'), 'utf8'));
      } catch {
        continue;
      }
      for (const e of routes.extensions ?? []) {
        if (/^topbar-(?:l\d+|level\d*)-|^top-nav-(?:level|actions|trailing|info|app)/.test(e.slot))
          offenders.push(`${app} : ${e.name} → ${e.slot}`);
        if (e.slot === 'topbar-slot' && !e.meta?.topbar) offenders.push(`${app} : ${e.name} sans meta.topbar`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
