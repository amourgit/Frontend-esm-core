/**
 * Apps EMBARQUÉES (`kind: "embed"`) : manifeste `egen-app.json`, grants approuvés, registry synthétique.
 *
 * Module sans dépendance (Node >= 18), utilisé par external-apps.mjs (chargement), sync-external-apps.mjs
 * (récupération du manifeste) et serve-prod.mjs (publication). Spécification : docs/integration-apps/17.
 *
 * ⚠ Les constantes ci-dessous DOIVENT rester alignées sur le catalogue de `@egen-civitas/esm-embed-protocol`
 *   (CAPABILITY_IDS, `defaultGrant`, règles de `validateManifest`). Le Core ne peut pas importer ce paquet ici
 *   (outils sans dépendance, exécutés avant toute installation) : un test de parité l'impose dès que le paquet est
 *   installé (voir plan 18, P6.6). Les grants EFFECTIFS ne sont PAS calculés ici : le navigateur les calcule avec
 *   `effectiveGrants` du protocole (une seule implémentation), à partir du manifeste et du plafond approuvé.
 */

/** Nom de l'app générique (packages/apps/esm-embed-app) qui monte toutes les apps embarquées. */
export const EMBED_APP_NAME = '@egen/esm-embed-app';

export const CAPABILITY_IDS = [
  'session', 'tenant', 'locale', 'theme', 'permissions', 'navigation', 'events', 'notifications',
  'dialogs', 'api', 'flags', 'config', 'telemetry', 'ai-tools', 'lifecycle',
];
/** Capacités accordées sans approbation (lecture sans risque). */
export const DEFAULT_GRANT_CAPABILITIES = new Set(['session', 'tenant', 'locale', 'theme', 'navigation', 'config', 'telemetry', 'lifecycle']);

