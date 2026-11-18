# 04 — Plan par phases (P0 à P10)

Ce document est le **pivot** du programme : il dit **quoi faire, dans quel ordre, avec quels critères de réussite**.
Les autres documents le soutiennent : le *pourquoi* est dans [01](01-CADRAGE.md) et [02](02-ETAT-DES-LIEUX.md), le
*pour chaque app* dans [03](03-CLASSIFICATION-APPS.md), le *comment coder* dans [06](06-GUIDE-DEVELOPPEUR.md), le
*comment prouver* dans [07](07-TESTS-ET-CI.md), le *quoi décider* dans [08](08-DECISIONS-ET-RISQUES.md).

## 0. Conventions d'exécution

| Règle | Contenu |
| --- | --- |
| Identifiant | `T<phase>.<n>` pour une tâche (ex. `T1.2`) ; `E-xx` pour un scénario de test ; `D-xx` décision ; `R-xx` risque ; `F-xx` constat ; `*-REQ-n` demande externe |
| Unité de travail | Une tâche = une PR, sauf mention contraire. Une PR ne mélange pas deux tâches |
| Branche | `feat/mp-<id>-<mot-clé>` (ex. `feat/mp-t1-2-check-platforms`) |
| Titre de PR | `feat(multiplateforme): T1.2 outil de vérification des plateformes` (types admis : `feat`, `fix`, `chore`, `docs`, `test` ; `refactor` est refusé par la CI) |
| « Fait » | Fusionné dans `main`, CI verte (principe P-9), suivi mis à jour dans la même PR |
| Version | Si le comportement **publié** d'une app change : incrémenter `version` de **cette app** dans son `package.json` (patch pour correctif, minor pour ajout compatible, major pour rupture) **et** ajouter `.changeset/<nom-court>.md` au format des notes existantes (`D-19`). Sans incrément, la publication est ignorée |
| Critère d'acceptation | Toujours une **commande** et un **résultat attendu** : pas de « vérifié visuellement » |
| Échecs préexistants | La baseline de T0.4 peut révéler des **échecs de tests/typecheck antérieurs** (le suivi de la réforme TopBar en signale). Dans ce cas, tout critère « `yarn verify` code 0 » se lit **« aucun échec nouveau par rapport à `BASELINE.md` »** ; la liste des échecs préexistants y est consignée |
| Dérogation | Toute désactivation de règle (`eslint-disable`, `test.fail`, app laissée `["web"]`) est inscrite dans [08](08-DECISIONS-ET-RISQUES.md) avec sa raison et sa date de réexamen |

### Ordre et dépendances

```
P0 ─► P1 ─┬─► P2 ───────────────┐
          │                      ├─► P6 (vagues 1→5) ─► P7 ─► P8 ─► P9 ─► P10
          └─► P3 ─┬─► P4 ───────┤
                  └─► P5 ───────┘
```

- **Chemin critique** : P0 → P1 → P3 → P4 → P6 → P8 → P9.
- **En parallèle possible** : P2 avec P3 ; P5 avec P4 ; P7 démarre quand la vague 4 de P6 est terminée.
- **Bloquants externes** : `BE-REQ-1` (contrat) bloque le **début** de P4 ; `HOST-REQ-*` et `egen-mobile` bloquent P9.

### Calendrier indicatif (à réviser après P0)

| Phase | Taille | Jours-développeur | Hypothèse principale |
| --- | --- | --- | --- |
| P0 | S | 1,5 | Aucun conflit de dépendances à la montée de version |
| P1 | M | 3,5 | Le schéma du framework valide les 26 fichiers sans correction |
| P2 | M | 3,5 | Les règles ESLint ne produisent pas de faux positifs ingérables |
| P3 | L | 6,5 | `egen build --platform` fonctionne depuis le core sans contournement |
| P4 | L | 8 | Le contrat backend est validé avant le début |
| P5 | M | 5 | ≈ 100 images de démonstration, remplaçables par avatars/visuels légers |
| P6 | XL | 16 | 13 apps ; vagues 1-5 ; peu d'imprévus |
| P7 | L | 10 | Pas de refonte complète de la barre supérieure |
| P8 | M | 4 | `egen-distributions` n'impose pas de format différent |
| P9 | L | 8 | Appareils et Host disponibles |
| **Total P0–P8** | | **≈ 58** | **≈ 12 semaines pour 1 développeur, ≈ 7-8 semaines pour 2** |

Ces chiffres sont des **ordres de grandeur**, pas des engagements. L'écart d'estimation est surtout porté par P4
(contrat backend), P6 (nombre d'imprévus) et P7 (ampleur de l'adaptation mobile).

---

## P0 — Fondations et alignement

**Objectif** : partir d'une base saine et mesurée, avant de changer le moindre comportement.

**Pourquoi** : le core utilise des versions du framework qui n'ont ni les capacités natives, ni le schéma de routes, ni
l'estampillage de compatibilité (F-20) ; les plages `peerDependencies` ne reflètent pas la réalité (F-11) ; le mécanisme de
version est manuel et peut faire oublier une publication (F-23) ; la documentation d'instruction décrit une structure
disparue (F-17) ; rien n'est mesuré (aucune baseline).

**Prérequis** : aucun.

### T0.1 — Aligner les dépendances `@egen-civitas/*` sur les dernières versions publiées

- **Étapes**
  1. `yarn deps:egen:check` : constater les écarts (attendu : ceux du tableau §3.1 de [02](02-ETAT-DES-LIEUX.md)).
  2. `yarn deps:egen` (réécrit les plages dans les `package.json` et met à jour `yarn.lock`).
  3. Vérifier que les **planchers** suivants sont respectés dans le `package.json` racine (`devDependencies` et
     `resolutions`) et dans chaque app (`dependencies`) : `esm-app-shell ^2.11.1`, `rspack-config ^1.2.0`, `esm-routes ^1.3.0`,
     `esm-globals ^2.4.0`, `esm-tenant ^1.1.0`, `esm-api ^3.0.1`, `esm-styleguide ^4.1.0`, `esm-framework ^4.1.0`, `egen ^2.3.0`.
  4. `yarn install`, `yarn build`, `yarn verify`.
  5. Incrémenter `version` (patch) des 26 apps ; **une seule** note `.changeset/alignement-framework-2026-11.md` listant les 26.
- **Fichiers** : `package.json` (racine), `packages/apps/*/package.json`, `yarn.lock`, `.changeset/`.
- **Critère de fin** : `yarn deps:egen:check` sort avec le code 0 ; `yarn install --immutable` passe ; `yarn build` et
  `yarn verify` verts ; le test de fumée Web ci-dessous passe.
- **Test de fumée Web (obligatoire, principe P-1)** : `yarn build:prod && yarn start:prod`, puis
  `curl -s http://localhost:<port>/egen-civitas/spa/importmap.json | jq '.imports | length'` → **au moins 26 entrées d'app** ;
  `curl -s .../routes.registry.json | jq 'keys | length'` → **26** ; la page de connexion s'affiche (relevé manuel unique,
  consigné dans `BASELINE.md`).

### T0.2 — Corriger la plage de compatibilité déclarée (`peerDependencies`)

- **Constat traité** : F-11 — 26/26 apps déclarent `@egen-civitas/esm-framework` en peer `>=3.0.0`.
- **Règle** (`D-17`) : le peer `@egen-civitas/esm-framework` de **chaque** app vaut `^4.1.0`. Le framework estampille cette
  plage (et **elle seule**) dans le `routes.json` publié (`frameworkRange`) ; le shell écarte au démarrage une app dont la plage
  n'est pas satisfaite par sa version du framework. Les autres peers ne sont pas utilisés pour ce mécanisme et sont conservés.
- **Étapes** : modifier la ligne dans les 26 `package.json` ; `yarn install` ; `yarn build:apps`.
- **Critère de fin** : `for f in packages/apps/*/dist/routes.json; do jq -r .frameworkRange $f; done | sort -u` → exactement
  **`^4.1.0`** ; aucune app sans `frameworkRange`.
- **Effet attendu** : une app du core ne peut plus être chargée par un shell dont le framework est en 3.x ou en 5.x.

### T0.3 — Écrire la politique de version et de publication, et la rendre vérifiable

- **Contenu à écrire** (section « Publier une app » dans le `README.md` racine, avec renvoi vers [08](08-DECISIONS-ET-RISQUES.md)) :
  versions **indépendantes** par app (`D-02`), noms `@egen/*-app` **inchangés** (`D-03`), règle de montée (patch/minor/major),
  règle « pas d'incrément = pas de publication », rôle de `.changeset/` (notes sans outil, `D-19`).
- **Outil** : `tools/check-version-bump.mjs` — pour une PR, compare la branche à `origin/main` : pour chaque dossier
  `packages/apps/<x>/` dont des fichiers de `src/` ou `package.json` (hors `version`) changent, vérifie que `version` a changé.
  Sortie : liste des apps concernées ; code de sortie **0** (informatif) tant que le job est marqué informatif, **1** une fois
  rendu obligatoire (décision à prendre à la fin de P1).
