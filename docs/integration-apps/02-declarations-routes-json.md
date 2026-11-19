# 02 — Déclarations destinées au Shell : `routes.json`

Sources : types `fw/packages/framework/esm-globals/src/types.ts`, schéma `fw/packages/framework/esm-routes/schema/routes.schema.json`, enregistrement `fw/packages/framework/esm-routes/src/loaders/{pages,components}.ts`, observation des 28 apps du Core.

## 1. Rôle et emplacement

- `src/routes.json` est **obligatoire** pour toute app construite avec `rspack-config` : s'il manque, le build s'arrête avec le message *« This app does not define a routes.json. This file is required for this app to be used by the Egen 3 App Shell. »* (code de sortie `9819023573289`). ✅ `rspack-config/src/index.ts`.
- Au build, il est **copié** à la racine du dossier de sortie (`dist/routes.json`) en y ajoutant `version` et `frameworkRange` (✅ `routes-stamp.ts`).
- C'est un **catalogue de déclarations** : il ne contient aucun code. Chaque `component` est le **nom d'un export** de l'app (voir §10).
- Valeur du `$schema` dans les apps du Core : `https://egen.alpha.vercel.com/routes.schema.json`. 🟡 Seule l'existence du fichier local `routes.schema.json` est vérifiée, pas la disponibilité de cette URL.
- Le schéma local est **strict** (`additionalProperties: false` à tous les niveaux) : un éditeur signalera toute clé inconnue. ✅ Le **runtime**, lui, ne valide pas cela (voir §11).

## 2. Clés de premier niveau

| Clé | Type | Statut | Rôle | Qui l'écrit |
| --- | --- | --- | --- | --- |
| `$schema` | string | facultatif | aide éditeur | auteur |
| `version` | string | **estampillé** | version de l'app | **build** (ne pas écrire) |
| `frameworkRange` | string (semver) | **estampillé** | plage de `esm-framework` ; app écartée si non satisfaite | **build** (ne pas écrire) |
| `platforms` | `('web'\|'android'\|'ios')[]` | facultatif | plateformes où l'app est enregistrée ; absent/vide = toutes | auteur |
| `requiredCapabilities` | `CapabilityName[]` | facultatif | capacités natives indispensables (`session`, `secureStorage`, `openExternal`, `lifecycle`, `permissions`, `files`, `camera`, `push`, `biometric` + extensions) | auteur |
| `pages` | `PageDefinition[]` | facultatif | pages montées par URL | auteur |
| `extensions` | `ExtensionDefinition[]` | facultatif | composants insérés dans des *slots* | auteur |
| `modals` | `ModalDefinition[]` | facultatif | modales lançables par nom | auteur |
| `workspaces` / `workspaceGroups` | tableaux | facultatif | espaces de travail (v1) | auteur |
| `workspaceGroups2` / `workspaceWindows2` / `workspaces2` | tableaux | facultatif | espaces de travail (v2) | auteur |
| `featureFlags` | `FeatureFlagDefinition[]` | facultatif | drapeaux de fonctionnalité | auteur |
| `optionalBackendDependencies` | objet | facultatif | modules backend optionnels activant un drapeau | auteur |
| `backendDependencies` | objet | facultatif | ⛔ **aucun consommateur trouvé** (voir §9) | — |

Statut **dans le Core** (28 apps) : seules les clés `$schema`, `pages`, `extensions`, `modals`, `backendDependencies` sont utilisées. `workspaces*`, `featureFlags`, `platforms`, `requiredCapabilities`, `optionalBackendDependencies` sont **disponibles mais inutilisées** dans les sources du Core.

## 3. Pages (`pages[]`)

Enregistrement : `registerApp` → `finishRegisteringAllApps` → `registerApplication` Single-SPA (voir 01 §7).

| Propriété | Type | Oblig. | Détail vérifié |
| --- | --- | --- | --- |
| `component` | string | **oui** | nom d'export (ou `module#export`) |
| `route` | string \| boolean | **un des deux** | chaîne → `pathToActiveWhen(spaBase + route)` ; `true` = toujours actif ; `false` = jamais |
| `routeRegex` | string | **un des deux** | testé sur le chemin **sans** `spaBase` (ex. `^home(/.*)?$`) |
| `online` | boolean | non | défaut `true` ; effectif **seulement si** `window.offlineEnabled` |
| `offline` | boolean | non | défaut `false` ; idem |
| `featureFlag` | string | non | page active seulement si le drapeau est vrai ; idem (mode hors ligne uniquement) |
| `containerDomId` | string | non | défaut `egen-apps-container` ; **doit exister** dans le HTML du Shell (sinon exception au démarrage) |

