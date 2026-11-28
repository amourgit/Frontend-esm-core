/**
 * Apps EMBARQUÉES (`kind: "embed"`) : déclaration `egen-config.json` publiée par l'app, grants approuvés, registry synthétique.
 *
 * Module sans dépendance (Node >= 18), utilisé par external-apps.mjs (chargement), sync-external-apps.mjs
 * (récupération du manifeste) et serve-prod.mjs (publication). Spécification : docs/integration-apps/17.
 *
 * ⚠ Les constantes ci-dessous DOIVENT rester alignées sur le catalogue de `@egen-civitas/esm-embed-protocol`
 *   (CAPABILITY_IDS, `defaultGrant`, règles de `validateManifest`). Le Core ne peut pas importer ce paquet ici
 *   (outils sans dépendance, exécutés avant toute installation) : un test de parité l'impose dès que le paquet est
 *   installé (voir plan 18, P5c.6). Les grants EFFECTIFS ne sont PAS calculés ici : le navigateur les calcule avec
 *   `effectiveGrants` du protocole (une seule implémentation), à partir du manifeste et du plafond approuvé.
 */

/** Nom de l'app générique (packages/apps/esm-embed-app) qui monte toutes les apps embarquées. */
export const EMBED_APP_NAME = '@egen/esm-embed-app';

export const CAPABILITY_IDS = [
  'tenant', 'locale', 'navigation', 'events', 'notifications', 'dialogs', 'flags', 'config', 'telemetry', 'extensions', 'lifecycle',
];
/** Capacités accordées sans approbation (état d'interface du Core en lecture, sans risque). */
export const DEFAULT_GRANT_CAPABILITIES = new Set(['tenant', 'locale', 'navigation', 'config', 'telemetry', 'lifecycle']);

/**
 * RÈGLE D'OR (docs/integration-apps/17 §2) : le SDK ne transporte que ce dont le Core est lui-même la source.
 * Ces capacités sont volontairement ABSENTES ; les demander est une erreur explicite (même message que le protocole).
 */
export const REMOVED_CAPABILITIES = {
  session: "l'identité ne vient pas du Core : l'app obtient son jeton auprès de Keycloak (OIDC)",
  auth: "l'authentification ne vient pas du Core : l'app obtient son jeton auprès de Keycloak (OIDC)",
  permissions: "les droits sont portés par le jeton et le backend de l'app, pas par le Core",
  theme: 'le thème vient de sa source (service de thèmes), pas du Core',
  api: "l'app appelle ses backends avec son propre jeton Keycloak ; le Core ne relaie pas d'appels authentifiés",
};
const removedMsg = (where, id) => `${where}.${id} : capacité absente du SDK — ${REMOVED_CAPABILITIES[id]} (docs/integration-apps/17 §2)`;

/**
 * Droits d'iframe négociés (docs/integration-apps/17 §7 bis) : listes blanches STRICTES, alignées sur le protocole.
 * `allow-top-navigation*` est volontairement absent : une app embarquée ne pilote jamais la fenêtre du Core.
 */
export const IFRAME_SANDBOX_TOKENS = [
  'allow-downloads', 'allow-forms', 'allow-modals', 'allow-pointer-lock', 'allow-popups', 'allow-popups-to-escape-sandbox', 'allow-presentation', 'allow-same-origin', 'allow-scripts',
];
export const IFRAME_ALLOW_TOKENS = [
  'autoplay', 'camera', 'clipboard-read', 'clipboard-write', 'display-capture', 'fullscreen', 'geolocation', 'microphone', 'picture-in-picture', 'web-share',
];

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
      if (Object.hasOwn(REMOVED_CAPABILITIES, id)) errors.push(removedMsg('capabilities', id));
      else if (!CAPABILITY_IDS.includes(id)) errors.push(`capabilities.${id} : capacité inconnue`);
      else if (!isObj(cfg)) errors.push(`capabilities.${id} : objet attendu`);
    }
  }
  errors.push(...checkIframe(m.iframe, 'iframe'), ...checkConfig(m.config));
  if (m.extensions !== undefined) errors.push(...checkExtensionDecls(m.extensions, typeof m.url === 'string' ? m.url : undefined));
  return errors;
}

