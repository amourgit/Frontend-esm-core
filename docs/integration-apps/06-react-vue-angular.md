# 06 — React, Vue, Angular

> Principe : **être un bundle JavaScript ne suffit pas.** Une app est compatible EGEN si elle satisfait le contrat de 01 §2 (conteneur MF `var` + `./start` + lifecycles + `routes.json` + inscription dans import map/registry). Compatibilité Single-SPA ≠ compatibilité EGEN complète.

Légende : ✅ lu dans le code EGEN ; 🟡 non exécuté ; ⛔ absent d'EGEN ; **ÉCO** = comportement de l'écosystème Single-SPA / du framework concerné, **non vérifié dans ce dépôt** (à valider par un prototype).

## 1. Ce qu'EGEN appelle réellement (valable pour tous les frameworks)

| Contexte de montage | Mécanisme (✅) | Ce que reçoit le lifecycle |
| --- | --- | --- |
| **Page** (`pages[]`) | Application Single-SPA (`registerApplication`) montée dans le `<div id="single-spa-application:<app>-page-<i>">` du conteneur | props Single-SPA standard (`name`, `singleSpa`, `mountParcel`…) ; ⛔ pas de `domElement` explicite fourni par EGEN : c'est le comportement par défaut de Single-SPA (**ÉCO**) |
| **Extension** | `mountRootParcel({...lifecycle, name}, { …, _extensionContext:{extensionId, extensionSlotName}, domElement })` (`esm-extensions/src/render.ts`) | **`domElement`** + `_extensionContext` |
| **Modale** | `mountRootParcel(…, { ...additionalProps, domElement })` (`esm-styleguide/src/modals/index.tsx`) | `domElement` + props de `showModal` |
| **Workspace** | `<Parcel config={lifecycle} mountParcel={mountRootParcel} {...props} />` (`esm-styleguide/…/workspace-renderer.component.tsx`) | props du workspace |

Donc **tout export** est une fonction `() => LifeCycles | Promise<LifeCycles>` dont l'objet doit fonctionner **à la fois** comme application (pages) et comme **parcel** (extensions, modales, workspaces) : `mount` doit pouvoir rendre dans `props.domElement` quand il est fourni.

Le contrat de `LifeCycles` : `bootstrap`, `mount`, `unmount` (Single-SPA 6). `unmount` doit **tout nettoyer** (voir 07).

## 2. React

### 2.1 Ce qu'EGEN fournit (✅)
- `getSyncLifecycle` / `getAsyncLifecycle` / `getLifecycle` (`esm-react-utils`) : utilisent `single-spa-react` 6 avec `React` et **`ReactDOMClient` (`react-dom/client`) ⇒ React ≥ 18** (les apps du Core déclarent `react: 18.x`).
- Le décorateur enveloppe le composant : frontière d'erreur, `ComponentContext`, `I18nextProvider` (namespace = `moduleName`), `SWRConfig`, `StrictMode` (défaut).
- Hooks et composants : `useConfig`, `useSession`, `ExtensionSlot`, `UserHasAccess`, `ConfigurableLink`… (03).

### 2.2 Conditions pour une app React compatible
1. `react`, `react-dom`, `react-i18next`, `rxjs`, `swr`, `single-spa` en **`peerDependencies`** (singleton partagé avec le Shell) — jamais en `dependencies` seule (07 B/E).
2. Config `egen` par défaut (`rspack-config`) ou config équivalente (05 §2.3).
3. `@egen-civitas/esm-framework` en peer ; `esm-tenant`/`esm-context` importés **directement** (03 §2).
4. `moduleName` = `name` du `package.json` (04 §3).
5. Un export par `component` déclaré, via `get*Lifecycle`.

### 2.3 Limites connues
- `react-router-dom` : le Shell le partage, mais l'app doit créer **son** `BrowserRouter` avec `basename={window.getEgenSpaBase()}` (pratique du Core, ex. `esm-footer-app`). Pas de routeur fourni par EGEN.
- Carbon/SCSS : **retirés** du Framework 5.x et du Core ; styles par CSS Modules (`*.module.css`, préfixés par app) ou Tailwind (`*.tw.css`).
- React 19 : ⛔ non examiné ; le code utilise l'API React 18.

## 3. Vue

> **Mise à jour :** un adaptateur Vue 3 existe désormais (`@egen-civitas/esm-vue-utils`, branche `feature/multi-techno-utils` du Framework, non publié) et a été validé de bout en bout hors Shell : voir [13](13-extension-multi-technologies.md). Les constats ci-dessous décrivent l'état **avant** cet ajout ; Angular a désormais aussi son adaptateur (`@egen-civitas/esm-angular-utils`, validé de la même façon, sans zone.js par défaut) ; pour les applications autonomes (Next.js, SSR) : `@egen-civitas/esm-nextjs-utils` (iframe + pont) — **déprécié**, voie unique SDK embed (doc 17).

### 3.1 État dans EGEN
- ⛔ **Aucun adaptateur Vue** : recherche de `single-spa-vue`, `vue` dans `fw/` et `core/` (`package.json`, `.ts`, `.tsx`, `.md`, hors `node_modules`) : **aucune occurrence**.
- ⛔ `esm-react-utils` (hooks, décorateur, `ExtensionSlot`) est **spécifique à React** : inutilisable dans Vue.
- ✅ Les **fonctions non-hook** du Framework (config, navigation, `egenFetch`, stores…) sont du JavaScript pur et peuvent être appelées depuis n'importe quel code, à condition d'importer `@egen-civitas/esm-framework` en **peer** pour partager la copie du Shell. 🟡 non éprouvé avec Vue.

