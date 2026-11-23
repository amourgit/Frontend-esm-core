# 15 — Scénarios d'intégration externe, de bout en bout

Ce document déroule, étape par étape, **toute la chaîne** qui amène une application développée hors du Core à s'afficher dans EGEN : qui intervient, ce qui est fait, ce qui est produit, comment on constate que ça a marché, ce qui peut échouer.

**Mode d'exploitation retenu : à froid.** Une app externe s'ajoute en trois gestes : la **déclarer** (`external-apps.json`), lancer **`yarn prepare:prod`** (une seule commande entre le build et le démarrage : contrôles, `external:sync --strict`, vérification du verrou, précompression, avec un retour par étape), puis **redémarrer ou redéployer** le Core. Le Core lit le verrou au démarrage et revérifie chaque empreinte : rien n'est modifié pendant qu'il tourne. Le rechargement à chaud (`kill -HUP`) existe (doc 12) mais n'est pas utilisé dans ce document.

Quatre points de départ sont couverts :

| Scénario | Point de départ | Statut |
| --- | --- | --- |
| **A** | Code source dans un dépôt accessible (GitHub…) | ✅ chaîne complète disponible (via une étape de construction/publication) |
| **B** | Paquet déjà publié (npm public ou registre privé) | ✅ |
| **C** | Application **déjà déployée** à une adresse connue (distante, locale, ou application autonome comme Next.js) | ✅ (C1, C3) · 🟡 (C2, jamais exécuté de bout en bout) |
| **D** | **Registre central** d'apps conçues pour EGEN mais développées à l'extérieur | ✅ pour le registre de paquets · 💡 pour le catalogue et la porte de conformité (à construire, spécifié ici) |

Légende de preuve : voir [00](00-LISEZ-MOI.md). Chaque affirmation renvoie à un fichier lu : `core/tools/external-apps.mjs`, `core/tools/sync-external-apps.mjs`, `core/tools/serve-prod.mjs`, `fw/packages/tooling/egen/src/commands/assemble.ts`. Les paquets `esm-integration-utils`, `esm-vue-utils`, `esm-angular-utils`, `esm-nextjs-utils` sont **publiés sur npm** (0.2.0), ainsi que `esm-globals` 2.5.0 et `esm-dynamic-loading` 2.2.0 (alias d'import map).

---

## 1. Les acteurs

| Acteur | Rôle dans la chaîne |
| --- | --- |
| **Équipe de l'app** | Écrit et construit l'application ; produit un paquet (bundle + `routes.json`) ou une URL de déploiement |
| **CI de l'app** | Construit, teste, empaquette (`npm pack`), publie (registre npm ou asset de release) |
| **Hébergeur tiers** | Sert le bundle d'une app *remote* (CDN, serveur de l'équipe) ; sert une app autonome (Next.js) |
| **Opérateur du Core** | Décide quelles apps externes sont admises ; édite `external-apps.json` ; lance la synchronisation et le rechargement |
| **`egen assemble`** (Framework) | Récupère un paquet (registre / `file:` / `https:`), en extrait le dossier du bundle, produit import map + registry |
| **`sync-external-apps.mjs`** (Core) | Orchestre la récupération, télécharge les apps distantes, calcule les SHA-256, **écrit le verrou** |
| **`external-apps.mjs`** (Core) | **Valide** chaque app (alignement avec le Shell) ; utilisé par la synchro et par `serve-prod` |
| **`serve-prod.mjs`** (Core) | Publie import map + registry fusionnés, sert les bundles hébergés, expose le statut, recharge sur `SIGHUP` |
| **Shell** (`esm-app-shell`) | Lit l'import map et le registry dans la page, enregistre les pages, charge le bundle à la demande |
| **Single-SPA** | Monte/démonte les lifecycles exportés par l'app |

Le Shell ne « découvre » rien : il charge ce que l'import map et le registry décrivent. Toute la chaîne ci-dessous sert à produire ces deux fichiers **de manière sûre et reproductible**.

## 2. Ce que « conforme comme une app du Core » veut dire

Une app externe est indiscernable d'une app interne pour le Shell si elle respecte le **même contrat**. Liste de contrôle (à valider avant tout scénario) :

