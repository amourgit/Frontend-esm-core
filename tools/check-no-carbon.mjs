#!/usr/bin/env node
// Garde-fou « zéro Carbon / zéro SCSS » du core : échoue si un fichier `.scss`, une mention de `@carbon/` ou de classes `cds--`,
// ou une dépendance `sass*` réapparaît dans packages/. Voir docs/PLAN-RETRAIT-CARBON-SCSS.md (dépôt framework).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SKIP = new Set(['node_modules', 'dist', 'coverage', '.turbo']);
const TEXT = /\.(ts|tsx|js|jsx|mjs|cjs|css|json|ejs|html)$/;
const CARBON = /@carbon\/|carbon-components|\bcds-{1,2}[a-z]|\.s[ac]ss(['"?]|\b)/;
const SASS_DEP = /"(sass|sass-loader|sass-embedded|@rsbuild\/plugin-sass)"\s*:/;

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(full);
  }
};
walk(join(ROOT, 'packages'));

const problems = [];
for (const file of files) {
  const rel = relative(ROOT, file);
  if (/\.(scss|sass)$/.test(file)) problems.push(`${rel} : fichier SCSS`);
  else if (TEXT.test(file) && !file.endsWith('CHANGELOG.md')) {
    const text = readFileSync(file, 'utf-8');
    if (CARBON.test(text)) problems.push(`${rel} : mention de Carbon ou d'un import .scss`);
    if (file.endsWith('package.json') && SASS_DEP.test(text)) problems.push(`${rel} : dépendance sass`);
  }
}
if (problems.length) {
  console.error(`Carbon / SCSS réintroduits (${problems.length}) :\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('Aucun Carbon ni SCSS dans packages/.');
