#!/usr/bin/env node
/**
 * Serveur de PRODUCTION EGEN — statique, zéro dépendance, ~40-80 Mo de RAM.
 *
 * Remplace `egen develop` (qui lance 1 dev-server rspack PAR application,
 * donc ~18 processus/compilateurs en mémoire) par :
 *   - lecture des dist/ déjà compilés (yarn build:apps) ;
 *   - import map + routes registry générés une fois au démarrage ;
 *   - app-shell pré-compilé servi tel quel ;
 *   - fichiers streamés depuis le disque (précompressés .br/.gz si présents) ;
 *   - proxy optionnel de l'API vers EGEN_BACKEND.
 *
 * Apps EXTERNES : publiées depuis external-apps/external-apps.lock.json (généré par
 * `yarn external:sync`), validées par tools/external-apps.mjs (une app fautive est
 * rejetée, jamais publiée), rechargeables à chaud par `kill -HUP <pid>`.
 *
 * Variables : PORT, HOST, EGEN_SPA_PATH, EGEN_API_URL, EGEN_BACKEND,
 *             EGEN_BRAND_DIR, EGEN_OFFLINE, EGEN_TENANT_* (cf. RUNTIME_BRIDGED_VARS),
 *             EGEN_EXTERNAL_DIR, EGEN_EXTERNAL_STRICT, EGEN_EXTERNAL_ALLOW_HTTP,
 *             EGEN_ROUTES_FROM_SRC, EGEN_IMPORTMAP_ALIASES,
 *             EGEN_CONFIG_FILE, EGEN_CONFIG_URLS (configuration runtime des apps, voir runtime-config.mjs).
 */
import http from 'node:http';
import https from 'node:https';
import { createRequire } from 'node:module';
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatReport, loadExternalApps } from './external-apps.mjs';
import { EMBED_APP_NAME, buildEmbedConfig } from './embed-apps.mjs';
import { RuntimeConfigError, buildConfigUrls, loadRuntimeConfig } from './runtime-config.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const log = (...a) => console.log('[egen-prod]', ...a);

// ── .env (optionnel) : process.env prioritaire ──────────────────────────────
function loadDotenv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadDotenv(resolve(ROOT, '.env.production'));
loadDotenv(resolve(ROOT, '.env'));

const env = process.env;
const trim = (s) => s.replace(/\/+$/, '');
const PORT = Number(env.PORT || 8080);
const HOST = env.HOST || '0.0.0.0';
const SPA = trim(env.EGEN_SPA_PATH || '/egen-civitas/spa');
const API = trim(env.EGEN_API_URL || '/egen-civitas');
const BACKEND = env.EGEN_BACKEND ? new URL(env.EGEN_BACKEND) : null;
const OFFLINE = env.EGEN_OFFLINE === 'true';
// Alias d'import map : namespace i18n/config des apps internes (`@egen-civitas/<app>`) -> nom du paquet
// (`@egen/<app>`), pour que le Shell retrouve les traductions (cf. docs/integration-apps/08, écart E2).
const ROUTES_FROM_SRC = env.EGEN_ROUTES_FROM_SRC === 'true'; // true : ignorer dist/routes.json (dépannage)
const IMPORTMAP_ALIASES = env.EGEN_IMPORTMAP_ALIASES !== 'false';
const EXTERNAL_DIR = resolve(ROOT, env.EGEN_EXTERNAL_DIR || 'external-apps');
const EXTERNAL_STRICT = env.EGEN_EXTERNAL_STRICT === 'true';
const EXTERNAL_ALLOW_HTTP = env.EGEN_EXTERNAL_ALLOW_HTTP === 'true';

// Variables à injecter sur window au runtime (idem `egen develop`).
const BRIDGED = [
  ['EGEN_DEV_NO_AUTH', 'egenDevNoAuth', 'boolean'],
  ['EGEN_TENANT_MODE', 'egenTenantMode', 'string'],
  ['EGEN_TENANT_ID', 'egenTenantId', 'string'],
  ['EGEN_TENANT_PERSIST', 'egenTenantPersist', 'string'],
  ['EGEN_TENANT_RESOLUTION_ORDER', 'egenTenantResolutionOrder', 'string'],
  ['EGEN_TENANT_PATH_PREFIX', 'egenTenantPathPrefix', 'string'],
  ['EGEN_TENANT_JWT_CLAIM', 'egenTenantJwtClaim', 'string'],
  ['EGEN_TENANT_ROOT_DOMAIN', 'egenTenantRootDomain', 'string'],
];
const overrides = {};
for (const [k, w, t] of BRIDGED) if (env[k] !== undefined) overrides[w] = t === 'boolean' ? env[k] === 'true' : env[k];

