# 03 — Paquets du Framework

Source : `package.json` et code de chaque paquet de `fw/packages/{framework,shell,tooling}` (HEAD `fe80ed2`). Versions entre parenthèses = HEAD ; celles consommées par le Core sont indiquées en 00.

## 1. Deux façons d'utiliser EGEN depuis une app

| Mode | Définition | Ce qui est nécessaire |
| --- | --- | --- |
| **A. Contrat seul** | L'app n'utilise que le contrat d'intégration (un conteneur Module Federation + des lifecycles + `routes.json`). Elle n'appelle aucune API EGEN. | Aucun paquet `@egen-civitas/*` à l'exécution. Voir 05 et 06. |
| **B. Contrat + services** | L'app utilise les API du Framework (session, config, extensions, hooks, styleguide…). | `@egen-civitas/esm-framework` + les paquets listés en `peerDependencies`. C'est le cas des 28 apps du Core. |

## 2. L'entrée `@egen-civitas/esm-framework` (agrégateur)

- Aucun code propre : ce sont des **ré-exports** (`fw/packages/framework/esm-framework/src/index.ts` et `internal.ts`).
- **Deux entrées qui ne sont pas identiques** (✅) :

| Export | `index` (API publique, types) | `internal` (runtime des apps) |
| --- | --- | --- |
| api, config, dynamic-loading, data-api, error-handling, expression-evaluator, extensions, feature-flags, globals, navigation, offline, platform, react-utils, state, styleguide, translations, utils | ✅ | ✅ |
| `esm-routes` | ❌ | ✅ |
| `esm-context`, `esm-tenant`, `esm-ai-framework` | ✅ | ❌ |

- À la compilation, `rspack-config` remplace `@egen-civitas/esm-framework` par `@egen-civitas/esm-framework/src/internal` (alias) et le Shell partage cette copie, qu'il enregistre aussi sous la clé `@egen-civitas/esm-framework` du share scope (`esm-app-shell/src/index.ts`, `initializeSpa`). 🟡 **Conséquence probable** : un symbole exporté **seulement** par `index` (tenant, context, ai-framework) importé depuis `'@egen-civitas/esm-framework'` ne serait pas fourni par la copie `internal`. Le Core contourne le problème **en important `esm-tenant` directement** (6 fichiers) ; aucun import direct d'`esm-context` n'existe dans le Core. 💡 À importer directement depuis leur propre paquet.
- `@egen-civitas/esm-framework/mock` : mock pour les tests (utilisé par `setup-tests.ts` des apps).

## 3. Catalogue

Légende : **Int.** = intervient dans l'intégration au Shell (chargement, enregistrement, montage) ; **Métier** = services pour le code fonctionnel de l'app. « Oblig. » s'entend pour une app du mode B construite avec la config par défaut.

### 3.1 Cœur d'intégration