### 3.2 Conditions pour qu'une app Vue soit chargeable
| Exigence | Détail |
| --- | --- |
| Bundle conforme | conteneur MF **`var`** `slugify(name)`, `exposes: {'./start': …}`, `publicPath: 'auto'` ; produit par Rspack/Webpack (le loader `.vue` est à ajouter par l'app : **ÉCO**, via `scriptRuleConfig`/`additionalConfig`/`overrides` de la config EGEN, ou config maison) |
| Lifecycles | export = `() => Promise.resolve(lifecycles)` où `lifecycles` expose `bootstrap/mount/unmount`. Un adaptateur Single-SPA pour Vue (`single-spa-vue`) existe dans l'écosystème (**ÉCO**, non fourni par EGEN) |
| Parcel | `mount` doit utiliser `props.domElement` pour les extensions/modales/workspaces (§1) |
| `unmount` | `app.unmount()` + suppression des listeners/abonnements |
| Dépendances | `vue` **embarqué** par app (le Shell ne le partage pas) ; deux apps Vue simultanées ⇒ deux copies (acceptable ; partage `vue` entre elles possible en `shared` MF mais **non prévu** par EGEN) |
| `routes.json` | identique à React (02) |
| Traductions | `importTranslation` facultatif ; sinon i18n propre à l'app (`window.i18next` global est disponible 🟡) |
| Dev | `package.json` → `"egen:develop": { "command": "<serveur de dev Vue>", "url": "http://localhost:<port>/<bundle>" }` ; ⚠️ fournir les routes (05 §4.1) |

### 3.3 Limites
Pas d'accès aux hooks React d'EGEN ; pas de `ExtensionSlot` Vue (rendre un slot depuis Vue n'est pas supporté : ⛔) ; styles Vue `scoped` conseillés (07 D/E pour les styles globaux).

## 4. Angular

### 4.1 État dans EGEN
- ⛔ **Aucun adaptateur Angular** : recherche de `single-spa-angular`, `@angular/` dans `fw/` et `core/` : aucune occurrence.
- Même limite que Vue pour les hooks/décorateur React.

### 4.2 Conditions et points d'attention
| Sujet | Détail |
| --- | --- |
| Bundle conforme | MF **`var`** + `./start` : 🟡 l'outillage Angular standard (esbuild builder) ne produit pas de conteneur Webpack MF ; il faut un builder Webpack avec Module Federation (**ÉCO** : plugin de la communauté) configuré en `library: { type: 'var', name: slugify(name) }` |
| Lifecycles | adaptateur Single-SPA pour Angular de l'écosystème (**ÉCO**) ; `bootstrap/mount/unmount` ; `mount` doit tenir compte de `domElement` |
| `zone.js` | Angular patche des API asynchrones **globales** ; avec plusieurs apps dans la même page cela peut interférer (**ÉCO**, risque connu à tester). EGEN n'offre aucune isolation. |
| `<base href>` | ✅ le Shell **pose** un `<base href=<spaBase>>` dans `<head>` (`wireSpaPaths`) : le routeur Angular doit en tenir compte (`APP_BASE_HREF`, `window.getEgenSpaBase()`) |
| Routage | pas de routeur fourni par EGEN ; l'activation des pages est faite par `routes.json` (`route`/`routeRegex`) ; le routeur interne de l'app ne doit gérer que le **sous-chemin** |
| Dépendances | `@angular/*` embarqués par app (non partagés par le Shell) ; versions Angular différentes entre deux apps ⇒ copies séparées |
| Dev | `egen:develop` (comme Vue) |

### 4.3 Limites
Plus de risque d'interférence globale que Vue/React (zone.js, `<base>`) ; aucun exemple existant dans l'écosystème EGEN ; à valider par prototype avant tout engagement.

## 5. Conflits potentiels quand plusieurs apps cohabitent (✅ constats, 🟡 risques)

| Risque | Fait vérifié | Conséquence |
| --- | --- | --- |
| Copies multiples de React | `shared` en `singleton: true` **mais** `strictVersion: false` | une app avec un `react` incompatible s'exécute quand même, avec hooks cassés |
| Peers manquants côté app | ce qui n'est pas en `peerDependencies` est embarqué | doublon silencieux |
| Namespaces i18n | un seul `window.i18next` ; namespace = `moduleName` | collision si deux apps ont le même `moduleName` |
| DOM et conteneurs | chaque page a son `div` ; extensions/modales via parcels | une app qui écrit hors de son `domElement` pollue les autres |
| Historique | un seul `history` ; Single-SPA gère les événements | listeners `popstate` non nettoyés = fuites |
| Styles | CSS Modules à préfixe d'app **par défaut seulement avec la config EGEN** | une app hors config EGEN peut injecter du CSS global |

## 6. Synthèse

| | React | Vue | Angular |
| --- | --- | --- | --- |
| Adaptateur/lifecycle dans EGEN | ✅ `getSyncLifecycle`… | ⛔ | ⛔ |
| Décorateur (erreurs, i18n, SWR) | ✅ | ⛔ | ⛔ |
| Hooks / `ExtensionSlot` | ✅ | ⛔ | ⛔ |
| Config de build fournie | ✅ `rspack-config` | 🟡 à étendre / maison | 🟡 maison |
| Partage des runtimes par le Shell | ✅ react, react-dom… | ⛔ (`vue` embarqué) | ⛔ (`@angular/*` embarqués) |
| Montage comme page | ✅ | 🟡 | 🟡 |
| Montage comme extension/modale/workspace (parcel) | ✅ | 🟡 | 🟡 |
| Exemple existant dans l'écosystème EGEN | ✅ 28 apps | ⛔ | ⛔ |
| Statut | **Production** | **Implémenté et testé** (`esm-vue-utils`, non publié) | **Implémenté et testé** (`esm-angular-utils`, non publié ; AOT non vérifié) |
