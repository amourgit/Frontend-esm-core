# 01 — Architecture réelle d'intégration

Tous les points sont ✅ sauf mention contraire. Chemins : `fw/` = Frontend-esm-framework, `core/` = Frontend-esm-core.

## 1. Qui fait quoi

| Acteur | Ce qu'il est | Ce qu'il fait réellement | Où |
| --- | --- | --- | --- |
| **Application** | Un paquet npm qui produit **un bundle** `dist/egen-<nom>.js` (conteneur Module Federation) + un `routes.json` | Exporte des composants sous forme de *lifecycles* ; déclare ses contributions dans `routes.json` | `core/packages/apps/*` ou dépôt externe |
| **Shell** (`@egen-civitas/esm-app-shell`) | La page hôte (`index.html` + JS) | Lit l'import map et le routes registry **dans le DOM**, enregistre les pages dans Single-SPA, fournit les conteneurs (zones, rails, modales…), partage les dépendances | `fw/packages/shell/esm-app-shell` |
| **Framework** (`@egen-civitas/esm-*`) | Bibliothèques partagées | Chargement dynamique, enregistrement des routes/extensions, config, état, API, hooks React, styleguide | `fw/packages/framework/*` |
| **Outillage** (`@egen-civitas/egen`, `rspack-config`) | CLI + config de build | `egen develop/build/assemble/start`, config Rspack/Module Federation par défaut | `fw/packages/tooling/*` |
| **Core** (`Frontend-esm-core`) | Monorepo d'applications | Fournit les 28 apps, `tools/serve-prod.mjs`, `tools/check-nav-routes.mjs`, `tools/scaffold-app.py`. **Ne contient ni Shell ni mécanisme de chargement** : il consomme le Shell compilé (`esm-app-shell` npm) | `core/` |

**Conséquence clé** : la « découverte » et le « chargement » ne sont pas dans le Core. Le Core ne fait qu'**assembler deux fichiers** (import map + routes registry) et les donner au Shell. Le Shell charge ce que ces deux fichiers décrivent, rien d'autre.

## 2. Le contrat minimal en une phrase

> Pour qu'une app soit chargée : (1) son **nom** est une clé de l'import map **et** du routes registry, (2) l'URL de l'import map pointe vers un **conteneur Module Federation** exposant `./start`, (3) chaque `component` déclaré dans le routes registry est un **export de `./start`** qui est une **fonction renvoyant des lifecycles Single-SPA**.

Chaque maillon est détaillé ci-dessous avec sa preuve.

## 3. Démarrage du Shell (ordre réel)

`fw/packages/shell/esm-app-shell/src/index.ts` expose `window.initializeSpa(config)` ; `src/run.ts` enchaîne :

1. `setupPaths` (`window.spaBase`, `getEgenSpaBase()`, `egenBase`, `spaEnv`) puis `<base href>` et `__webpack_public_path__`.
2. `__webpack_init_sharing__('default')` : initialise le **share scope** Module Federation ; alias runtime `@egen-civitas/esm-framework` → `…/src/internal`.
3. `setupImportMapOverrides()`, thème, i18n, tenant (`setupTenantSystem`), styleguide, rendu des conteneurs (toasts, workbench, modales, notifications…).
4. `registerPlatformCapabilities()` (capacités natives, utile au filtre `requiredCapabilities`).
5. **`setupApps()`** : `setupRouteMapOverrides()` puis `getCurrentRouteMap()` puis, **pour chaque entrée du registry**, `registerApp(nom, routes)`.
6. **`finishRegisteringAllApps()`** : crée un `<div id="single-spa-application:<app>-page-<i>">` dans le conteneur de chaque page, puis `registerApplication(...)` Single-SPA.
7. `provideConfigs` (fichiers de config `configUrls`), puis `runShell` → `setupI18n` → **`single-spa.start()`**.
8. En cas d'échec : `handleInitFailure` → écran d'erreur (`#app-error`) ou écran « hôte incompatible » (cibles natives).

## 4. Import map : d'où vient-elle, que contient-elle

- **Format** : `{ "imports": { "<nom du paquet>": "<URL du bundle>" } }` ; type `ImportMap` dans `fw/packages/framework/esm-globals/src/types.ts`.
- **Lecture** : `getCurrentPageMap()` (`fw/packages/framework/esm-dynamic-loading/src/import-maps.ts`) lit **toutes** les balises `<script type="systemjs-importmap">` du DOM (inline ou `src`), fusionne leurs `imports` (la dernière gagne).
- **Production du HTML** : `fw/packages/shell/esm-app-shell/src/index.ejs` émet la balise (inline si `EGEN_ESM_IMPORTMAP`, sinon `src=<publicPath>/importmap.json`) ; `serve-prod.mjs` remplace/sert le même fichier.
- **Surcharges de développement** : préfixe `localStorage` `import-map-override:`, actives **uniquement** si `window.spaEnv === 'development'` ; en production `addImportMapOverride` est un no-op journalisé (`[Security] … disabled`). Cibles natives : toujours désactivées.
- **Résolution d'URL** : une valeur qui commence par `./` est préfixée par `window.spaBase` (`dynamic-loading.ts`) ; une URL **absolue** est utilisée telle quelle (→ possibilité d'héberger sur un autre domaine, voir 05).