// ── Découverte des apps (lecture de fichiers uniquement, aucun import JS) ───
const appsDir = resolve(ROOT, 'packages/apps');
const importMap = {};
const aliases = {};
const routes = {};
const withoutRange = [];
const mounts = new Map(); // dirName -> dossier dist
for (const dir of readdirSync(appsDir)) {
  const pkgFile = join(appsDir, dir, 'package.json');
  if (!existsSync(pkgFile)) continue;
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
  const entry = pkg.browser || pkg.module || pkg.main;
  const distDir = resolve(appsDir, dir, dirname(entry));
  if (!existsSync(join(distDir, basename(entry)))) {
    log(`SKIP ${pkg.name}: bundle absent (${entry}) — lancer "yarn build:apps"`);
    continue;
  }
  mounts.set(dir, distDir);
  importMap[pkg.name] = `${SPA}/apps/${dir}/${basename(entry)}`;
  const alias = `@egen-civitas/${pkg.name.split('/').pop()}`;
  if (IMPORTMAP_ALIASES && alias !== pkg.name) aliases[alias] = pkg.name;
  // `dist/routes.json` est copié au build par rspack-config et estampillé (`version`, `frameworkRange`) :
  // c'est lui qui active le garde-fou de compatibilité du Shell (écart G3). Repli sur la source.
  const built = join(distDir, 'routes.json');
  const rf = !ROUTES_FROM_SRC && existsSync(built) ? built : join(appsDir, dir, 'src', 'routes.json');
  if (existsSync(rf)) {
    const r = JSON.parse(readFileSync(rf, 'utf8'));
    routes[pkg.name] = { ...r, version: pkg.version };
    if (!r.frameworkRange) withoutRange.push(pkg.name);
  }
}
if (withoutRange.length) log(`frameworkRange absent (garde-fou de version inactif) : ${withoutRange.join(', ')}`);
log(`${mounts.size} applications : ${[...mounts.keys()].join(', ')}`);
if (!mounts.size) { console.error('Aucune app compilée.'); process.exit(1); }

// ── Apps externes (verrou external-apps.lock.json) ──────────────────────────
// Les apps internes priment : un nom déjà pris est rejeté côté externe.
const internalNames = new Set(Object.keys(importMap));
let importMapJson = '';
let routesJson = '';
let externalMounts = new Map();
let externalStatusJson = '[]';
let embedConfigJson = JSON.stringify({ version: 1, apps: [] });

function publishRegistries() {
  // Routes déjà prises par les pages des apps internes : une app embarquée ne peut pas les réutiliser.
  const reservedRoutes = new Set();
  for (const r of Object.values(routes)) for (const p of r.pages ?? []) if (typeof p.route === 'string') reservedRoutes.add(p.route);
  const ext = loadExternalApps({ dir: EXTERNAL_DIR, spaPath: SPA, internalNames, allowHttp: EXTERNAL_ALLOW_HTTP, reservedRoutes });
  externalMounts = ext.mounts;
  const imports = { ...importMap, ...ext.importMap };
  // un nom présent dans `imports` (ex. app externe homonyme) n'est jamais remplacé par un alias
  const effectiveAliases = Object.fromEntries(Object.entries(aliases).filter(([k, v]) => !(k in imports) && v in imports));
  importMapJson = JSON.stringify(Object.keys(effectiveAliases).length ? { imports, aliases: effectiveAliases } : { imports });
  const merged = { ...routes, ...ext.routes };
  embedConfigJson = JSON.stringify({ version: 1, apps: [] });
  if (ext.embed.length) {
    if (!(EMBED_APP_NAME in importMap)) {
      // L'app générique n'est pas compilée : on le dit clairement plutôt que d'exposer des routes qui n'affichent rien.
      log(`externes : ${ext.embed.length} app(s) embarquée(s) ignorée(s) : ${EMBED_APP_NAME} non compilée (lancer "yarn build:apps")`);
      for (const a of ext.apps) if (a.kind === 'embed' && a.status !== 'rejected') { a.status = 'rejected'; a.errors.push(`${EMBED_APP_NAME} non compilée`); }
    } else {
      const base = merged[EMBED_APP_NAME] ?? {};
      merged[EMBED_APP_NAME] = {
        ...base,
        pages: [...(base.pages ?? []), ...ext.embedRegistry.pages],
        extensions: [...(base.extensions ?? []), ...ext.embedRegistry.extensions],
      };
      embedConfigJson = JSON.stringify(buildEmbedConfig(ext.embed));
    }
  }
  routesJson = JSON.stringify(merged);
  externalStatusJson = JSON.stringify({
    apps: ext.apps.map(({ name, kind, version, status, errors, warnings }) => ({ name, kind, version, status, errors, warnings })),
  });
  formatReport(ext.apps).forEach((l) => log(`externes : ${l}`));
  return ext.apps.some((a) => a.status === 'rejected');
}
if (publishRegistries() && EXTERNAL_STRICT) {
  console.error('[egen-prod] apps externes rejetées en mode strict (EGEN_EXTERNAL_STRICT=true).');
  process.exit(1);
}
process.on('SIGHUP', () => {
  log('SIGHUP : rechargement des apps externes');
  publishRegistries();
});

