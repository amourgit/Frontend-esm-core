// Tests : `yarn test:tools` — apps embarquées (kind: "embed"), docs/integration-apps/17 et 18
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMBED_APP_NAME, REMOVED_CAPABILITIES, allowedContributions, buildEmbedConfig, buildEmbedRegistry, checkApproved, checkConfig, checkEmbedManifest, checkExtensionDecls, checkIframe, IFRAME_ALLOW_TOKENS, IFRAME_SANDBOX_TOKENS, iframeReport, checkLimits, contributionsOf, embedWarnings, slotCovers } from './embed-apps.mjs';
import { LOCK_FILE, LOCK_VERSION, loadExternalApps, sha256 } from './external-apps.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SPA = '/egen-civitas/spa';
const tmp = () => mkdtempSync(join(tmpdir(), 'egen-embed-'));

const manifest = (over = {}) => ({
  manifestVersion: 1,
  name: '@civitas/esm-studio-app',
  version: '1.2.0',
  title: 'Theme Studio',
  url: 'https://studio.exemple.org',
  route: 'studio',
  technology: 'nextjs',
  navigation: { mode: 'history', basePath: '/' },
  placement: { rail: 'left', icon: 'Palette' },
  capabilities: { locale: {}, notifications: {}, events: { publish: ['app.studio.*'] } },
  extensions: [{ name: 'chip', slot: 'topbar-actions-slot', view: '/_egen/chip', order: 5, height: 48, privileges: ['Voir Studio'], featureFlag: 'studio' }],
  ...over,
});
const APPROVED = { notifications: {}, events: { publish: ['app.*'] }, extensions: { contribute: ['topbar-nav-slot', 'shell-rail-left-slot', 'topbar-actions-slot'] } };

/** Dossier externe + verrou contenant une ou plusieurs apps embarquées. */
function fixture(entries) {
  const dir = tmp();
  mkdirSync(join(dir, 'embed', 'manifests'), { recursive: true });
  const apps = {};
  entries.forEach((e, i) => {
    const m = e.manifest ?? manifest();
    const raw = Buffer.from(JSON.stringify(m));
    const file = `embed/manifests/m${i}.json`;
    writeFileSync(join(dir, file), e.rawOverride ?? raw);
    apps[e.lockName ?? m.name] = { kind: 'embed', version: m.version, manifestFile: file, manifestSha256: e.sha ?? sha256(raw), approved: e.approved ?? APPROVED, ...(e.limits ? { limits: e.limits } : {}), ...(e.config ? { config: e.config } : {}) };
  });
  writeFileSync(join(dir, LOCK_FILE), JSON.stringify({ lockVersion: LOCK_VERSION, apps }));
  return dir;
}
const load = (dir, extra = {}) => loadExternalApps({ dir, spaPath: SPA, ...extra });

test('manifeste : cas nominal et erreurs', () => {
  assert.deepEqual(checkEmbedManifest(manifest()), []);
  const errs = checkEmbedManifest(manifest({ url: 'http://x.org', route: 'A B', technology: 'cobol', capabilities: { zzz: {} }, navigation: { mode: 'x' } }));
  assert.ok(errs.length >= 5, errs.join('|'));
  assert.deepEqual(checkEmbedManifest(manifest({ url: 'http://localhost:3000' }), { allowHttp: true }), []);
  assert.ok(checkEmbedManifest(manifest({ url: 'https://u:p@x.org' })).length);
  assert.ok(checkEmbedManifest(null).length);
});

test('règle d’or : session, thème, droits, api et auth sont absents du SDK, avec la voie à suivre', () => {
  for (const id of Object.keys(REMOVED_CAPABILITIES)) {
    const e = checkEmbedManifest(manifest({ capabilities: { [id]: {} } }));
    assert.match(e.join(' '), /absente du SDK/, id);
    assert.match(checkApproved({ [id]: {} }).join(' '), /absente du SDK/, id);
  }
  assert.match(checkEmbedManifest(manifest({ capabilities: { session: {} } })).join(' '), /Keycloak/);
});