/** Politique des toasts (`exclusive`, `rate`) : mêmes règles que `validateNotificationConfig` du protocole. */
export function checkNotificationPolicy(c) {
  const errors = [];
  const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
  if (c.exclusive !== undefined && typeof c.exclusive !== 'boolean') errors.push('notifications.exclusive : booléen attendu');
  if (c.rate !== undefined) {
    if (!isObj(c.rate)) errors.push('notifications.rate : objet { max, perSeconds } attendu');
    else {
      if (!int(c.rate.max, 1, 100)) errors.push('notifications.rate.max : entier de 1 à 100');
      if (!int(c.rate.perSeconds, 1, 3600)) errors.push('notifications.rate.perSeconds : entier de 1 à 3600');
    }
  }
  return errors;
}

/** Valide un bloc `iframe` (`{ sandbox?: string[], allow?: string[] }`) : jetons connus uniquement, sans doublon. */
export function checkIframe(iframe, where = 'iframe') {
  if (iframe === undefined) return [];
  if (!isObj(iframe)) return [`${where} : objet { sandbox, allow } attendu`];
  const errors = [];
  for (const [k, known] of [['sandbox', IFRAME_SANDBOX_TOKENS], ['allow', IFRAME_ALLOW_TOKENS]]) {
    const v = iframe[k];
    if (v === undefined) continue;
    if (!Array.isArray(v) || v.length > 20) { errors.push(`${where}.${k} : tableau (≤ 20) de jetons attendu`); continue; }
    const seen = new Set();
    for (const t of v) {
      if (typeof t !== 'string' || !known.includes(t)) errors.push(`${where}.${k} : jeton « ${String(t)} » hors liste blanche (${known.join(', ')})`);
      else if (seen.has(t)) errors.push(`${where}.${k} : jeton « ${t} » en double`);
      else seen.add(t);
    }
  }
  for (const k of Object.keys(iframe)) if (k !== 'sandbox' && k !== 'allow') errors.push(`${where}.${k} : clé inconnue (sandbox | allow)`);
  return errors;
}

/** Valide le plafond approuvé par l'opérateur : `{ capacité: false | { … } }`. */
export function checkApproved(approved) {
  if (approved === undefined) return [];
  if (!isObj(approved)) return ['grants : objet attendu'];
  const errors = [];
  for (const [id, cfg] of Object.entries(approved)) {
    if (id === 'iframe') { if (cfg !== false) errors.push(...checkIframe(cfg, 'grants.iframe')); continue; }
    if (Object.hasOwn(REMOVED_CAPABILITIES, id)) errors.push(removedMsg('grants', id));
    else if (!CAPABILITY_IDS.includes(id)) errors.push(`grants.${id} : capacité inconnue`);
    else if (cfg !== false && !isObj(cfg)) errors.push(`grants.${id} : false ou objet attendu`);
    else if (id === 'notifications' && isObj(cfg)) errors.push(...checkNotificationPolicy(cfg).map((m) => `grants.${m}`));
  }
  return errors;
}

/** Configuration publique de l'app servie par la capacité `config` : objet JSON ≤ 8 Ko, rien de secret. */
export function checkConfig(config) {
  if (config === undefined) return [];
  if (!isObj(config)) return ['config : objet attendu'];
  return JSON.stringify(config).length > 8192 ? ['config : 8 Ko au maximum'] : [];
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
  for (const [k, requested] of Object.entries(manifest.iframe ?? {})) {
    const ceiling = isObj(approved.iframe) && Array.isArray(approved.iframe[k]) ? approved.iframe[k] : [];
    for (const t of requested) if (!ceiling.includes(t)) w.push(`droit d'iframe « ${k}: ${t} » demandé par l'app mais non approuvé (grants.iframe) : il sera refusé`);
  }
  for (const d of unapprovedContributions(manifest, approved)) {
    w.push(`contribution « ${d.name} » au slot « ${d.slot} » non approuvée (extensions.contribute) : elle n'apparaîtra pas`);
  }
  for (const id of Object.keys(approved)) {
    if (id === 'iframe') continue; // droit d'iframe : traité ci-dessus (demandé vs approuvé), ce n'est pas une capacité
    // `extensions.contribute` s'applique aux contributions déclarées (`extensions[]`) sans demande de capacité : seule la découverte (`discover`) en exige une.
    const needsRequest = id === 'extensions' ? isObj(approved.extensions) && Array.isArray(approved.extensions.discover) && approved.extensions.discover.length > 0 : true;
    if (approved[id] !== false && needsRequest && !DEFAULT_GRANT_CAPABILITIES.has(id) && manifest.capabilities?.[id] === undefined) {
      w.push(`capacité « ${id} » approuvée mais non demandée par l'app : sans effet`);
    }
  }
  return w;
}