- **Critère de fin** : test `node --test tools/check-version-bump.test.mjs` avec un dépôt Git de fixture (trois cas : version
  changée, non changée, aucun changement d'app) ; job CI « Contrôle de version (informatif) » visible sur une PR de test.

### T0.4 — Mesurer la baseline

- **Livrable** : `docs/multiplateforme/BASELINE.md`, avec **pour chaque ligne la commande et le résultat** :
  durée de `yarn install` (cache froid), de `yarn build` (cache Turbo froid et chaud), de `yarn verify` ; nombre de fichiers de test
  (89 attendu) et nombre de tests passés ; poids de `dist/egen-<app>.js` par app (non compressé et gzip) ; sortie de
  `node tools/inventory-dist.mjs` du **shell Web** (à copier depuis le framework, voir T3.5) ; version de Node et de Yarn ;
  commit mesuré.
- **Critère de fin** : le fichier existe, contient le commit mesuré et au moins les 6 familles de mesures ci-dessus.
- **Usage** : toute PR ultérieure qui augmente le poids de l'artefact natif de plus de **10 %** par rapport à la baseline
  doit être justifiée (`D-10`).

### T0.5 — Remettre la documentation d'instruction à l'état réel

- **`.github/copilot-instructions.md`** : réécrire la section « structure du dépôt » (le framework n'est plus dans ce dépôt :
  seul `packages/apps/*` existe ; il se consomme par npm). Ce fichier est dans `tools/shared-paths.txt` : la modification se
  propage aux dépôts jumeaux par la synchronisation (voir R-10) ; la préparer comme **une PR dédiée** avec la mention
  « à synchroniser ».
- **`docs/analyse-auth-session.md`** : ajouter en tête un bandeau « Historique — les paquets `@egen/esm-*` du framework sont
  devenus `@egen-civitas/*` ; la référence actuelle pour le natif est `docs/multiplateforme/05-CONTRAT-SESSION-LOGIN.md` ».
- **`docs/analyse-esm-tenant.md`** : même bandeau.
- **`README.md`** (racine) : la section « Multiplateforme » (liens vers `docs/multiplateforme/README.md` et `docs/SUIVI-MULTIPLATEFORME.md`) est **déjà
  ajoutée** par la livraison de cette documentation ; rien à faire.
- **Critère de fin** : `grep -n "packages/framework\|packages/shell\|packages/tooling" .github/copilot-instructions.md` ne
  renvoie plus de description de répertoires inexistants ; le lien du README racine résout.

### Livrables de P0

Dépendances alignées et vérifiées ; plage de compatibilité exacte dans les 26 apps ; politique de version écrite et contrôlée ;
`BASELINE.md` ; documentation d'instruction corrigée.

### Critères d'acceptation de P0 (tous obligatoires)

| # | Commande | Résultat attendu |
| --- | --- | --- |
| 1 | `yarn deps:egen:check` | code 0 |
| 2 | `yarn install --immutable && yarn build && yarn verify` | code 0 |
| 3 | `for f in packages/apps/*/dist/routes.json; do jq -r .frameworkRange $f; done \| sort -u` | une seule ligne : `^4.1.0` |
| 4 | Test de fumée Web de T0.1 | ≥ 26 entrées d'import map ; 26 routes ; page de connexion affichée |
| 5 | `test -f docs/multiplateforme/BASELINE.md` | existe, commit mesuré renseigné |

### Résultats attendus

Le core consomme le framework **à jour** ; **aucun comportement Web n'a changé** ; on sait chiffrer la suite (durées, poids).

### Risques et parades

| Risque | Parade |
| --- | --- |
| La montée du shell en 2.11 change un comportement Web | Test de fumée Web + exécution des 89 fichiers de test ; si un test casse, corriger **dans le core** ou remonter au framework (`FW-REQ`), jamais contourner silencieusement |
| Conflit de résolution Yarn après `deps:egen` | Revenir au dernier `yarn.lock`, monter les paquets un par un, consigner la cause |
| Oubli d'incrément de version | T0.3 |

---

## P1 — Contrat de plateforme des apps

**Objectif** : chaque app **déclare** sur quelles cibles elle tourne, et un outil **vérifie** cette déclaration à chaque PR.

**Pourquoi** : aujourd'hui aucune `routes.json` ne contient `platforms` (F-16, §2 de [02](02-ETAT-DES-LIEUX.md)). Sans déclaration,
le framework considère l'app éligible **partout** ; une app non adaptée serait enregistrée en natif et planterait.

**Prérequis** : P0.

### T1.1 — Créer la matrice de classification

- **Livrable** : `tools/platform-matrix.json`, **copie exacte** du bloc JSON de [03](03-CLASSIFICATION-APPS.md) §3, avec en plus,
  pour chacune des 19 apps A et B, `"nativePending": true`.
- **Critère de fin** : `jq '.apps | length' tools/platform-matrix.json` → **26** ; `jq '[.apps[] | select(.nativePending)] | length'` → **19**.

### T1.2 — Écrire `tools/check-platforms.mjs`

- **Entrées** : `tools/platform-matrix.json`, `packages/apps/*/src/routes.json`, `packages/apps/*/package.json`,
  le schéma `@egen-civitas/esm-routes/routes.schema.json` (export publié par `esm-routes` ≥ 1.3.0).
- **Contrôles** (chacun a un code stable) :

| Code | Règle | Message en cas d'échec |
| --- | --- | --- |
| `PLAT-001` | Toute app de `packages/apps/` figure dans la matrice, et réciproquement | « app absente de la matrice : … » |
| `PLAT-002` | `routes.json` est du JSON valide **et** valide contre le schéma du framework | « routes.json invalide : <chemin> <message> » |
| `PLAT-003` | `platforms` est présent, non vide, sans doublon, avec des valeurs dans `web`, `android`, `ios` | « platforms manquant ou invalide » |
| `PLAT-004` | Si `nativePending` vaut `true` : `platforms` vaut exactement `["web"]`. Sinon : `platforms` est égal à la valeur cible de la matrice | « platforms ≠ matrice (attendu … trouvé …) » |
| `PLAT-005` | `requiredCapabilities` est égal à la matrice et ses éléments appartiennent à `session`, `secureStorage`, `openExternal`, `lifecycle`, `permissions`, `files`, `camera`, `push`, `biometric` | « requiredCapabilities ≠ matrice » |
| `PLAT-006` | Une app de catégorie C ou D n'a jamais `android` ni `ios` dans `platforms` | « app web seulement déclarée native » |
| `PLAT-007` | Le peer `@egen-civitas/esm-framework` de l'app est `^4.1.0` (valeur du plancher, lue dans la matrice : champ `frameworkPeer`) | « peer esm-framework ≠ plancher » |

- **Options** : `--json` (sortie machine), `--app <nom>` (une seule app).
- **Code de sortie** : `0` si aucune erreur, `1` sinon. Toutes les erreurs sont listées avant de sortir.
- **Critère de fin** : `node tools/check-platforms.mjs` → code 1 **avant** T1.4 (messages `PLAT-003`), code 0 **après**.

### T1.3 — Écrire `tools/list-apps.mjs`

- **Usage** : `node tools/list-apps.mjs --platform <web|android|ios> [--production] [--names|--json]`.
- **Sémantique** : liste les apps dont `routes.json` contient la plateforme demandée (**la vérité d'exécution**, pas la matrice).
  `--production` exclut les apps de catégorie D (lue dans la matrice). `--names` : un nom de paquet par ligne ;
  `--json` : tableau d'objets `{ name, dir, version, category }`.
- **Critère de fin** : après T1.4, `node tools/list-apps.mjs --platform web --production --names | wc -l` → **23** (26 moins les 3
  apps D) ; `--platform android` → **0** (aucune app n'est encore native : toutes sont `nativePending`).

### T1.4 — Déclarer `platforms` et `requiredCapabilities` dans les 26 `routes.json`

- **Règle** : valeur initiale de `platforms` = `["web"]` pour **les 26** apps (règle de transition de [03](03-CLASSIFICATION-APPS.md) §1).
  Ajouter `"requiredCapabilities": ["session"]` à `esm-login-app` **uniquement** (valeur neutre en Web, la capacité `session` y existe).
- **Critère de fin** : `node tools/check-platforms.mjs` → code 0 ; `yarn build:apps` vert ; **les 89 fichiers de test** verts ;
  test de fumée Web de T0.1 inchangé (**aucun changement de comportement Web** : `["web"]` est la cible implicite d'avant).

### T1.5 — Brancher la vérification dans `yarn verify` et la CI

- Ajouter le script `"verify:platforms": "node tools/check-platforms.mjs"` et l'enchaîner dans `verify`
  (`... && yarn verify:platforms && turbo run lint test typescript`).
- Écrire `node --test tools/check-platforms.test.mjs` : une fixture par code `PLAT-001` à `PLAT-007` (un cas qui échoue, un qui passe).
- **Critère de fin** : le job « Build & verify » exécute `verify:platforms` ; une PR de test qui retire `platforms` d'une app
  échoue avec `PLAT-003`.

### T1.6 — Mettre à jour `tools/scaffold-app.py`

- Une nouvelle app générée reçoit `"platforms": ["web"]`, une entrée dans `tools/platform-matrix.json` (catégorie demandée par
  l'argument `--category`, **obligatoire**, valeurs `A`, `B`, `C`, `D`), et le peer `^4.1.0`.
- **Critère de fin** : générer une app de test ; `node tools/check-platforms.mjs` → code 0 ; supprimer l'app de test.

### Livrables de P1

Matrice ; `check-platforms` et `list-apps` testés ; 26 `routes.json` déclarés ; vérification obligatoire en CI ; générateur à jour.

### Critères d'acceptation de P1

| # | Commande | Résultat attendu |
| --- | --- | --- |
| 1 | `node tools/check-platforms.mjs` | code 0 |
| 2 | `node --test tools/check-platforms.test.mjs tools/check-version-bump.test.mjs` | tous verts |
| 3 | `node tools/list-apps.mjs --platform web --production --names \| wc -l` | 23 |
| 4 | `node tools/list-apps.mjs --platform android --names \| wc -l` | 0 |
| 5 | `yarn verify` | code 0, inclut `verify:platforms` |
| 6 | Test de fumée Web | identique à P0 |

### Résultats attendus

Le **contrat est explicite et gardé** : on ne peut plus ajouter une app sans décision de plateforme, ni déclarer native une app
classée « web seulement ». Aucun changement de comportement pour l'utilisateur final.

### Risques et parades

| Risque | Parade |
| --- | --- |
| Le schéma du framework rejette un `routes.json` existant | Corriger le `routes.json` (champ invalide) ; si le schéma est trop strict, ouvrir une demande au framework, ne pas affaiblir l'outil |
| L'outil gèle une app « en cours » | Le champ `nativePending` est le seul mécanisme de transition ; pas de contournement |

---

## P2 — Règles de code et garde-fous automatiques

**Objectif** : que **le code interdit en natif soit refusé automatiquement**, sans dépendre de la vigilance des relecteurs.

**Pourquoi** : les problèmes de F-04, F-06 et du stockage de secrets sont des **motifs de code reconnaissables** (affectation à
`location.href`, `target="_blank"`, `localStorage` avec un nom de jeton, `window.open`…). Les détecter par lint est peu coûteux et
évite les régressions pendant toute la durée du programme.

**Prérequis** : P1 (la matrice sert à doser la sévérité).

### T2.1 — Configuration ESLint « native-safe »

- **Où** : nouveau fichier `packages/apps/.eslintrc.cjs` (configuration **en cascade** : s'applique aux fichiers sous
  `packages/apps/`, fusionnée avec le `.eslintrc` racine). Il n'est **pas** dans `tools/shared-paths.txt` : il ne se propage donc
  pas aux dépôts jumeaux (`D-11`, R-10). Il lit `tools/platform-matrix.json` ; si ce fichier est absent, il n'active **aucune** règle.
- **Règles** (toutes via `no-restricted-syntax` / `no-restricted-imports`, avec ces sélecteurs exacts ; le message cite la section du guide [06](06-GUIDE-DEVELOPPEUR.md)) :

| ID | Motif interdit | Sélecteur ESLint | Gravité |
| --- | --- | --- | --- |
| N-01 | `window.open(...)` | `CallExpression[callee.object.name='window'][callee.property.name='open']` | erreur |
| N-02 | `document.cookie` | `MemberExpression[object.name='document'][property.name='cookie']` | erreur |
| N-03 | Affectation à `location.href` / `window.location` ; `location.assign()` / `location.replace()` | `AssignmentExpression[left.property.name='href'][left.object.property.name='location']`, `AssignmentExpression[left.object.name='window'][left.property.name='location']`, `CallExpression[callee.object.property.name='location'][callee.property.name=/^(assign\|replace)$/]` | erreur |
| N-04 | Lien externe brut (le message renvoie à `ExternalLink`, [06](06-GUIDE-DEVELOPPEUR.md) §3.1) | `JSXAttribute[name.name='target'][value.value='_blank']` | erreur |
| N-05 | Stockage navigateur d'un nom évoquant un secret | `CallExpression[callee.object.name=/^(localStorage\|sessionStorage)$/][arguments.0.value=/(token\|secret\|passw\|jwt\|credential\|authoriz)/i]` | erreur |
| N-06 | Détection par User-Agent | `MemberExpression[object.name='navigator'][property.name='userAgent']` | erreur |
| N-07 | Import d'une enveloppe native | `no-restricted-imports` avec `patterns: ['@capacitor/*', 'cordova*']` | erreur |
| N-08 | `new Notification(...)`, `Notification.requestPermission()` | `NewExpression[callee.name='Notification']`, `CallExpression[callee.object.name='Notification']` | erreur (la capacité `push` relève de P10) |
| N-09 | `src` d'élément média avec URL absolue littérale | `JSXAttribute[name.name='src'][value.value=/^https?:\/\//]` | erreur |
| N-10 | `href` de chemin absolu à la racine | `JSXAttribute[name.name='href'][value.value=/^\/(?!\/)/]` | avertissement |

- **Dosage de la sévérité** : pour une app avec `nativePending: true` (matrice), les règles sont en **avertissement** ; pour une app
  `nativePending: false`, en **erreur** ; pour une app de catégorie C ou D, **désactivées**. Ainsi le lint reste vert pendant la
  migration et devient bloquant app par app (`D-18`).
- **Critère de fin** : `yarn lint` vert ; `yarn lint --max-warnings=9999` produit des avertissements N-0x pour les motifs connus de
  [02](02-ETAT-DES-LIEUX.md) §8-9 (au moins 14 pour N-04, 2 pour N-03).

### T2.2 — Contrôle des ressources distantes `tools/check-remote-assets.mjs`

- **Pourquoi un outil séparé** : les URL d'images sont dans des **fichiers de données** (`*.data.ts`, `*-mock-data.ts`) où ESLint
  ne sait pas distinguer un lien d'une ressource.
- **Fonctionnement** : parcourt `packages/apps/<app>/src/**/*.{ts,tsx,scss,css,json}` (hors tests) des apps de catégorie A et B et
  relève toute URL `http(s)://hôte/...`. Un hôte est **autorisé** s'il figure dans `tools/remote-hosts-allowlist.json` (liens
  sortants et espaces de noms légitimes ; **jamais** un hôte d'images, de polices ou de scripts). Liste **initiale** :
  `egen.alpha.vercel.com` (champ `$schema` des `routes.json`), `www.w3.org` (espace de noms SVG), `teams.live.com`, `github.com`,
  `linkedin.com`, `youtube.com`, `civitas-africa.vercel.app` (liens sortants). Sinon : erreur
  `ASSET-001 « ressource distante : <hôte> dans <fichier>:<ligne> »`.
- **Sévérité** : avertissement si l'app est `nativePending`, erreur sinon (même règle que T2.1).
- **Critère de fin** : sur le dépôt actuel, `node tools/check-remote-assets.mjs --json | jq '.findings | length'` = **151** au
  2026-11-15 (128 `images.unsplash.com`, 16 `picsum.photos`, 6 `cdn.21st.dev`, 1 `prod.spline.design` : [02](02-ETAT-DES-LIEUX.md) §9) ;
  le critère **robuste** est ≥ 100 (le nombre exact évolue avec le code) ; code de sortie 0 (tout est en avertissement).

### T2.3 — Tester les garde-fous eux-mêmes

- `node --test tools/eslint-native-rules.test.mjs` : avec l'API Node d'ESLint (`lintText`), pour **chaque** règle N-01 à N-10 :
  un extrait **fautif** (la règle se déclenche avec le bon `ruleId`), un extrait **conforme** (silence), et le même extrait fautif
  placé dans une app de catégorie C → **silence**.
- `node --test tools/check-remote-assets.test.mjs` : hôte interdit → `ASSET-001` ; hôte autorisé → silence ; app C → ignorée.
- **Critère de fin** : les deux suites vertes ; branchées dans `verify` (`node --test tools/*.test.mjs`).

### T2.4 — Mettre à jour le modèle de PR

- Ajouter à `.github/pull_request_template.md` une section « Multiplateforme » avec les cases : « Aucun motif interdit par
  [06](06-GUIDE-DEVELOPPEUR.md) » ; « Comportement Web inchangé (test nommé) » ; « `version` de l'app incrémentée si son
  comportement change » ; « Matrice et `routes.json` à jour ». Ce fichier est partagé avec les jumeaux (R-10) : préparer en PR
  dédiée « à synchroniser ».
- **Critère de fin** : une PR de test affiche les nouvelles cases.

### T2.5 — Composant `ExternalLink` de référence et contrôle des copies

- **Pourquoi** : en Web, `navigate({ to: 'https://…' })` fait `window.location.assign` : il **quitte le SPA dans le même onglet**. Remplacer un
  `<a target="_blank">` par `ConfigurableLink` changerait donc le comportement Web (violation de P-1). Il faut un composant qui **garde le Web à
  l'identique** et envoie le lien au Host en natif. 7 apps en ont besoin (`footer`, `help-menu`, `login`, `home`, `primary-navigation`, `informations`,
  `ai-assistant`) : la demande `FW-REQ-7` centralisera ce composant dans le framework ; **en attendant**, copie locale identique (`D-07`).
- **Composant de référence** (créé dans `esm-footer-app/src/components/external-link/external-link.component.tsx`) :

```tsx
// SHARED: ExternalLink v1 — copie identique dans chaque app ; remplacer par l'export du framework quand FW-REQ-7 sera livrée
import React, { type AnchorHTMLAttributes, type PropsWithChildren } from 'react';
import { isNativePlatform, navigate } from '@egen-civitas/esm-framework';

type Props = PropsWithChildren<{ to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick' | 'target'>>;

export function ExternalLink({ to, children, ...rest }: Props) {
  if (!isNativePlatform()) {
    // Web : strictement le lien d'origine (nouvel onglet, sans accès à window.opener)
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  // Natif : le clic passe par navigate(), qui confie l'URL au Host (capacité openExternal)
  return (
    <a
      href={to}
      {...rest}
      onClick={(event) => {
        event.preventDefault();
        navigate({ to });
      }}
    >
      {children}
    </a>
  );
}
```

- **Tests** (dans le même dossier) : **Web** (sans `window.egenTarget`) : l'élément porte `target="_blank"` et `rel="noopener noreferrer"`, le clic **n'appelle pas** `navigate` ;
  **natif** (`window.egenTarget = 'android'`) : le clic appelle `preventDefault` et `navigate({ to })` **une fois** ; les propriétés `className`, `aria-label`, `data-*` sont transmises ;
  le texte du lien est rendu.
- **Outil `tools/check-shared-copies.mjs`** : repère, dans `packages/apps/**`, les fichiers dont la **première ligne** commence par `// SHARED: <nom> v<n>` ; regroupe par `<nom> v<n>` ;
  exige que tous les fichiers d'un groupe aient un **contenu identique** (empreinte SHA-256) ; code `SHARED-001` sinon, avec la liste des copies divergentes. Test `node --test`
  avec une fixture (copies identiques / divergentes / marqueur seul). Branché dans `yarn verify`.
- **Critère de fin** : tests du composant verts (Web et natif) ; `node tools/check-shared-copies.mjs` → code 0 ; la fixture divergente donne `SHARED-001`.

### Livrables de P2

Configuration ESLint en cascade ; outil de ressources distantes ; composant `ExternalLink` de référence et contrôle des copies ; leurs tests ; modèle de PR ; [06](06-GUIDE-DEVELOPPEUR.md) en vigueur.

### Critères d'acceptation de P2

| # | Commande | Résultat attendu |
| --- | --- | --- |
| 1 | `node --test tools/eslint-native-rules.test.mjs tools/check-remote-assets.test.mjs` | tous verts |
| 2 | `yarn verify` | code 0 |
| 3 | `yarn lint --max-warnings=9999 \| grep -c "N-04"` | ≥ 14 |
| 4 | `node tools/check-remote-assets.mjs --json \| jq '.findings\|length'` | ≥ 100 |
| 5 | `node tools/check-shared-copies.mjs && yarn workspace @egen/esm-footer-app test` | code 0 ; tests `ExternalLink` Web et natif verts |

### Résultats attendus

Les motifs interdits sont **visibles** (avertissements) dès maintenant et deviennent **bloquants** app par app. Aucun nouveau
motif interdit ne peut entrer dans une app déjà migrée.

### Risques et parades

| Risque | Parade |
| --- | --- |
| Faux positifs de N-05 (nom de clé anodin contenant « auth ») | Le sélecteur ne vise que les **littéraux** passés à `localStorage` ; en cas de faux positif légitime : renommer la clé (préférable) ou dérogation inscrite dans [08](08-DECISIONS-ET-RISQUES.md) |
| ESLint en cascade non pris en compte par l'éditeur | Vérifier dans la CI (`yarn lint`) ; documenter dans [06](06-GUIDE-DEVELOPPEUR.md) |

---

## P3 — Banc de test natif simulé

**Objectif** : construire un **artefact natif du core** et le faire tourner en CI contre un **faux Host**, afin de prouver chaque
changement des phases suivantes **sans appareil**.

**Pourquoi** : sans banc, chaque adaptation ne se vérifierait qu'à la main ou sur appareil (P9, tardif). Le framework a déjà
prouvé le principe pour son shell (9 scénarios, `createMockHost`) ; le core doit faire de même **avec ses vraies apps** (F-19).

**Prérequis** : P1 (`list-apps`, matrice).

**Nature de l'artefact** : un **artefact d'essai** (`D-20`), jamais publié ni livré. L'artefact officiel d'un produit est fabriqué
par `egen-distributions`. Le core ne fait que **construire à l'identique, en miniature**, ce que la distribution fera.

### T3.1 — `tools/build-native-preview.mjs`

- **Usage** : `node tools/build-native-preview.mjs [--platform android|ios|web] [--candidates|--strict] [--skip-apps-build] [--out <dossier>]`
  (défauts : `--platform android`, `--candidates`, sortie `e2e-native/.artifact/<platform>`). `--platform web` construit **l'artefact Web du même
  build** (chemin public `/egen-civitas/spa/`, API relative `/egen`, **sans** cible native ni CSP) : il sert aux scénarios de non-régression Web E-90 à E-94.
- **Sélection des apps**
  - `--candidates` (défaut) : toutes les apps de catégorie **A et B** de la matrice, **même si** leur `routes.json` dit `["web"]`
    (`nativePending`). Sert à valider les apps **avant** de les déclarer natives.
  - `--strict` : seulement `node tools/list-apps.mjs --platform <p> --production`. Sert à valider **l'état déclaré réel**.
- **Étapes**
  1. Sauf `--skip-apps-build` : `yarn build:apps`.
  2. Créer `e2e-native/.staging/` ; pour chaque app retenue, copier `packages/apps/<dir>/dist/` vers `.staging/apps/<dir>/`.
     En mode `--candidates`, réécrire `.staging/apps/<dir>/routes.json` pour que `platforms` contienne la plateforme demandée.
  3. Écrire `.staging/importmap.json` : `{ "imports": { "<nom du paquet>": "/app/apps/<dir>/<fichier du champ browser>" } }`.
  4. Écrire `.staging/routes.registry.json` : `{ "<nom du paquet>": <contenu du routes.json estampillé> }` (avec `version` et `frameworkRange`).
  5. Construire le shell : `yarn egen build --platform <p> --env production --api-url https://api.test.local --spa-path /app/ --importmap .staging/importmap.json --routes .staging/routes.registry.json --target <out>`
     avec `EGEN_TENANT_MODE=single` et `EGEN_TENANT_ID=test` (le tenant natif est fixé au build, `D-09`). Pour `--platform web` : `--spa-path /egen-civitas/spa/`, `--api-url /egen`, et les entrées d'import map pointent vers `/egen-civitas/spa/apps/<dir>/…`.
  6. Copier `.staging/apps/` dans `<out>/apps/`.
  7. Afficher : nombre d'apps, nombre de fichiers, poids total (voir T3.5).
- **Contraintes** : le build échoue (comme en distribution réelle) si une règle native du framework est violée ; **aucun** correctif
  n'est appliqué par l'outil sur le code des apps.
- **Critère de fin** : `node tools/build-native-preview.mjs` produit `e2e-native/.artifact/android/index.html` contenant une CSP et
  `window.egenTarget = 'android'` (dans `bootstrap-head.<hash>.js`), et `jq '.imports|length'` de l'import map vaut **19**.

### T3.2 — Squelette du banc `e2e-native/`

- **Arborescence**

```
e2e-native/
  playwright.config.mjs      # 1 worker, pas de nouvelle tentative, reporter 'github' en CI
  support/
    static-server.mjs        # sert <out> sous /app avec repli SPA ; journalise les requêtes
    mock-host.mjs            # lit @egen-civitas/esm-platform/dist/testing/mock-host.js (createMockHost, jamais copié)
    session-host.mjs         # gestionnaires session.* (getAuthorization, refresh, setTokens, clear) ; état dans window.__host
    api-mock.mjs             # interception de https://api.test.local/** selon les fixtures de 05-CONTRAT-SESSION-LOGIN.md
    probes.mjs               # violations de CSP, requêtes hors origine, pageerror, erreurs console
  specs/                     # un fichier par famille de scénarios (voir 07)
  .artifact/                 # (ignoré par Git) sortie de build-native-preview
  .staging/                  # (ignoré par Git)
```

- **Scripts** (`package.json` racine) : `"build:native-preview": "node tools/build-native-preview.mjs"`,
  `"e2e:native": "playwright test --config e2e-native/playwright.config.mjs"`. Ajouter `e2e-native/.artifact/` et
  `e2e-native/.staging/` à `.gitignore`. Ajouter `@egen-civitas/esm-platform` en `devDependency` du racine (il est déjà présent
  par transitivité ; le rendre explicite évite une rupture de résolution).
- **Poste sans accès au CDN de Playwright** : variable `EGEN_E2E_CHROMIUM=<chemin d'un Chromium>` (recette : `npm i @sparticuz/chromium
  playwright-core`, puis passer `chromium.executablePath()`), prise en compte dans la configuration.
- **Critère de fin** : `yarn e2e:native` s'exécute (même avec 0 test métier) et un test témoin « la page d'index répond 200 » passe.

### T3.3 — Premiers scénarios (voir le catalogue dans [07](07-TESTS-ET-CI.md))

Écrire et faire passer : **E-01** (démarrage sans 404 ni requête hors origine), **E-03** (la base `/app` est respectée), **E-04** (aucune
violation de CSP), **E-06** (Host incompatible → écran bloquant, aucune app enregistrée), **E-07** (filtrage : les apps C/D sont
absentes, les apps A/B présentes), **E-20** (fumée : **chacune** des 19 apps A/B est enregistrée et son extension ou sa page se rend ;
un test paramétré par app), **E-90** (non-régression Web : l'artefact Web du même build démarre sans Host).

**Mécanisme des échecs connus** : les scénarios qui détectent un problème **déjà constaté** (E-02 images distantes, E-05
WebSocket) sont écrits dès maintenant avec `test.fail(true, '<F-xx> → <tâche>')`. Tant que le défaut existe, le test « échoue » comme
prévu et la suite reste verte ; **dès que le défaut est corrigé, le test devient rouge** (il passe alors qu'on le déclarait en
échec), ce qui **oblige** à retirer l'annotation dans la PR qui corrige. Chaque annotation `test.fail` référence une tâche.

- **Critère de fin** : `yarn build:native-preview && yarn e2e:native` → vert ; la liste des `test.fail` correspond exactement aux
  constats F-02/F-04/F-21 encore ouverts.

### T3.4 — Job CI `e2e-native`

- Nouveau job dans `.github/workflows/ci.yml` (à côté de « Build & verify », qu'il n'alourdit pas) : `yarn install --immutable` →
  `yarn build` → `yarn build:native-preview --skip-apps-build` → `yarn playwright install --with-deps chromium` → `yarn e2e:native`.
- Sur échec : téléverser `e2e-native/test-results` (captures et traces).
- **Budget de temps** : ≤ 20 minutes. Au-delà, scinder en deux jobs (build, test) avec transfert d'artefact.
- **Critère de fin** : le job est vert sur `main` et visible comme **vérification requise** de la protection de branche (décision du responsable).

### T3.5 — Mesurer l'artefact natif

- Copier `tools/inventory-dist.mjs` depuis le framework (`Frontend-esm-framework/scripts/inventory-dist.mjs`, copie locale assumée,
  `D-07` ; marquer `// SHARED: copie du framework, à supprimer si le framework le publie`).
- Ajouter à `BASELINE.md` la section « Artefact natif d'essai » : total, répartition par type, plus gros fichiers, avec le commit.
- **Critère de fin** : `node tools/inventory-dist.mjs e2e-native/.artifact/android` affiche le total et la répartition ; la valeur est
  consignée comme **baseline native**.

### Livrables de P3

Outil de construction d'artefact ; banc Playwright ; scénarios de base ; job CI ; baseline native.

### Critères d'acceptation de P3

| # | Commande | Résultat attendu |
| --- | --- | --- |
| 1 | `yarn build:native-preview` | code 0 ; import map de 19 apps |
| 2 | `yarn e2e:native` | tous les scénarios verts ; `test.fail` listés = constats ouverts |
| 3 | `grep -c "test.fail" e2e-native/specs/*.mjs` | chaque occurrence référence une tâche (relecture) |
| 4 | Job CI `e2e-native` sur une PR | vert, ≤ 20 min |
| 5 | `node tools/inventory-dist.mjs e2e-native/.artifact/android` | total consigné dans `BASELINE.md` |

### Résultats attendus

On peut dire, **avant tout changement d'app**, ce qui est cassé en natif (la liste des `test.fail`) et le prouver ; à chaque PR
suivante, on voit le nombre d'échecs connus **diminuer**.

### Risques et parades

| Risque | Parade |
| --- | --- |
| `egen build --platform` refuse la configuration du core | Corriger la **configuration** (API en https, import map non vide…) ; ne jamais assouplir une règle du framework ; si c'est un défaut du framework, ouvrir un `FW-REQ` |
| Le build du shell est trop lent pour la CI | Mettre en cache `node_modules/@egen-civitas/esm-app-shell/dist` ; ne reconstruire le shell que si l'import map change |
| Un asset d'app (image locale) ne se charge pas depuis `/app/apps/<dir>/` | Cas couvert par le **témoin positif** de T5.2 ; correction de `publicPath` à étudier avec le framework |

---

## P4 — Session et login natifs

**Objectif** : l'utilisateur **se connecte, reste connecté, se déconnecte** en natif, **sans cookie et sans jeton dans le WebView**.

**Pourquoi** : F-01 (critique). Le login actuel repose sur HTTP Basic + cookie ; en natif, le framework fournit les jetons via le Host et
impose `credentials: 'omit'`. Le détail du flux, des erreurs et du contrat backend est dans [05](05-CONTRAT-SESSION-LOGIN.md).

**Prérequis** : P3 (banc) **et** `BE-REQ-1` validé (réponses écrites à Q1–Q8 de [05](05-CONTRAT-SESSION-LOGIN.md)).

### T4.0 — Porte d'entrée : contrat validé

- **Livrable** : [05](05-CONTRAT-SESSION-LOGIN.md) §6 rempli avec les réponses du backend (forme exacte des requêtes et réponses),
  date et nom du validateur ; `D-06` passe de « Proposée » à « Décidée ».
- **Critère de fin** : aucune question Q1–Q8 laissée sans réponse ; fixtures de test dérivées (`e2e-native/fixtures/auth-*.json`).
- **Si le contrat tarde** : les tâches T4.1 à T4.3 (isolation par stratégie) peuvent être faites contre le contrat **proposé** ; la
  fusion de T4.4 en dépend.

### T4.1 — Isoler l'authentification derrière une interface

- Créer `packages/apps/esm-login-app/src/auth/` avec :
  - `auth-strategy.ts` : `interface AuthStrategy { login(credentials: { username: string; password: string }): Promise<void>; logout(): Promise<void>; }`
  - `cookie-strategy.ts` : **déplacement à l'identique** du comportement actuel (`refetchCurrentUser(username, password)`, logout par `DELETE` de la session).
  - `index.ts` : `getAuthStrategy()` retourne la stratégie cookie en Web et la stratégie jeton en natif (`isNativePlatform()`).
- **Contrainte** : le comportement Web est **strictement identique** (principe P-1). Le déplacement ne change ni requête, ni message, ni ordre.
- **Critère de fin** : les 5 fichiers de test existants du login passent **sans modification** ; un nouveau test vérifie que, en Web,
  `getAuthStrategy()` retourne la stratégie cookie et émet exactement la requête d'avant (en-tête `Authorization: Basic …`).

### T4.2 — Stratégie jeton (natif)

- `auth/token-strategy.ts`, conforme à [05](05-CONTRAT-SESSION-LOGIN.md) §4 :
  1. `POST` d'échange identifiant/mot de passe → réponse validée par un schéma `zod` (déjà dépendance de l'app) ; toute réponse hors
     schéma = erreur `AUTH_PROTOCOL` (jamais de repli silencieux) ;
  2. `getPlatform().session.setTokens({ ... })` — c'est le **seul** endroit où un jeton est manipulé, et il n'est ni journalisé ni mis en état React ;
  3. `refetchCurrentUser()` **sans identifiants** (le fournisseur d'autorisation du framework ajoute `Bearer`).
- **Interdits** : stocker le jeton ailleurs que dans le Host ; l'écrire dans un message d'erreur ou un journal ; utiliser `localStorage`.
- **Critère de fin** : tests unitaires avec `createMockPlatform` : `setTokens` appelé **une fois** avec les valeurs de la réponse ; **aucun**
  appel à `Storage.prototype.setItem` avec une clé ou une valeur contenant le jeton (espion) ; réponse mal formée → `AUTH_PROTOCOL` ;
  capacité `session` absente → erreur `UNAVAILABLE` convertie en message explicite (principe P-10).

### T4.3 — Brancher les stratégies dans l'interface de login

- `login/login.component.tsx` (`handleSubmit`) : remplacer l'appel direct par `getAuthStrategy().login(...)`. Conserver tel quel : la validation
  du formulaire, le contournement de développement `applyDevAuthBypassForLogin` (inerte en natif), la redirection de succès et la
  persistance du tenant.
- **Lien du pied de page** (`login-footer.component.tsx:32`) : utiliser une **copie** du composant `ExternalLink` de T2.5 (Web inchangé).
- **Gestion des erreurs** (tableau complet dans [05](05-CONTRAT-SESSION-LOGIN.md) §5) : identifiants invalides, réseau, délai dépassé,
  stockage sécurisé refusé, Host sans `session`, protocole invalide ; chacune avec une **clé de traduction** propre ajoutée aux
  fichiers `translations/*.json` de l'app et au dictionnaire anglais.
- **Point d'attention** : `login.component.tsx:264` affiche aujourd'hui `error.message` brut ; en natif, tout message passe par le tableau de [05](05-CONTRAT-SESSION-LOGIN.md) §5 (le Web garde son comportement).
- **Critère de fin** : un test par erreur du tableau ; les messages existent en français et en anglais (`yarn extract-translations` à jour).

### T4.4 — Déconnexion et expiration

- `redirect-logout/logout.resource.ts` : stratégie jeton → (1) tentative de révocation côté serveur, **échec toléré** ; (2) **toujours**
  `getPlatform().session.clear()` ; (3) vidage du cache SWR ; (4) `clearCurrentUser()` ; (5) redirection vers `login`. L'ordre garantit que l'utilisateur est
  déconnecté **localement** même si le réseau est coupé.
- Expiration : quand le rafraîchissement échoue (le framework retourne alors la réponse `401`), vérifier que l'utilisateur est renvoyé au login
  avec un message « session expirée » (clé `sessionExpired`), sans boucle.
- **Critère de fin** : tests unitaires (réseau coupé → clear quand même ; ordre des appels) ; scénarios E-13 et E-16.

### T4.5 — Changement de mot de passe

- Vérifier que `change-password` fonctionne **avec `Bearer`** (aucune dépendance au cookie). Ajuster `change-password.resource.ts` si besoin.
- **Critère de fin** : test unitaire et scénario E-19 (si le contrat le prévoit, voir [05](05-CONTRAT-SESSION-LOGIN.md) §3.5).

### T4.6 — Garde de session sous la base native

- `esm-user-profile-app` : tester `session-guard.component.tsx` sous `/app/` ; **prouver** l'absence de redirection prématurée et de boucle login ⇄ garde pendant que le
  jeton se rafraîchit (comportement déjà garanti par `useSession()`, qui suspend jusqu'à `loaded` : le test le verrouille) (la garde attend que la session soit **résolue** avant de rediriger, règle RC-5 de [05](05-CONTRAT-SESSION-LOGIN.md) §7).
- **Critère de fin** : tests de la garde (session en cours de chargement → pas de redirection ; non authentifié → redirection vers `${egenSpaBase}login`).

### T4.7 — Scénarios natifs simulés (voir le catalogue de [07](07-TESTS-ET-CI.md))

E-10 (connexion réussie : les jetons sont chez le Host simulé, **pas** dans le stockage), E-11 (les appels portent `Bearer`), E-12 (401 → un seul
rafraîchissement → rejeu), E-13 (rafraîchissement refusé → retour au login), E-14 (inspection : aucune clé de stockage, aucun cookie ne contient le jeton),
E-15 (Host sans `session` → message clair, pas de plantage), E-16 (déconnexion), E-17 (mauvais mot de passe), E-18 (API indisponible).

### T4.8 — Passage en natif du login et de la garde

- Même PR que la fin de T4.7 : `nativePending: false` pour `esm-login-app` et `esm-user-profile-app` ; `platforms` ← `["web","android","ios"]` ;
  incrément de `version` (minor) et note `.changeset/` ; les règles N-0x passent en **erreur** pour ces deux apps.
- **Critère de fin** : `node tools/check-platforms.mjs` code 0 ; `yarn build:native-preview --strict` inclut ces deux apps ; E-10 à E-18 verts.

### T4.9 — Documentation de l'app

- `packages/apps/esm-login-app/README.md` : flux Web, flux natif, tableau des erreurs, ce qui est stocké et où.
- **Critère de fin** : le README décrit explicitement « aucun jeton hors du Host ».

### Livrables de P4

Stratégies cookie/jeton isolées ; login et déconnexion natifs ; garde de session ; scénarios E-10 à E-18 ; apps `login` et `user-profile` natives.

### Critères d'acceptation de P4

| # | Commande | Résultat attendu |
| --- | --- | --- |
| 1 | `yarn workspace @egen/esm-login-app test` | vert, dont les 5 fichiers d'origine **non modifiés** |
| 2 | `yarn e2e:native --grep "E-1[0-9]"` | E-10 à E-18 verts |
| 3 | `yarn e2e:native --grep "E-14"` | aucune clé/cookie/IndexedDB ne contient le jeton |
| 4 | `yarn e2e:native --grep "E-90"` | le login **Web** (Basic + cookie) est inchangé |
| 5 | `node tools/check-platforms.mjs` | code 0 |

### Résultats attendus

Un utilisateur peut, **en simulation**, se connecter, naviguer, voir sa session rafraîchie sans action, et se déconnecter ; le Web ne change pas.
La validation réelle viendra en P9.

### Risques et parades

| Risque | Parade |
| --- | --- |
| Contrat backend différent du contrat proposé | Isolation par `AuthStrategy` : seule `token-strategy.ts` change ; les fixtures de test changent avec le contrat |
| Boucle de redirection login ⇄ garde | T4.6 + E-13 |
| Fuite du jeton dans un message d'erreur | Aucun message ne contient d'argument d'appel (garanti côté framework, G4) ; test E-14 + revue |
| Le Host n'implémente pas `session.refresh` | `HOST-REQ-3` ; sans lui, la session native expire à la fin de la durée de vie du jeton d'accès : documenté et testé (E-13) |

---

## P5 — Ressources distantes et CSP

**Objectif** : **aucune ressource externe n'est chargée à l'exécution** en natif ; la seule origine externe est l'API, appelée par `egenFetch`.

**Pourquoi** : F-02, F-03, F-18. La CSP native (`img-src 'self' data: blob:`, `font-src 'self'`, `connect-src 'self' <API>`) **bloque** les
≈ 150 ressources distantes (presque toutes des images de démonstration), la scène 3D distante, les polices distantes. Et un jeton `Bearer` ne peut pas authentifier un
`<img src>` : les images **protégées** devront passer par `egenFetch`.

**Prérequis** : P3 (le scénario E-02 mesure le résultat).

### T5.1 — Politique d'assets (écrire et appliquer)

Décision `D-08`, rédigée dans [06](06-GUIDE-DEVELOPPEUR.md) §4 et appliquée ici :

| Type de ressource | Règle |
| --- | --- |
| Image de **démonstration** (avatars, couvertures, illustrations de données factices) | Remplacée par (1) un **avatar à initiales** généré en CSS quand c'est un portrait, (2) un **visuel local** compressé sinon |
| Illustration **de l'interface** (page 404, logos) | Fichier **local** de l'app, importé par le code (le bundler l'émet dans `dist/`) |
| Image **publique de l'API** (non protégée) | Autorisée seulement si `FW-REQ-2` est livrée (origine de l'API dans `img-src`) |
| Image/fichier **protégé** de l'API | `egenFetch(url)` → `Blob` → `URL.createObjectURL` (autorisé par `blob:`), avec `URL.revokeObjectURL` au démontage |
| Police | **Embarquée** dans l'app ou fournie par le shell ; jamais `fonts.googleapis.com` en A/B |
| Script, iframe, vidéo distants | Interdits en A/B |

**Budget d'image locale** : ≤ 60 Ko par image (WebP), ≤ 600 Ko cumulés par app A/B, hors dérogation inscrite dans [08](08-DECISIONS-ET-RISQUES.md).

### T5.2 — Témoin positif : un asset local d'app se charge en natif

- Avant tout remplacement massif, prouver le mécanisme : ajouter **une** image locale à `esm-not-found-app` (une des 6 illustrations),
  l'importer, construire l'artefact natif, et vérifier par E-02 (partie « témoin ») qu'elle est servie depuis `/app/apps/esm-not-found-app/…`
  avec le statut 200.
- **Critère de fin** : le témoin passe ; si l'URL résolue est incorrecte (chemin public), **s'arrêter** et traiter avec le framework avant de
  continuer (R-04).

### T5.3 — Composant d'avatar à initiales (local à chaque app qui en a besoin)

- Petit composant sans dépendance (initiales du nom, couleur déterministe tirée d'un hachage du nom), **dupliqué** dans `esm-annuaire-app`
  et `esm-primary-navigation-app` (`D-07` : promotion au framework à la **deuxième** demande, via `FW-REQ`).
- **Critère de fin** : tests (initiales d'un nom simple, composé, vide ; couleur stable pour un même nom).

### T5.4 — Remplacer les images de démonstration, app par app (portées par les vagues de P6)

Les remplacements eux-mêmes sont des tâches des vagues de P6 (T6.2.x, T6.3.x, T6.4.x, T6.1.x) pour que **chaque app passe en natif en un seul geste**.
Ce que P5 apporte : la politique (T5.1), le témoin (T5.2), l'avatar (T5.3), le contrôle (T5.5).

### T5.5 — Durcir les contrôles

- Quand **toutes** les apps A/B auront terminé leur vague : `ASSET-001` et N-09 deviennent **erreurs** pour tout le dépôt ; le `test.fail` de E-02 est retiré.
- **Critère de fin** (fin de P6) : `node tools/check-remote-assets.mjs` → 0 résultat ; E-02 vert **sans** annotation ; E-04 vert.

### T5.6 — Images protégées (conception, sans code)

- Rédiger la conception du chargement d'images protégées (hook `useAuthenticatedObjectUrl`) : signature, gestion du cache, annulation,
  révocation des URL, états (chargement, erreur). **Implémenter seulement** quand `BE-REQ-3` confirme que des images protégées existent
  et que l'API les sert avec `Bearer`. Rappel `D-07` : implémentation locale dans la première app qui en a besoin, demande `FW-REQ-5` à la deuxième.
- **Critère de fin** : section ajoutée à [06](06-GUIDE-DEVELOPPEUR.md) §4.4, relue.

### T5.7 — Suivre `FW-REQ-2`

- Ouvrir la demande (origine de l'API dans `img-src`, configurable) avec l'exemple concret : photos du personnel servies par l'API.
- **Critère de fin** : demande ouverte et référencée dans le suivi ; décision du framework consignée.

### Livrables de P5

Politique d'assets en vigueur ; témoin positif ; avatar à initiales ; conception des images protégées ; demande `FW-REQ-2`.

### Critères d'acceptation de P5

| # | Commande | Résultat attendu |
| --- | --- | --- |
| 1 | `yarn e2e:native --grep "E-02"` | le témoin positif passe ; la partie « aucune requête externe » est encore `test.fail` jusqu'à la fin de P6 |
| 2 | Tests de l'avatar | verts |
| 3 | Section 06 §4.4 | présente |

### Résultats attendus

Le mécanisme de chargement d'un asset local est **prouvé**, la règle est **écrite**, le remplacement peut se faire par vagues sans rien casser.

### Risques et parades

| Risque | Parade |
| --- | --- |
| L'artefact enfle avec les images locales | Budget par image/app ; avatars à initiales plutôt que fichiers ; déduplication (mêmes photos répétées dans plusieurs fichiers) |
| Les images de démonstration sont déjà remplacées par des données réelles | Si l'API fournit les images, appliquer la ligne « protégé » ou « publique » de T5.1 ; supprimer le jeu de démonstration |

---

## P6 — Adaptation des apps de catégorie B (cinq vagues)

**Objectif** : les 13 apps de catégorie B fonctionnent en natif **et** sont déclarées natives.

**Prérequis** : P2 (lint), P3 (banc), P5 (politique d'assets) ; `login` et `user-profile` sont traités par P4.

### Règles communes à toutes les vagues

1. **Une app = une PR** (ou une par groupe cohérent dans la même vague), contenant : le code, **les tests**, la note `.changeset/`, l'incrément de `version`.
2. **Sortie d'app** (critères identiques pour chaque app) :
   - les changements listés dans sa fiche de [03](03-CLASSIFICATION-APPS.md) §6 sont faits ;
   - les tests unitaires ajoutés passent et le **comportement Web est couvert par un test nommé** (P-1) ;
   - ESLint : zéro avertissement N-0x pour l'app (elle passe en erreur) ;
   - `node tools/check-remote-assets.mjs --app <nom>` → 0 résultat ;
   - E-20 pour l'app **vert sans `test.fail`**, ainsi que ses scénarios propres (E-21 à E-26 selon l'app) ;
   - **dans la même PR** : `nativePending: false` dans la matrice et `platforms` ← `["web","android","ios"]` dans `routes.json` ;
   - le suivi est mis à jour.
3. **Sortie de vague** : toutes les apps de la vague sont sorties, `yarn verify` et `yarn e2e:native` verts sur `main`.
4. Ne jamais déclarer une app native « en attendant » : la règle de transition de [03](03-CLASSIFICATION-APPS.md) §1 s'applique.

### Vague 1 — petites apps (6 apps, S × 6)

| Tâche | App | Contenu (détail dans la fiche de [03](03-CLASSIFICATION-APPS.md)) | Scénarios |
| --- | --- | --- | --- |
| T6.1.1 | `esm-appearance-app` | Plein écran masqué en natif (§6.7) | E-20, E-24 |
| T6.1.2 | `esm-footer-app` | 2 liens → `ExternalLink` (§6.8) | E-20, E-21, E-92 |
| T6.1.3 | `esm-help-menu-app` | 3 liens → `ExternalLink` (copie) + **3 tests** à créer (§6.9) | E-20, E-21, E-92 |
| T6.1.4 | `esm-language-app` | `reload()` conservé, test à réviser selon `D-15` (§6.10) | E-20, E-27 |
| T6.1.5 | `esm-not-found-app` | retour accueil par `navigate` **en natif seulement** (Web conservé, dérogation `X-01`), 6 illustrations locales (§6.11) | E-20, E-03, E-02 |
| T6.1.6 | `esm-sites-app` | 4 images distantes remplacées (§6.13) | E-20, E-02 |

**Sortie de vague 1** : les 6 apps natives ; `ASSET-001` → 0 pour ces 6 apps ; comptage des `test.fail` de E-02 diminué.

### Vague 2 — contenus à images (2 apps, S + M)

| Tâche | App | Contenu | Scénarios |
| --- | --- | --- | --- |
| T6.2.1 | `esm-home-app` | Route `home/showcase` non montée en natif + `React.lazy` ; lien social ; vérifier le fond (§6.3) | E-20, E-25, E-21 |
| T6.2.2 | `esm-annuaire-app` | `mailto:` par `navigate` ; ≈ 38 images → avatars à initiales/visuels locaux ; retours d'échec du presse-papiers (§6.5) | E-20, E-22, E-02 |

**Sortie de vague 2** : `home` et `annuaire` natives ; la route `home/showcase` absente en natif (E-25) et présente en Web (E-90).

### Vague 3 — informations (1 app, L)

| Tâche | App | Contenu | Scénarios |
| --- | --- | --- | --- |
| T6.3.1 | `esm-informations-app` | ≈ 40 images remplacées (déduplication) ; clé de configuration `publicBaseUrl` et partage conditionné (`D-16`) ; lien de la modale d'événement ; retours du presse-papiers (§6.4) | E-20, E-23, E-02 |

**Sortie de vague 3** : `informations` native ; le partage ne produit **jamais** une URL locale (E-23).

### Vague 4 — navigation principale (1 app, M ; la mise en page mobile est en P7)

| Tâche | App | Contenu | Scénarios |
| --- | --- | --- | --- |
| T6.4.1 | `esm-primary-navigation-app` | Lien du menu d'applications ; avatars du répertoire (≈ 24) ; son après geste ; retour du presse-papiers du fil d'Ariane (§6.2) | E-20, E-21, E-02 |

**Coordination (R-07)** : cette app est modifiée en parallèle par la réforme TopBar (`docs/SUIVI-REFORME-TOPBAR.md`, T8→T12). Avant de
démarrer T6.4.1 : lire le point de reprise de ce suivi, fusionner ou rebaser les PR de la réforme en cours, **ne jamais** mener les deux
chantiers sur le même fichier en même temps.

**Sortie de vague 4** : `primary-navigation` native (comportement et ressources) ; **P7 peut démarrer**.

### Vague 5 — assistant IA (1 app, M, conditionnelle)

| Tâche | App | Contenu | Scénarios |
| --- | --- | --- | --- |
| T6.5.1 | `esm-ai-assistant-app` | Voix désactivée en natif (`D-13`) ; lien du panneau ; vérification du canal WebSocket sous CSP (§6.6) | E-20, E-05, E-26 |
| T6.5.2 | (framework) | Si E-05 confirme le blocage : `FW-REQ-6` ; l'assistant reste **déclaré web seulement** jusqu'à sa livraison, avec un message explicite | — |

**Sortie de vague 5** : soit l'assistant est natif (texte), soit sa déclaration reste `["web"]` avec dérogation inscrite dans [08](08-DECISIONS-ET-RISQUES.md) et `FW-REQ-6` suivie.

### Fin de P6 : durcissement général

- `ASSET-001` et N-09 en **erreur** pour tout le dépôt (T5.5) ; `test.fail` retirés de E-02 ; **plus aucune** app A/B en `nativePending`
  (sauf dérogation inscrite) ; `node tools/list-apps.mjs --platform android --production --names | wc -l` → **19** (ou 18 avec dérogation de l'assistant).

### Livrables de P6

13 apps natives (dont `login` et `user-profile` via P4), tests ajoutés (au moins 3 pour `help-menu`), notes de version, matrice à jour.

### Critères d'acceptation de P6

| # | Commande | Résultat attendu |
| --- | --- | --- |
| 1 | `node tools/check-platforms.mjs` | code 0 |
| 2 | `node tools/list-apps.mjs --platform android --production --names \| wc -l` | 19 (ou 18, dérogation) |
| 3 | `node tools/check-remote-assets.mjs --json \| jq '.findings\|length'` | 0 |
| 4 | `yarn lint` | 0 erreur, **0 avertissement N-0x** |
| 5 | `yarn build:native-preview --strict && yarn e2e:native` | tout vert, **plus aucun `test.fail` lié à F-02 ni F-04** |
| 6 | `yarn verify` | code 0 |

### Résultats attendus

L'artefact natif du core est **conforme** : aucune requête externe, aucune navigation hors du SPA, aucune CSP violée, 19 apps enregistrées.

### Risques et parades

| Risque | Parade |
| --- | --- |
| Régression Web pendant une adaptation | Test nommé de non-régression Web **dans chaque PR** ; scénario E-90 en CI |
| Une app a des besoins non vus à l'audit | Ajouter la tâche à la vague, consigner un constat `F-xx` daté, ne pas élargir la PR |
| Conflits avec la réforme TopBar | Coordination décrite ci-dessus ; vague 4 en dernier avant P7 |

---

## P7 — Expérience mobile

**Objectif** : l'interface est **utilisable sur téléphone** : pas de débordement, cibles tactiles suffisantes, zones sûres respectées, lisibilité.

**Pourquoi** : F-14, F-13. L'interface actuelle (barre supérieure à niveaux, rails gauche/droit, panneaux) est pensée pour un écran de
bureau et n'a jamais été auditée sur petit écran. **C'est le poste d'incertitude le plus important du programme** (R-03).

**Prérequis** : fin de la vague 4 de P6 (la navigation principale est native) ; `FW-REQ-1` (zones sûres) livrée **ou** décision écrite de report.

### T7.1 — Fixer le profil d'usage et les seuils

- **Appareils de référence (viewports)** : 360 × 800 (Android compact), 390 × 844 (iPhone courant), 768 × 1024 (tablette en portrait).
- **Seuils** (mesurables) :
  - aucun défilement horizontal du document : `document.documentElement.scrollWidth <= window.innerWidth` ;
  - cible tactile interactive (`button`, `a[href]`, `[role="button"]`, `input`, `select`) **≥ 44 × 44 pixels CSS** dans la barre supérieure, le
    pied de page et le login ;
  - texte de contenu `font-size` calculé **≥ 14 px** ;
  - aucun contenu masqué par la barre supérieure fixe ni par le pied de page fixe ;
  - zones sûres : les barres fixes utilisent `env(safe-area-inset-*)` (dès que `FW-REQ-1` est livrée).
- **Critère de fin** : section « Seuils mobiles » consignée dans [07](07-TESTS-ET-CI.md) §5 (déjà posée) et validée par le responsable produit.

### T7.2 — Audit automatisé

- Scénarios **E-30** (débordement horizontal, par app et par viewport), **E-32** (taille des cibles tactiles), **E-33** (taille de police), écrits avec
  Playwright sur l'artefact natif d'essai.
- **Critère de fin** : un **rapport** (`e2e-native/reports/mobile-audit.md` généré, non versionné) liste, par écran et par viewport, chaque
  violation ; les violations sont converties en tâches `T7.3.x`.

### T7.3 — Corrections de la barre supérieure et des rails (`esm-primary-navigation-app`)

- Tâches à créer **à partir du rapport de T7.2**, chacune avec son critère mesurable. Les décisions de conception attendues :
  - comportement de la barre supérieure à niveaux sur petit écran (repli en menu) ;
  - rails gauche et droit (`shell-rail-left-slot`, `shell-rail-right-slot`) : tiroir plein écran sur petit écran ;
  - cibles tactiles ≥ 44 px ;
  - respect des zones sûres.
- **Contrainte** : coordination avec la réforme TopBar (R-07) ; tout comportement **Web** reste inchangé au-delà des seuils de bureau.
- **Critère de fin** : E-30, E-32 verts pour la barre supérieure et le pied de page.

### T7.4 — Autres apps

- Corriger, app par app, les violations restantes du rapport (annuaire, informations, sites, home, login).
- **Critère de fin** : E-30, E-32, E-33 verts pour toutes les apps A/B aux trois viewports.

### T7.5 — Clavier virtuel et orientation (vérification)

- Le login et les champs de recherche restent visibles quand le clavier virtuel est ouvert ; passage portrait ↔ paysage sans perte d'état.
  **Non simulable** en CI : vérifié en P9 (étapes P9-12 et P9-13), conception relue ici.

### T7.6 — Accessibilité de base

- Contrastes du thème sombre et clair (rapport 4,5:1 pour le texte courant), libellés des boutons-icônes, ordre de tabulation du login.
  Vérification automatisée par `@axe-core/playwright` sur login, accueil, annuaire, informations (aucune violation de gravité « serious » ou « critical »).
- **Critère de fin** : scénario **E-34** vert (dépendance de test `@axe-core/playwright`, à ajouter).

### T7.7 — Performance de démarrage (mesure)

- Mesurer en simulation (limitation CPU ×4) le temps jusqu'à la page de connexion rendue ; consigner dans `BASELINE.md`.
  **Cible** : à fixer après la première mesure (pas de seuil inventé) ; règle : pas de dégradation > 10 % par PR.
- **Critère de fin** : mesure consignée, règle de non-régression en place (`D-10`).

### Livrables de P7

Seuils validés ; rapport d'audit ; corrections de navigation et des apps ; scénarios E-30 à E-34 ; mesure de démarrage.

### Critères d'acceptation de P7

| # | Commande | Résultat attendu |
| --- | --- | --- |
| 1 | `yarn e2e:native --grep "E-3[0-4]"` | verts pour 3 viewports |
| 2 | Rapport d'audit | 0 violation ouverte (ou dérogation inscrite) |
| 3 | `grep -rn "safe-area-inset" packages/apps/esm-primary-navigation-app/src` | présent dans les styles des barres fixes (si `FW-REQ-1` livrée) |

### Résultats attendus

Les parcours principaux sont **utilisables au doigt** sur petit écran, mesurés automatiquement ; ce qui ne se mesure pas en CI est prêt pour P9.

### Risques et parades

| Risque | Parade |
| --- | --- |
| L'adaptation de la barre supérieure est plus lourde que prévu | Auditer **tôt** (dès T7.2) ; découper en tâches ; limiter v1 aux parcours définis (login, accueil, annuaire, informations) ; consigner le reste comme dette datée |
| `FW-REQ-1` tarde | Appliquer les marges de sécurité via variables CSS locales **temporaires** documentées ; basculer sur `env()` à la livraison |

---

## P8 — Livraison vers les distributions

**Objectif** : le core publie, de façon **vérifiée**, ce dont `egen-distributions` a besoin pour assembler un produit natif.

**Prérequis** : P6 (apps natives déclarées).

### T8.1 — Contrôle du contenu publié `tools/check-pack.mjs`

- Pour chaque app A/B, simuler la publication : `yarn workspace <nom> pack --dry-run --json` (ou `npm pack --dry-run --json`) et vérifier :
  | Code | Règle |
  | --- | --- |
  | `PACK-001` | le paquet contient `dist/egen-<nom>.js` (valeur du champ `browser`) |
  | `PACK-002` | le paquet contient `dist/routes.json` **estampillé** : `version` égale à celle du `package.json`, `frameworkRange` = `^4.1.0` |
  | `PACK-003` | `platforms` de `dist/routes.json` est égal à la matrice (app non en attente) |
  | `PACK-004` | aucun fichier `.map` n'est publié **si** `FW-REQ-3` est livrée côté distribution (sinon avertissement) |
  | `PACK-005` | aucun fichier hors `dist/`, `package.json`, `README.md`, `CHANGELOG.md`, `LICENSE` n'est publié |
- **Critère de fin** : `node tools/check-pack.mjs` code 0 ; test `node --test` avec une app de fixture.

### T8.2 — Contrat de livraison

- Rédiger `docs/multiplateforme/LIVRAISON-DISTRIBUTIONS.md` : ce que le core publie (noms de paquets, version, `dist/`, `routes.json` estampillé) ;
  comment lister les apps d'une cible (`list-apps --platform <p> --production --json`) ; la règle « jamais d'app D en production » ;
  la matrice des catégories ; le calendrier de montée de version ; qui prévenir en cas de changement.
- **Critère de fin** : relu par l'équipe `egen-distributions` ; ses retours consignés (`DIST-REQ-1` close ou ajustée).

### T8.3 — Dépôts jumeaux (décision `D-11`)

- Décider avec l'équipe des projets métier si `tools/check-platforms.mjs`, `tools/list-apps.mjs` et la configuration ESLint native
  rejoignent `tools/shared-paths.txt`. Si oui : les rendre **génériques** (matrice absente ⇒ aucun contrôle), les ajouter à la liste, préparer la synchronisation (`docs/SYNC-CORE-TV.md`).
- **Critère de fin** : décision consignée dans [08](08-DECISIONS-ET-RISQUES.md) ; si « oui », une PR de synchronisation ouverte côté jumeau.

### T8.4 — Publication à blanc

- `yarn ci:publish-next` avec `--dry-run` (ou sur le registre de test) : vérifier que seules les apps dont la version a changé sont publiées.
- **Critère de fin** : liste des paquets publiés conforme aux incréments de version de la période ; aucune app oubliée (cf. `check-version-bump`).

### T8.5 — Notes de version consolidées

- Rassembler en un document `docs/multiplateforme/NOTES-DE-VERSION.md` ce qui change pour les distributions : apps devenues natives,
  nouvelles exigences (`HOST-REQ-*`), changement de contrat.
- **Critère de fin** : le document existe et couvre chaque app passée en natif.

### Livrables de P8

`check-pack` ; contrat de livraison ; décision jumeaux ; publication à blanc ; notes de version.

### Critères d'acceptation de P8

| # | Commande | Résultat attendu |
| --- | --- | --- |
| 1 | `node tools/check-pack.mjs` | code 0 |
| 2 | `node tools/list-apps.mjs --platform android --production --json` | 19 (ou 18) objets, aucune app D |
| 3 | `LIVRAISON-DISTRIBUTIONS.md` | présent, relu |

### Résultats attendus

`egen-distributions` peut consommer le core **sans lire son code** : liste d'apps par cible, paquets vérifiés, règles claires.

---

## P9 — Validation sur appareil réel

**Objectif** : prouver sur de **vrais appareils** ce que le banc simulé ne peut pas prouver.

**Prérequis** : P8 ; `egen-mobile` (Host) et `egen-distributions` (artefact) disponibles ; backend avec le contrat de [05](05-CONTRAT-SESSION-LOGIN.md) ; `HOST-REQ-1`, `HOST-REQ-2`, `HOST-REQ-3`, `BE-REQ-2` livrées.

### T9.1 — Matrice d'appareils (à confirmer avec le produit, H-06)

Proposition de minimum : **2 appareils Android** (un d'entrée de gamme, un récent) et **2 appareils iOS** (un ancien encore supporté, un récent).
Les versions minimales d'Android et d'iOS à supporter sont **une décision produit à prendre avant P9** (aucune valeur n'est inventée ici).

### T9.2 — Protocole de test

Exécuter, sur chaque appareil, les parcours **P9-01 à P9-20** du catalogue de [07](07-TESTS-ET-CI.md) §6 : installation, handshake, connexion,
rafraîchissement du jeton (jeton d'accès à durée courte côté backend de test), navigation de chaque app native, lien externe, `mailto:`,
changement de langue (**rechargement**, `D-15`), retour au premier plan, coupure réseau, clavier virtuel, rotation, déconnexion.

### T9.3 — Procès-verbal et traitement des écarts

- Un procès-verbal par appareil (modèle en [07](07-TESTS-ET-CI.md) §6.3), versionné dans `docs/multiplateforme/pv/`.
- Chaque écart devient un constat `F-xx` daté avec gravité et tâche ; les écarts **critiques et hauts** bloquent la sortie de P9.
- Les cas qui s'avèrent **reproductibles en simulation** reçoivent un scénario `E-xx` supplémentaire.

### T9.4 — Décisions à trancher sur appareil

`D-15` (`reload()` et repli `index.html`), H-07 (dictée sur iOS), présence de `matchMedia`/Fullscreen, comportement du presse-papiers, politique du clavier.

### Critères d'acceptation de P9

| # | Critère | Preuve |
| --- | --- | --- |
| 1 | Les 20 parcours P9 passent sur ≥ 1 Android et ≥ 1 iOS | procès-verbaux signés |
| 2 | Aucun écart critique ou haut ouvert | suivi |
| 3 | `D-15`, H-07 tranchées | [08](08-DECISIONS-ET-RISQUES.md) mis à jour |

### Résultats attendus

Le core est **validé en conditions réelles** ; la liste des écarts restants est connue, chiffrée et priorisée.

### Risques et parades

| Risque | Parade |
| --- | --- |
| Appareils indisponibles | Réserver à l'avance (R-11) ; émulateurs en complément **non suffisant** pour les parcours P9-08 à P9-14 |
| Comportement du WebView différent du Chromium de test | Les écarts alimentent de nouveaux scénarios ; ne jamais conclure « ça marche » sur la seule simulation |

---

## P10 — Évolutions optionnelles (non planifiées)

Chaque item a un **critère d'entrée** : on ne le démarre que quand il est rempli.

| Évolution | Critère d'entrée | Idée de conception (à valider) |
| --- | --- | --- |
| Voix dans l'assistant | Capacité `permissions` (micro) livrée (framework + Host) ; test iOS concluant (H-07) | Réactiver `use-speech-recognition` derrière `has('permissions')` ; sinon dictée native fournie par le Host |
| Scanner / photo | Capacités `camera` et `files` natives livrées | Une app dédiée déclarant `requiredCapabilities: ["camera"]` |
| Notifications push | Capacité `push` native livrée ; backend capable d'émettre | `esm-notifications-app` s'abonne via `getPlatform().push` ; règle N-08 levée pour cette capacité |
| Déverrouillage biométrique | Capacité `biometric` livrée | Protège l'accès à `secureStorage` après une période d'inactivité |
| Hors ligne natif | Stratégie hors ligne native décidée (pas de service worker) | Réexaminer `esm-offline-tools-app` (catégorie C) |
| Apps de catégorie C | Décision produit | Réexaminer `character-factory` ; `theme-studio` restera web |

---

## Annexe A — Traçabilité constats → tâches

| Constat | Tâches |
| --- | --- |
| F-01 | T4.0–T4.9 |
| F-02, F-18 | T5.1–T5.5, T6.1.5, T6.1.6, T6.2.1, T6.2.2, T6.3.1, T6.4.1 |
| F-03 | T5.1, T5.6, T5.7 (`FW-REQ-2`, `BE-REQ-3`) |
| F-04 | T6.1.5, T6.2.2 |
| F-05 | T6.1.4, T6.1.5, T9.4 |
| F-06 | T2.1 (N-04), T2.5, T6.1.2, T6.1.3, T6.2.1, T6.3.1, T6.4.1, T6.5.1, T4.3 |
| F-07 | T6.5.1 (`D-13`), P10 |
| F-08 | T6.1.1 |
| F-09 | T6.3.1 |
| F-10 | T1.4 (tenant-routing web seulement), `D-09` |
| F-11 | T0.2 |
| F-12, F-23 | T0.3 |
| F-13 | T7.1, T7.3 (`FW-REQ-1`) |
| F-14 | P7 |
| F-15 | T1.4 (offline-tools web seulement) |
| F-16 | T1.5, T6.1.3, P3 |
| F-17 | T0.5 |
| F-19 | T3.1–T3.5 |
| F-20 | T0.1 |
| F-21 | T6.5.1, T6.5.2 (`FW-REQ-6`) |
| F-22 | T1.4 (logs web seulement) |

## Annexe B — Récapitulatif des tâches

| Phase | Tâches |
| --- | --- |
| P0 | T0.1, T0.2, T0.3, T0.4, T0.5 |
| P1 | T1.1, T1.2, T1.3, T1.4, T1.5, T1.6 |
| P2 | T2.1, T2.2, T2.3, T2.4, T2.5 |
| P3 | T3.1, T3.2, T3.3, T3.4, T3.5 |
| P4 | T4.0, T4.1, T4.2, T4.3, T4.4, T4.5, T4.6, T4.7, T4.8, T4.9 |
| P5 | T5.1, T5.2, T5.3, T5.4 (porté par P6), T5.5, T5.6, T5.7 |
| P6 | T6.1.1–T6.1.6, T6.2.1–T6.2.2, T6.3.1, T6.4.1, T6.5.1–T6.5.2 |
| P7 | T7.1, T7.2, T7.3 (+ sous-tâches), T7.4, T7.5, T7.6, T7.7 |
| P8 | T8.1, T8.2, T8.3, T8.4, T8.5 |
| P9 | T9.1, T9.2, T9.3, T9.4 |
| P10 | selon critère d'entrée |