> Ce n'est **pas** une import map de navigateur native (`<script type="importmap">`) : le type est `systemjs-importmap` et c'est `esm-dynamic-loading` qui l'interprète lui-même. Elle ne sert **pas** à résoudre les `import` du code : elle associe *nom d'app → URL du conteneur*.

## 5. Routes Registry

- **Format** : `EgenRoutes = Record<nomApp, EgenAppRoutes>` (`esm-globals/src/types.ts`).
- **Lecture** : `getCurrentRouteMap()` (`esm-dynamic-loading/src/route-maps.ts`) lit toutes les balises `<script type="egen-routes">` (inline ou `src`), fusionne par `Object.assign` (clé = nom d'app : **une clé dupliquée écrase la précédente**).
- **Validation** (`esm-globals/src/type-utils.ts`) : `isEgenAppRoutes` ne vérifie que **la forme** : `pages`, `extensions`, `workspaces`, `modals`, **s'ils sont présents**, doivent être des tableaux. Un objet vide `{}` est valide. Les autres clés ne sont pas validées à cet endroit.
- **Surcharges dev** : préfixe `localStorage` `egen-routes:`, mêmes règles de sécurité que l'import map.
- **Génération** : voir §8 (trois générateurs distincts, qui ne produisent pas exactement le même contenu).

## 6. Chargement dynamique d'une app (`importDynamic`)

`fw/packages/framework/esm-dynamic-loading/src/dynamic-loading.ts` :

1. `preloadImport(nom)` : si `window[slug(nom)]` n'existe pas, cherche `nom` dans l'import map (erreur `Could not find the package <nom> defined in the current importmap` sinon), puis injecte un `<script async src=url>` (dédupliqué ; avertissement console si pas chargé en 5 s).
2. `slug(nom) = nom.replace(/[\/\-@]/g, '_')` : `@egen/esm-footer-app` → `_egen_esm_footer_app`. Le bundle doit définir **cette variable globale** (config `library: { type: 'var', name: slugify(name) }` dans `rspack-config`).
3. Le global doit être un conteneur fédéré : objet avec `init` et `get` (sinon `The global variable … does not refer to a federated module`).
4. `container.init(__webpack_share_scopes__.default)` puis `container.get('./start')` : **le nom d'exposition est fixé à `./start`** (valeur par défaut du paramètre `share`).
5. Délai maximal de chargement par défaut : **600 000 ms**.

Puis `loadLifeCycles(appName, component)` (`fw/packages/framework/esm-routes/src/loaders/load-lifecycles.ts`) :

- `component` peut être `"export"` ou `"autre-module#export"` (le `#` désigne l'export d'**un autre module** du registry) ;
- exécute `startupApp()` du module **une seule fois par module** s'il existe, puis `registerModuleLoad` ;
- appelle `module[export]()` et attend des **lifecycles** ; si l'export n'existe pas ou n'est pas une fonction → `console.warn` + **lifecycle vide** (l'app ne monte rien, sans exception) ;
- `startupApp` qui rejette → le chargement de l'export échoue.

## 7. Single-SPA dans EGEN

- **Seules les `pages` sont des « applications » Single-SPA.** Chaque page devient `registerApplication("<app>-page-<i>", loader, activityFn)` (`esm-routes/src/loaders/pages.ts`). L'index `<i>` suit l'ordre des pages de l'app **après un tri alphabétique des apps** (`localeCompare 'en'`).
- **Extensions, modales, workspaces** ne sont **pas** des applications Single-SPA : ils sont enregistrés dans les stores d'`esm-extensions` avec un `load: () => loadLifeCycles(...)` (`esm-routes/src/loaders/components.ts`), et montés par le React du Shell/styleguide (`ExtensionSlot`, modales, workbench).
- **Quand une page est active** : `route` (chaîne → `pathToActiveWhen(spaBase + route)`, booléen → constant) ou `routeRegex` (testé sur le chemin **sans** `spaBase`). Si `window.offlineEnabled`, la fonction est enveloppée : `online` (défaut `true`), `offline` (défaut `false`), `featureFlag`.
- **Où elle monte** : dans `#<containerDomId>` (défaut `egen-apps-container`). Si ce conteneur n'existe pas dans le HTML du Shell : **exception au démarrage** (`… cannot be mounted to "<id>"; DOM element does not exist.`) qui interrompt tout le démarrage.
- `bootstrap/mount/unmount` : fournis par le lifecycle ; EGEN ne les appelle pas lui-même, c'est Single-SPA.

Conteneurs présents dans le HTML du Shell (`index.ejs`) : `egen-apps-container` (zone principale), `egen-top-nav-app-container`, `egen-ai-assistant-app-container`, `egen-footer-app-container`, `egen-page-background-container`, `egen-workspaces-container`, `egen-rail-left/right-container`, `egen-zone-left/right/bottom-container`. Un `containerDomId` hors de cette liste n'existe pas.