const slug = (s) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

const EXT_NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SLOT_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;
const INTERNAL_PATH_RE = /^\/(?![/\\])[^\s\\\u0000-\u001f\u007f]*$/;

/** Valide les contributions d'extension (mêmes règles que `validateExtensionDecls` du protocole). */
export function checkExtensionDecls(input, appUrl) {
  if (!Array.isArray(input)) return ['extensions : tableau attendu'];
  if (input.length > 20) return ['extensions : 20 contributions au maximum'];
  const errors = [];
  const seen = new Set();
  let origin;
  try { origin = appUrl ? new URL(appUrl).origin : undefined; } catch { /* url invalide : déjà signalée */ }
  input.forEach((e, i) => {
    const at = `extensions[${i}]`;
    if (!isObj(e)) return void errors.push(`${at} : objet attendu`);
    if (typeof e.name !== 'string' || !EXT_NAME_RE.test(e.name)) errors.push(`${at}.name : minuscules, chiffres et tirets (≤ 64)`);
    else if (seen.has(e.name)) errors.push(`${at}.name : « ${e.name} » en double`);
    else seen.add(e.name);
    if (typeof e.slot !== 'string' || !SLOT_RE.test(e.slot)) errors.push(`${at}.slot : nom de slot attendu (minuscules, chiffres, tirets)`);
    if (e.view !== undefined && !(typeof e.view === 'string' && e.view.length <= 2000 && INTERNAL_PATH_RE.test(e.view))) errors.push(`${at}.view : chemin interne de l'app attendu`);
    if (e.order !== undefined && !Number.isFinite(e.order)) errors.push(`${at}.order : nombre attendu`);
    if (e.height !== undefined && !(typeof e.height === 'number' && e.height >= 0 && e.height <= 5000)) errors.push(`${at}.height : 0 à 5000`);
    if (e.privileges !== undefined && !(Array.isArray(e.privileges) && e.privileges.length <= 10 && e.privileges.every((p) => typeof p === 'string' && p.length > 0 && p.length <= 100))) errors.push(`${at}.privileges : tableau (≤ 10) de textes`);
    if (e.featureFlag !== undefined && !(typeof e.featureFlag === 'string' && e.featureFlag.length > 0 && e.featureFlag.length <= 100)) errors.push(`${at}.featureFlag : texte attendu`);
    if (e.meta !== undefined) {
      if (!isObj(e.meta)) errors.push(`${at}.meta : objet attendu`);
      else {
        if (JSON.stringify(e.meta).length > 4096) errors.push(`${at}.meta : 4 Ko au maximum`);
        if (e.meta.iconUrl !== undefined) {
          let ok = false;
          try { const u = new URL(String(e.meta.iconUrl)); ok = u.protocol === 'https:' && !!origin && u.origin === origin; } catch { /* invalide */ }
          if (!ok) errors.push(`${at}.meta.iconUrl : https et même origine que l'app (pas de pistage par image externe)`);
        }
      }
    }
  });
  return errors;
}

/** Motif de slot : exact, ou préfixe avec `*` final (`annuaire-*`). `*` seul n'est pas supporté. */
export const slotCovers = (ceiling, q) => ceiling === q || (ceiling.length > 1 && ceiling.endsWith('*') && q.startsWith(ceiling.slice(0, -1)));

const RAIL_SLOTS = new Set(['shell-rail-left-slot', 'shell-rail-right-slot']);

/**
 * Contributions de l'app : celles déclarées (`extensions[]`) + les raccourcis `placement` (entrée de TopBar, panneau de rail)
 * quand l'app ne déclare pas déjà une contribution sur ce slot.
 */