| # | Exigence | Pourquoi | Preuve |
| --- | --- | --- | --- |
| 1 | `package.json` : `name`, `version`, `browser` (chemin du bundle, ex. `dist/acme-esm-hello-app.js`), `keywords: ["egen"]`, `peerDependencies` (même `{}`) | `name` = clé de l'import map et du registry ; `browser` = fichier chargé | 05 §2.1 ✅ |
| 2 | Conteneur Module Federation de type `var`, nom `slugify(name)` (`@acme/esm-hello-app` → `_acme_esm_hello_app`), exposition `./start` | contrat de `importDynamic` | 01 §6, `external-apps.mjs` ✅ |
| 3 | Chaque `component` de `routes.json` est un **export de `./start`**, fonction renvoyant des lifecycles | `load-lifecycles` | 01 §2 ✅ |
| 4 | `src/routes.json` copié dans le dossier de sortie, à côté du bundle (`dist/routes.json`) | `egen assemble` ne lit que les fichiers sous `dirname(browser)` | `assemble.ts` ✅ |
| 5 | `src/index.ts(x)` présent | sinon Rspack échoue (*Can't resolve './src'*) | 13 §4 ✅ |
| 6 | `moduleName` des composants = `name` du `package.json` | espace de noms i18n et config | 04, 08 E2 ✅ |
| 7 | Build par `@egen-civitas/egen` (`default-rspack-config`) pour React ; équivalent aligné pour Vue/Angular | estampille `version` et `frameworkRange` dans `dist/routes.json` | 05 §2.3, 01 §9 ✅ |
| 8 | Technologie : React → `esm-react-utils` · Vue 3 → `esm-vue-utils` · Angular → `esm-angular-utils` · autonome (Next.js…) → `esm-nextjs-utils` (iframe) | fabriques de lifecycle et services EGEN | 13 ✅ |
| 9 | Montage dans les zones, rails et slots du Core, pas de montage « sauvage » | cohérence de l'interface | `docs/guide-montage-apps-rails-zones.md` |
| 10 | `package.json` : `"files": ["dist"]`, `publishConfig.access` | le tarball doit contenir le bundle **et** `routes.json` | 12 §5 ✅ |

Différences réelles avec une app interne (tout le reste est identique) :

| | App interne (`packages/apps/*`) | App externe |
| --- | --- | --- |
| Découverte | `serve-prod` scanne `packages/apps/*`, lit `dist/routes.json` (estampillé) | `external-apps.json` → verrou → `serve-prod` |
| Validation à la publication | aucune | **oui** (`external-apps.mjs`) : refus des apps fautives |
| `routes.json` utilisé | celui du build (`dist/routes.json`, `frameworkRange` estampillé ; écart G3 traité) | **celui du build** (estampillé : le garde-fou de version est actif) |
| Intégrité | — | SHA-256 vérifié à chaque démarrage (hébergée) ou mémorisé (remote) |
| Nom en conflit avec une app interne | — | l'app interne **prime**, l'externe est rejetée |

---

## 3. Scénario A — du code source sur GitHub à l'écran

Exemple fil rouge : dépôt `github.com/acme/esm-hello-app` (React, Vue ou Angular), version `1.2.0`. Le Core est déjà en production.

### A1 — Récupérer et comprendre le code
- **Qui** : développeur de l'équipe (ou de l'opérateur).
- **Quoi** : `git clone`, puis contrôle de la liste de la section 2 (`package.json`, `routes.json`, `src/index.ts`, conteneur `var`).
- **Résultat** : un dépôt conforme, ou la liste des écarts à corriger. 🟡 Il n'existe pas encore de commande qui fasse ce contrôle (💡 `egen check-app`, voir D2).

### A2 — Essayer l'app dans le Core, en développement
- **Qui** : développeur.
- **Quoi** : depuis le Core, lancer `egen develop` en ajoutant le dépôt aux sources : `yarn egen develop --sources "packages/apps/*" "../esm-hello-app"` (🟡 combinaison non exécutée ; le mécanisme `--sources` accepte des chemins hors monorepo, 05 §4.1 ✅). Pour une app avec son propre serveur (Vue/Vite, Angular CLI), déclarer `egen:develop: { "command": "…", "url": "…" }` dans son `package.json`.
- **Ce qui se passe** : `egen develop` lance un serveur par app sur un port libre, ajoute `<nom> → http://localhost:<port>/<bundle>` à l'import map éphémère et `<nom> → src/routes.json` au registry ; le Shell passe en mode développement.
- **Résultat** : l'app apparaît dans le Core local. ⚠️ Dans ce mode le garde-fou `frameworkRange` n'est pas exercé et, pour `egen:develop`, les routes ne sont enregistrées qu'au premier « update » de `src/routes.json` (écart G5, 05 §4.1).