// ── Configuration runtime des apps (optionnelle, lue une fois au démarrage) ──
// EGEN_CONFIG_FILE : fichier JSON { "<nom de l'app>": { ... } } servi à <spa>/config.json et donné au Shell
// (`configUrls`). EGEN_CONFIG_URLS : URLs supplémentaires (séparées par des virgules). Sans ces variables,
// `configUrls` reste vide, comme avant. Un fichier invalide empêche le démarrage (intégration à froid).
let runtimeConfigJson = null;
if (env.EGEN_CONFIG_FILE) {
  try {
    runtimeConfigJson = loadRuntimeConfig(resolve(ROOT, env.EGEN_CONFIG_FILE)).json;
  } catch (e) {
    if (e instanceof RuntimeConfigError) { console.error(`[egen-prod] ${e.message}`); process.exit(1); }
    throw e;
  }
}
const CONFIG_URLS = buildConfigUrls({ spa: SPA, hasFile: runtimeConfigJson !== null, extra: env.EGEN_CONFIG_URLS });
if (CONFIG_URLS.length) log(`configuration runtime : ${CONFIG_URLS.join(', ')}`);

// ── App shell + index.html ──────────────────────────────────────────────────
const require = createRequire(import.meta.url);
const SHELL = env.EGEN_SHELL_DIR
  ? resolve(env.EGEN_SHELL_DIR)
  : resolve(dirname(require.resolve('@egen-civitas/esm-app-shell/package.json')), 'dist');
const BRAND = env.EGEN_BRAND_DIR ? resolve(ROOT, env.EGEN_BRAND_DIR) : null;
const indexHtml = readFileSync(join(SHELL, 'index.html'), 'utf8')
  .replace(
    /<script>initializeSpa\([\s\S\n]*<\/script>/m,
    `<script>Object.assign(window, ${JSON.stringify(overrides)});initializeSpa({apiUrl:${JSON.stringify(API)},spaPath:${JSON.stringify(SPA)},env:"production",offline:${OFFLINE},configUrls:${JSON.stringify(CONFIG_URLS)}});</script>`,
  )
  .replace(/(href|src)="\/egen-civitas\/spa/g, `$1="${SPA}`)
  .replace(/(href|src)="\/egen\/spa/g, `$1="${SPA}`);

// ── Statique ────────────────────────────────────────────────────────────────
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.map': 'application/json',
  '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
const HASHED = /[.\-_/][0-9a-f]{8,}\.[a-z0-9]+$/i;

function safeJoin(base, rel) {
  const p = normalize(join(base, decodeURIComponent(rel)));
  return p === base || p.startsWith(base + sep) ? p : null;
}
function fileStat(p) { try { const s = statSync(p); return s.isFile() ? s : null; } catch { return null; } }

function sendFile(req, res, file, st) {
  const ext = extname(file);
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  const h = {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    ETag: etag,
    'Last-Modified': st.mtime.toUTCString(),
    'Cache-Control': HASHED.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache',
    Vary: 'Accept-Encoding',
  };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
  let out = file, size = st.size;
  const ae = String(req.headers['accept-encoding'] || '');
  for (const [enc, suf] of [['br', '.br'], ['gzip', '.gz']]) {
    if (ae.includes(enc)) {
      const s = fileStat(file + suf);
      if (s) { out = file + suf; size = s.size; h['Content-Encoding'] = enc; break; }
    }
  }
  h['Content-Length'] = size;
  res.writeHead(200, h);
  if (req.method === 'HEAD') return res.end();
  createReadStream(out).pipe(res);
}

function sendBuffer(req, res, type, body, cache = 'no-cache') {
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), 'Cache-Control': cache });
  res.end(req.method === 'HEAD' ? undefined : body);
}