test('contributions déclarées : validation', () => {
  const ok = { name: 'nav', slot: 'topbar-nav-slot', meta: { iconUrl: 'https://studio.exemple.org/i.svg' } };
  assert.deepEqual(checkExtensionDecls([ok], 'https://studio.exemple.org'), []);
  const bad = checkExtensionDecls([{ ...ok, name: 'A B' }, ok, ok, { ...ok, name: 'v', view: '//evil' }, { ...ok, name: 'x', slot: 'X Y' }, { ...ok, name: 'i', meta: { iconUrl: 'https://tracker.exemple.net/i.svg' } }, { ...ok, name: 'h', height: 99999 }], 'https://studio.exemple.org');
  assert.ok(bad.length >= 6, bad.join('|'));
  assert.deepEqual(checkExtensionDecls('x'), ['extensions : tableau attendu']);
  assert.match(checkExtensionDecls([{ ...ok, meta: { x: 'a'.repeat(5000) } }]).join(), /4 Ko/);
});

test('plafond approuvé, limites et configuration', () => {
  assert.deepEqual(checkApproved({ flags: { names: ['beta'] }, dialogs: false, extensions: { discover: ['topbar-nav-slot'] } }), []);
  assert.ok(checkApproved({ nope: {} }).length);
  assert.ok(checkApproved({ events: 'oui' }).length);
  assert.deepEqual(checkLimits({ requestsPerSecond: 50 }), []);
  assert.ok(checkLimits({ inconnue: 1 }).length);
  assert.ok(checkLimits({ requestsPerSecond: -1 }).length);
  assert.deepEqual(checkConfig({ a: 1 }), []);
  assert.ok(checkConfig([]).length);
  assert.match(checkConfig({ x: 'a'.repeat(9000) }).join(), /8 Ko/);
});

test('toasts : politique de l’opérateur validée (exclusive, rate)', () => {
  assert.deepEqual(checkApproved({ notifications: {} }), []);
  assert.deepEqual(checkApproved({ notifications: { exclusive: false, rate: { max: 5, perSeconds: 30 } } }), []);
  assert.match(checkApproved({ notifications: { exclusive: 'non' } }).join(), /grants\.notifications\.exclusive/);
  assert.equal(checkApproved({ notifications: { rate: { max: 0, perSeconds: 5000 } } }).length, 2);
  assert.equal(checkApproved({ notifications: { rate: 'x' } }).length, 1);
  assert.equal(load(fixture([{ approved: { ...APPROVED, notifications: { rate: { max: 999 } } } }])).apps[0].status, 'rejected');
});

test('slots : exact ou préfixe avec * final ; * seul refusé', () => {
  assert.ok(slotCovers('topbar-nav-slot', 'topbar-nav-slot'));
  assert.ok(slotCovers('annuaire-*', 'annuaire-detail-slot'));
  assert.ok(!slotCovers('annuaire-*', 'sites-x'));
  assert.ok(!slotCovers('*', 'anything'));
});

test('contributions : raccourcis placement + déclarations, approbation par slot', () => {
  const decls = contributionsOf(manifest());
  assert.deepEqual(decls.map((d) => [d.name, d.slot]), [['chip', 'topbar-actions-slot'], ['nav', 'topbar-nav-slot'], ['rail', 'shell-rail-left-slot']]);
  // une déclaration explicite sur un slot supprime le raccourci correspondant
  const explicit = contributionsOf(manifest({ extensions: [{ name: 'mon-nav', slot: 'topbar-nav-slot', meta: { label: 'X' } }] }));
  assert.deepEqual(explicit.map((d) => d.name), ['mon-nav', 'rail']);
  // sans approbation : rien ; avec : seulement les slots couverts
  assert.deepEqual(allowedContributions(manifest(), {}), []);
  assert.deepEqual(allowedContributions(manifest(), { extensions: { contribute: ['topbar-nav-slot'] } }).map((d) => d.name), ['nav']);
  assert.deepEqual(allowedContributions(manifest(), APPROVED).length, 3);
  assert.deepEqual(allowedContributions(manifest(), { extensions: false }), []);
});

