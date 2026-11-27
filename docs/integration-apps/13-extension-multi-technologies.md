# 13 — Extension du Framework à plusieurs technologies

Direction retenue : un **socle commun** indépendant de l'interface + **une fine couche d'adaptation par technologie**, sur le modèle de `esm-react-utils`.

## 1. Constat vérifié : le socle existe déjà

Analyse des `package.json` du Framework (HEAD `fe80ed2`) : **20 paquets sur 29 n'ont aucune dépendance à React, Vue, Angular ni Carbon (analyse faite sur le HEAD `fe80ed2`, inchangée sur ces paquets au `main` actuel)** (api, config, state, context, navigation, feature-flags, globals, platform, theme, dynamic-loading, routes…). Tout l'état est porté par des magasins de type zustand (`getState/subscribe`). **Seul `esm-react-utils` (et `esm-styleguide` pour l'interface du Shell) est lié à React** : il ne fait que transformer ces magasins en hooks, plus un décorateur (erreurs, i18n, SWR) et le composant `ExtensionSlot`.

Conséquence : il manquait seulement une **couche neutre** décrivant « ce que fait un hook » sans React.

## 2. Architecture

```
                 ┌──────────── Shell (inchangé) ────────────┐
                 │  loadLifeCycles(export) → single-spa     │
                 └───────────────▲──────────────────────────┘
        contrat : export = () => lifecycles (page) / parcel (extension, modale, workspace)
 ┌──────────────┬────────────────┴───────────┬──────────────────┬───────────────┐
 │ esm-react-   │ esm-vue-utils   ✅ livré    │ esm-angular-utils│ esm-nextjs-… │
 │ utils (exist.)│ (Vue 3, composables, slot) │ ✅ livré          │ ✅ livré       │
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
| Angular | `@egen-civitas/esm-angular-utils` | ✅ implémenté et testé (§5) |
| Next.js / apps autonomes | `@egen-civitas/esm-nextjs-utils` | ✅ implémenté et testé : iframe + pont `postMessage` (§6). **Déprécié** : voie unique SDK embed (doc 17) |

Les paquets sont dans le dépôt Framework : la branche `feature/multi-techno-utils` a été **fusionnée dans `main`** (2026-11-21) et **publiés sur npm** en version `0.2.0` : `esm-integration-utils`, `esm-vue-utils`, `esm-angular-utils`, `esm-nextjs-utils` ; `esm-globals` `2.5.0` et `esm-dynamic-loading` `2.2.0` portent la table d'alias de l'import map. Parcours complets d'intégration (sources GitHub, paquet, app déjà déployée, registre central) : [15](15-scenarios-integration-externe.md).

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

## 5. Angular — implémenté et testé

`@egen-civitas/esm-angular-utils`, même contrat que React/Vue : `getSyncLifecycle` / `getAsyncLifecycle` / `getLifecycle` (par-dessus **`single-spa-angular`**), `provideEgen`, et des fonctions `injectComponentContext`, `injectEgenProps`, `injectConfig`, `injectSession`, `injectStore`, `injectFeatureFlag`, `injectTranslate`, `injectExtensionSlot`, `injectExtensionMounter` (retournent des *signals*).

**Choix de conception** (justifiés par l'essai) :
- **Sans décorateur ni gabarit** dans la bibliothèque (`inject()` et fonctions) : rien à compiler côté paquet ; les composants de slot restent dans l'application (recette dans le README du paquet) ;
- **Sans zone.js par défaut** (`zone: false`, détection par signals) : zone.js modifie des API globales partagées par toutes les apps de la page, donc le risque d'interférence évoqué en 06 est évité à la racine ; `zone: true` reste possible ;
- `single-spa-angular` **suit la version majeure d'Angular** (22.0.1 ↔ Angular 22 : une installation avec Angular 19 échoue en `ERESOLVE`) : déclaré en `peerDependencies`.

**Preuves** (✅) : 17 tests avec **Angular 22 et `single-spa-angular` 22 réels** (compilation JIT, sans zone) ; `tsc` propre. **Essai de bout en bout** avec une app Angular compilée par Rspack + Module Federation (conteneur `var`, `./start`), chargée comme le Shell :

| Étape | Résultat |
| --- | --- |
| `<script>` → global `_acme_esm_ng_app` (`init`, `get`) | ✅ |
| `get('./start')` → exports `root`, `widget` (fonctions) | ✅ |
| `root()` → `bootstrap/mount/unmount/update` | ✅ |
| Montage **page** (`#single-spa-application:<nom>`), puis démontage | rendu, puis DOM vide ✅ |
| Montage **extension** (parcel, `domElement`, `_extensionContext`), puis démontage | rendu, puis DOM vide ✅ |
| Erreurs JS ; chargement de `zone.js` | aucune ; **non chargé** ✅ |

Faits relevés dans `single-spa-angular` : il utilise `props.domElement` sinon `#single-spa-application:<nom>` (même convention que Vue et le Shell) ; son `update` est vide par défaut (le paquet le branche sur `EGEN_PROPS`) ; **`bootstrap` doit précéder `mount`** (Single-SPA le garantit).

**Non couvert** (🟡) : Angular CLI en compilation **AOT** (le paquet n'a ni décorateur ni gabarit, mais ce n'est pas exécuté), routeur Angular, Shell réel, cohabitation avec React/Vue dans la même page.

## 6. Next.js et applications autonomes — implémenté et testé (iframe + pont)

> ⚠️ **Déprécié (décision du 2026-11-26).** Ce pont 1.1 + enveloppe « wrapper » est remplacé par le SDK embed (`egen-config.json` + protocole v2, doc 17) ; retrait planifié (doc 18 P6.4, P8). Section conservée pour les apps qui l'utilisent encore.

`@egen-civitas/esm-nextjs-utils` : l'application (Next.js avec SSR, routeur propre…) reste **autonome** et s'affiche dans une iframe reliée au Shell par un pont `postMessage` (protocole v1). Pas de conteneur Module Federation : le plugin de Next (`@module-federation/nextjs-mf` 8.9) ne couvre que Next 12–15, alors que Next courant est la **16.4** (mesuré sur npm).

| Côté | API | Rôle |
| --- | --- | --- |
| Shell | `getEmbedLifecycle` / `getSyncLifecycle` | crée l'iframe (sandbox), envoie langue + session filtrée, reçoit navigation / hauteur / titre |
| Application | `createEgenBridge` (`/client`) | `ready`, `subscribe`, `navigate`, `setHeight`, `autoResize`, `setTitle` |

**Sécurité** (✅ testée, 18 tests) : messages acceptés seulement de l'iframe elle-même **et** de l'origine autorisée (jamais `*`) ; envoi avec origine cible explicite ; navigation limitée aux chemins internes (`//hôte`, URL absolues, `javascript:` ignorés) ; **`sessionId` jamais transmis** (liste blanche de champs) ; avertissement si l'app a la même origine que le Shell avec `allow-scripts allow-same-origin` (bac à sable sans effet).

**Exploitation** (à ne pas oublier) : l'app doit autoriser l'affichage par le Shell (`Content-Security-Policy: frame-ancestors <shell>`, pas de `X-Frame-Options: DENY/SAMEORIGIN`) ; cookies tiers bloqués entre sites distincts (préférer les sous-domaines d'un même domaine) ; inadapté aux cibles natives.

**Non couvert** (🟡) : exécution **inter-fenêtres dans un vrai navigateur** (les tests simulent les deux fenêtres), Shell réel.

## 7. Utiliser Vue / Angular dès maintenant (apps externes en production)

1. Créer l'app Vue avec `src/index.ts` (ré-export de la source exposée), `src/routes.json`, et la config de build du §4 (`library var`, `./start`, `publicPath:'auto'`, copie de `routes.json`) ; `moduleName` = `name` du `package.json`.
2. `npm run build && npm pack` ; `"files": ["dist"]`.
3. Déclarer dans `external-apps.json` du Core ; `yarn external:sync` ; `kill -HUP` (voir [12](12-apps-externes-en-production.md)).
4. Les paquets sont publiés sur npm : les installer normalement (`@egen-civitas/esm-vue-utils`, etc.).
5. Angular : mêmes étapes ; installer la version de `single-spa-angular` qui correspond à la version majeure d'Angular.

Exemple complet testé : [10 — exemple 3](10-exemples.md).
