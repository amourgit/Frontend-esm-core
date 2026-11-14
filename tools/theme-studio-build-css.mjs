#!/usr/bin/env node
// Compile `src/tweakcn/tweakcn.source.css` (Tailwind v4) puis SCOPE chaque règle sous `.tweakcn-root`
// → `src/tweakcn/tweakcn.generated.tw.css` (commité, comme les autres fichiers générés du dépôt).
//
// Pourquoi : le shell EGEN charge déjà une feuille Tailwind globale dont les tokens (`bg-primary`, `rounded-lg`, `dark:`…)
// ont un autre sens que ceux de TweakCN. Scoper garantit qu'aucune règle de l'éditeur ne fuit dans le shell
// (et inversement). Usage : node tools/theme-studio-build-css.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = process.cwd();
const dir = path.join(root, 'packages/apps/esm-theme-studio-app');
const from = path.join(dir, 'src/tweakcn/tweakcn.source.css');
const out = path.join(dir, 'src/tweakcn/tweakcn.generated.tw.css');
const SCOPE = '.tweakcn-root';

const postcss = require(require.resolve('postcss', { paths: [dir, root] }));
const tailwind = require(require.resolve('@tailwindcss/postcss', { paths: [dir, root] }));

const scopeSelector = (sel) => {
  const s = sel.trim();
  if (s.startsWith(SCOPE)) return s;
  if (s === ':root' || s === ':host' || s === 'html' || s === 'body') return SCOPE;
  return `${SCOPE} ${s.replace(/^(:root|:host|html|body)\b\s*/, '')}`.trimEnd();
};

const scopePlugin = {
  postcssPlugin: 'theme-studio-scope',
  Once(css) {
    css.walkRules((rule) => {
      let p = rule.parent;
      while (p && p.type !== 'root') {
        if (p.type === 'atrule' && /keyframes$/.test(p.name)) return;
        p = p.parent;
      }
      rule.selectors = [...new Set(rule.selectors.map(scopeSelector))];
    });
  },
};

const input = fs.readFileSync(from, 'utf8');
const result = await postcss([tailwind({ optimize: false }), scopePlugin]).process(input, { from });
const header = '/* GÉNÉRÉ par tools/theme-studio-build-css.mjs — ne pas modifier à la main. */\n';
fs.writeFileSync(out, header + result.css);
console.log(`écrit ${path.relative(root, out)} (${(result.css.length / 1024).toFixed(0)} Ko)`);
