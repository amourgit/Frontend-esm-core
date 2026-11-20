# 13 — Extension du Framework à plusieurs technologies

Direction retenue : un **socle commun** indépendant de l'interface + **une fine couche d'adaptation par technologie**, sur le modèle de `esm-react-utils`.

## 1. Constat vérifié : le socle existe déjà

Analyse des `package.json` du Framework (HEAD `fe80ed2`) : **20 paquets sur 29 n'ont aucune dépendance à React, Vue, Angular ni Carbon** (api, config, state, context, navigation, feature-flags, globals, platform, theme, dynamic-loading, routes…). Tout l'état est porté par des magasins de type zustand (`getState/subscribe`). **Seul `esm-react-utils` (et `esm-styleguide` pour l'interface du Shell) est lié à React** : il ne fait que transformer ces magasins en hooks, plus un décorateur (erreurs, i18n, SWR) et le composant `ExtensionSlot`.

Conséquence : il manquait seulement une **couche neutre** décrivant « ce que fait un hook » sans React.

## 2. Architecture

```
                 ┌──────────── Shell (inchangé) ────────────┐
                 │  loadLifeCycles(export) → single-spa     │
                 └───────────────▲──────────────────────────┘
        contrat : export = () => lifecycles (page) / parcel (extension, modale, workspace)
 ┌──────────────┬────────────────┴───────────┬──────────────────┬───────────────┐
 │ esm-react-   │ esm-vue-utils   ✅ livré    │ esm-angular-utils│ esm-nextjs-… │
 │ utils (exist.)│ (Vue 3, composables, slot) │ 💡 à faire       │ 💡 à cadrer   │
 └──────┬───────┴────────────────┬───────────┴────────┬─────────┴───────┬───────┘
        └────────────── esm-integration-utils ✅ (socle neutre) ─────────┘
              contrat de lifecycle · config · session · drapeaux · i18n · slots · parcels · erreurs
                                          │
        esm-config · esm-api · esm-extensions · esm-feature-flags · esm-globals … (déjà neutres)
```

| Rôle | Paquet | Statut |
| --- | --- | --- |
| Socle commun (contrats, intégration, config, services partagés) | `@egen-civitas/esm-integration-utils` | ✅ implémenté et testé |
| React | `@egen-civitas/esm-react-utils` | ✅ existant, **non modifié** |
| Vue 3 | `@egen-civitas/esm-vue-utils` | ✅ implémenté et testé |
| Angular | `@egen-civitas/esm-angular-utils` | 💡 conçu (§5), non implémenté |
| Next.js | `@egen-civitas/esm-nextjs-utils` | 💡 faisabilité analysée (§6), décision requise |

Les paquets sont dans le dépôt Framework, branche **`feature/multi-techno-utils`** (commit `76e9dd0`, changeset inclus, `yarn.lock` mis à jour). **Non publiés sur npm** tant que la branche n'est pas fusionnée et le changeset publié (ordre : `esm-integration-utils` puis `esm-vue-utils`).

## 3. Correspondance React → socle neutre → Vue

| React (`esm-react-utils`) | Socle neutre (`esm-integration-utils`) | Vue (`esm-vue-utils`) |
| --- | --- | --- |
| `getSyncLifecycle` / `getAsyncLifecycle` / `getLifecycle` | `toLifecycleExport`, `toAsyncLifecycleExport`, `assertLifecycleOptions` | mêmes noms, même contrat, via `single-spa-vue` |
| `egenComponentDecorator` (frontière d'erreur) | `reportComponentError` | `EgenErrorBoundary` + `app.config.errorHandler` |
| `ComponentContext` | `createComponentConfig`, `extensionFromProps` | injection `COMPONENT_CONTEXT`, `useComponentContext()` |
| `useConfig` | `watchComponentConfig`, `whenConfigLoaded` | `useConfig()` |
| `useSession` | `watchSession`, `whenSessionLoaded` | `useSession()` |
| `useStore` | `watchStore` | `useStore()` |
| `useFeatureFlag` | `watchFeatureFlag` | `useFeatureFlag()` |
| `react-i18next` | `createTranslator`, `watchTranslations` | `useTranslation()` |
| `useExtensionSlot`, `ExtensionSlot` | `connectExtensionSlot` | `useExtensionSlot()`, `ExtensionSlot` |
| `Extension` | `mountExtension` | `Extension` |

## 4. Vue : ce qui est prouvé

**Tests automatiques** (dépôt Framework) : `esm-integration-utils` 26/26, `esm-vue-utils` 19/19, avec **Vue 3.5 et `single-spa-vue` 3.0.1 réels** (seuls les services EGEN sont simulés) ; contrôle de types `tsc` propre.

**Essai de bout en bout** (hors Shell complet) : une app Vue 3 compilée avec **Rspack 1.7 + Module Federation** (conteneur `var`, exposition `./start`, config alignée sur `rspack-config`) puis chargée comme le fait le Shell :

| Étape | Résultat |
| --- | --- |
| `<script src=bundle>` | global `_acme_esm_vue_app` défini, avec `init` et `get` ✅ |
| `init` + `get('./start')` + `factory()` | exports `root`, `widget` ✅ (fonctions) |
| `await root()` | lifecycles `bootstrap/mount/unmount/update` ✅ |
| Montage **page** (`#single-spa-application:<nom>`) | texte rendu, DOM vide après `unmount` ✅ |
| Montage **extension** (parcel, `domElement`, `_extensionContext`) | rendu ✅ |
| Erreurs JS pendant le chargement | aucune ✅ |

Ce que cet essai **ne couvre pas** (🟡) : le Shell réel (`registerApp`, conteneurs, `frameworkRange`), `ExtensionSlot` rendu par un vrai slot du Shell, la cohabitation avec une app React dans la même page, le partage de `vue` entre deux apps Vue.

**Constats collatéraux de l'essai** (✅) :
- sans `src/index.(ts|tsx|js)`, Rspack échoue (*Can't resolve './src'*) : **toute app construite avec la config EGEN doit avoir `src/index.*`** (l'hypothèse notée 🟡 en 05 est confirmée) ;
- le rendu par défaut de `single-spa-vue` est écrit pour Vue 2 : `esm-vue-utils` fournit sa propre fonction `render` ;
- la config EGEN n'a ni `entry` ni `output.filename` (le conteneur MF porte le nom du fichier) : reproduire ces deux points évite le conflit « Multiple assets emit different content ».

## 5. Angular — conception (non implémenté)

`@egen-civitas/esm-angular-utils`, même contrat :

- `getLifecycle(bootstrapFn | AppModule, options)` / `getSyncLifecycle` / `getAsyncLifecycle` construits sur **`single-spa-angular`** (adaptateur existant, à réutiliser) ;
- services injectables (`EgenConfigService`, `EgenSessionService`, `EgenFeatureFlagService`, `EgenTranslationService`) au-dessus de `esm-integration-utils`, exposant des `Observable` (RxJS, déjà partagé par le Shell) et des *signals* ;
- composants `egen-extension-slot` / `egen-extension` (`connectExtensionSlot`, `mountExtension`) ;
- fournisseur `provideEgen({ moduleName, featureName })` (contexte + `ErrorHandler`).

Contraintes à lever **par prototype** avant d'écrire le paquet (aucune n'est vérifiée dans ce dépôt) : conteneur Module Federation **`var`** avec un builder Webpack (l'esbuild builder d'Angular ne le produit pas) ; isolation de `zone.js` entre apps ; `APP_BASE_HREF` vs `<base href>` posé par le Shell ; montage comme parcel (`domElement`). Critère d'acceptation : rejouer exactement l'essai du §4.

## 6. Next.js — faisabilité (décision requise)

Next.js est React, mais son modèle (routeur propriétaire de l'URL, rendu serveur, bundler maison) heurte le modèle Single-SPA. Trois voies, du plus au moins intégré :

| Voie | Principe | Limites |
| --- | --- | --- |
| **A. Export statique client** | `output: 'export'`, pages côté client, enveloppé par `esm-react-utils` (`getSyncLifecycle`) | pas de SSR/ISR/API routes ; le routeur Next doit être neutralisé ou confiné à un sous-chemin ; conteneur MF `var` à produire (plugin communautaire, webpack seulement) 🟡 |
| **B. Iframe** | l'app Next reste autonome (SSR possible), le Shell l'affiche | pas de partage de contexte/état, communication par `postMessage`, thème et navigation à synchroniser |
| **C. Rendu serveur unifié** | hors périmètre Single-SPA | incompatible avec le Shell actuel |

💡 Recommandation : cadrer **A** par prototype (même grille de validation que §4) ; si le SSR est indispensable, **B** avec un petit paquet de pont (`esm-nextjs-utils` limité à la communication Shell ↔ iframe). **Un paquet « Next.js Utils » à part entière n'a de sens que pour A.**

## 7. Utiliser Vue dès maintenant (apps externes en production)

1. Créer l'app Vue avec `src/index.ts` (ré-export de la source exposée), `src/routes.json`, et la config de build du §4 (`library var`, `./start`, `publicPath:'auto'`, copie de `routes.json`) ; `moduleName` = `name` du `package.json`.
2. `npm run build && npm pack` ; `"files": ["dist"]`.
3. Déclarer dans `external-apps.json` du Core ; `yarn external:sync` ; `kill -HUP` (voir [12](12-apps-externes-en-production.md)).
4. Tant que `esm-vue-utils` n'est pas publié : le consommer depuis le dépôt Framework (`yarn link`/tarball `npm pack`).

Exemple complet testé : [10 — exemple 3](10-exemples.md).