## 8. Module Federation dans EGEN

### Côté app (`fw/packages/tooling/rspack-config/src/index.ts`)

| Réglage | Valeur | Conséquence |
| --- | --- | --- |
| `name` | `name` du `package.json` | clé de l'import map **et** du registry |
| `library` | `{ type: 'var', name: slugify(name) }` | variable globale cherchée par `importDynamic` |
| `filename` | `basename(browser \|\| main)` | nom du bundle |
| `exposes` | `{ './start': <fichier source> }` | **seule** exposition ; `<fichier source>` = `main` si `browser` existe, sinon `types` |
| `shared` | **chaque clé de `peerDependencies`** + `@egen-civitas/esm-framework/src/internal` | voir ci-dessous |
| `output.publicPath` | `'auto'` | les chunks se chargent depuis l'origine du bundle |
| `optimization.splitChunks` | `maxAsyncRequests: 3`, `maxInitialRequests: 1` | bundles volontairement peu fragmentés |
| `alias` | `@egen-civitas/esm-framework` → `…/src/internal` | un seul framework |

Chaque dépendance partagée est : `singleton: true`, `strictVersion: false`, `requiredVersion: <plage du peer>`, `shareScope: 'default'`. **`swr` a un traitement spécial** (`swr/`) à cause de bugs connus de Module Federation (commentaire du code).

> **Règle déduite du code (✅)** : *ce qui est dans `peerDependencies` est partagé ; ce qui est dans `dependencies` seul est embarqué dans le bundle.* Il n'y a pas d'autre liste.

> **`strictVersion: false` (✅)** : Module Federation **ne refuse jamais** une version incompatible. C'est pourquoi EGEN ajoute son propre garde-fou `frameworkRange` (voir §9).

### Côté Shell (`fw/packages/shell/esm-app-shell/dependencies.json`, HEAD `3.0.2`)

`i18next, dayjs, react, react-dom, react-router-dom, react-i18next, @egen-civitas/esm-framework/src/internal, esm-api, esm-config, esm-react-utils, esm-platform, esm-state, esm-tenant, rxjs, single-spa, swr`. La version **2.11.1** (consommée par le Core) ajoute `@carbon/react`.

🟡 Les autres paquets `@egen-civitas/*` listés dans les `peerDependencies` des apps (`esm-extensions`, `esm-data-api`, `esm-navigation`…) ne sont pas dans cette liste du Shell. Le comportement standard de Module Federation est que le premier conteneur qui en a besoin fournit sa copie au share scope et que les suivants la réutilisent (`singleton`). Ce n'est **pas** vérifié par exécution : voir 08.

### Apps « core » du Shell
En développement uniquement (`!isProd`), le Shell peut embarquer les `dist/` d'apps situées dans `EGEN_ESM_CORE_APPS_DIR` (défaut `../../apps` relatif au Shell) dont le nom finit par **`-app`** ou **`-widgets`** (`rspack.config.js`, `allowedSuffixes`). C'est un mécanisme distinct de ce que fait le Core.

## 9. Garde-fous de compatibilité (`getAppUnavailability`)

`fw/packages/framework/esm-routes/src/loaders/availability.ts`, appelé au début de `registerApp` : une app est **écartée sans erreur** (un `console.warn` `[egen] L'application <x> n'est pas enregistrée…`) si :

| Cause | Condition |
| --- | --- |
| `platform` | `platforms` non vide et la cible courante (`web`/`android`/`ios`) n'y est pas |
| `framework` | `frameworkRange` présent et non satisfait par `process.env.FRAMEWORK_VERSION` du **Shell** (semver, `includePrerelease: true`) |
| `capability` | une capacité de `requiredCapabilities` est absente |

`frameworkRange` est **estampillé au build** dans le `routes.json` copié en `dist/` : c'est la plage de la `peerDependency` `@egen-civitas/esm-framework` de l'app (`rspack-config/src/routes-stamp.ts`), avec `version`. Une plage illisible n'est pas estampillée. **Mode développement** : `egen develop` n'estampille que `version` (`getAppRoutes`, `fw/packages/tooling/egen/src/utils/dependencies.ts`) : le garde-fou n'est donc **pas** exercé en dev.

## 10. Trois générateurs du couple (import map, routes registry)

| Générateur | Quand | Source des apps | Contenu `routes` |
| --- | --- | --- | --- |
| `egen develop` (`egen/src/utils/importmap.ts`, `runProject`) | dev local | dossiers `--sources` / `--packages`, **chacun avec son propre serveur de dev** (ou une commande `egen:develop`) | `src/routes.json` + `version` prerelease locale |
| `egen assemble` (`egen/src/commands/assemble.ts`) | build de distribution | **paquets npm** / `file:` / URL `https://` listés dans `spa-build-config.json` | `dist/routes.json` du tarball + `version` |
| `core/tools/serve-prod.mjs` | production du Core | **dossiers `core/packages/apps/*`** compilés | `src/routes.json` + `version` (**sans `frameworkRange`**) |

Détail de chacun et conséquences pour les apps externes : voir 05.