const NAME_RE = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const ROUTE_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const VERSION_RE = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const TECHS = ['nextjs', 'react', 'vue', 'angular', 'static', 'other'];
const MODES = ['none', 'history', 'hash'];
const LIMIT_KEYS = ['maxMessageBytes', 'requestsPerSecond', 'callTimeoutMs', 'maxSubscriptions', 'eventsPerSecond', 'handshakeTimeoutMs', 'pingIntervalMs'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function validUrl(u, allowHttp) {
  if (typeof u !== 'string' || u.length > 2000) return false;
  try {
    const x = new URL(u);
    if (x.username || x.password) return false;
    if (x.protocol === 'https:') return true;
    return allowHttp && x.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Valide un manifeste. Retourne la liste des erreurs (vide = valide). */
export function checkEmbedManifest(m, { allowHttp = false } = {}) {
  const errors = [];
  if (!isObj(m)) return ['le manifeste doit être un objet'];
  if (m.manifestVersion !== 1) errors.push('manifestVersion : 1 attendu');
  if (typeof m.name !== 'string' || !NAME_RE.test(m.name) || m.name.length > 214) errors.push('name : nom de paquet valide attendu');
  if (typeof m.version !== 'string' || !VERSION_RE.test(m.version)) errors.push('version : semver attendu');
  if (typeof m.title !== 'string' || !m.title.trim() || m.title.length > 100) errors.push('title : texte non vide ≤ 100 attendu');
  if (!validUrl(m.url, allowHttp)) errors.push(`url : https attendue, sans identifiants${allowHttp ? ' (http toléré)' : ''}`);
  if (typeof m.route !== 'string' || !ROUTE_RE.test(m.route)) errors.push('route : minuscules, chiffres et tirets (≤ 64)');
  if (!TECHS.includes(m.technology)) errors.push(`technology : ${TECHS.join(' | ')}`);
  if (!isObj(m.navigation) || !MODES.includes(m.navigation.mode)) errors.push(`navigation.mode : ${MODES.join(' | ')}`);
  else {
    const n = m.navigation;
    if (n.basePath !== undefined && !(typeof n.basePath === 'string' && n.basePath.startsWith('/') && !n.basePath.startsWith('//'))) errors.push('navigation.basePath : chemin commençant par « / »');
    if (n.sensitiveParams !== undefined && !(Array.isArray(n.sensitiveParams) && n.sensitiveParams.every((s) => typeof s === 'string' && s.length <= 64))) errors.push('navigation.sensitiveParams : tableau de textes');
  }
  if (m.placement !== undefined && (!isObj(m.placement) || (m.placement.rail !== undefined && !['left', 'right', 'bottom'].includes(m.placement.rail)))) errors.push('placement.rail : left | right | bottom');
  if (!isObj(m.capabilities)) errors.push('capabilities : objet attendu');
  else {
    for (const [id, cfg] of Object.entries(m.capabilities)) {
      if (!CAPABILITY_IDS.includes(id)) errors.push(`capabilities.${id} : capacité inconnue`);
      else if (!isObj(cfg)) errors.push(`capabilities.${id} : objet attendu`);
    }
  }
  return errors;
}

/** Valide le plafond approuvé par l'opérateur : `{ capacité: false | { … } }`. */
export function checkApproved(approved) {
  if (approved === undefined) return [];
  if (!isObj(approved)) return ['grants : objet attendu'];
  const errors = [];
  for (const [id, cfg] of Object.entries(approved)) {
    if (!CAPABILITY_IDS.includes(id)) errors.push(`grants.${id} : capacité inconnue`);
    else if (cfg !== false && !isObj(cfg)) errors.push(`grants.${id} : false ou objet attendu`);
  }
  return errors;
}

export function checkLimits(limits) {
  if (limits === undefined) return [];
  if (!isObj(limits)) return ['limits : objet attendu'];
  const errors = [];
  for (const [k, v] of Object.entries(limits)) {
    if (!LIMIT_KEYS.includes(k)) errors.push(`limits.${k} : limite inconnue`);
    else if (!Number.isFinite(v) || v < 0) errors.push(`limits.${k} : nombre ≥ 0 attendu`);
  }
  return errors;
}

/** Réserves (non bloquantes) sur l'écart entre la demande et l'approbation. */
export function embedWarnings(manifest, approved = {}) {
  const w = [];
  for (const id of Object.keys(manifest.capabilities ?? {})) {
    if (!DEFAULT_GRANT_CAPABILITIES.has(id) && (approved[id] === undefined || approved[id] === false)) {
      w.push(`capacité « ${id} » demandée par l'app mais non approuvée : elle sera refusée`);
    }
  }
  for (const id of Object.keys(approved)) {
    if (approved[id] !== false && !DEFAULT_GRANT_CAPABILITIES.has(id) && manifest.capabilities?.[id] === undefined) {
      w.push(`capacité « ${id} » approuvée mais non demandée par l'app : sans effet`);
    }
  }
  return w;
}

const slug = (s) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

/**
 * Registry synthétique de l'app générique : une page par app embarquée + une entrée de navigation déclarative
 * (extension `navEntry` du slot `topbar-nav-slot`, même contrat que les apps internes : seule sa `meta` est lue par la TopBar).
 * Format des routes.json : docs/integration-apps/02.
 *
 * `placement.rail` (panneau de rail) n'est PAS synthétisé : le composant `railPanel` d'une app interne est lié à une section
 * figée (`<SectionNavPanel section="…"/>`), contrat incompatible avec une app générique ; l'accès passe par la TopBar.
 */
export function buildEmbedRegistry(embeds) {
  const pages = [];
  const extensions = [];
  embeds.forEach((e, i) => {
    const m = e.manifest;
    pages.push({ component: 'root', route: m.route, online: true, offline: false });
    extensions.push({
      name: `embed-${slug(e.name)}-nav`,
      slot: 'topbar-nav-slot',
      component: 'navEntry',
      online: true,
      offline: false,
      order: 900 + i,
      meta: {
        section: slug(m.route),
        sectionLabel: m.title,
        group: slug(m.placement?.group ?? 'apps'),
        groupLabel: m.placement?.group ?? 'Applications',
        label: m.title,
        description: m.title,
        icon: m.placement?.icon ?? 'AppWindow',
        route: m.route,
      },
    });
  });
  return { pages, extensions };
}

/** Contenu de `<spa>/embed-apps.json` lu par l'app générique (publié par serve-prod, jamais écrit sur disque). */
export function buildEmbedConfig(embeds) {
  return {
    version: 1,
    apps: embeds.map((e) => ({ name: e.name, version: e.version, route: e.manifest.route, manifest: e.manifest, approved: e.approved, limits: e.limits })),
  };
}