### A3 — Construire et empaqueter (CI de l'app)
- **Qui** : CI de l'équipe de l'app.
- **Quoi** :
  ```bash
  yarn install --immutable
  yarn build            # produit dist/<bundle>.js + dist/routes.json estampillé
  npm pack              # produit acme-esm-hello-app-1.2.0.tgz (contient dist/)
  ```
- **Résultat** : un tarball dont `package/dist/` contient le bundle **et** `routes.json` (frameworkRange + version estampillés si build par `rspack-config`).

### A4 — Diffuser le paquet (choisir UNE voie)
- **A4-a · Asset de release GitHub (dépôt public)** — **Qui** : CI de l'app. **Quoi** : `gh release create v1.2.0 acme-esm-hello-app-1.2.0.tgz`. **Résultat** : URL stable `https://github.com/acme/esm-hello-app/releases/download/v1.2.0/acme-esm-hello-app-1.2.0.tgz`. `egen assemble` la télécharge par un `fetch` simple qui suit les redirections ✅. ⛔ **Dépôt privé non pris en charge** : aucun en-tête d'authentification n'est envoyé.
- **A4-b · Registre npm** — **Quoi** : `npm publish`. **Résultat** : `@acme/esm-hello-app@1.2.0` récupérable par plage semver (scénario B).
- ⛔ **Il n'existe pas de source git** (`git+https://…`) : `egen assemble` ne gère que registre, `file:` et `https:` ✅ (`downloadPackage`). Le code source **doit** être construit avant diffusion.

### A5 — Déclarer l'app dans le Core
- **Qui** : opérateur du Core.
- **Quoi** : éditer `external-apps.json` (modèle : `external-apps.example.json`) :
  ```json
  {
    "apps": {
      "@acme/esm-hello-app": "https://github.com/acme/esm-hello-app/releases/download/v1.2.0/acme-esm-hello-app-1.2.0.tgz"
    }
  }
  ```
- **Résultat** : la déclaration est la **seule** chose que l'opérateur écrit. C'est elle qui décide de l'admission de l'app.

### A6 — Synchroniser (récupération, validation, verrou)
- **Qui** : opérateur ; outils `sync-external-apps.mjs` puis `egen assemble` puis `external-apps.mjs`.
- **Quoi** : `yarn external:sync` (ajouter `--strict` pour échouer si une app est rejetée).
- **Ce qui se passe, dans l'ordre** :
  1. le dossier `external-apps/` est vidé puis recréé ;
  2. `egen assemble --mode config … --manifest` télécharge le tarball et en extrait **uniquement** le dossier du bundle dans `external-apps/acme-esm-hello-app-1.2.0/` ;
  3. la synchro lit l'import map produite (`./acme-esm-hello-app-1.2.0/acme-esm-hello-app.js`) et calcule le **SHA-256** du bundle ;
  4. elle écrit `external-apps/external-apps.lock.json` ;
  5. elle charge le verrou avec `external-apps.mjs` et affiche le rapport.
- **Résultat** (extrait du verrou) :
  ```json
  { "lockVersion": 1, "apps": { "@acme/esm-hello-app": {
      "kind": "hosted", "version": "1.2.0", "source": "https://…tgz",
      "dir": "acme-esm-hello-app-1.2.0", "entry": "acme-esm-hello-app.js", "sha256": "…" } } }
  ```
  Journal attendu : `@acme/esm-hello-app@1.2.0 [hosted] : ok`.
