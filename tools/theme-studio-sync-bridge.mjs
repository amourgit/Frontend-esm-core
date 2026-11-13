#!/usr/bin/env node
// Génère `src/core/carbon-bridge.generated.ts` à partir du pont Carbon du framework (_carbon-bridge.scss).
// Pourquoi : le pont déclare les `--cds-*` sur `:root` ; la prévisualisation du Studio doit les REdéclarer sur son conteneur
// pour que Carbon suive le thème ÉDITÉ (et non celui de l'application). Usage :
//   node tools/theme-studio-sync-bridge.mjs [chemin/_carbon-bridge.scss]
import { readFileSync, writeFileSync } from 'node:fs';

const candidates = [
  process.argv[2],
  'node_modules/@egen-civitas/esm-styleguide/src/_carbon-bridge.scss',
  '../framework/packages/framework/esm-styleguide/src/_carbon-bridge.scss',
].filter(Boolean);

const source = candidates.find((p) => {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
});
if (!source) {
  console.error('Pont Carbon introuvable. Passer le chemin de _carbon-bridge.scss en argument.');
  process.exit(1);
}

const text = readFileSync(source, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const entries = [...text.matchAll(/^\s*(--cds-[\w-]+)\s*:\s*(.+?);\s*(?:\/\/.*)?$/gm)].map((m) => [m[1], m[2].trim()]);
if (entries.length < 50) {
  console.error(`Seulement ${entries.length} variables lues — format du pont modifié ?`);
  process.exit(1);
}

const body = entries.map(([k, v]) => `  '${k}': ${JSON.stringify(v)},`).join('\n');
writeFileSync(
  'packages/apps/esm-theme-studio-app/src/core/carbon-bridge.generated.ts',
  `// GÉNÉRÉ par tools/theme-studio-sync-bridge.mjs — ne pas modifier à la main.\n// Source : _carbon-bridge.scss (${entries.length} variables)\nexport const CARBON_BRIDGE: Record<string, string> = {\n${body}\n};\n`,
);
console.log(`${entries.length} variables --cds-* écrites depuis ${source}`);