| Paquet | Responsabilité réelle | Fournit aux apps | Oblig. | Int. / Métier | Peers notables | Si absent |
| --- | --- | --- | --- | --- | --- | --- |
| `esm-globals` | Types (`EgenAppRoutes`, `PageDefinition`…), globals `window` (`getEgenSpaBase`, `spaBase`, `offlineEnabled`…), type-guards, cibles/capacités, événements | Types de `routes.json`, `getEgenSpaBase()` | Oui (mode B) | Int. | `single-spa` | Plus de typage ni de `getEgenSpaBase` |
| `esm-dynamic-loading` | `importDynamic`, lecture import map / route map, surcharges dev | rarement utilisé en direct | Non (interne) | Int. | `esm-globals`, `esm-translations` | Le Shell ne charge rien |
| `esm-routes` | `registerApp`, `finishRegisteringAllApps`, `loadLifeCycles`, `getAppUnavailability`, schéma JSON | — (entrée `internal` uniquement) | Non (interne Shell) | Int. | `esm-config`, `esm-dynamic-loading`, `esm-extensions`, `esm-feature-flags`, `esm-globals`, `esm-utils`, `single-spa` | Aucune page/extension enregistrée |
| `esm-react-utils` | `getLifecycle`/`getSyncLifecycle`/`getAsyncLifecycle`, `egenComponentDecorator`, hooks (`useConfig`, `useSession`, `useExtensionSlot`…), `ExtensionSlot`, `ConfigurableLink`, `UserHasAccess` | **Les lifecycles React** + hooks | Oui (apps React) | Int. + Métier | `react`, `react-dom`, `react-i18next`, `i18next`, `swr`, `rxjs`, `dayjs`, `single-spa` + 11 `@egen-civitas/*` | Pas de lifecycle React fourni par EGEN (à écrire soi-même, voir 06) |
| `esm-extensions` | Stores d'extensions, slots, modales, workspaces, rails (`tool-window`), `attach`, `registerExtension` | `ExtensionSlot` data, `showModal`, workspaces | Oui (Shell) | Int. + Métier | `react`, `single-spa`, `esm-api`, `esm-config`… | Extensions/modales inopérantes |
| `esm-config` | Système de configuration : `defineConfigSchema`, `getConfig`, `registerModuleWithConfigSystem` (appelé par `registerApp`), `registerModuleLoad` (appelé après `startupApp`) | `defineConfigSchema` (typiquement dans `startupApp`) | Oui | Int. + Métier | `esm-globals`, `esm-state`, `esm-utils`, `single-spa` | `registerApp` n'a plus où enregistrer le module |
| `esm-feature-flags` | `registerFeatureFlag`, `getFeatureFlag`, `setFeatureFlag` | drapeaux | Non pour l'app, oui pour le Shell | Int. (pages/extensions `featureFlag`) | `esm-globals`, `esm-state`, `single-spa` | `featureFlag` ignoré |
| `esm-state` | Stores observables | `createGlobalStore`, `getGlobalStore` | Oui (dépendance de tous) | Métier | `esm-globals`, `esm-utils` | — |
| `esm-context` | Contexte d'exécution | contextes | Non | Métier | `esm-globals`, `esm-state` | — |
| `esm-navigation` | `navigate`, historique, fil d'Ariane | `navigate`, `interpolateUrl` | Non | Métier | `esm-globals`, `esm-platform`, `esm-state`, `single-spa` | navigation à écrire soi-même |
| `esm-platform` | Capacités de plateforme (web/Android/iOS), erreurs typées, détection de cible | capacités | Non (sauf apps natives) | Int. (`requiredCapabilities`) | `esm-globals` | filtre de capacités sans effet |
| `esm-translations` | Traductions du « core » | — | interne | Int. (i18n des modules) | `i18next` | — |
| `esm-utils` | Utilitaires (`isVersionSatisfied`…) | utilitaires | Oui | Int. (compat. de version) | `esm-globals`, `dayjs`, `i18next`, `rxjs` | — |
| `esm-error-handling` | Gestion d'erreurs partagée | — | Non | Métier | `esm-globals` | — |

### 3.1 bis Intégration multi-technologies (branche `feature/multi-techno-utils`, non publiée)

