#!/usr/bin/env node
/**
 * Synchronise les apps EXTERNES pour la production du Core.
 *
 *   yarn external:sync            récupère, valide, écrit external-apps/external-apps.lock.json
 *   yarn external:check           vérifie le verrou (fichiers + dérive des bundles distants), sans rien écrire
 *
 * Entrée : `external-apps.json` (racine du Core ; EGEN_EXTERNAL_APPS pour un autre chemin)
 *
 *   {
 *     "registry": "https://registry.npmjs.org",            // optionnel (registre npm)
 *     "apps": {                                             // HÉBERGÉES par le Core (récupérées puis servies)
 *       "@acme/esm-hello-app": "1.2.0",                     //   version semver (registre npm)
 *       "@acme/esm-local-app": "file:../x/acme-local-1.0.0.tgz",   // tarball local
 *       "@acme/esm-url-app":   "https://exemple.org/esm-url-app-1.0.0.tgz"  // tarball https
 *     },
 *     "embed": [                                            // APPS EMBARQUÉES (iframe, protocole v2 : docs 17)
 *       { "manifest": "https://studio.exemple.org/egen-app.json",   //   URL https ou chemin local du manifeste
 *         "grants": { "notifications": {}, "events": { "publish": ["app.studio.*"] },
 *                     "extensions": { "contribute": ["topbar-nav-slot"] } },   // plafond approuvé (dont les slots où l'app peut contribuer)
 *         "limits": { "requestsPerSecond": 50 },               //   optionnel
 *         "config": { "studioApi": "https://api.exemple.org" } }    //   optionnel : configuration publique servie par la capacité `config`
 *     ],
 *     "remote": [                                           // HÉBERGÉES AILLEURS (référencées par URL)
 *       { "name": "@partner/esm-x-app",
 *         "bundle": "https://cdn.partner.org/x/1.0.0/partner-esm-x-app.js",
 *         "routes": "https://cdn.partner.org/x/1.0.0/routes.json",
 *         "version": "1.0.0" }
 *     ]
 *   }
 *
 * La récupération des paquets npm / tarballs est déléguée à `egen assemble` (code maintenu par le
 * Framework) : pas de ré-implémentation. Sortie : external-apps/ (EGEN_EXTERNAL_DIR), ignoré par git.
 *
 * Options : --strict (code 1 si une app est rejetée) · --config <fichier> · --out <dossier> · --check
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkApproved, checkConfig, checkEmbedManifest, checkLimits } from './embed-apps.mjs';
import { LOCK_FILE, LOCK_VERSION, formatReport, isSafeSegment, loadExternalApps, sha256 } from './external-apps.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const log = (...a) => console.log('[external-apps]', ...a);
const fail = (msg) => { console.error('[external-apps] ✗', msg); process.exit(1); };

// ── arguments ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const CHECK = flag('--check');
const STRICT = flag('--strict') || process.env.EGEN_EXTERNAL_STRICT === 'true';
const CONFIG = resolve(ROOT, opt('--config') || process.env.EGEN_EXTERNAL_APPS || 'external-apps.json');
const OUT = resolve(ROOT, opt('--out') || process.env.EGEN_EXTERNAL_DIR || 'external-apps');
const SPA = (process.env.EGEN_SPA_PATH || '/egen-civitas/spa').replace(/\/+$/, '');
const ALLOW_HTTP = process.env.EGEN_EXTERNAL_ALLOW_HTTP === 'true';

// ── configuration ───────────────────────────────────────────────────────────
function readConfig() {
  if (!existsSync(CONFIG)) fail(`configuration introuvable : ${CONFIG}`);
  let cfg;
  try { cfg = JSON.parse(readFileSync(CONFIG, 'utf8')); } catch (e) { fail(`${CONFIG} illisible : ${e.message}`); }
  const apps = cfg.apps ?? {};
  const remote = cfg.remote ?? [];
  if (typeof apps !== 'object' || Array.isArray(apps)) fail('« apps » doit être un objet { nom: version|file:|https }');
  if (!Array.isArray(remote)) fail('« remote » doit être un tableau');
  for (const [n, v] of Object.entries(apps)) if (typeof v !== 'string' || !v) fail(`apps["${n}"] : version attendue (chaîne)`);
  const seen = new Set(Object.keys(apps));
  for (const r of remote) {
    if (!r || typeof r.name !== 'string' || typeof r.bundle !== 'string' || typeof r.routes !== 'string') {
      fail('remote[] : { name, bundle, routes } requis (chaînes)');
    }
    if (seen.has(r.name)) fail(`application déclarée deux fois : ${r.name}`);
    seen.add(r.name);
  }
  const embed = cfg.embed ?? [];
  if (!Array.isArray(embed)) fail('« embed » doit être un tableau');
  for (const [i, e] of embed.entries()) {
    if (!e || typeof e.manifest !== 'string' || !e.manifest) fail(`embed[${i}] : « manifest » requis (URL https ou chemin)`);
    const bad = [...checkApproved(e.grants), ...checkLimits(e.limits), ...checkConfig(e.config)];
    if (bad.length) fail(`embed[${i}] : ${bad.join(' ; ')}`);
  }
  return { registry: cfg.registry, apps, remote, embed };
}

// ── récupération réseau (apps distantes) ────────────────────────────────────
async function download(url, what) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000), redirect: 'follow' });
  if (!res.ok) throw new Error(`${what} : HTTP ${res.status} (${url})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 64 * 1024 * 1024) throw new Error(`${what} : fichier trop volumineux`);
  return buf;
}
/** Source d'un manifeste : URL https(s) → réseau ; sinon chemin local (relatif au fichier de configuration). */
const isUrl = (src) => /^https?:\/\//i.test(src);
async function readManifestSource(src) {
  if (isUrl(src)) return download(src, `manifeste ${src}`);
  const file = resolve(dirname(CONFIG), src.replace(/^file:/, ''));
  if (!existsSync(file)) throw new Error(`manifeste local introuvable : ${file}`);
  return readFileSync(file);
}
const snapshotName = (name) => `${name.replace(/^@/, '').replace(/\//, '-')}.json`;