Règles et pièges vérifiés :

- Le schéma exige **exactement un** de `route` / `routeRegex`.
- ⚠️ `registerApp` accepte une page qui porte `routes` (pluriel) à la place, mais `tryRegisterPage` ne lit que `route`/`routeRegex` : une page avec `routes` seul est **ignorée avec un `console.warn`** (« missing a route »). `routes` n'existe ni dans le type ni dans le schéma. À ne pas utiliser.
- Plusieurs pages d'une même app sont autorisées ; l'index `<app>-page-<i>` dépend de l'ordre dans le tableau.
- Exemple réel (Core) : `esm-footer-app` — `{ "component": "root", "routeRegex": "^(?!(?:login|logout|change-password)/?)", "online": true, "offline": true, "containerDomId": "egen-footer-app-container" }`. Il monte donc dans le conteneur du pied de page, et non dans la zone principale.

## 4. Extensions (`extensions[]`)

Une extension est un composant inséré dans un **slot** (emplacement nommé). Enregistrement : `tryRegisterExtension` → `registerExtension` + `attach(slot, nom)` (`esm-routes/src/loaders/components.ts`).

| Propriété | Type | Oblig. | Détail |
| --- | --- | --- | --- |
| `name` | string | **oui** | identifiant de l'extension (utilisé en configuration) ; sans `name` → `console.error`, ignorée |
| `component` | string | **oui** | export ; sans lui → `console.error`, ignorée |
| `slot` | string | non | slot par défaut |
| `slots` | string[] | non | plusieurs slots ; **si `slots` ET `slot` sont donnés, seul `slots` est pris en compte** (avertissement) |
| `order` | number | non | ordre dans le slot (surchargeable par configuration) |
| `online` / `offline` | boolean | non | défauts **`true` / `false`** (valeurs appliquées à l'enregistrement) |
| `privileges` | string \| string[] | non | l'utilisateur doit avoir **l'un** de ces privilèges |
| `displayExpression` | string | non | expression évaluée (`esm-expression-evaluator`) |
| `featureFlag` | string | non | rendu seulement si le drapeau est actif |
| `meta` | objet libre | non | propriétés transmises à l'extension ; **contrat imposé par certains slots** (§5) |

Une extension sans `slot` ni `slots` est enregistrée **sans être rattachée** : elle ne s'affiche que si un slot l'accueille par configuration (comportement d'`esm-extensions`, 🟡 non exécuté).

## 5. Slots : lesquels existent réellement

Un slot n'est pas « déclaré » dans `routes.json` : il existe quand un composant React rend `<ExtensionSlot name="…" />` (`esm-react-utils/src/ExtensionSlot.tsx`). Les extensions peuvent donc cibler **n'importe quel nom**, sans erreur ; elles ne s'affichent que si un slot de ce nom est rendu.

Slots utilisés par les extensions du Core (comptage sur les 28 apps) : `topbar-nav-slot` (24), `topbar-slot` (14), `home-sections` (7), `quick-access-section-slot` (5), `shell-rail-bottom-slot` (4), `user-panel-slot` (4), `sites-registry-slot` (4), `shell-rail-left-slot` (3), `shell-rail-right-slot` (3), `help-menu-slot` (3), plus des slots propres à une app (`offline-tools-*`, `global-settings-slot`, `staggered-menu-slot`, `app-menu-slot`, `user-panel-bottom-slot`).

### Slots à contrat strict : les rails du Shell
`shell-rail-left-slot`, `shell-rail-bottom-slot`, `shell-rail-right-slot` (`esm-extensions/src/tool-window.ts`). Leur `meta` doit être une `ToolWindowMeta` :

| Champ `meta` | Règle de validation |
| --- | --- |
| `title` | chaîne **non vide** (obligatoire) |
| `titleKey`, `icon` | chaîne |
| `iconUrl` | doit commencer par `https://`, `/` ou `data:image/(svg+xml\|png\|webp\|gif\|jpeg)` |
| `order` | nombre fini |
| `global` | booléen |
| `rail` | `"left"` ou `"right"` |
| `compartment` | `"default"` ou `{height,minHeight,maxHeight}` en ]0,100] |

Si la `meta` est invalide, l'extension **n'apparaît pas** et `tryRegisterExtension` émet un `console.warn` *« … ne s'affichera pas : … »* — c'est le premier endroit où regarder lors de l'intégration d'une app distante.

