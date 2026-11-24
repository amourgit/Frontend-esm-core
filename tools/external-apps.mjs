/**
 * Apps EXTERNES en production — chargement, validation, alignement.
 *
 * Module sans dépendance (Node >= 18) utilisé par :
 *   - tools/serve-prod.mjs          (publication dans l'import map + registry)
 *   - tools/sync-external-apps.mjs  (récupération des bundles, génération du verrou)
 *
 * Source de vérité en production : `<EXTERNAL_DIR>/external-apps.lock.json`
 * (généré par `yarn external:sync`). Deux sortes d'entrées :
 *   - "hosted" : bundle récupéré (npm / file: / https tarball via `egen assemble`) et
 *                servi par le core sous `<spa>/external/<dir>/<fichier>` ;
 *   - "remote" : bundle hébergé ailleurs (URL https), référencé tel quel ; seules ses
 *                routes sont figées localement (snapshot) pour ne pas dépendre du
 *                partenaire au démarrage.
 *
 * Pourquoi valider ici : le Shell n'a que des garde-fous partiels (voir
 * docs/integration-apps/01 et 02) :
 *   - un `containerDomId` inconnu fait échouer le DÉMARRAGE du Shell (toutes les apps) ;
 *   - un registry dont UNE entrée n'est pas conforme (pages/extensions… non tableaux)
 *     est ignoré EN ENTIER (toutes les apps disparaissent) ;
 *   - deux apps de même nom : la dernière écrase silencieusement la première.
 * Une app externe fautive est donc REJETÉE ici, avant d'atteindre le navigateur.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { EMBED_APP_NAME, buildEmbedRegistry, checkApproved, checkEmbedManifest, checkLimits, embedWarnings } from './embed-apps.mjs';

export const LOCK_FILE = 'external-apps.lock.json';
export const LOCK_VERSION = 1;
export { EMBED_APP_NAME };

/** Conteneurs réellement présents dans le HTML du Shell (fw/packages/shell/esm-app-shell/src/index.ejs). */
export const KNOWN_CONTAINERS = new Set([
  'egen-apps-container',
  'egen-top-nav-app-container',
  'egen-ai-assistant-app-container',
  'egen-footer-app-container',
  'egen-page-background-container',
  'egen-workspaces-container',
  'egen-rail-left-container',
  'egen-rail-right-container',
  'egen-zone-left-container',
  'egen-zone-right-container',
  'egen-zone-bottom-container',
]);

/** Même calcul que `importDynamic` (esm-dynamic-loading) : nom du global du conteneur Module Federation. */
export const slugify = (name) => name.replace(/[/\-@]/g, '_');

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

const NAME_RE = /^(@[a-z0-9~][a-z0-9._~-]*\/)?[a-z0-9~][a-z0-9._~-]*$/;
const SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9._@~+-]*$/;
const EMBED_SNAPSHOT_RE = /^embed\/manifests\/[A-Za-z0-9][A-Za-z0-9._@~+-]*\.json$/;
const SNAPSHOT_RE = /^remote\/routes\/[A-Za-z0-9][A-Za-z0-9._@~+-]*\.json$/;
const MAX_SCAN_BYTES = 64 * 1024 * 1024;

const err = (message) => ({ level: 'error', message });
const warn = (message) => ({ level: 'warn', message });

/** Segment de chemin sûr (pas de séparateur, pas de « .. »). */
export function isSafeSegment(s) {
  return typeof s === 'string' && SEGMENT_RE.test(s) && !s.includes('..');
}

/**
 * Contrôle d'un `routes.json` (objet déjà parsé). Retourne une liste d'anomalies.
 * `error` = l'app doit être refusée (risque pour tout le Shell) ; `warn` = app publiée avec réserve.
 */
export function checkRoutes(routes) {
  const issues = [];
  if (routes == null) {
    issues.push(warn("aucun routes.json : l'app sera chargeable mais n'affichera rien"));
    return issues;
  }
  if (typeof routes !== 'object' || Array.isArray(routes)) {
    return [err('routes.json doit être un objet')];
  }
  for (const key of ['pages', 'extensions', 'workspaces', 'modals']) {
    if (routes[key] !== undefined && !Array.isArray(routes[key])) {
      issues.push(err(`« ${key} » doit être un tableau (sinon le registry entier est ignoré par le Shell)`));
    }
  }
  const asArray = (v) => (Array.isArray(v) ? v : []);

  asArray(routes.pages).forEach((p, i) => {
    const at = `pages[${i}]`;
    if (!p || typeof p !== 'object') return issues.push(err(`${at} : objet attendu`));
    if (typeof p.component !== 'string' || !p.component) issues.push(warn(`${at} : « component » manquant (page ignorée)`));
    if (p.route === undefined && p.routeRegex === undefined) {
      issues.push(
        warn(
          p.routes !== undefined
            ? `${at} : « routes » (pluriel) est ignoré par le Shell, utiliser « route » ou « routeRegex »`
            : `${at} : ni « route » ni « routeRegex » (page ignorée)`,
        ),
      );
    }
    if (p.containerDomId !== undefined && !KNOWN_CONTAINERS.has(p.containerDomId)) {
      issues.push(err(`${at} : containerDomId « ${p.containerDomId} » inexistant dans le Shell (empêcherait son démarrage)`));
    }
  });
  asArray(routes.extensions).forEach((e, i) => {
    const at = `extensions[${i}]`;
    if (!e || typeof e !== 'object') return issues.push(err(`${at} : objet attendu`));
    if (typeof e.name !== 'string' || !e.name) issues.push(warn(`${at} : « name » manquant (extension ignorée)`));
    if (typeof e.component !== 'string' || !e.component) issues.push(warn(`${at} : « component » manquant (extension ignorée)`));
  });
  asArray(routes.modals).forEach((m, i) => {
    const at = `modals[${i}]`;
    if (!m || typeof m !== 'object') return issues.push(err(`${at} : objet attendu`));
    if (typeof m.name !== 'string' || typeof m.component !== 'string') issues.push(warn(`${at} : « name » et « component » requis`));
  });
  if (!routes.frameworkRange) {
    issues.push(warn("« frameworkRange » absent : aucune vérification de compatibilité avec le Shell (build par rspack-config recommandé)"));
  }
  return issues;
}