// ── mode vérification ───────────────────────────────────────────────────────
async function check() {
  const loaded = loadExternalApps({ dir: OUT, spaPath: SPA, allowHttp: ALLOW_HTTP });
  let drift = 0;
  const lockFile = join(OUT, LOCK_FILE);
  if (existsSync(lockFile)) {
    const lock = JSON.parse(readFileSync(lockFile, 'utf8'));
    for (const [name, e] of Object.entries(lock.apps ?? {})) {
      if (e.kind === 'embed') {
        try {
          const cur = await readManifestSource(e.manifestSource);
          if (e.manifestSourceSha256 && sha256(cur) !== e.manifestSourceSha256) { console.error(`  ✗ dérive : le manifeste de ${name} a changé depuis la synchronisation`); drift++; }
        } catch (ex) { console.error(`  ✗ ${ex.message}`); drift++; }
        continue;
      }
      if (e.kind !== 'remote') continue;
      try {
        const bundle = await download(e.bundle, `bundle de ${name}`);
        if (e.bundleSha256 && sha256(bundle) !== e.bundleSha256) { console.error(`  ✗ dérive : le bundle distant de ${name} a changé depuis la synchronisation`); drift++; }
        const routes = await download(e.routesSource, `routes de ${name}`);
        if (e.routesSourceSha256 && sha256(routes) !== e.routesSourceSha256) { console.error(`  ✗ dérive : les routes distantes de ${name} ont changé`); drift++; }
      } catch (ex) { console.error(`  ✗ ${ex.message}`); drift++; }
    }
  }
  formatReport(loaded.apps).forEach((l) => console.log(l));
  const rejected = loaded.apps.filter((a) => a.status === 'rejected').length;
  if (rejected || drift) fail(`${rejected} app(s) rejetée(s), ${drift} dérive(s)`);
  log('verrou conforme');
}

