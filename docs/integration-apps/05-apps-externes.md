# 05 — Applications externes au Core

Une app **externe** est développée dans son propre dépôt, avec son propre cycle de build/déploiement. EGEN ne la distingue d'une app interne que par **le moyen par lequel son bundle et son `routes.json` parviennent au Shell**. Le contrat côté Shell est **identique** (voir 01 §2) ; ce qui change, c'est la *découverte*.

Légende de preuve : voir 00. Chemins `fw/` = Frontend-esm-framework.

## 1. Trois formes d'« externe » réellement prises en charge

| Forme | Mécanisme | Outil | Statut |
| --- | --- | --- | --- |
| **E1 — Source dans un autre dossier/dépôt, lancée en développement** | `egen develop --sources <chemin>` (le chemin peut être hors du monorepo) | `egen develop` | ✅ |
| **E2 — Paquet npm (ou tarball `file:`/`https://`) assemblé dans une distribution** | `spa-build-config.json` → `egen assemble` | `egen assemble` | ✅ |
| **E3 — Bundle hébergé ailleurs, référencé par URL** | entrée d'import map absolue + entrée de registry | fichiers `importmap.json` / `routes.registry.json` ou variables du Shell | ✅ pour le chargement, 🟡 pour le réseau/CORS |

✅ **Mise à jour :** `serve-prod.mjs` prend désormais en charge les formes E2 et E3 en production via `yarn external:sync` (voir [12](12-apps-externes-en-production.md)). Le §4.2 ci-dessous décrit le comportement **d'origine** (apps internes seules), conservé pour les apps internes.

## 2. Indépendance du projet externe

### 2.1 Ce qui doit exister

| Élément | Obligatoire ? | Précision vérifiée |
| --- | --- | --- |
| `package.json` : `name`, `version`, `browser` (chemin du bundle), `main` | **oui** | `name` = clé du registry/import map ; `browser` = fichier chargé |
| `package.json` : `peerDependencies` | **oui (même `{}`)** si la config `egen` par défaut est utilisée | sinon TypeError (`Object.keys(undefined)`), voir 04 §2 |
| `src/routes.json` | **oui** (config par défaut) | build interrompu sinon |
| Un conteneur Module Federation de type **`var`** nommé `slugify(name)`, exposant **`./start`** | **oui** (contrat du Shell) | `esm-dynamic-loading/src/dynamic-loading.ts` |
| Des exports = fonctions renvoyant des lifecycles Single-SPA | **oui** | `load-lifecycles.ts` |
| `export const importTranslation = require.context(…,'lazy')` | conditionnel (si traductions par le Shell) | `app-shell/src/locale.ts` |
| `export function startupApp()` | facultatif | |
| Un build qui produit **`routes.json` dans le même dossier que `browser`** | **oui pour E2** | `assemble.ts` ne copie que les fichiers situés sous `dirname(browser)` |
| `tsconfig.json`, tests, README | non (conventions) | |

### 2.2 Ce qu'il faut installer — selon le mode (voir 03 §1)

**Mode A — contrat seul** (aucune API EGEN utilisée) : aucun paquet `@egen-civitas/*` à l'exécution. Il faut seulement produire le conteneur et les lifecycles (voir 06 pour Vue/Angular). Le Shell fournit en partage `react`, `react-dom`, `react-router-dom`, `react-i18next`, `i18next`, `dayjs`, `rxjs`, `single-spa`, `swr` (`dependencies.json`) : une app non-React peut simplement ne **pas** les déclarer en peer.

**Mode B — contrat + services** :
- devDependency **`@egen-civitas/egen`** : apporte `rspack` (bin), `@rspack/core`, `@swc/core`, `rspack-config`, le Shell (pour `egen develop`) — pas besoin de les déclarer séparément (✅ `dependencies` de `egen` et `rspack-config`).
- `@egen-civitas/esm-framework` en `peerDependencies` (plage large, ex. `>=4.0.0`) **et** en `dependencies`.
- Les `peerDependencies` listés deviennent les `shared` Module Federation ; ⚠️ si `swr` est listé, `require('swr/package.json')` est exécuté au build : `swr` doit être installé.
- `react`/`react-dom` **18** (le décorateur utilise `react-dom/client` : `ReactDOMClient`, `singleSpaReact`).

### 2.3 Build : deux voies