test('réserves : demandée non approuvée, approuvée non demandée, contribution non approuvée', () => {
  const w = embedWarnings(manifest(), { events: {}, flags: {}, extensions: { contribute: ['topbar-nav-slot'] } });
  assert.ok(w.some((x) => x.includes('notifications') && x.includes('refusée')));
  assert.ok(w.some((x) => x.includes('flags') && x.includes('sans effet')));
  assert.ok(w.some((x) => x.includes('contribution « chip »') && x.includes('non approuvée')));
  assert.deepEqual(embedWarnings(manifest({ capabilities: { locale: {} }, extensions: undefined, placement: undefined }), {}), []);
});

test('chargeur : acceptée, sans entrée d’import map ni routes propres ; contributions et config publiées', () => {
  const r = load(fixture([{ config: { studioApi: 'https://api.exemple.org' } }]));
  assert.equal(r.apps[0].status, 'accepted');
  assert.equal(r.apps[0].kind, 'embed');
  assert.deepEqual(r.importMap, {});
  assert.deepEqual(r.routes, {});
  assert.equal(r.embed.length, 1);
  assert.equal(r.embed[0].manifest.route, 'studio');
  assert.deepEqual(r.embed[0].approved, APPROVED);
  assert.deepEqual(r.embed[0].config, { studioApi: 'https://api.exemple.org' });
  assert.deepEqual(r.embed[0].contributions.map((d) => d.name), ['chip', 'nav', 'rail']);
});

test('registry synthétique : page + une extension par contribution APPROUVÉE, bon composant, meta.embed', () => {
  const r = load(fixture([{}]));
  assert.deepEqual(r.embedRegistry.pages, [{ component: 'root', route: 'studio', online: true, offline: false }]);
  const byName = Object.fromEntries(r.embedRegistry.extensions.map((e) => [e.name, e]));
  assert.deepEqual(Object.keys(byName).sort(), ['embed-civitas-esm-studio-app-chip', 'embed-civitas-esm-studio-app-nav', 'embed-civitas-esm-studio-app-rail']);
  const chip = byName['embed-civitas-esm-studio-app-chip'];
  assert.equal(chip.component, 'extensionView');
  assert.equal(chip.slot, 'topbar-actions-slot');
  assert.deepEqual(chip.privileges, ['Voir Studio']);
  assert.equal(chip.featureFlag, 'studio');
  assert.equal(chip.order, 5);
  assert.deepEqual(chip.meta.embed, { app: '@civitas/esm-studio-app', ext: 'chip' });
  const nav = byName['embed-civitas-esm-studio-app-nav'];
  assert.equal(nav.component, 'navEntry');
  assert.equal(nav.slot, 'topbar-nav-slot');
  assert.deepEqual({ section: nav.meta.section, label: nav.meta.label, route: nav.meta.route, icon: nav.meta.icon }, { section: 'studio', label: 'Theme Studio', route: 'studio', icon: 'Palette' });
  const rail = byName['embed-civitas-esm-studio-app-rail'];
  assert.equal(rail.component, 'railPanel');
  assert.equal(rail.slot, 'shell-rail-left-slot');
  assert.deepEqual({ title: rail.meta.title, section: rail.meta.section, global: rail.meta.global }, { title: 'Theme Studio', section: 'studio', global: true });
  assert.equal(buildEmbedRegistry([{ name: '@a/b', manifest: manifest({ placement: undefined, extensions: undefined }), contributions: [] }]).extensions.length, 0);
  const cfg = buildEmbedConfig(r.embed).apps[0];
  assert.equal(cfg.route, 'studio');
  assert.equal(cfg.contributions.length, 3);
  assert.deepEqual(cfg.config, {});
});

test('sans approbation de slot, aucune extension n’est injectée dans le Core', () => {
  const r = load(fixture([{ approved: { notifications: {}, events: { publish: ['app.*'] } } }]));
  assert.equal(r.apps[0].status, 'accepted-with-warnings');
  assert.deepEqual(r.embedRegistry.extensions, []);
  assert.deepEqual(r.embedRegistry.pages.length, 1);
  assert.ok(r.apps[0].warnings.some((w) => w.includes('non approuvée')));
});