- **Contrôles faits ici** (refus = l'app n'est jamais publiée, le reste du Core n'est pas affecté) : nom de paquet valide ; pas de conflit avec une app interne ; chemins du verrou sûrs ; bundle présent ; `routes.json` lisible ; `pages/extensions/workspaces/modals` sont des tableaux ; `containerDomId` connu du Shell. **Réserves** (publiée mais signalée) : conteneur `var` ou `./start` absents du bundle, `routes.json` absent, `frameworkRange` absent, page sans `route`/`routeRegex`, extension déjà déclarée par une autre app.

### A7 — Précompresser et servir
- **Qui** : opérateur ; `precompress.mjs`, `serve-prod.mjs`.
- **Quoi** : tout ce qui précède (A6) et la précompression s'enchaînent en **une commande** : `yarn prepare:prod` (avec `EGEN_CONFIG_FILE=… ` si une configuration runtime est utilisée, voir A10). Elle affiche cinq étapes numérotées (apps compilées · configuration runtime · synchronisation des externes · contrôle du verrou · précompression), s'arrête à la première erreur en nommant l'étape et le remède (code 1 : ne pas démarrer), et termine par la commande de démarrage. Puis **redémarrer** le Core (`yarn start:prod`) ou le redéployer. Aucune action sur un Core qui tourne. `--skip-precompress` pour un essai rapide.
- **Ce qui se passe** : `serve-prod` relit le verrou, **revérifie le SHA-256**, fusionne l'app dans l'import map (`@acme/esm-hello-app → <spa>/external/acme-esm-hello-app-1.2.0/acme-esm-hello-app.js`) et dans le registry (`routes.json` de l'app + `version`), et sert le bundle sous `<spa>/external/…`.
- **Résultat** : `GET <spa>/importmap.json` et `<spa>/routes.registry.json` contiennent l'app.

### A8 — Vérifier
- **Statut** : `GET <spa>/external-apps.status.json` → `{ apps: [{ name, kind, version, status, errors, warnings }] }` avec `status` ∈ `accepted` · `accepted-with-warnings` · `rejected`.
- **Navigateur** : le Shell enregistre la page ; au premier accès à sa route, `importDynamic` charge `<script src=…>`, initialise le conteneur `_acme_esm_hello_app`, appelle `./start`, et Single-SPA monte le lifecycle. 🟡 Jamais joué avec un Shell complet dans ce dépôt.
- **Contrôle périodique / CI** : `yarn external:check` (fichiers + dérive).

### A9 — Mettre à jour
Nouvelle version `1.3.0` publiée (A3–A4) → l'opérateur change l'URL ou la plage dans `external-apps.json` → `yarn external:sync --strict` → redémarrage ou redéploiement du Core. **Une seule version par app** à la fois (une clé = une URL).

---

### A10 — Configurer l'app (si elle est configurable)
- **Qui** : opérateur du Core.
- **Pourquoi** : une app externe lit sa configuration par `getConfig(<nom du paquet>)`. En production, le Shell reçoit ses fichiers de configuration par `configUrls` ; **`serve-prod` n'en fournissait aucun** (`configUrls:[]` figé) : une app configurable n'aurait eu que ses valeurs par défaut.
- **Quoi** : un fichier JSON `{ "<nom de l'app>": { … } }` désigné par `EGEN_CONFIG_FILE` (chemin relatif à la racine du Core), par exemple (modèle : `egen-config.example.json`) :
  ```json
  { "@civitas/esm-penpot-app": { "penpotUrl": "https://design.exemple.org" } }
  ```
  `EGEN_CONFIG_URLS` ajoute d'autres fichiers (URLs séparées par des virgules, lues par le navigateur).
- **Ce qui se passe** : au démarrage, `serve-prod` lit et **valide** le fichier (`tools/runtime-config.mjs`), le sert à `<spa>/config.json` (`Cache-Control: no-store`) et le déclare dans `configUrls`. Un fichier illisible ou invalide **empêche le démarrage** avec un message explicite (code 1) : en intégration à froid, une erreur de configuration se voit au déploiement, pas en silence dans le navigateur.
- **À savoir** : le contenu est **public** (servi au navigateur) : aucun secret. Sans `EGEN_CONFIG_FILE`, le comportement est celui d'avant (✅ testé, 3 tests de `tools/runtime-config.test.mjs`).

## 4. Scénario B — paquet déjà publié

### B1 — Registre npm public
- **Qui** : opérateur. **Quoi** : `"apps": { "@acme/esm-hello-app": "^1.2.0" }` (plage semver) ou version exacte (recommandé en production : reproductible). **Ensuite** : A6 → A8 identiques.
- `egen assemble` résout via `pacote.manifest` puis télécharge le tarball **avec contrôle d'intégrité** (`_integrity`) ✅.

### B2 — Registre privé ou à portée
- **Qui** : opérateur + administrateur du registre.
- **Quoi** : fournir un `.npmrc` (au niveau utilisateur ou projet) avec l'URL du registre par portée et le jeton d'authentification ; ou le champ `"registry"` de `external-apps.json` (transmis à `egen assemble --registry`). `egen` lit la chaîne `.npmrc` (`@pnpm/npm-conf`) ✅.
- 🟡 Non exécuté contre un registre privé réel ; le mécanisme est celui de npm. Le jeton ne doit **jamais** être commité dans `external-apps.json`.

### B3 — Contrôles propres à ce scénario
Le paquet doit contenir **`dist/` complet** (bundle + `routes.json`). Un paquet publié sans `routes.json` produit l'avertissement `Routes file … does not exist` : l'app est chargeable mais **n'affiche rien**.

---

## 5. Scénario C — application déjà déployée, adresse connue

### C1 — Hébergée ailleurs, accessible en https (app *remote*)
- **Qui** : équipe de l'app (déploiement) + opérateur du Core.
- **Prérequis côté app** : le bundle est un conteneur Module Federation `var` exposant `./start`, avec `publicPath: 'auto'` (les chunks sont chargés depuis **son** domaine) ; un `routes.json` est accessible à une URL.
- **Quoi** (opérateur) :
  ```json
  { "remote": [ {
      "name": "@partner/esm-x-app",
      "bundle": "https://cdn.partner.org/x/1.0.0/partner-esm-x-app.js",
      "routes": "https://cdn.partner.org/x/1.0.0/routes.json",
      "version": "1.0.0" } ] }
  ```
- **Ce qui se passe** (`yarn external:sync`) : téléchargement du bundle (SHA-256 mémorisé) et des routes ; **les routes sont figées** dans `external-apps/remote/routes/partner-esm-x-app.json` : le démarrage du Core ne dépend donc pas du partenaire.
- **Résultat** : verrou `kind: "remote"` ; import map = l'URL du bundle **telle quelle** ; registry = le snapshot.
- **Règles** : **https obligatoire** (sinon rejet, contenu mixte ; `EGEN_EXTERNAL_ALLOW_HTTP=true` pour un environnement de test) ; aucun contrôle d'intégrité à l'exécution (le navigateur charge le script lui-même) → surveiller la **dérive** avec `yarn external:check` (planifié en CI).
- **Exploitation** : la CSP du Core doit autoriser le domaine du script (🟡 non examiné en détail) ; le partenaire doit garantir la disponibilité et le `Cache-Control` ; **aucun repli** si l'hôte est indisponible. ⛔ Inutilisable par les cibles natives Android/iOS (le contenu doit être embarqué).

### C2 — Déployée en local ou sur un réseau interne (poste, serveur de développement)
- **Qui** : développeur.
- **Quoi** :
  - app lancée par EGEN : `egen develop --sources ../mon-app` (scénario A2) ;
  - app lancée par **son propre serveur** (Vite, Angular CLI) : `egen:develop` dans son `package.json` ;
  - app déjà en marche à une adresse connue : fournir import map et registry à `egen develop` via `--importmap` et `--routes` (chemin, URL ou JSON littéral) ; les apps locales sont fusionnées par-dessus (05 §4.1 ✅).
- **Résultat** : visible dans le Core de développement uniquement. **Un port de développement n'est jamais un mécanisme de production** (05 §6). Pour passer en production, repasser par A (construire/publier) ou C1 (déployer en https).
- 🟡 La combinaison `--importmap` + app locale + Core démarré par `yarn start` n'a pas été exécutée ici.

### C3 — Application autonome (Next.js, SSR, routeur propre) déployée à une adresse connue
Cas typique : l'app tourne déjà sur `https://next.exemple.org/app` et ne produira jamais de conteneur Module Federation.
- **Qui** : équipe de l'app (côté app) + équipe d'intégration (une « enveloppe » minuscule).
- **Étape 1 — enveloppe côté Shell** (paquet `@acme/esm-mon-next`, voir scénario A pour le construire) :
  ```ts
  import { getSyncLifecycle } from '@egen-civitas/esm-nextjs-utils';
  export const root = getSyncLifecycle({
    moduleName: '@acme/esm-mon-next', featureName: 'mon-next',
    url: 'https://next.exemple.org/app',
  });
  ```
  `routes.json` : `{ "pages": [{ "component": "root", "routeRegex": "^mon-next(/.*)?$" }] }`.
- **Étape 2 — pont côté application** : `createEgenBridge({ moduleName, allowedHostOrigins: ['https://shell.exemple.org'] })` (client React, jamais pendant le rendu serveur).
- **Étape 3 — exploitation** : l'app envoie `Content-Security-Policy: frame-ancestors https://shell.exemple.org` (jamais `X-Frame-Options: DENY/SAMEORIGIN`, cause n°1 d'une iframe vide) ; la CSP du Core autorise `frame-src` vers l'app ; préférer un **sous-domaine du même site** (cookies tiers bloqués sinon).
- **Étape 4** : l'enveloppe est diffusée comme n'importe quelle app (A3 → A6).
- **Ce qui est garanti** (✅ testé, 18 tests) : messages acceptés seulement de l'iframe **et** de l'origine autorisée (jamais `*`) ; navigation limitée aux chemins internes ; `sessionId` jamais transmis.
- **Limites** : pas de partage de contexte React, de dépendances ni de styles avec le Shell ; 🟡 exécution inter-fenêtres en vrai navigateur non validée ; inadapté aux cibles natives.

---

## 6. Scénario D — registre central d'apps conçues pour EGEN

But : un endroit unique où l'on trouve des apps **entièrement écrites pour EGEN mais développées à part**, qui suivent exactement l'architecture d'une app du Core, et que n'importe quel Core peut adopter sans réécriture.

### D1 — Ce qui existe aujourd'hui (✅) : le registre de paquets
- **Qui** : administrateur du registre ; équipes d'apps ; opérateurs de Core.
- **Quoi** : un registre npm (privé, ou public avec la portée de l'organisation) sert de **source unique** : les équipes y publient `@org/esm-*-app` (A3–A4-b) ; chaque Core le déclare (`registry` ou `.npmrc`, B2) et choisit ses apps dans `external-apps.json`. Le mode `survey` d'`egen assemble` interroge un registre npm public (mots-clés `egen`, noms finissant par `-app`) pour proposer des apps en interactif ✅, mais ne sert pas en production.
- **Ce que ça garantit** : intégrité (contrôle `_integrity`), versions, authentification par portée. **Ce que ça ne garantit pas** : qu'une app publiée est **conforme** (aucune porte à la publication) ni qu'elle est **approuvée** pour un Core donné.

### D2 — Cible retenue (💡, à construire) : catalogue + porte de conformité
Décision de conception : le catalogue **n'ajoute pas de nouveau mécanisme de chargement** ; il produit les mêmes entrées `apps` / `remote` que l'opérateur écrit à la main, et tout le reste de la chaîne (A6 → A8) reste inchangé. Le verrou et la validation du Core restent l'ultime garde.

**Flux** :
1. L'équipe publie son paquet (A4) ;
2. une **porte de conformité** (commande `egen check-app`, écart G4) s'exécute en CI du registre ;
3. si elle passe, une entrée est ajoutée au **catalogue** (fichier JSON versionné, servi à URL stable ou dans un dépôt dédié) ;
4. l'opérateur du Core sélectionne dans le catalogue (`"catalog": "<url|chemin>"` + `"select": [...]`) ; `yarn external:sync` résout les entrées en `apps`/`remote`, puis suit A6.

**Format du catalogue** (proposé) :
```json
{ "catalogVersion": 1, "apps": [ {
    "name": "@acme/esm-hello-app",
    "technology": "react | vue | angular | embed",
    "description": "…", "owner": "acme",
    "source": { "type": "npm", "registry": "https://npm.acme.org", "range": "^1.2.0" },
    "conformity": { "checkedWith": "check-app@1", "checkedAt": "2026-11-21", "frameworkRange": "^5.0.1" },
    "status": "approved | deprecated | revoked" } ] }
```
`source.type` peut aussi valoir `tarball` (`url` + `sha256` obligatoire) ou `remote` (`bundle`, `routes`).

**Règles de la porte de conformité** (reprennent celles de `external-apps.mjs` et la liste de la section 2) :
- `package.json` : `name` valide, `browser` pointe un fichier de `dist/`, `peerDependencies` présent, `keywords` contient `egen`, `files` contient `dist` ;
- bundle : conteneur `var` `slugify(name)` et exposition `./start` présents ; **chaque `component` de `routes.json` est un export de `./start`** et une fonction (contrôle réel par chargement, comme l'essai du doc 13 §4 — plus fort que le contrôle statique actuel de `checkBundle`) ;
- `routes.json` : tableaux valides, `containerDomId` connus, `frameworkRange` estampillé ;
- `moduleName` = `name` ; technologie utilisant le bon paquet d'intégration ; montage conforme au guide `docs/guide-montage-apps-rails-zones.md` ;
- aucune collision de nom avec une app interne ni de nom d'extension déjà pris dans le catalogue.

**Pourquoi ce choix** : il respecte la priorité de modularité et de personnalisation totale (chaque entreprise garde la main sur ce qu'elle admet : `select` + verrou), évite un second chemin de chargement, et réutilise la validation déjà testée (`yarn test:tools`).

---

## 6 bis. Exemple réel, à froid : Penpot

Penpot (outil de conception) est une application autonome (backend Clojure, frontend ClojureScript, PostgreSQL) : c'est le cas **C3**, avec les moyens du scénario **A** pour diffuser son enveloppe. Le fork est `github.com/amourgit/penpot`, branche `egen` (partie du tag stable 2.19.3, voir `EGEN.md` dans le fork).

| Étape | Qui | Ce qui est fait | Vérifié |
| --- | --- | --- | --- |
| 1. Adapter Penpot | équipe app | `PENPOT_FRAME_ANCESTORS` dans l'image frontend : par défaut Penpot interdit tout embarquement (`X-Frame-Options: SAMEORIGIN`, et sa CSP `frame-ancestors` n'est pas appliquée en mode report-only) | ✅ 24 vérifications, dont un vrai nginx |
| 2. Déployer Penpot | opérateur | `docker/egen/` : images officielles 2.19.3 + deux fichiers nginx montés ; Penpot sur un sous-domaine du même site que le Core | 🟡 compose validé (YAML), **jamais lancé** (pas de Docker disponible ici) |
| 3. Construire l'enveloppe | CI du fork | tag `egen-app-v1.0.0` → tests, types, build, `npm pack`, release GitHub | ✅ exécuté sur GitHub Actions |
| 4. Déclarer | opérateur | `external-apps.json` : URL https du tarball de la release | ✅ |
| 5. Synchroniser | opérateur | `yarn external:sync --strict` : `@civitas/esm-penpot-app@1.0.0 [hosted] : ok` | ✅ avec le tarball téléchargé de la release |
| 6. Configurer | opérateur | `EGEN_CONFIG_FILE` avec `penpotUrl` (A10) | ✅ |
| 7. Redémarrer | opérateur | `precompress.mjs` puis `yarn start:prod` ; import map, registry et statut `accepted` ; redémarrage : identique | ✅ |
| 8. Sécurité à froid | — | bundle altéré après la synchro → **REJETÉE** au démarrage, absent de l'import map (404) ; re-synchro : rétabli | ✅ |
| 9. Affichage réel | navigateur | iframe Penpot dans le Core, connexion, copier-coller, export | ⛔ **non vérifié** : nécessite Penpot déployé et un navigateur |

Points d'attention constatés : l'iframe n'est utilisable que si Penpot envoie un `frame-ancestors` incluant l'origine du Core (sinon : cadre vide) ; la connexion exige un sous-domaine du même site ou les réglages `cors` + cookies sécurisés (guide `docker/egen/README.md` du fork).

---

## 6 ter. Exemple réel, à froid et en local : EGEN Theme Studio (tweakcn)

Le fork `github.com/amourgit/Frontend-esm-tweakcn-fork` (branche `feature/civitas-egen`) est une application Next.js autonome (éditeur de thèmes) : cas **C3**, même chaîne que Penpot, plus simple (un seul service, `EGEN.md` dans le fork).

| Étape | Ce qui est fait | Vérifié |
| --- | --- | --- |
| 1. Adapter | `EGEN_FRAME_ANCESTORS` (lue à l'exécution, `middleware.ts`) → `Content-Security-Policy: frame-ancestors 'self' <origines>` ; vide = comportement amont | ✅ parseur testé (https / localhost seulement, pas d'identifiants) |
| 2. Enveloppe | `integrations/egen/esm-tweakcn-app` : `@civitas/esm-tweakcn-app` (route `theme-studio`, rail gauche, navigation) ; 24 tests, types, build | ✅ |
| 3. Release | tag `egen-app-v1.0.0` → CI → tarball de release | ✅ GitHub Actions |
| 4. Déclarer | `external-apps.json` : URL du tarball | ✅ |
| 5. Synchroniser | `yarn external:sync --strict` : `@civitas/esm-tweakcn-app@1.0.0 [hosted] : ok` | ✅ |
| 6. Configurer | `egen-config.json` : `{ "@civitas/esm-tweakcn-app": { "studioUrl": "http://localhost:3000" } }` | ✅ |
| 7. Local | tweakcn : `pnpm dev` avec `EGEN_FRAME_ANCESTORS=http://localhost:<port du Core>` ; Core : `yarn prepare:prod` puis `yarn start:prod` | ⛔ affichage navigateur non vérifié |

## 6 quater. Exemple réel, à froid et en local : Character Factory

Projet autonome `github.com/amourgit/egen-character-factory` (branche `feature/reforme-character`) : site **statique** (Vite, React, three-vrm), sans backend ni base : cas **C3**, le plus léger. L'ancienne app interne du Core a été retirée (réforme Character) ; le Core ne connaît que l'enveloppe.

| Étape | Ce qui est fait | Vérifié |
| --- | --- | --- |
| 1. Adapter | `CHARACTER_FRAME_ANCESTORS` → `Content-Security-Policy: frame-ancestors 'self' <origines>` calculé au démarrage de l'image nginx (`docker/15-egen-frame-ancestors.envsh`, `nginx.conf.template`) ; vide = aucun en-tête ; origine invalide = démarrage refusé | ✅ 6 cas + `nginx -t` + nginx réel (en-tête présent/absent) |
| 2. Enveloppe | `integrations/egen/esm-character-app` : `@civitas/esm-character-app` (route `character`, rail, navigation) ; 24 tests, types, build | ✅ |
| 3. Release | tag `egen-app-v1.0.0` → CI → tarball | ✅ GitHub Actions |
| 4. Déclarer / synchroniser | `external-apps.json`, `yarn external:sync --strict` | ✅ |
| 5. Configurer | `egen-config.json` : `characterUrl` (`http://localhost:5173` en local ; l'image Docker écoute sur 8080) | ✅ |
| 6. Local | Character : `npm run dev` ; Core : `yarn prepare:prod` puis `yarn start:prod` | ⛔ affichage navigateur non vérifié (WebGL) |

## 7. Choisir son scénario

| Situation | Scénario | Pourquoi |
| --- | --- | --- |
| On a le code, pas encore de paquet | A | seule voie reproductible depuis les sources |
| Le paquet est publié | B | le plus simple, intégrité vérifiée |
| L'app tourne déjà, on ne contrôle pas son build | C1 | aucune récupération de paquet ; surveiller la dérive |
| L'app est autonome (Next.js, SSR) | C3 | iframe + pont, sans Module Federation |
| Essai sur un poste | C2 / A2 | développement uniquement |
| Plusieurs entreprises, apps partagées | D | registre unique + catalogue |
| Cible Android/iOS | A ou B (hébergée) | le contenu doit être embarqué |

## 8. Diagnostic par étape

| Étape | Symptôme | Cause probable |
| --- | --- | --- |
| A4 / A6 | `Failed to download package from …: 404` | URL de release erronée ou dépôt privé |
| A6 | `egen assemble a échoué` | registre inaccessible, `.npmrc` absent, tarball sans `package.json` |
| A6 | `Routes file … does not exist` | `routes.json` absent de `dist/` : app sans page ni extension |
| A6 / A7 | `REJETÉE` + `containerDomId « … » inexistant` | conteneur absent du Shell ; corriger `routes.json` |
| A6 / A7 | `nom déjà utilisé par une app interne` | renommer l'app externe |
| A7 | `empreinte SHA-256 … différente du verrou` | fichier modifié après la synchro : relancer `yarn external:sync` |
| C1 | `le bundle distant doit être en https` | passer en https (ou `EGEN_EXTERNAL_ALLOW_HTTP=true` en test) |
| C1 | `dérive : le bundle distant … a changé` | le partenaire a redéployé : relancer la synchro après revue |
| A8 | la page **404** s'affiche en plein écran par-dessus (ou à la place de) l'app externe | Core antérieur à la détection dynamique de la 404 : `esm-not-found-app` listait les routes connues en dur. Mettre le Core à jour puis `yarn build:prod` (la 404 compare maintenant les pages enregistrées, internes et externes) |
| A8 | page vide, pas d'erreur | `routes.json` sans `route`/`routeRegex`, ou `frameworkRange` non satisfait (`console.warn` du Shell) |
| C3 | iframe vide | `frame-ancestors` / `X-Frame-Options` côté app, ou `frame-src` côté Core |

## 9. Limites connues et prochaines étapes

- ⛔ Une seule version par app au runtime (G6) ; ⛔ pas de découverte automatique (G2) ; ⛔ pas de source git directe ; ⛔ dépôt privé en tarball `https:` non supporté (utiliser un registre privé, B2).
- ✅ La configuration runtime en production est désormais possible (A10, `EGEN_CONFIG_FILE`) ; avant, `configUrls` était vide.
- 💡 À construire pour boucler D : `egen check-app` (G4, dans le Framework), format et résolveur de catalogue dans `sync-external-apps.mjs`, tests associés.
- 🟡 Jamais exécutés de bout en bout avec un Shell complet : A8, C2, C3 en navigateur réel, B2 sur registre privé.
