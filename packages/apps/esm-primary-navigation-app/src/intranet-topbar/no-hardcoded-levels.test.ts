import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Garde-fou : la TopBar est faite de N niveaux ; aucun niveau n'a de fichier, de composant ni de branche à son nom.
// Si ce test échoue, un numéro de niveau s'est glissé dans le code : le déplacer dans la config ou le placement.

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
});