test('chargeur : réserves sur l’écart demande / approbation', () => {
  const r = load(fixture([{ approved: {} }]));
  assert.equal(r.apps[0].status, 'accepted-with-warnings');
  assert.ok(r.apps[0].warnings.some((w) => w.includes('notifications')));
});

test('chargeur : rejets (empreinte, nom, route prise, route en double, capacité retirée/inconnue, plafond, config)', () => {
  assert.match(load(fixture([{ sha: 'a'.repeat(64) }])).apps[0].errors.join(' '), /modifié depuis la synchronisation/);
  assert.match(load(fixture([{ lockName: '@autre/nom' }])).apps[0].errors.join(' '), /diffère du nom du verrou/);
  assert.match(load(fixture([{}]), { reservedRoutes: new Set(['studio']) }).apps[0].errors.join(' '), /déjà utilisée par une autre page/);
  const two = load(fixture([{}, { manifest: manifest({ name: '@civitas/esm-autre-app' }) }]));
  assert.deepEqual(two.apps.map((a) => a.status), ['accepted', 'rejected']);
  assert.match(two.apps[1].errors.join(' '), /autre app embarquée/);
  assert.equal(two.embed.length, 1);
  assert.match(load(fixture([{ manifest: manifest({ capabilities: { session: {} } }) }])).apps[0].errors.join(' '), /absente du SDK/);
  assert.equal(load(fixture([{ manifest: manifest({ capabilities: { zzz: {} } }) }])).apps[0].status, 'rejected');
  assert.equal(load(fixture([{ approved: { nope: {} } }])).apps[0].status, 'rejected');
  assert.equal(load(fixture([{ approved: { theme: {} } }])).apps[0].status, 'rejected');
  assert.equal(load(fixture([{ config: [] }])).apps[0].status, 'rejected');
  assert.equal(load(fixture([{}]), { internalNames: new Set(['@civitas/esm-studio-app']) }).apps[0].status, 'rejected');
});

test('chargeur : une entrée embed n’émet pas l’avertissement « aucun routes.json »', () => {
  const r = load(fixture([{}]));
  assert.ok(!r.apps[0].warnings.some((w) => w.includes('routes.json')));
});

// ── sync : manifeste local, verrou, dérive ──────────────────────────────────
function syncRoot(cfg, m = manifest()) {
  const root = tmp();
  mkdirSync(join(root, 'tools'));
  for (const f of ['sync-external-apps.mjs', 'external-apps.mjs', 'embed-apps.mjs']) cpSync(join(HERE, f), join(root, 'tools', f));
  writeFileSync(join(root, 'egen-config.json'), JSON.stringify(m));
  writeFileSync(join(root, 'external-apps.json'), JSON.stringify(cfg));
  return root;
}
const runSync = (root, ...args) => spawnSync(process.execPath, [join(root, 'tools/sync-external-apps.mjs'), ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, EGEN_EXTERNAL_DIR: '', EGEN_EXTERNAL_APPS: '' } });

test('sync : écrit le manifeste figé et le verrou ; check conforme puis dérive détectée', () => {
  const root = syncRoot({ embed: [{ manifest: './egen-config.json', grants: { notifications: {} }, limits: { requestsPerSecond: 50 }, config: { studioApi: 'https://api.exemple.org' } }] });
  const r = runSync(root);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const lock = JSON.parse(readFileSync(join(root, 'external-apps', LOCK_FILE), 'utf8'));
  const e = lock.apps['@civitas/esm-studio-app'];
  assert.equal(e.kind, 'embed');
  assert.equal(e.version, '1.2.0');
  assert.deepEqual(e.approved, { notifications: {} });
  assert.deepEqual(e.limits, { requestsPerSecond: 50 });
  assert.deepEqual(e.config, { studioApi: 'https://api.exemple.org' });
  assert.match(e.manifestFile, /^embed\/manifests\/civitas-esm-studio-app\.json$/);
  assert.equal(sha256(readFileSync(join(root, 'external-apps', e.manifestFile))), e.manifestSha256);
  assert.equal(runSync(root, '--check').status, 0);
  writeFileSync(join(root, 'egen-config.json'), JSON.stringify(manifest({ version: '9.9.9' })));
  const drift = runSync(root, '--check');
  assert.equal(drift.status, 1);
  assert.match(drift.stdout + drift.stderr, /dérive : le manifeste/);
});