// ── synchronisation ─────────────────────────────────────────────────────────
async function sync() {
  const cfg = readConfig();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const lock = { lockVersion: LOCK_VERSION, generatedAt: new Date().toISOString(), apps: {} };

  // 1) Apps hébergées : egen assemble (npm / file: / https tarball)
  const names = Object.keys(cfg.apps);
  if (names.length) {
    const tmpCfg = join(OUT, '.assemble-config.json');
    writeFileSync(tmpCfg, JSON.stringify({ publicUrl: '.', frontendModules: cfg.apps }));
    const args = ['egen', 'assemble', '--mode', 'config', '--config', tmpCfg, '--target', OUT, '--manifest'];
    if (cfg.registry) args.push('--registry', cfg.registry);
    log(`egen assemble : ${names.length} application(s)…`);
    const bin = process.env.EGEN_BIN ? [process.env.EGEN_BIN] : ['yarn'];
    const cmdArgs = process.env.EGEN_BIN ? args.slice(1) : args;
    const r = spawnSync(bin[0], cmdArgs, { cwd: ROOT, stdio: 'inherit', shell: false });
    if (r.status !== 0) fail(`egen assemble a échoué (code ${r.status})`);
    rmSync(tmpCfg, { force: true });

    const importmap = JSON.parse(readFileSync(join(OUT, 'importmap.json'), 'utf8')).imports ?? {};
    const manifestFile = join(OUT, 'spa-assemble-config.json');
    const versions = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')).frontendModules ?? {} : {};
    for (const name of names) {
      const ref = importmap[name];
      const m = typeof ref === 'string' && ref.match(/^\.\/([^/]+)\/([^/]+)$/);
      if (!m || !isSafeSegment(m[1]) || !isSafeSegment(m[2])) fail(`${name} : entrée d'import map inattendue (${ref})`);
      const [, dir, entry] = m;
      lock.apps[name] = {
        kind: 'hosted',
        version: versions[name],
        source: cfg.apps[name],
        dir,
        entry,
        sha256: sha256(readFileSync(join(OUT, dir, entry))),
      };
    }
  }

  // 2) Apps distantes : on fige les routes, on mémorise l'empreinte du bundle (détection de dérive)
  for (const r of cfg.remote) {
    log(`distante : ${r.name}`);
    let bundle, routesBuf;
    try {
      bundle = await download(r.bundle, `bundle de ${r.name}`);
      routesBuf = await download(r.routes, `routes de ${r.name}`);
    } catch (e) { fail(e.message); }
    let routes;
    try { routes = JSON.parse(routesBuf.toString('utf8')); } catch (e) { fail(`routes de ${r.name} : JSON invalide (${e.message})`); }
    const file = `remote/routes/${snapshotName(r.name)}`;
    mkdirSync(join(OUT, 'remote', 'routes'), { recursive: true });
    const frozen = Buffer.from(JSON.stringify({ ...routes, version: routes.version ?? r.version }));
    writeFileSync(join(OUT, file), frozen);
    lock.apps[r.name] = {
      kind: 'remote',
      version: routes.version ?? r.version,
      bundle: r.bundle,
      bundleSha256: sha256(bundle),
      routesSource: r.routes,
      routesSourceSha256: sha256(routesBuf),
      routesFile: file,
      routesSha256: sha256(frozen),
    };
  }

  // 3) Apps embarquées : manifeste validé et figé, plafond approuvé par l'opérateur
  for (const e of cfg.embed) {
    log(`embarquée : ${e.manifest}`);
    let raw, manifest;
    try { raw = await readManifestSource(e.manifest); } catch (ex) { fail(ex.message); }
    try { manifest = JSON.parse(raw.toString('utf8')); } catch (ex) { fail(`manifeste ${e.manifest} : JSON invalide (${ex.message})`); }
    const errors = checkEmbedManifest(manifest, { allowHttp: ALLOW_HTTP });
    if (errors.length) fail(`manifeste ${e.manifest} invalide :\n  - ${errors.join('\n  - ')}`);
    if (lock.apps[manifest.name]) fail(`application déclarée deux fois : ${manifest.name}`);
    const file = `embed/manifests/${snapshotName(manifest.name)}`;
    mkdirSync(join(OUT, 'embed', 'manifests'), { recursive: true });
    const frozen = Buffer.from(JSON.stringify(manifest));
    writeFileSync(join(OUT, file), frozen);
    lock.apps[manifest.name] = {
      kind: 'embed',
      version: manifest.version,
      manifestSource: e.manifest,
      manifestSourceSha256: sha256(raw),
      manifestFile: file,
      manifestSha256: sha256(frozen),
      approved: e.grants ?? {},
      ...(e.limits ? { limits: e.limits } : {}),
      ...(e.config ? { config: e.config } : {}),
    };
  }

  writeFileSync(join(OUT, LOCK_FILE), JSON.stringify(lock, null, 2) + '\n');
  const loaded = loadExternalApps({ dir: OUT, spaPath: SPA, allowHttp: ALLOW_HTTP });
  formatReport(loaded.apps).forEach((l) => console.log(l));
  const rejected = loaded.apps.filter((a) => a.status === 'rejected').length;
  log(`${loaded.apps.length - rejected}/${loaded.apps.length} application(s) publiables → ${OUT}`);
  if (rejected && STRICT) fail(`${rejected} application(s) rejetée(s) (mode strict)`);
}

(CHECK ? check() : sync()).catch((e) => fail(e.stack || e.message));