export function contributionsOf(manifest) {
  const decls = [...(manifest.extensions ?? [])];
  const has = (slot) => decls.some((d) => d.slot === slot);
  const p = manifest.placement;
  if (!has('topbar-nav-slot')) {
    decls.push({
      name: 'nav',
      slot: 'topbar-nav-slot',
      meta: { section: slug(manifest.route), sectionLabel: manifest.title, group: slug(p?.group ?? 'apps'), groupLabel: p?.group ?? 'Applications', label: manifest.title, description: manifest.title, icon: p?.icon ?? 'AppWindow', route: manifest.route },
    });
  }
  const railSlot = p?.rail === 'left' ? 'shell-rail-left-slot' : p?.rail === 'right' ? 'shell-rail-right-slot' : undefined;
  if (railSlot && !has(railSlot)) decls.push({ name: 'rail', slot: railSlot, meta: { title: manifest.title, icon: p?.icon ?? 'AppWindow', global: true, section: slug(manifest.route) } });
  return decls;
}

/** Contributions dont le slot est approuvé par l'opérateur (`approved.extensions.contribute`) : seul moyen d'ajouter un composant à un slot du Core. */
export function allowedContributions(manifest, approved = {}) {
  const slots = isObj(approved.extensions) && Array.isArray(approved.extensions.contribute) ? approved.extensions.contribute : [];
  return contributionsOf(manifest).filter((d) => slots.some((s) => slotCovers(s, d.slot)));
}

/** Contributions écartées faute d'approbation (pour les réserves visibles dans le statut). */
export function unapprovedContributions(manifest, approved = {}) {
  const ok = new Set(allowedContributions(manifest, approved));
  return (manifest.extensions ?? []).filter((d) => !ok.has(d));
}

/**
 * Registry synthétique de l'app générique : une page par app + une extension par contribution APPROUVÉE.
 *  - `view` présent → composant `extensionView` (la vue de l'app, dans une iframe, à l'intérieur du slot) ;
 *  - slot de rail sans vue → `railPanel` (liste des sous-options de la section, comme les apps internes) ;
 *  - sinon → `navEntry` (déclaratif : seule la `meta` est lue par le slot, ex. entrée de TopBar).
 * `meta.embed` identifie l'app et la contribution : les composants génériques retrouvent leur contexte par leur propre
 * enregistrement d'extension (ComponentContext + getExtensionRegistration), sans rien deviner d'après l'URL.
 */
export function buildEmbedRegistry(embeds) {
  const pages = [];
  const extensions = [];
  embeds.forEach((e, i) => {
    pages.push({ component: 'root', route: e.manifest.route, online: true, offline: false });
    e.contributions.forEach((d, j) => {
      const component = d.view ? 'extensionView' : RAIL_SLOTS.has(d.slot) ? 'railPanel' : 'navEntry';
      extensions.push({
        name: `embed-${slug(e.name)}-${d.name}`,
        slot: d.slot,
        component,
        online: true,
        offline: false,
        order: d.order ?? 900 + i * 10 + j,
        ...(d.privileges?.length ? { privileges: d.privileges } : {}),
        ...(d.featureFlag ? { featureFlag: d.featureFlag } : {}),
        meta: { ...(d.meta ?? {}), order: d.order ?? 900 + i * 10 + j, embed: { app: e.name, ext: d.name } },
      });
    });
  });
  return { pages, extensions };
}

/** Contenu de `<spa>/embed-apps.json` lu par l'app générique (publié par serve-prod, jamais écrit sur disque). */
export function buildEmbedConfig(embeds) {
  return {
    version: 1,
    apps: embeds.map((e) => ({ name: e.name, version: e.version, route: e.manifest.route, manifest: e.manifest, approved: e.approved, limits: e.limits, config: e.config, contributions: e.contributions })),
  };
}

/** Droits d'iframe demandés vs approuvés (journal opérateur, `external-apps.status.json`) ; l'effectif est calculé dans le navigateur. */
export function iframeReport(manifest, approved = {}) {
  const req = manifest.iframe ?? {};
  const ap = isObj(approved.iframe) ? approved.iframe : {};
  return { requested: { sandbox: req.sandbox ?? [], allow: req.allow ?? [] }, approved: { sandbox: ap.sandbox ?? [], allow: ap.allow ?? [] } };
}
