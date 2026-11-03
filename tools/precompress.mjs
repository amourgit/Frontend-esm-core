#!/usr/bin/env node
/** Précompresse (brotli) js/css/json/wasm/svg/html des dist/ — séquentiel, RAM faible. */
import { promises as fs } from 'node:fs';
import { brotliCompress, constants } from 'node:zlib';
import { promisify } from 'node:util';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const br = promisify(brotliCompress);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXT = new Set(['.js', '.css', '.json', '.wasm', '.svg', '.html', '.txt']);
let n = 0, saved = 0;

async function walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { await walk(p); continue; }
    if (!EXT.has(extname(p)) || p.endsWith('.map')) continue;
    const buf = await fs.readFile(p);
    if (buf.length < 1024) continue;
    const out = await br(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 9, [constants.BROTLI_PARAM_SIZE_HINT]: buf.length } });
    if (out.length < buf.length) { await fs.writeFile(p + '.br', out); n++; saved += buf.length - out.length; }
  }
}
for (const app of await fs.readdir(join(ROOT, 'packages/apps'))) {
  const pkg = join(ROOT, 'packages/apps', app, 'package.json');
  try {
    const j = JSON.parse(await fs.readFile(pkg, 'utf8'));
    await walk(resolve(ROOT, 'packages/apps', app, dirname(j.browser || j.main)));
  } catch {}
}
console.log(`[precompress] ${n} fichiers .br, ${(saved / 1048576).toFixed(1)} Mo économisés`);