test('sync : manifeste invalide, doublon et plafond invalide refusés', () => {
  let root = syncRoot({ embed: [{ manifest: './egen-config.json' }] }, { nope: 1 });
  let r = runSync(root);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /invalide/);
  root = syncRoot({ embed: [{ manifest: './egen-config.json' }, { manifest: './egen-config.json' }] });
  r = runSync(root);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /déclarée deux fois/);
  root = syncRoot({ embed: [{ manifest: './egen-config.json', grants: { nope: {} } }] });
  assert.equal(runSync(root).status, 1);
  root = syncRoot({ embed: [{ manifest: './egen-config.json', grants: { theme: {} } }] });
  assert.match(runSync(root).stdout + runSync(root).stderr, /absente du SDK/);
  root = syncRoot({ embed: [{ manifest: './egen-config.json', config: [] }] });
  assert.equal(runSync(root).status, 1);
  root = syncRoot({ embed: [{ manifest: './absent.json' }] });
  assert.match(runSync(root).stdout + runSync(root).stderr, /introuvable/);
});

// ── droits d'iframe négociés (plan 18, P5c.6 à P5c.8) ───────────────────────
const IFRAME_REQ = { sandbox: ['allow-downloads', 'allow-modals', 'allow-popups-to-escape-sandbox'], allow: ['clipboard-read', 'clipboard-write', 'fullscreen'] };

test('iframe : liste blanche stricte du manifeste et du plafond (jamais de top-navigation, jeton inconnu rejeté)', () => {
  assert.deepEqual(checkEmbedManifest(manifest({ iframe: IFRAME_REQ })), []);
  assert.deepEqual(checkApproved({ iframe: IFRAME_REQ }), []);
  assert.deepEqual(checkApproved({ iframe: false }), [], 'false = rien d’accordé');
  assert.match(checkEmbedManifest(manifest({ iframe: { sandbox: ['allow-top-navigation'] } })).join(), /hors liste blanche/);
  assert.match(checkEmbedManifest(manifest({ iframe: { allow: ['usb'] } })).join(), /iframe\.allow/);
  assert.match(checkApproved({ iframe: { sandbox: ['allow-top-navigation-by-user-activation'] } }).join(), /grants\.iframe\.sandbox/);
  assert.ok(checkIframe({ sandbox: ['allow-downloads', 'allow-downloads'] }).join().includes('en double'));
  assert.ok(checkIframe({ sandbox: 'allow-downloads' }).length);
  assert.ok(checkIframe({ autre: [] }).length);
  assert.ok(checkIframe([]).length);
  assert.ok(!IFRAME_SANDBOX_TOKENS.some((t) => t.includes('top-navigation')));
  assert.ok(IFRAME_ALLOW_TOKENS.includes('clipboard-write'));
});

test('iframe : réserves demandé ≠ approuvé et journal demandé vs approuvé', () => {
  const m = manifest({ iframe: IFRAME_REQ });
  const w = embedWarnings(m, { ...APPROVED, iframe: { sandbox: ['allow-downloads'], allow: ['fullscreen'] } });
  assert.ok(w.some((x) => x.includes('sandbox: allow-modals') && x.includes('non approuvé')));
  assert.ok(w.some((x) => x.includes('allow: clipboard-read')));
  assert.ok(!w.some((x) => x.includes('allow-downloads')));
  assert.ok(!w.some((x) => x.includes('capacité « iframe »')), 'iframe n’est pas une capacité');
  assert.deepEqual(iframeReport(m, { iframe: { sandbox: ['allow-downloads'] } }), { requested: IFRAME_REQ, approved: { sandbox: ['allow-downloads'], allow: [] } });
  assert.deepEqual(iframeReport(manifest(), {}), { requested: { sandbox: [], allow: [] }, approved: { sandbox: [], allow: [] } });
});

