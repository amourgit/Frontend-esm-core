# 04 — Applications internes au Core

Une app **interne** vit dans `core/packages/apps/<nom>/`, est un *workspace* Yarn (`"workspaces": ["packages/apps/*"]`) et est construite/servie avec les outils du Core. Les chiffres ci-dessous viennent d'un script exécuté sur les **28 apps** de `main` (après fusion de `feature/ajustement-reforme`).

## 1. Structure d'un projet

### Fichiers

| Fichier / dossier | Statut | Rôle et preuve | Présent |
| --- | --- | --- | --- |
| `package.json` | **Obligatoire** | Identité, point d'entrée, peers (voir §2) | 28/28 |
| `src/routes.json` | **Obligatoire** | Sans lui le build s'arrête (`rspack-config`, code 9819023573289) | 28/28 |
| `src/index.ts(x)` | **Obligatoire** (valeur de `main`) | Fichier exposé en `./start` : contient les exports | 28/28 |
| `rspack.config.js` | **Obligatoire en pratique** : les scripts `serve`/`build` appellent `rspack` (CLI de `@rspack/cli`, réexportée par `egen`) qui lit ce fichier dans le dossier de l'app. Seul `egen develop` sait se rabattre sur la config par défaut s'il manque (`runProject`) | 28/28 |
| `tsconfig.json` | Habituel | contrôle de types (`yarn typescript` = `tsc`, `noEmit`) | 28/28 (4 variantes) |
| `src/declarations.d.ts` | Habituel | déclarations de types pour les imports non TypeScript : `declare module '*.module.css'` (28/28 ; contenu variable : images `*.png`/`*.svg`, `*.css`…, ≈ 9 variantes) | 28/28 |
| `translations/en.json` | **Quasi obligatoire** | `fallbackLng: 'en'` ; `importTranslation` (§3) lit `./<langue>.json` | 28/28 |
| `translations/fr.json` | Facultatif | 20/28 | |
| `vitest.config.ts` | Habituel | tests (`happy-dom`, `mockReset: true`) | 28/28 |
| `setup-tests.ts` | Habituel | mock `@egen-civitas/esm-framework/mock`, `window.getEgenSpaBase` | 22/28 |
| `src/config-schema.ts` | Conditionnel | schéma de configuration du module (si l'app est configurable) | 16/28 |
| `src/constants.ts` | Convention locale | `moduleName` | 9/28 |
| `README.md` | Convention | 20/28 |
| `__mocks__/` | Local | mocks de tests | 5/28 |

### Convention de nommage (✅ vérifiée)

| Élément | Règle | Pourquoi |
| --- | --- | --- |
| Dossier | `esm-<nom>-app` | convention des 28 apps |
| `name` | `@egen/esm-<nom>-app` | `build:apps` filtre `--filter='@egen/*-app'` (`core/package.json`) : **un nom hors de ce motif n'est pas compilé par `yarn build:apps`/`build:prod`** |
| `browser` | `dist/egen-esm-<nom>-app.js` | identique pour les 28 ; `filename`/`outDir` du build en sont déduits |
| `main` | `src/index.ts` | 28/28 ; `exposes['./start']` pointe dessus |
| clé import map / registry | = `name` | `makeIdent` retire le scope et le suffixe `-app` pour le **préfixe CSS Modules** uniquement |

## 2. Configuration

### `package.json` — propriété par propriété

| Propriété | Obligatoire | Utilisation réelle | Si absente / erronée |
| --- | --- | --- | --- |
| `name` | oui | nom du conteneur MF, clé du registry, slug global | app introuvable ou conflit de nom |
| `version` | oui | estampillée dans `dist/routes.json` (`inc(version,'prerelease','local')` en dev) | version affichée absente |
| `browser` | oui (en pratique) | chemin du bundle | sans `browser`, `exposes` pointe vers `types` (comportement de `rspack-config`) : **toujours renseigner `browser`** |
| `main` | oui | source exposée en `./start` | rien n'est exposé |
| `source: true` | convention | présent 28/28 | aucun effet constaté dans le code lu |
| `peerDependencies` | **oui, même vide `{}`** | **chaque clé devient un `shared` Module Federation** ; `esm-framework` → `frameworkRange` | ⚠️ `Object.keys(peerDependencies)` lève une **TypeError** si la propriété est absente (`rspack-config/src/index.ts`) |
| `dependencies` | oui | ce qui est **embarqué** dans le bundle | — |
| `devDependencies` | — | tests (`vitest` 5, `happy-dom` 21, `vite` 8…) ; plus de `sass` | — |
| `keywords: ["egen","microfrontends"]` | convention | `egen assemble --mode survey` cherche les paquets par mot-clé `egen` + suffixe `-app` | non listée dans le survey |
| `browserslist: ["extends browserslist-config-egen"]` | convention | cibles de transpilation | cible par défaut de l'outil |
| `scripts` | voir §7 | | |
| `publishConfig.access: public`, `repository`, `bugs`, `homepage` | convention | publication npm (`ci:publish`) | — |

**Peers dans le Core** : 22 peers sont **communs aux 28 apps** (`esm-api, esm-config, esm-context, esm-data-api, esm-dynamic-loading, esm-error-handling, esm-extensions, esm-feature-flags, esm-framework, esm-globals, esm-navigation, esm-react-utils, esm-routes, esm-state, esm-tenant, esm-utils, dayjs, react, react-dom, react-i18next, rxjs, swr`). Les autres sont propres à certaines apps : `single-spa`, `react-router-dom`, `i18next`, `esm-styleguide`, `esm-theme`, `esm-ai-framework`, `embla-carousel`, `lucide-react`.

**Règle pratique ✅ (déduite du code)** :
- **Partagé** (dans `peerDependencies`, plage large `>=` ou `18.x`) : tout ce qui est un *singleton* à tenir unique dans la page : `react`, `react-dom`, `react-i18next`, `rxjs`, `swr`, `single-spa`, `dayjs` et les paquets `@egen-civitas/*`.
- **Embarqué** (dans `dependencies` seulement) : bibliothèques propres à l'app (icônes, carrousel…).
- Le Core déclare **les deux** pour les paquets EGEN (`dependencies: ^x.y` pour l'installation, `peerDependencies: >=x.y` pour le partage). C'est la forme qu'attend `scaffold-app.py`.

### `rspack.config.js`
- **27/28** : exactement `module.exports = require('@egen-civitas/egen/default-rspack-config');`.
- **1/28** : `esm-ai-assistant-app` enveloppe la config par défaut pour forcer l'alias de la build de **production** de `react-reconciler` (moteur de `@react-three/fiber`) : le React du Shell est de production, alors que le code de l'app est compilé en mode du serveur de dev. Exemple d'**exception légitime et documentée** : personnalisation par `createConfig(env, argv)` puis modification de `config.resolve`.
- Points d'extension de la config par défaut (objets mutables exportés) : `overrides`, `additionalConfig`, `scriptRuleConfig`, `cssRuleConfig`, `tailwindRuleConfig`, `assetRuleConfig`, `watchConfig`, `optimizationConfig`.

Ce que la config par défaut impose (✅ `rspack-config`) : loader `builtin:swc-loader` (TS/TSX), **CSS Modules par défaut** pour tout `*.css` (la règle SCSS n'existe plus depuis `rspack-config` 2.0) avec `localIdentName` préfixé par l'identifiant de l'app, `*.tw.css` = Tailwind **sans** modules, images `asset/resource`, **SVG `asset/source` (importés comme chaîne)**, `TsCheckerRspackPlugin`, `CleanWebpackPlugin`, `StatsWriterPlugin` (`<bundle>.buildmanifest.json`), `devtool` `hidden-nosources-source-map` en production, `.env*` du monorepo lus (`resolvePublicEnv`) et variables `EGEN_AI_*`, `EGEN_DEV_*`, `EGEN_TENANT_*` injectées par `DefinePlugin`.

### `tsconfig.json`, tests
- 4 variantes de `tsconfig.json` dans le Core (18/8/1/1 apps) : la config est **locale à l'app**, non imposée par l'outillage. Valeurs courantes : `jsx: react`, `moduleResolution: bundler`, `noEmit: true`.
- `vitest.config.ts` : `environment: 'happy-dom'`, `mockReset: true`, `setupFiles: ['./setup-tests.ts']`. `setup-tests.ts` : `vi.mock('@egen-civitas/esm-framework', () => import('@egen-civitas/esm-framework/mock'))` et `window.getEgenSpaBase = vi.fn(() => '/egen/spa/')`.

## 3. Point d'entrée

Le fichier `main` est ce que `container.get('./start')` renvoie. Anatomie de `esm-footer-app/src/index.ts` (✅, complet) :

```ts
import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import footerRootComponent from './root.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = { featureName: 'footer', moduleName };

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getSyncLifecycle(footerRootComponent, options);
```

| Élément | Lu par | Statut | Détail |
| --- | --- | --- | --- |
| `export const <component>` pour **chaque** `component` de `routes.json` | `loadLifeCycles` | **obligatoire** | fonction → lifecycles ; sinon `console.warn` + lifecycle vide |
| `export function startupApp()` | `loadLifeCycles.initializeApp` | **facultatif** (20/28) | exécutée **une fois par module**, avant le premier export chargé ; peut être asynchrone ; une erreur fait échouer le chargement. Lieu naturel de `defineConfigSchema`. |
| `export const importTranslation` | `esm-app-shell/src/locale.ts` | **requis pour les traductions** (28/28) | **doit** valoir `require.context(dir, false, /.json$/, 'lazy')` : le Shell vérifie que la valeur de retour est une `Promise` (« Did you forget to set require.context mode to 'lazy'? »). Appelée avec `./<langue>.json` (`-` → `_`, donc `pt_BR.json`). Si absente, `Module <ns> does not export an importTranslation function` (capturé : traductions vides pour ce module). |

`moduleName` est l'**espace de noms i18n** (`defaultNS` du décorateur) et le nom sous lequel `defineConfigSchema` enregistre le schéma. ⚠️ **Dans les 28 apps du Core, `moduleName` vaut `@egen-civitas/<app>` alors que le `name` du paquet (donc la clé de l'import map et du registry) vaut `@egen/<app>`** (0/28 identiques). Or le Shell charge les traductions d'un namespace par `importDynamic(namespace)`, qui cherche **ce nom dans l'import map** (`locale.ts` → `dynamic-loading.ts`). Voir 08, écart **E2** (✅ confirmé à l'exécution ; correctif par table d'alias dans l'import map, sans renommage). Règle sûre pour une nouvelle app : **`moduleName` = `name` du `package.json`**.

### Les trois fabriques de lifecycle (`esm-react-utils/src/getLifecycle.ts`)

| Fabrique | Usage | Retour |
| --- | --- | --- |
| `getSyncLifecycle(Composant, options)` | composant importé statiquement | `() => Promise.resolve(lifecycle)` |
| `getAsyncLifecycle(() => import('./x'), options)` | chargement paresseux (le module doit avoir un `default`) | `() => import().then(lifecycle)` |
| `getLifecycle(Composant, options)` | renvoie directement le lifecycle `single-spa-react` | lifecycle |

`getAsyncExtensionLifecycle` est un alias de `getAsyncLifecycle`. Dans le Core, **28/28 `index.ts` utilisent l'une d'elles** ; aucune app n'écrit ses `bootstrap/mount/unmount` à la main.

`options` (`ComponentDecoratorOptions`) : `moduleName` (**obligatoire**, string), `featureName` (**obligatoire**, string — sinon `throw new Error('Invalid options')`), `disableTranslations?` (pas d'`I18nextProvider`), `strictMode?` (défaut `true`), `swrConfig?`.

Ce que le décorateur apporte (✅ `egenComponentDecorator.tsx`) : classe-frontière d'erreur React, contexte de composant (`moduleName`, `featureName`, extension), `I18nextProvider`, `SWRConfig` (avec cache SWR dédié, 3 réessais). C'est pourquoi un composant d'app n'a pas besoin de fournir ces contextes lui-même.

Exemple de **composant « de données » sans rendu** (extension de navigation, voir `guide-montage-apps-rails-zones.md`) : `getSyncLifecycle(() => null, options)` ; seule la `meta` du `routes.json` est lue.

## 4. Déclarations destinées au Shell
Voir [02](02-declarations-routes-json.md). Règle d'or du Core : **le Core n'a pas de registre central ; `routes.json` d'une app + son export suffisent**. Une nouvelle app n'a à être enregistrée nulle part (voir §6 : `egen develop` et `serve-prod.mjs` la trouvent par scan de `packages/apps/*`).

## 5. Intégration au Framework
- Importer depuis **`@egen-civitas/esm-framework`** pour les API courantes ; importer **directement** `@egen-civitas/esm-tenant` (et `esm-context`) car ils ne sont pas dans l'entrée `internal` (voir 03 §2).
- Ne jamais importer `esm-routes`/`esm-dynamic-loading` pour « charger une app » : c'est le rôle du Shell.
- Aucun appel direct à un mécanisme interne du Shell (`window.installedModules`, conteneurs) : voir 07.
- **Duplication de runtimes** : ne mettre `react`, `react-dom`, `react-i18next`, `rxjs`, `swr`, `single-spa` que dans `peerDependencies` (singleton). Les mettre en `dependencies` seul revient à les **embarquer** et à créer une 2ᵉ copie (voir 07 B/E).
- **Pas de Carbon ni de SCSS** : le Core les a retirés (74 fichiers `*.module.css`, 0 `.scss`) ; `yarn verify` exécute `tools/check-no-carbon.mjs` qui échoue si `@carbon/`, `cds--`, une dépendance `sass*` ou un fichier `.scss` réapparaît (voir [14](14-plan-migration-carbon.md)).

## 6. Cycle de développement complet (commandes réelles)

**Création** — `python3 tools/scaffold-app.py esm-foo-app "Description" "dep1,dep2" sous-dossier1,sous-dossier2` (`core/tools/scaffold-app.py`) : copie `rspack.config.js`, `tsconfig.json`, `src/declarations.d.ts` depuis `esm-user-profile-app`, `vitest.config.ts` et `setup-tests.ts` depuis `esm-primary-navigation-app`, dérive le `package.json` (`name: @egen/<app>`, `version: 1.0.0`, `browser: dist/egen-<app>.js`) et crée `translations/en.json` vide. **Reste manuel** : `src/index.ts`, `src/routes.json`, `config-schema.ts`, composants, tests, README, entrée dans le README racine, changeset, `yarn install`. ⚠️ Le script **dépend de `esm-user-profile-app` et `esm-primary-navigation-app`** : leur retrait casserait l'outil.

| Étape | Commande | Ce qui se passe (✅) |
| --- | --- | --- |
| Installer | `yarn install` (Yarn 4.10.3, `packageManager`) | `postinstall: husky install` |
| Développer **toutes** les apps | `yarn start` = `egen develop --sources "packages/apps/*"` | pour chaque dossier : un serveur de dev Rspack (ports 8081+, hors port du backend), import map + registry **en mémoire**, Shell servi ; options : `--port`, `--host`, `--backend` (défaut `http://localhost:8082`), `--spa-path` (défaut `/egen-civitas/spa/`), `--api-url`, `--config-url/--config-file`, `--importmap`, `--routes`, `--support-offline`, `--use-rspack` |
| Développer **une** app | dans le dossier de l'app : `yarn start` (= `egen develop`) ou `yarn serve` (= `rspack serve --mode=development`) | `--sources` par défaut = dossier courant |
| Tester | `yarn test` (racine, turbo) / `yarn test` (app) | `vitest run` avec `TZ=UTC`, `--passWithNoTests` |
| Contrôler | `yarn verify` = `node tools/check-nav-routes.mjs && turbo run lint test typescript` | cohérence navigation/rails + lint + tests + types |
| Compiler | `yarn build` (turbo) / `yarn build:apps` / dans l'app `yarn build` (= `rspack --mode=production`) ; `yarn build:development` | produit `dist/egen-<nom>.js`, `dist/routes.json` (estampillé), `dist/*.buildmanifest.json`, chunks |
| Analyser | `yarn analyze` (`--env analyze=true`) | ouvre le Bundle Analyzer |
| Production | `yarn build:prod` (`build` filtré `@egen/*-app`, concurrence 2, puis `tools/precompress.mjs`) puis `yarn start:prod` (`node --max-old-space-size=256 tools/serve-prod.mjs`) | voir 05 §4 |
| Traductions | `yarn extract-translations` | `i18next-parser` sur `src/**/*.component.tsx` |
| Dépendances EGEN | `yarn deps:egen` / `yarn deps:egen:check` | aligne les plages `@egen-civitas/*` sur le publié |

Variables de `serve-prod.mjs` : `PORT` (8080), `HOST`, `EGEN_SPA_PATH` (`/egen-civitas/spa`), `EGEN_API_URL`, `EGEN_BACKEND` (proxy API), `EGEN_BRAND_DIR`, `EGEN_OFFLINE`, `EGEN_SHELL_DIR`, `EGEN_DEV_NO_AUTH`, `EGEN_TENANT_*`.

## 7. Analyse des 28 apps : commun, propre, local

**Commun à toutes (✅ 28/28)** : `package.json` de même forme (mêmes 17 clés), `main: src/index.ts`, `browser: dist/egen-<nom>.js`, `src/routes.json`, `rspack.config.js`, `vitest.config.ts`, `translations/en.json`, `export importTranslation`, une fabrique `get*Lifecycle`, 12 scripts (`serve`, `debug`, `analyze` : 27/28), peer `esm-framework >=3.0.0`.

**Propre à certaines apps** : `startupApp` (20/28 ; absent de appearance, clock, help-menu, implementer-tools, language, logs, notifications, settings), `config-schema.ts` (16/28), `fr.json` (20/28), `setup-tests.ts` (22/28).

**Convention locale / exception** : `esm-ai-assistant-app` (config Rspack enveloppée, voir §2) ; `versions` : 22 apps à `1.0.0`, 6 à `9.0.2` (`devtools, help-menu, implementer-tools, login, offline-tools, primary-navigation`) — **aucun effet sur l'intégration** ; `containerDomId` non par défaut : `esm-footer-app` (`egen-footer-app-container`) et les apps du haut/IA (conteneurs dédiés du Shell).

**Contributions déclarées (28 apps)** : 18 pages, 84 extensions, 4 modales ; clés d'extension réellement utilisées : `name, slot, component, online, offline, order, meta` (**jamais** `slots`, `privileges`, `displayExpression`, `featureFlag`) ; clés de page : `component, route, routeRegex, online, offline, containerDomId` ; clés de premier niveau : `$schema, pages, extensions, modals, backendDependencies`.

**Cohérence** : 0 écart entre `component` déclarés et exports (contrôle par script sur tous les `routes.json`).