### Slot à contrat du Core : `topbar-nav-slot`
Ce contrat n'est **pas** dans le Framework : il est imposé par `core/tools/check-nav-routes.mjs` (lancé par `yarn verify`). Chaque entrée doit avoir `meta.section`, `meta.label`, `meta.route` (chaînes non vides), `meta.group` (optionnel, chaîne non vide), et sa `meta.route` doit correspondre à un `pages[].route` déclaré par une app du Core. ✅ Ce contrôle ne lit que `core/packages/apps/*/src/routes.json` : **il ne couvre pas une app externe**.

## 6. Modales (`modals[]`)

`{ name, component }`, les deux obligatoires (schéma et code). Lancement par nom. Loader : `loadLifeCycles(appName, component)`.

## 7. Workspaces, groupes, fenêtres

- **v1** : `workspaces[]` exige `name, title, type, groups, component` (schéma). `title` est une **clé de traduction** du module. `width` ∈ `narrow|wider|extra-wide`, `preferredWindowSize` ∈ `maximized|hidden|normal`. `workspaceGroups[]` : `{ name, members? }`.
- **v2** : `workspaceGroups2[]` (`name, closeable?, overlay?, persistence? 'app-wide'|'closable', scopePattern?`), `workspaceWindows2[]` (`name, group, icon?, canMaximize?, order?, width?`), `workspaces2[]` (`name, component, window`).
- 🟡 Présents dans le code d'enregistrement et les types ; **aucune app du Core ne les utilise** : leur comportement d'affichage n'est pas observé ici.

## 8. Drapeaux de fonctionnalité

`featureFlags[]` : `{ flagName, label, description }` (les trois obligatoires, `registerApp` ne contrôle que `flagName`). `optionalBackendDependencies` : `{ "<uuid module backend>": "<semver>" }` ou `{ version, feature: {flagName,label,description} }` ; au démarrage (`app-shell/src/optionaldeps.ts`, déclenché par l'événement `started`) le Shell interroge `/module` du backend et active le drapeau si la version est satisfaite. Les erreurs réseau sont **avalées**. Un descripteur `feature` incomplet → `console.warn`.

## 9. `backendDependencies`

Présent dans les 28 `routes.json` du Core et dans le schéma/type, mais ⛔ **aucun code lu ne le consomme** (recherche dans le Shell, `esm-routes`, `esm-api` : seul `esm-api/src/egen-backend-dependencies.ts` définit une constante `{'webservices.rest': '2.24.0'}` qui est autre chose). À traiter comme **informatif** tant qu'un consommateur n'est pas identifié.

## 10. Relation déclaration ↔ composant exporté

| Déclaration | Doit correspondre à |
| --- | --- |
| `"component": "root"` | `export const root = …` (ou `export function root`) dans le fichier exposé en `./start` |
| `"component": "autre-app#nom"` | export `nom` du module **`autre-app`** présent dans le registry |

L'export doit être une **fonction sans argument renvoyant un lifecycle (ou une promesse de lifecycle)** (✅ `load-lifecycles.ts` ; produit par `getSyncLifecycle`/`getAsyncLifecycle`, voir 04 §4). Cohérence mesurée sur les 28 apps du Core : **0 incohérence** entre `routes.json` et exports (contrôle par script sur 18 pages, 84 extensions, 4 modales).

## 11. Ce que le runtime valide… et ne valide pas

| Contrôle | Où | Effet |
| --- | --- | --- |
| Pages/extensions/workspaces/modals sont des **tableaux** | `isEgenAppRoutes` | sinon l'objet est ignoré dans les surcharges ; pour un registre inline, balise rejetée par `isEgenRoutes` |
| `name`+`component` d'une extension/modale/workspace ; `component`+(`route`\|`routeRegex`\|`routes`) d'une page | `registerApp` | élément ignoré + `console.warn/error` |
| Export inexistant ou non fonction | `loadLifeCycles` | `console.warn` + lifecycle vide (rien ne s'affiche) |
| Clés inconnues, types fins (`order` numérique…) | — | ⛔ non validés à l'exécution (le schéma ne sert qu'à l'éditeur) |
| Doublon de nom d'app dans le registry | `Object.assign` | le dernier **écrase** le précédent |
| Doublon de nom d'extension | 🟡 non examiné | à ne pas faire |

Conclusion pratique : **un `routes.json` erroné ne fait presque jamais planter le Shell ; il rend l'app silencieusement inactive.** Seules exceptions : `containerDomId` inexistant (exception au démarrage) et registre non conforme à `isEgenRoutes` (balise ignorée en bloc).