/** Contrôle statique d'un bundle local : conteneur Module Federation attendu par le Shell. */
export function checkBundle(file, name) {
  const issues = [];
  let size;
  try {
    size = statSync(file).size;
  } catch {
    return [err(`bundle introuvable : ${file}`)];
  }
  if (size > MAX_SCAN_BYTES) return [warn('bundle trop volumineux pour le contrôle statique')];
  const text = readFileSync(file, 'utf8');
  const slug = slugify(name);
  if (!text.includes(slug)) issues.push(warn(`le bundle ne mentionne pas le global « ${slug} » : conteneur Module Federation "var" introuvable`));
  if (!text.includes('./start')) issues.push(warn('le bundle ne mentionne pas l\'exposition « ./start »'));
  return issues;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/**
 * Charge les apps externes décrites par le verrou et retourne ce qu'il faut publier.
 *
 * @param {object} o
 * @param {string} o.dir            dossier des apps externes (contient le verrou)
 * @param {string} o.spaPath        ex. '/egen-civitas/spa'
 * @param {Set<string>} [o.internalNames] noms des apps internes (priorité absolue)
 * @param {boolean} [o.allowHttp]   autorise les bundles distants en http (hors production)
 * @param {Set<string>} [o.reservedRoutes] routes déjà prises par d'autres pages (une app embarquée ne peut pas les réutiliser)
 * @returns {{importMap:Object, routes:Object, mounts:Map<string,string>, apps:Array}}
 */
export function loadExternalApps({ dir, spaPath, internalNames = new Set(), allowHttp = false, reservedRoutes = new Set() }) {
  const out = { importMap: {}, routes: {}, mounts: new Map(), apps: [], embed: [], embedRegistry: { pages: [], extensions: [] } };
  const embedRoutes = new Set();
  const lockFile = join(dir, LOCK_FILE);
  if (!existsSync(lockFile)) return out;

  let lock;
  try {
    lock = readJson(lockFile);
  } catch (e) {
    out.apps.push({ name: LOCK_FILE, kind: 'lock', status: 'rejected', errors: [`verrou illisible : ${e.message}`], warnings: [] });
    return out;
  }
  if (lock.lockVersion !== LOCK_VERSION || typeof lock.apps !== 'object' || lock.apps === null) {
    out.apps.push({ name: LOCK_FILE, kind: 'lock', status: 'rejected', errors: [`verrou invalide (lockVersion ${LOCK_VERSION} attendu)`], warnings: [] });
    return out;
  }

  const extensionOwners = new Map();

  for (const [name, entry] of Object.entries(lock.apps)) {
    const rec = { name, kind: entry?.kind, version: entry?.version, status: 'accepted', errors: [], warnings: [] };
    const issues = [];
    let bundleUrl = null;
    let mountDir = null;
    let routes = null;

    if (!NAME_RE.test(name)) issues.push(err(`nom de paquet invalide : ${name}`));
    if (internalNames.has(name)) issues.push(err('nom déjà utilisé par une app interne du Core (l\'app interne prime)'));

    if (entry?.kind === 'hosted') {
      if (!isSafeSegment(entry.dir) || !isSafeSegment(entry.entry)) {
        issues.push(err('chemin de bundle invalide dans le verrou'));
      } else {
        const bundle = join(dir, entry.dir, entry.entry);
        const bundleIssues = checkBundle(bundle, name);
        issues.push(...bundleIssues);
        if (!bundleIssues.some((i) => i.level === 'error')) {
          if (entry.sha256 && sha256(readFileSync(bundle)) !== entry.sha256) {
            issues.push(err('empreinte SHA-256 du bundle différente du verrou (fichier modifié depuis la synchronisation)'));
          }
          bundleUrl = `${spaPath}/external/${entry.dir}/${entry.entry}`;
          mountDir = entry.dir;
        }
        const routesFile = join(dir, entry.dir, 'routes.json');
        if (existsSync(routesFile)) {
          try { routes = readJson(routesFile); } catch (e) { issues.push(err(`routes.json illisible : ${e.message}`)); }
        }
      }
    } else if (entry?.kind === 'remote') {
      let u = null;
      try { u = new URL(entry.bundle); } catch { issues.push(err('URL de bundle invalide')); }
      if (u) {
        if (u.protocol !== 'https:' && !(allowHttp && u.protocol === 'http:')) {
          issues.push(err('le bundle distant doit être en https (contenu mixte bloqué par les navigateurs)'));
        } else {
          bundleUrl = u.toString();
        }
      }
      if (!SNAPSHOT_RE.test(String(entry.routesFile ?? ''))) {
        issues.push(err('chemin du snapshot de routes invalide dans le verrou'));
      } else {
        const rf = join(dir, entry.routesFile);
        if (!existsSync(rf)) issues.push(err('snapshot de routes introuvable (relancer yarn external:sync)'));
        else {
          const raw = readFileSync(rf);
          if (entry.routesSha256 && sha256(raw) !== entry.routesSha256) issues.push(err('snapshot de routes modifié depuis la synchronisation'));
          try { routes = JSON.parse(raw.toString('utf8')); } catch (e) { issues.push(err(`snapshot de routes illisible : ${e.message}`)); }
        }
      }
    } else if (entry?.kind === 'embed') {
      // App embarquée (iframe) : aucun bundle ; le manifeste figé + le plafond approuvé alimentent l'app générique.
      let manifest = null;
      if (!EMBED_SNAPSHOT_RE.test(String(entry.manifestFile ?? ''))) {
        issues.push(err('chemin du manifeste invalide dans le verrou'));
      } else {
        const mf = join(dir, entry.manifestFile);
        if (!existsSync(mf)) issues.push(err('manifeste introuvable (relancer yarn external:sync)'));
        else {
          const raw = readFileSync(mf);
          if (entry.manifestSha256 && sha256(raw) !== entry.manifestSha256) issues.push(err('manifeste modifié depuis la synchronisation (empreinte SHA-256 différente du verrou)'));
          try { manifest = JSON.parse(raw.toString('utf8')); } catch (e) { issues.push(err(`manifeste illisible : ${e.message}`)); }
        }
      }
      if (manifest) {
        for (const m of [...checkEmbedManifest(manifest, { allowHttp }), ...checkApproved(entry.approved), ...checkLimits(entry.limits)]) issues.push(err(m));
        if (manifest.name !== name) issues.push(err(`le nom du manifeste (${manifest.name}) diffère du nom du verrou`));
        if (reservedRoutes.has(manifest.route)) issues.push(err(`route « ${manifest.route} » déjà utilisée par une autre page du Core`));
        else if (embedRoutes.has(manifest.route)) issues.push(err(`route « ${manifest.route} » déjà utilisée par une autre app embarquée`));
        if (!issues.some((i) => i.level === 'error')) {
          embedRoutes.add(manifest.route);
          for (const m of embedWarnings(manifest, entry.approved)) issues.push(warn(m));
          rec.embedRoute = manifest.route;
          rec.version = manifest.version;
          out.embed.push({ name, version: manifest.version, manifest, approved: entry.approved ?? {}, limits: entry.limits ?? {} });
        }
      }
    } else {
      issues.push(err(`type d'entrée inconnu : ${String(entry?.kind)}`));
    }

    if (entry?.kind !== 'embed') issues.push(...checkRoutes(routes));

    if (routes && Array.isArray(routes.extensions)) {
      for (const e of routes.extensions) {
        if (e && typeof e.name === 'string') {
          const owner = extensionOwners.get(e.name);
          if (owner && owner !== name) issues.push(warn(`extension « ${e.name} » déjà déclarée par ${owner}`));
          else extensionOwners.set(e.name, name);
        }
      }
    }

    rec.errors = issues.filter((i) => i.level === 'error').map((i) => i.message);
    rec.warnings = issues.filter((i) => i.level === 'warn').map((i) => i.message);
    if (rec.errors.length) rec.status = 'rejected';
    else if (rec.warnings.length) rec.status = 'accepted-with-warnings';

    if (rec.status !== 'rejected' && bundleUrl) {
      out.importMap[name] = bundleUrl;
      if (routes && typeof routes === 'object') out.routes[name] = { ...routes, version: routes.version ?? entry.version };
      if (mountDir) out.mounts.set(mountDir, join(dir, mountDir));
    }
    out.apps.push(rec);
  }
  out.embedRegistry = buildEmbedRegistry(out.embed);
  return out;
}

/** Résumé lisible pour les journaux. */
export function formatReport(apps) {
  if (!apps.length) return ['aucune application externe'];
  const lines = [];
  for (const a of apps) {
    const tag = a.status === 'rejected' ? 'REJETÉE' : a.status === 'accepted-with-warnings' ? 'ok (réserves)' : 'ok';
    lines.push(`${a.name}${a.version ? `@${a.version}` : ''} [${a.kind}] : ${tag}`);
    for (const m of a.errors) lines.push(`    ✗ ${m}`);
    for (const m of a.warnings) lines.push(`    ! ${m}`);
  }
  return lines;
}