test('iframe : le verrou fige la demande et le plafond ; le statut journalise demandé vs approuvé', () => {
  const r = load(fixture([{ manifest: manifest({ iframe: IFRAME_REQ }), approved: { ...APPROVED, iframe: { sandbox: ['allow-downloads'] } } }]));
  assert.equal(r.apps[0].status, 'accepted-with-warnings');
  assert.deepEqual(r.apps[0].iframe.approved, { sandbox: ['allow-downloads'], allow: [] });
  assert.deepEqual(r.embed[0].manifest.iframe, IFRAME_REQ);
  assert.deepEqual(r.embed[0].approved.iframe, { sandbox: ['allow-downloads'] });
  const bad = load(fixture([{ manifest: manifest({ iframe: { sandbox: ['allow-top-navigation'] } }) }]));
  assert.equal(bad.apps[0].status, 'rejected');
});

test('egen-config.json : la config publique de l’app est servie, celle de l’opérateur la surcharge', () => {
  const r = load(fixture([{ manifest: manifest({ config: { studioApi: 'https://app.exemple.org', lang: 'fr' } }), config: { studioApi: 'https://api.exemple.org' } }]));
  assert.deepEqual(r.embed[0].config, { studioApi: 'https://api.exemple.org', lang: 'fr' });
  assert.ok(checkEmbedManifest(manifest({ config: [] })).length);
  assert.ok(checkEmbedManifest(manifest({ config: { big: 'x'.repeat(9000) } })).length);
});

test('sync : source par défaut = egen-config.json de l’app (url) ; déclaration côté Core = second recours', () => {
  // `url` : on remplace le réseau par un serveur local servant /egen-config.json
  const root = syncRoot({ embed: [{ url: 'http://127.0.0.1:1', grants: { iframe: IFRAME_REQ } }] });
  const r = runSync(root);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /egen-config\.json/, 'la source dérivée de l’url est <url>/egen-config.json');
  const inline = syncRoot({ embed: [{ declaration: manifest({ iframe: IFRAME_REQ }), grants: { iframe: IFRAME_REQ } }] });
  const ok = runSync(inline);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  const lock = JSON.parse(readFileSync(join(inline, 'external-apps', LOCK_FILE), 'utf8'));
  const e = lock.apps['@civitas/esm-studio-app'];
  assert.equal(e.manifestSource, 'inline');
  assert.deepEqual(e.approved.iframe, IFRAME_REQ);
  assert.equal(runSync(inline, '--check').status, 0, 'inline : aucune dérive distante à surveiller');
  assert.equal(runSync(syncRoot({ embed: [{ url: 'https://a.org', manifest: './x.json' }] })).status, 1, 'une seule source');
  assert.equal(runSync(syncRoot({ embed: [{ grants: {} }] })).status, 1, 'au moins une source');
  assert.equal(runSync(syncRoot({ embed: [{ declaration: manifest(), grants: { iframe: { allow: ['usb'] } } }] })).status, 1, 'plafond iframe invalide');
});

test('parité : les listes blanches d’iframe de l’outillage sont celles du protocole publié', async (t) => {
  let proto;
  try {
    proto = await import('@egen-civitas/esm-embed-protocol');
  } catch {
    return t.skip('@egen-civitas/esm-embed-protocol non installé (yarn install)');
  }
  assert.deepEqual([...IFRAME_SANDBOX_TOKENS], [...proto.IFRAME_SANDBOX_TOKENS]);
  assert.deepEqual([...IFRAME_ALLOW_TOKENS], [...proto.IFRAME_ALLOW_TOKENS]);
  // même verdict que le protocole sur les formes valides et invalides
  for (const iframe of [IFRAME_REQ, { sandbox: ['allow-top-navigation'] }, { allow: ['usb'] }, { sandbox: ['allow-downloads', 'allow-downloads'] }, { autre: [] }, [], 'x']) {
    assert.equal(checkIframe(iframe).length > 0, proto.validateIframeRights(iframe).length > 0, JSON.stringify(iframe));
  }
});

// ── serve-prod : registry fusionné et embed-apps.json ───────────────────────
async function waitFor(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return r; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`serveur injoignable : ${url}`);
}