// ── Proxy API (optionnel) ───────────────────────────────────────────────────
function proxy(req, res) {
  if (!BACKEND) { res.writeHead(502, { 'Content-Type': 'text/plain' }); return res.end('EGEN_BACKEND non configuré'); }
  const lib = BACKEND.protocol === 'https:' ? https : http;
  const up = lib.request(
    { host: BACKEND.hostname, port: BACKEND.port || undefined, method: req.method, path: req.url,
      headers: { ...req.headers, host: BACKEND.host } },
    (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); },
  );
  up.on('error', (e) => { if (!res.headersSent) res.writeHead(502); res.end(`Bad gateway: ${e.message}`); });
  req.pipe(up);
}

// ── Serveur ─────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://x');
    if (pathname === '/healthz') return sendBuffer(req, res, 'text/plain', 'ok');
    if (pathname === '/' ) { res.writeHead(302, { Location: `${SPA}/` }); return res.end(); }

    if (pathname === SPA || pathname.startsWith(SPA + '/')) {
      const rel = pathname.slice(SPA.length).replace(/^\/+/, '');
      if (rel === 'importmap.json') return sendBuffer(req, res, TYPES['.json'], importMapJson);
      if (rel === 'routes.registry.json') return sendBuffer(req, res, TYPES['.json'], routesJson);
      if (rel === 'embed-apps.json') return sendBuffer(req, res, TYPES['.json'], embedConfigJson, 'no-store');
      if (rel === 'external-apps.status.json') return sendBuffer(req, res, TYPES['.json'], externalStatusJson);
      if (rel === 'config.json' && runtimeConfigJson !== null) return sendBuffer(req, res, TYPES['.json'], runtimeConfigJson, 'no-store');

      let m;
      if ((m = rel.match(/^apps\/([^/]+)\/(.+)$/)) && mounts.has(m[1])) {
        const f = safeJoin(mounts.get(m[1]), m[2]);
        const st = f && fileStat(f);
        if (st) return sendFile(req, res, f, st);
        res.writeHead(404); return res.end('Not found');
      }
      if ((m = rel.match(/^external\/([^/]+)\/(.+)$/)) && externalMounts.has(m[1])) {
        const f = safeJoin(externalMounts.get(m[1]), m[2]);
        const st = f && fileStat(f);
        if (st) return sendFile(req, res, f, st);
        res.writeHead(404); return res.end('Not found');
      }
      if (rel && rel !== 'index.html') {
        for (const base of [BRAND, SHELL]) {
          if (!base) continue;
          const f = safeJoin(base, rel);
          const st = f && fileStat(f);
          if (st) return sendFile(req, res, f, st);
        }
        if (extname(rel)) { res.writeHead(404); return res.end('Not found'); }
      }
      return sendBuffer(req, res, TYPES['.html'], indexHtml);
    }
    if (pathname.startsWith(API + '/')) return proxy(req, res);
    res.writeHead(302, { Location: `${SPA}/` }); res.end();
  } catch (e) {
    res.writeHead(400); res.end('Bad request');
  }
});
server.keepAliveTimeout = 65_000;
server.listen(PORT, HOST, () => {
  log(`http://${HOST}:${PORT}${SPA}/  (RSS ${(process.memoryUsage().rss / 1048576) | 0} Mo)`);
  // 0.0.0.0 / :: = « toutes les interfaces » : adresse d'écoute, PAS d'ouverture. Ouvrir dans un navigateur
  // via 0.0.0.0 donne une origine à part (iframes, cookies, CORS) : indiquer l'adresse à utiliser.
  if (HOST === '0.0.0.0' || HOST === '::') log(`ouvrir dans le navigateur : http://localhost:${PORT}${SPA}/`);
});
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => server.close(() => process.exit(0)));