| Paquet | Responsabilité | Peers notables |
| --- | --- | --- |
| `esm-integration-utils` | Socle neutre : contrat de lifecycle, config, session, drapeaux, i18n, slots et parcels d'extensions, erreurs | `esm-api`, `esm-config`, `esm-extensions`, `esm-feature-flags`, `esm-globals`, `single-spa` |
| `esm-vue-utils` | Vue 3 : `getSyncLifecycle`/`getAsyncLifecycle`, composables, `ExtensionSlot`/`Extension` | + `vue ^3.3`, dépend de `single-spa-vue` |
| `esm-angular-utils` | Angular (standalone, signals, sans zone par défaut) : lifecycles, `provideEgen`, fonctions `inject*` | + `@angular/core`, `single-spa-angular` (même majeure qu'Angular) |
| `esm-nextjs-utils` | Applications autonomes (Next.js) par iframe + pont `postMessage` : `getEmbedLifecycle` (Shell), `createEgenBridge` (`/client`) | `esm-integration-utils`, `single-spa` |

Voir [13](13-extension-multi-technologies.md).

### 3.2 Données, API, hors ligne

| Paquet | Responsabilité | Notes |
| --- | --- | --- |
| `esm-api` (3.0.1) | `egenFetch`, session/utilisateur, `restBaseUrl`, contournement d'auth de dev (`initDevAuthBypass`), constante `backendDependencies` | Peers : `esm-config`, `esm-error-handling`, `esm-globals`, `esm-navigation`, `esm-state`, `rxjs`. **Partagé par le Shell** (`dependencies.json`). |
| `esm-data-api` (3.0.0) | API de données générique | Peers : `esm-api`, `esm-offline`, `esm-state` |
| `esm-offline` | Utilitaires hors ligne | Peers : `esm-api`, `esm-globals`, `esm-state` |
| `esm-expression-evaluator` | Évalue `displayExpression` | Dépendance directe de `esm-extensions` (peer) |

### 3.3 Interface et thème

| Paquet | Responsabilité | Notes |
| --- | --- | --- |
| `esm-styleguide` (5.2.4 consommé par le Core) | Composants d'UI **et rendu des conteneurs du Shell** (toasts, notifications, workbench, modales, workspaces) | Le Shell l'importe (`run.ts`). En 5.x : sans Carbone ni SCSS. |
| `esm-theme` (1.1.0) | Moteur de thème (JSON, clair/sombre, portée par app) | Dépendance du **Shell** uniquement (aucune app ne l'a en peer dans le Framework) |
| `esm-tenant` (1.1.0) | Capture du tenant (sous-domaine/chemin/requête/JWT) → store global + en-tête `X-Tenant-ID` | Aucune validation côté frontend (commentaire de `run.ts`). Variables `EGEN_TENANT_*`. |
| `tailwind-preset` (2.0.0) | Point d'entrée Tailwind v4 partagé | Les fichiers `*.tw.css` sont traités par `rspack-config` |

### 3.4 Couche IA (facultative)

`esm-ai-framework`, `-channel`, `-config`, `-context`, `-events`, `-extensions`, `-tools`. Orchestration, canal WebSocket vers un backend IA, registre de tools. **Facultatif** : requis seulement par les apps qui font de l'IA (ex. `esm-ai-assistant-app` du Core). Variables `EGEN_AI_*` (liste fermée vérifiée au build du Shell par `tools/env-bridge.js`). Aucun rôle dans l'intégration au Shell.

### 3.5 Outillage (`fw/packages/tooling/*`)

| Paquet | Rôle |
| --- | --- |
| `@egen-civitas/egen` | CLI `egen` (`develop`, `build`, `assemble`, `start`, `debug`) ; réexporte `default-rspack-config` / `default-webpack-config` ; dépend de `esm-app-shell`, `rspack-config`, `webpack-config` |
| `@egen-civitas/rspack-config` | Config Rspack par défaut (Module Federation, `routes.json`, `.env`). **Le plus structurant pour une app.** |
| `@egen-civitas/webpack-config` | Équivalent Webpack (pour apps Webpack ; compatibilité) 🟡 non examiné en détail |
| `browserslist-config-egen` | Cibles navigateurs (déclarées dans `browserslist` des apps) |
| `@egen-civitas/storybook`, `typedoc-plugin-file-categories` | Documentation / démos, hors intégration |

### 3.6 Le Shell (`@egen-civitas/esm-app-shell`)

Contient `index.ejs`, `run.ts`, `locale.ts` (chargement des traductions par app), service worker (cache de l'import map), `tools/targets.js` (cibles `web|android|ios`), `dependencies.json` (partage). Il est **consommé compilé** par le Core (`yarn start:prod` lit `esm-app-shell/dist`).

## 4. Frontière Framework / Core / Shell (pièges d'attribution)

| Fonctionnalité | Appartient à | Preuve |
| --- | --- | --- |
| Lire import map / routes dans le DOM | Framework (`esm-dynamic-loading`) | `route-maps.ts`, `import-maps.ts` |
| Enregistrer pages/extensions | Framework (`esm-routes`) | `loaders/pages.ts` |
| Créer les conteneurs HTML, démarrer Single-SPA, partager les dépendances | **Shell** | `index.ejs`, `run.ts`, `dependencies.json` |
| Générer import map + registry (dev, assemblage) | **Outillage** (`egen`) | `egen/src/utils/importmap.ts`, `commands/assemble.ts` |
| Générer import map + registry en production **du Core** | **Core** | `core/tools/serve-prod.mjs` |
| Contrat `topbar-nav-slot` (`section/label/route`) | **Core** (pas le Framework) | `core/tools/check-nav-routes.mjs` |
| Contrat des slots de rails (`ToolWindowMeta`) | Framework (`esm-extensions`) | `tool-window.ts` |
| `getSyncLifecycle` & co | Framework (`esm-react-utils`) | `getLifecycle.ts` |
| `startupApp`, `importTranslation` | **Convention de l'app**, lue par le Framework/Shell | `load-lifecycles.ts`, `locale.ts` |