async function withServer({ embedAppBuilt }, fn) {
  const root = tmp();
  mkdirSync(join(root, 'tools'));
  for (const f of ['serve-prod.mjs', 'external-apps.mjs', 'embed-apps.mjs', 'runtime-config.mjs']) cpSync(join(HERE, f), join(root, 'tools', f));
  const mkApp = (dir, name, pages) => {
    mkdirSync(join(root, 'packages/apps', dir, 'dist'), { recursive: true });
    mkdirSync(join(root, 'packages/apps', dir, 'src'), { recursive: true });
    writeFileSync(join(root, 'packages/apps', dir, 'package.json'), JSON.stringify({ name, version: '1.0.0', browser: `dist/${dir}.js` }));
    writeFileSync(join(root, 'packages/apps', dir, `dist/${dir}.js`), 'var x;');
    writeFileSync(join(root, 'packages/apps', dir, 'src/routes.json'), JSON.stringify({ pages }));
  };
  mkApp('esm-int-app', '@egen/esm-int-app', [{ component: 'root', route: 'int' }]);
  if (embedAppBuilt) mkApp('esm-embed-app', EMBED_APP_NAME, []);
  mkdirSync(join(root, 'shell'));
  writeFileSync(join(root, 'shell/index.html'), '<html><script>initializeSpa({})</script></html>');
  const ext = join(root, 'external-apps');
  mkdirSync(join(ext, 'embed/manifests'), { recursive: true });
  const m = manifest();
  const raw = Buffer.from(JSON.stringify(m));
  writeFileSync(join(ext, 'embed/manifests/m.json'), raw);
  writeFileSync(join(ext, LOCK_FILE), JSON.stringify({ lockVersion: LOCK_VERSION, apps: { [m.name]: { kind: 'embed', version: m.version, manifestFile: 'embed/manifests/m.json', manifestSha256: sha256(raw), approved: APPROVED } } }));
  const port = 18000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, [join(root, 'tools/serve-prod.mjs')], { env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', EGEN_SHELL_DIR: join(root, 'shell') }, stdio: 'ignore' });
  try {
    await waitFor(`http://127.0.0.1:${port}/healthz`);
    await fn(`http://127.0.0.1:${port}${SPA}`);
  } finally {
    child.kill();
  }
}

test('serve-prod : fusionne les pages embarquées dans le registry de l’app générique et publie embed-apps.json', async () => {
  await withServer({ embedAppBuilt: true }, async (base) => {
    const reg = await (await fetch(`${base}/routes.registry.json`)).json();
    assert.deepEqual(reg[EMBED_APP_NAME].pages, [{ component: 'root', route: 'studio', online: true, offline: false }]);
    assert.deepEqual(reg[EMBED_APP_NAME].extensions.map((e) => e.component).sort(), ['extensionView', 'navEntry', 'railPanel']);
    assert.deepEqual(reg['@egen/esm-int-app'].pages.map((p) => p.route), ['int']);
    const cfgRes = await fetch(`${base}/embed-apps.json`);
    assert.equal(cfgRes.headers.get('cache-control'), 'no-store');
    const cfg = await cfgRes.json();
    assert.equal(cfg.apps.length, 1);
    assert.equal(cfg.apps[0].manifest.url, 'https://studio.exemple.org');
    assert.deepEqual(cfg.apps[0].approved.events, { publish: ['app.*'] });
    assert.equal(cfg.apps[0].contributions.length, 3);
    const status = await (await fetch(`${base}/external-apps.status.json`)).json();
    assert.equal(status.apps[0].kind, 'embed');
  });
});

test('serve-prod : app générique non compilée → apps embarquées rejetées, rien d’exposé', async () => {
  await withServer({ embedAppBuilt: false }, async (base) => {
    const reg = await (await fetch(`${base}/routes.registry.json`)).json();
    assert.equal(reg[EMBED_APP_NAME], undefined);
    assert.deepEqual((await (await fetch(`${base}/embed-apps.json`)).json()).apps, []);
    const status = await (await fetch(`${base}/external-apps.status.json`)).json();
    assert.equal(status.apps[0].status, 'rejected');
    assert.match(status.apps[0].errors.join(' '), /non compilée/);
  });
});