| Voie | Quand | Garanties |
| --- | --- | --- |
| **Config EGEN** : `module.exports = require('@egen-civitas/egen/default-rspack-config')` | projets React/TS | `./start`, `library var`, `shared`, `routes.json` estampillé, `.env`, `buildmanifest` fournis ; **le plus sûr** |
| **Config maison** (Webpack/Rspack/autre) | Vue, Angular, existant | à vous de reproduire **exactement** : `name`, `library:{type:'var',name:slugify(name)}`, `exposes:{'./start':…}`, `filename`, `publicPath:'auto'`, `shared` singleton, copie de `routes.json` dans le dossier de sortie. **Rien dans EGEN ne le vérifie** (⛔ pas de validateur de conformité). |

🟡 La config par défaut ne définit pas `entry` : Rspack applique donc son entrée par défaut (`./src`, qui résout `src/index.*` grâce à `resolve.extensions`). Déduit de la lecture, non exécuté : garder `src/index.ts(x)`.

## 3. Contrat d'intégration avec le Shell

| Élément | Statut | Détail et source |
| --- | --- | --- |
| **Identité de l'app** = `name` | **obligatoire** | clé identique dans import map et registry |
| **Identifiant de module / global** | **obligatoire** | `slugify(name)` ; **pas de surcharge possible** (calculé dans `importDynamic`) |
| **Point d'entrée** | **obligatoire** | URL du bundle dans l'import map ; le fichier doit définir le global |
| **Exposition** | **obligatoire** | exactement `./start` (valeur par défaut de `importDynamic`) ; ⛔ pas d'autre nom configurable depuis `routes.json` |
| **Exports / cycles de vie** | **obligatoire** | fonctions → lifecycles (`bootstrap`, `mount`, `unmount`) |
| **Déclarations** | **obligatoire** pour apparaître | `routes.json` ; sans lui, l'app est chargeable mais **ne s'affiche nulle part** (voir `assemble.ts` : « no pages or extensions … will be available ») |
| **Configuration Module Federation** | **obligatoire** (conteneur `var`) | 🟡 la compatibilité avec d'autres plugins MF (ex. conteneurs ESM / `type: 'module'`) **n'est pas prévue** : `importDynamic` lit `window[slug]` |
| **Dépendances partagées** | conditionnel | `singleton: true, strictVersion: false` en config EGEN ; tout autre choix est à vos risques (07) |
| **Versions** | conditionnel | `version` (estampillée), `frameworkRange` (estampillé depuis le peer `esm-framework`) ; absent = « ancien format », toléré |
| **Ressources statiques** | conditionnel | résolues via `publicPath: 'auto'` (dérivé de l'URL du script) ; tout ce qui suppose une base fixe casse sur un autre domaine |
| **Métadonnées** | facultatif | `platforms`, `requiredCapabilities`, `featureFlags` |
| **Adresse de déploiement** | **obligatoire** | URL absolue ou relative (`./…` préfixée par `spaBase`) |
| **Information de découverte** | **obligatoire** | **l'import map ET le registry doivent la contenir** ; rien d'autre ne « découvre » |
| **Compatibilité** | conditionnel | `frameworkRange` vs version du Shell ; pas de contrôle de la version de `react` ni d'autres peers |

> **Lacune explicite** : aucun mécanisme n'existe pour qu'une app **s'annonce elle-même** au Shell (pas de manifeste à URL conventionnelle, pas de balayage de domaine). Une app est connue du Shell **uniquement** si un opérateur l'a inscrite dans l'import map et le registry. (⛔ vérifié : le Shell ne lit que des balises du DOM ; `esm-dynamic-loading` ne fait aucune requête de découverte.)

## 4. Découverte et enregistrement — fonctionnement réel

### 4.1 `egen develop` (développement)

Source : `fw/packages/tooling/egen/src/cli.ts`, `src/utils/importmap.ts`.

- **Sources** : `--sources <glob…>` (relatifs au dossier courant, **n'importe où**), `--packages <nom…>` (résolus depuis le workspace) ; sans option : dossier courant.
- Pour chaque dossier : exige un `package.json` ; détecte `webpack.config.js` ou `rspack.config.js` (sinon config par défaut) ; lance **un serveur de dev par app** sur un port libre ≥ port+1 (jamais celui du backend) ; ajoute à l'import map `<nom> → http://localhost:<port>/<basename(browser|module|main)>` et au registry `<nom> → src/routes.json (+ version prerelease locale)`.
- **Serveur de dev externe** : propriété `package.json` **`egen:develop: { "command": "…", "url"?: "…", "host"?: "…" }`** : la commande est exécutée dans le dossier de l'app (`exec`), et l'import map reçoit `startup.url || host/<bundle>`. ✅ **C'est le point d'entrée prévu pour Vue/Angular/Vite** (l'app lance son propre serveur).
  - ⚠️ ✅ **Dans ce cas, `runProject` n'ajoute pas les routes de l'app au registry** (seul `routes[...]` des apps lancées par EGEN est renseigné). Le watcher de `src/routes.json` ne crée l'entrée qu'au **premier `update` du fichier**. Contournements : fournir le registry via `--routes` (voir ci-dessous) ou toucher `src/routes.json` après démarrage. (À corriger : voir 08, E3.)
- **Registres préexistants** : `--importmap` et `--routes` acceptent **un chemin de fichier, une URL `https://…` ou un JSON littéral**. Les apps lancées localement sont **fusionnées par-dessus** (`mergeImportmapAndRoutes`). Permet de brancher une app locale sur un environnement déployé.
- **Réécriture** : les URLs du backend dans l'import map sont réécrites en chemins relatifs (`proxyImportmapAndRoutes`) **sauf** pour les apps lancées localement.
- Le serveur de dev de chaque app envoie `Access-Control-Allow-Origin: *` (config Rspack par défaut).
- Le Shell passe en mode « développement » (`spaEnv`) : les surcharges `localStorage` (`import-map-override:`, `egen-routes:`) sont actives (ce sont des **outils de poste de dev**, pas un mécanisme de déploiement).

### 4.2 `core/tools/serve-prod.mjs` (production du Core)

> **Évolution :** depuis l'ajout de `tools/external-apps.mjs` et `tools/sync-external-apps.mjs`, `serve-prod` publie aussi les apps externes validées (document 12). Ce qui suit décrit la découverte **des apps internes**.

Lecture du code (`core/tools/serve-prod.mjs`, lignes 60–80) :

```js
const appsDir = resolve(ROOT, 'packages/apps');
for (const dir of readdirSync(appsDir)) {
  const pkg = JSON.parse(readFileSync(join(appsDir, dir, 'package.json')));
  const entry = pkg.browser || pkg.module || pkg.main;
  …  // SKIP si dist/<bundle> absent
  importMap[pkg.name] = `${SPA}/apps/${dir}/${basename(entry)}`;
  const rf = join(appsDir, dir, 'src', 'routes.json');
  if (existsSync(rf)) routes[pkg.name] = { ...JSON.parse(readFileSync(rf)), version: pkg.version };
}
```

| Constat | Conséquence |
| --- | --- |
| Ne scanne que `core/packages/apps/*` | ⛔ une app externe n'est **jamais** vue |
| Import map et registry **construits en mémoire au démarrage** | ⛔ pas de rechargement à chaud ; un redémarrage est nécessaire pour toute nouvelle app |
| Lit `src/routes.json` (source), pas `dist/routes.json` | ⛔ le `frameworkRange` n'est **pas** estampillé (le garde-fou de version n'est pas exercé en production Core) ; `platforms` etc. sont ceux de la source |
| Sert les bundles sous `${SPA}/apps/<dossier>/` | les URLs sont relatives au Shell : pas de domaine externe |
| Aucune variable d'environnement pour ajouter des entrées | ⛔ pas de moyen d'injecter une app externe sans modifier `serve-prod.mjs` |
| Applique CSP/en-têtes ? | 🟡 non examiné en détail |

### 4.3 `egen assemble` + `egen build` (distribution)

- **Config** `spa-build-config.json` (option `--config`, plusieurs fusionnés ; `--mode config`) :
  ```json
  {
    "publicUrl": ".",
    "frontendModules": {
      "@egen/esm-footer-app": "1.0.0",
      "@acme/esm-mon-app": "^2.1.0",
      "@acme/esm-locale-app": "file:../esm-locale-app/acme-esm-locale-app-1.0.0.tgz",
      "@acme/esm-ext-app": "https://exemple.org/releases/esm-ext-app-1.2.0.tgz"
    },
    "frontendModuleExcludes": ["@egen/esm-footer-app"]
  }
  ```
- **Sources acceptées** par module : plage semver (registre npm, `--registry` ou config npm `@pnpm/npm-conf`), `file:<chemin>` (tarball local), `https://…` (tarball). ✅ `downloadPackage`.
- **Traitement** : extrait **uniquement** les fichiers sous `dirname(browser|module|main)` du tarball dans `<target>/<nom-sans-@-avec-tiret>-<version>/` ; lit `routes.json` de ce dossier (absent → avertissement : app sans page ni extension) ; écrit `importmap[.hash].json` (`<publicUrl>/<dossier>/<fichier>`), `routes.registry[.hash].json`, et `egen-config.json` (fusion des `--config-file`), `spa-assemble-config.json` avec `--manifest`.
- **Mode `survey`** (interactif, défaut) : interroge le registre npm (`keywords:egen`, noms finissant par `-app`). ✅ Réservé au confort : le mode `config` est le mode reproductible.
- `egen build` : `--importmap` / `--routes` (chemin, URL ou JSON), `--platform web|android|ios`, `--spa-path`, `--api-url`, `--config-url/--config-path`, `--asset`, `--default-locale`, `--env`. Le Shell construit référence l'import map/registry soit **inline** (variables `EGEN_ESM_IMPORTMAP`, `EGEN_ROUTES`), soit par **URL** (`EGEN_ESM_IMPORTMAP_URL`, `EGEN_ROUTES_URL`, par défaut `<publicPath>/importmap.json` et `…/routes.registry.json`).
- 🟡 **Non joué** ici (aucune exécution de `egen assemble`/`build`) ; aucune configuration `spa-build-config.json` n'existe dans le Core.

### 4.4 Cibles natives (`--platform android|ios`)
`app-shell/tools/targets.js` impose : `EGEN_ENV=production`, `EGEN_API_URL` en `https://` absolu, **import map et registry inline non vides**, **`EGEN_ESM_IMPORTMAP_URL`/`EGEN_ROUTES_URL` interdits**, `EGEN_DEV_NO_AUTH` interdit, CSP `script-src 'self'`. ⇒ **une app externe hébergée ailleurs ne peut pas être chargée par une cible native** ; elle doit être embarquée dans l'artefact (`assemble`).

## 5. Scénarios

| Scénario | Pris en charge ? | Comment / limite |
| --- | --- | --- |
| Développée localement | ✅ | `egen develop --sources ../mon-app` (E1) |
| Sur son propre serveur de dev | ✅ avec réserve | `egen:develop` dans `package.json` ; routes à fournir (E3 ci-dessus) |
| Compilée et hébergée indépendamment | ✅ (E3) | entrées d'import map/registry vers son URL ; **pas de découverte** |
| Sur un domaine différent de celui du Core | 🟡 | chargement `<script src>` d'URL absolue : ✅ (`dynamic-loading.ts`) ; `publicPath:'auto'` charge les chunks depuis son domaine ✅ ; mais le registry/import map eux-mêmes sont lus par `fetch` (CORS requis s'ils sont hors domaine), CSP à ouvrir, cibles natives impossibles |
| Mise à jour **sans** redéployer le Core | ✅ si le registry est un fichier à part (mode URL) et le bundle sous URL stable | ⛔ avec `serve-prod.mjs` (inscription en mémoire au démarrage) |
| Plusieurs versions | ⛔ au runtime | une clé = une URL ; `assemble` range chaque version dans `<nom>-<version>/` mais n'en publie qu'une dans l'import map |
| Temporairement indisponible | 🟡 | échec de `<script>` → rejet de `importDynamic` (toast uniquement si surcharge dev) ; l'isolement par application est celui de Single-SPA (non exécuté ici) ; **aucun repli/réessai propre à EGEN** |

## 6. Développement vs production — à ne pas confondre

| | Développement | Production |
| --- | --- | --- |
| URL du bundle | `http://localhost:<port>/<bundle>` (serveur de dev par app) | `…/apps/<dossier>/<bundle>` (statique) ou URL du registre |
| Import map / registry | en mémoire, fusion des apps lancées + `--importmap/--routes` | fichiers générés (assemble) ou en mémoire (serve-prod) |
| Surcharges `localStorage` | actives | **no-op** |
| `frameworkRange` | non estampillé | estampillé si build par `rspack-config` (mais non si `serve-prod`) |

Un port de dev n'est **jamais** un mécanisme d'intégration de production : il n'existe que dans l'import map éphémère d'`egen develop`.

## 7. Options d'évolution compatibles avec l'architecture réelle (💡)

Détail, importance et coût dans [08](08-ecarts-et-recommandations.md). En résumé : (a) un fichier `external-apps.json` lu par `serve-prod.mjs` et fusionné ; (b) faire de `serve-prod.mjs` un consommateur du **registry URL** déjà prévu par le Shell ; (c) produire la distribution du Core avec `egen assemble` + `egen build` plutôt qu'avec un serveur maison ; (d) un validateur de conformité (`egen check-app`) pour les apps externes.
