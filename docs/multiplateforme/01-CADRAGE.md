# 01 — Cadrage du programme « Core multiplateforme »

Ce document fixe le **but**, le **périmètre**, les **règles non négociables**, les **responsabilités** et la **définition de
« terminé »**. Tout le reste de la documentation en découle.

## 1. Contexte : les quatre briques

L'écosystème EGEN est composé de quatre briques qui ne se mélangent pas. Chacune a un seul métier.

```
  egen-framework ──────────────► moteur commun (shell, contrats, paquets)        [dépôt : Frontend-esm-framework]
        ▲
        │ consommé comme paquets npm (@egen-civitas/*), jamais en lien workspace
        │
  egen-core ───────────────────► les applications (microfrontends métier)        [CE DÉPÔT : Frontend-esm-core]
        │ publiées sur npm (@egen/*-app)
        ▼
  egen-distributions ──────────► assemble « quel produit, quelles apps, quelle cible » → artefact SPA   [à créer]
        │ dossier statique autonome
        ▼
  egen-mobile ─────────────────► coque native Capacitor (Host) : charge l'artefact, fournit les capacités   [à créer]
        │
        ▼ HTTPS + jeton
     backend (egen-kernel) ────► API, authentification, données
```

**Rôle du core dans cette chaîne** : c'est le seul endroit où vit le code qui sert l'utilisateur final (écran de
connexion, barre supérieure, accueil, annuaire, informations, assistant…). Il ne sait rien de Capacitor, ni d'Android,
ni de la composition des produits. Il **déclare** ce qu'il est (sur quelles plateformes chaque app peut tourner, de
quelles capacités elle a besoin) et il **respecte** les règles de ce document.

## 2. Ce que le framework fournit déjà (état au 2026-11-15)

Cette liste est la **base sur laquelle le core peut s'appuyer sans rien demander à personne**. Chaque ligne indique le
paquet et sa version minimale (vérifiées dans les `CHANGELOG.md` du framework et sur le registre npm).

| Capacité du framework | Paquet et version minimale | Utilité pour le core |
| --- | --- | --- |
| Déclaration `platforms`, `requiredCapabilities` dans `routes.json`, filtrage au démarrage | `esm-routes` ≥ 1.2.0, `esm-globals` ≥ 2.1.0, `esm-app-shell` ≥ 2.9.0 | Une app non éligible n'est pas enregistrée (journalisée, sans erreur) |
| Schéma JSON de `routes.json` publié | `esm-routes` ≥ 1.3.0 (`@egen-civitas/esm-routes/routes.schema.json`) | Valider les 26 `routes.json` automatiquement |
| `frameworkRange` estampillé au build à partir des `peerDependencies` | `rspack-config` ≥ 1.2.0, `esm-routes` ≥ 1.3.0, `esm-globals` ≥ 2.4.0 | Une app trop récente pour le framework du shell est écartée au lieu de planter |
| `getPlatform()`, `isNativePlatform()`, `getPlatformEnvironment()`, `PlatformError`, `isPlatformError()` | `esm-platform` ≥ 1.3.0 (client de pont en 1.2.0, capacités natives en 1.3.0), ré-exportés par `esm-framework` ≥ 4.1.0 | API unique pour les capacités natives, importable depuis `@egen-civitas/esm-framework` |
| Capacités natives v1 : `session`, `secureStorage`, `openExternal`, `lifecycle` | `esm-platform` ≥ 1.3.0, `esm-app-shell` ≥ 2.10.0 | Jeton gardé par le Host, liens externes, cycle de vie |
| Session par jeton : `Authorization: Bearer`, un seul rafraîchissement sur 401 puis rejeu, `credentials: 'omit'` | `esm-api` ≥ 3.0.0, `esm-app-shell` ≥ 2.10.0 | `egenFetch` fonctionne sans cookie |
| `navigate()` envoie toute URL avec schéma (`https:`, `mailto:`, `tel:`) à `openExternal` en natif | `esm-navigation` ≥ 1.1.0, `esm-app-shell` ≥ 2.11.0 | Plus besoin de `window.open` ni de `location.href` pour sortir de l'app |
| `ConfigurableLink` (lien **interne** : le clic appelle `navigate`) | `esm-react-utils` ^3.0.1 (déjà requis par le core) | Liens internes. **Ne remplace pas** `<a target="_blank">` : en Web, `navigate()` vers une URL absolue quitte le SPA dans le même onglet (voir `ExternalLink`, `FW-REQ-7`) |
| Build natif par cible (`EGEN_TARGET`), CSP stricte, règles de validation, `egen build` hors monorepo | `esm-app-shell` ≥ 2.9.0, `egen` ≥ 2.3.0 (option `egen build --platform android\|ios`) | Construire l'artefact natif depuis le core |
| Écran bloquant « mise à jour requise » si le Host est absent ou incompatible | `esm-app-shell` ≥ 2.11.0 | Comportement défini pour les mauvaises combinaisons |
| Tenant natif sans lecture de jeton dans le stockage | `esm-tenant` ≥ 1.1.0 | Règle « aucun jeton dans le WebView » |
| Outils de test : `createMockHost` (1.2.0), `createMockPlatform`, mocks `@egen-civitas/esm-framework/mock` | `esm-platform` ≥ 1.2.0 (sous-chemin `/testing`), `esm-framework` ≥ 4.1.0 | Tester sans Host réel |

**Ce que le framework ne fournit pas encore** (donc à ne pas supposer) : adaptateurs natifs pour `permissions`, `files`,
`camera`, `push`, `biometric` (les contrats existent, `has()` reste faux en natif tant que le Host et un adaptateur ne les
fournissent pas) ; `viewport-fit=cover` et zones sûres dans le shell ; autorisation de l'origine de l'API dans `img-src`
de la CSP ; filtrage des plateformes **au niveau d'une page ou d'une extension** (il se fait uniquement au niveau de
l'app). Ces points sont traités par les demandes `FW-REQ-*` de [08](08-DECISIONS-ET-RISQUES.md).

## 3. Objectifs mesurables

| # | Objectif | Comment on sait qu'il est atteint |
| --- | --- | --- |
| O-1 | Chaque app déclare explicitement ses plateformes | `yarn verify:platforms` passe ; 26/26 `routes.json` valides contre le schéma et avec `platforms` non vide |
| O-2 | Le Web ne régresse pas | Les tests existants restent verts ; les non-régressions Web ont des tests nommés (voir [07](07-TESTS-ET-CI.md)) |
| O-3 | Un utilisateur se connecte, reste connecté et se déconnecte en natif sans cookie ni jeton dans le WebView | Scénarios E-10 à E-15 de [07](07-TESTS-ET-CI.md) verts ; aucune clé de stockage contenant un jeton |
| O-4 | L'artefact natif ne charge aucune ressource externe (hors API) | Scénarios E-01/E-02 : 0 requête hors origine hors API, 0 violation de CSP |
| O-5 | Les 19 apps « natives » fonctionnent sur les parcours définis | Scénarios E-20 et suivants verts en simulation, puis validation sur appareil (P9) |
| O-6 | Le travail est reproductible et suivi | Chaque tâche a son état dans `docs/SUIVI-MULTIPLATEFORME.md`, chaque PR fusionnée avec CI verte |

## 4. Périmètre

### 4.1 Dans le périmètre (ce dépôt)

- Déclaration des plateformes et capacités de chacune des 26 apps (`src/routes.json`).
- Adaptation du code des apps pour qu'il tourne en natif (navigation, stockage, ressources, API navigateur, session).
- Outils et vérifications du core (`tools/`, ESLint, CI) qui empêchent la régression.
- Banc de test natif simulé du core.
- Préparation de ce que le core publie pour `egen-distributions` (paquets, `routes.json`, liste des apps éligibles).
- Documentation, suivi, guide du développeur.

### 4.2 Hors périmètre (avec le dépôt responsable)

| Sujet | Responsable | Pourquoi ce n'est pas ici |
| --- | --- | --- |
| Code Capacitor, Android, iOS, plugins natifs, injection de `window.egenHostBridge` | `egen-mobile` | Le core ne connaît pas le Host (règle N2 du framework) |
| Composition d'un produit (quelles apps dans quel produit), `build-manifest.json`, artefact final | `egen-distributions` | C'est une décision de produit, pas de code applicatif |
| Endpoints d'authentification, CORS, politique de jetons | backend | Le core consomme un contrat, il ne le définit pas seul |
| Nouvelles fonctionnalités du framework (zones sûres, CSP, filtrage fin) | `Frontend-esm-framework` | Demandées via `FW-REQ-*`, jamais contournées dans le core |
| Câblage des données réelles à la place des données de démonstration | équipes métier | Signalé comme constat (F-18) mais pas traité ici |
| Réforme TopBar en cours (T8→T12) | `docs/SUIVI-REFORME-TOPBAR.md` | Programme séparé ; ce plan s'y adapte (voir R-07) |

### 4.3 Non-objectifs explicites

- Pas de réécriture d'app « pour faire propre » : on change uniquement ce que la cible native impose.
- Pas de renommage de paquets, pas de renumérotation de versions (décisions `D-02`, `D-03`).
- Pas de nouveau paquet partagé dans le core (décision `D-07`).
- Pas de simulation de session ni de fausse capacité : sans capacité, l'app échoue de façon explicite (principe P-10).

## 5. Principes non négociables

Un principe est une règle **vérifiable**. Quand une phase prévoit un contrôle automatique, il est indiqué.

| # | Principe | Contrôle |
| --- | --- | --- |
| P-1 | **Le Web ne change pas.** Toute modification se fait derrière `isNativePlatform()` ou est neutre pour le Web ; le comportement Web est couvert par un test nommé. | Tests, relecture ; scénarios `E-90..` |
| P-2 | **Aucun jeton, secret ou mot de passe dans le WebView** en natif : ni `localStorage`, ni `sessionStorage`, ni cookie, ni IndexedDB. Les jetons vivent dans le Host (`platform.session`). | ESLint (P2), scénario E-14 |
| P-3 | **Déclarer, ne pas deviner.** Chaque app déclare `platforms` explicitement. Aucune détection par User-Agent ni par bibliothèque d'enveloppe ; on utilise `isNativePlatform()` / `getPlatform()` et `has()`. | `verify:platforms`, ESLint |
| P-4 | **Aucune ressource distante à l'exécution** en natif : images, polices, scripts, iframes sont embarqués. La seule origine externe autorisée est celle de l'API, appelée par `egenFetch`. | Scénarios E-01/E-02 |
| P-5 | **Aucune navigation hors du SPA par le code applicatif** : pas de `window.open`, pas d'affectation à `location.href`, pas de `target="_blank"` brut. On utilise `navigate()` (navigation interne, `mailto:`, `tel:`) ou le composant `ExternalLink` (lien externe). | ESLint |
| P-6 | **Jamais de chemin absolu à la racine.** En natif l'app est servie sous `/app` : on utilise `window.getEgenSpaBase()` ou `${egenSpaBase}`. | ESLint, scénario E-03 |
| P-7 | **Une app = une décision de plateforme**, écrite dans [03](03-CLASSIFICATION-APPS.md), reprise dans `routes.json`, vérifiée par l'outil. | `verify:platforms` |
| P-8 | **Réutiliser l'existant du framework avant de créer.** Ce qui doit être commun à plusieurs apps est demandé au framework (`FW-REQ-*`), pas copié. | Relecture |
| P-9 | **« Fait » = fusionné dans `main` avec la CI verte**, `version` de l'app incrémentée si son comportement publié change (sinon elle n'est pas republiée) avec une note `.changeset/<nom>.md`, suivi mis à jour. | Procédure du suivi, `D-19` |
| P-10 | **Échouer explicitement plutôt que simuler.** Une capacité absente donne un message clair à l'utilisateur et une erreur typée (`PlatformError`), jamais un faux succès. | Tests unitaires, E-15 |

## 6. Hypothèses

Une hypothèse est une chose **non vérifiée** dont le plan dépend. Chacune a un moyen de la vérifier et une date.

| # | Hypothèse | Vérification | Si elle est fausse |
| --- | --- | --- | --- |
| H-01 | Le backend peut exposer un échange identifiant/mot de passe contre un jeton d'accès et un jeton de rafraîchissement (variante A de [05](05-CONTRAT-SESSION-LOGIN.md)) | Réponse écrite du backend aux questions Q1–Q8 de [05](05-CONTRAT-SESSION-LOGIN.md) | Le contrat de [05](05-CONTRAT-SESSION-LOGIN.md) est révisé ; P4 est décalée, les autres phases non |
| H-02 | Le Host Capacitor sert l'artefact sous `/app` avec repli sur `index.html` pour toute route (`/app/home`, `/app/annuaire`…) | Exigence `HOST-REQ-1`, vérifiée en P9 | Les rechargements de page (`reload()`) ne doivent plus être utilisés (voir `D-15`) |
| H-03 | Le core reste consommateur **npm** du framework (pas de lien workspace) | Constat dans `docs/dev-lien-local-framework.md` | Sans objet : c'est une décision déjà prise et documentée |
| H-04 | Les dépôts jumeaux (ex. `civitas-tv-frontend`) reçoivent les fichiers listés dans `tools/shared-paths.txt` | `docs/SYNC-CORE-TV.md` | Les outils ajoutés en P1/P3 ne sont pas partagés (voir `D-11`) |
| H-05 | Les données de démonstration (annuaire, actualités, événements, vitrine) seront remplacées par des données de l'API avant une livraison de production | Confirmation de l'équipe métier | Les images de démonstration doivent être embarquées localement (P5) et comptées dans le budget de taille |
| H-06 | Les cibles sont Android et iOS via WebView ; le navigateur de bureau reste la cible `web` | Décision de produit | Si une cible bureau native (Electron…) apparaît, ce plan ne la couvre pas |
| H-07 | Le support de la dictée vocale du navigateur (`SpeechRecognition`) est absent ou instable dans le WebView iOS | Test sur appareil en P9 | La voix reste désactivée plus longtemps (voir `D-13`) |

## 7. Rôles et responsabilités

| Rôle | Responsabilités dans ce programme | Décide |
| --- | --- | --- |
| **Équipe core** | Exécute les phases P0–P8, tient le suivi, ouvre les `FW-REQ-*`, `BE-REQ-*`, `HOST-REQ-*` | Classification des apps ([03](03-CLASSIFICATION-APPS.md)), ordre des vagues |
| **Équipe framework** | Instruit les `FW-REQ-*` (zones sûres, CSP, filtrage), publie les versions | Contenu et calendrier des évolutions du framework |
| **Équipe backend** | Définit et publie le contrat d'authentification et le CORS (`BE-REQ-*`) | Forme des jetons, durée de vie, révocation |
| **Équipe `egen-distributions`** | Consomme `list-apps` et les paquets publiés ; compose les produits | Quelles apps dans quel produit |
| **Équipe `egen-mobile`** | Implémente le Host (`HOST-REQ-*`), fournit les appareils pour P9 | Capacités annoncées, plugins natifs |
| **Responsable produit** | Valide les décisions marquées « à valider » dans [08](08-DECISIONS-ET-RISQUES.md) | Périmètre natif (19 apps), tenant natif, budget de taille |

Une même personne peut tenir plusieurs rôles : la table dit **qui décide**, pas **combien de personnes**.

## 8. Définition de « terminé » du programme

Le programme est terminé quand **toutes** les conditions suivantes sont vraies :

1. Les tâches des phases P0 à P8 sont à l'état « fait » dans le suivi (fusionnées, CI verte).
2. `yarn verify` (qui inclut `verify:platforms`, le lint avec les règles natives, les tests et le typecheck) est vert sur `main`.
3. Le job de CI du banc de test natif simulé est vert sur `main` et couvre les scénarios de [07](07-TESTS-ET-CI.md) marqués « obligatoire ».
4. L'artefact natif construit par `tools/build-native-preview.mjs` ne contient aucune requête externe (hors API) et respecte le budget de taille de `D-10`.
5. La phase P9 est validée sur au moins un appareil Android et un appareil iOS réels, avec le procès-verbal joint au suivi.
6. Les demandes `FW-REQ-*` de priorité « haute » sont livrées ou ont une décision écrite de report.
7. Aucune dérogation (`eslint-disable`, app marquée « web seulement » faute de temps) n'est restée sans entrée dans [08](08-DECISIONS-ET-RISQUES.md).

## 9. Dépendances externes

| ID | Besoin | De qui | Bloque | État | Échéance souhaitée |
| --- | --- | --- | --- | --- | --- |
| BE-REQ-1 | Contrat d'authentification natif (jeton, rafraîchissement, révocation) — réponses à Q1–Q8 de [05](05-CONTRAT-SESSION-LOGIN.md) | backend | **P4** (début) | Non commencé | Avant le début de P4 |
| BE-REQ-2 | CORS pour l'origine locale du Host, avec les en-têtes listés dans `docs/cors-api-native.md` du framework | backend | P4 (test réel), P9 | Non commencé | Avant P9 |
| BE-REQ-3 | Accès aux images/fichiers protégés compatibles avec un jeton `Bearer` (pas de cookie) | backend | P5 (images protégées), P6 (annuaire) | Non commencé | Avant la vague 2 de P6 |
| FW-REQ-1 | `viewport-fit=cover` et zones sûres dans le shell pour la cible native | framework | P7 | À ouvrir | Avant P7 |
| FW-REQ-2 | Origine de l'API autorisée dans `img-src` de la CSP native (configurable) | framework | P5 (images publiques de l'API) | À ouvrir | Avant la fin de P5 |
| FW-REQ-3 | Exclusion des fichiers `.map` de l'artefact natif | framework | P8 | À ouvrir | Avant P8 |
| FW-REQ-4 | Filtrage par plateforme au niveau page/extension (facultatif) | framework | Aucune phase (confort) | À ouvrir | — |
| FW-REQ-5 | Assistant d'image authentifiée (fetch → URL d'objet) dans `esm-react-utils` | framework | Aucune phase (règle des deux usages) | À ouvrir | — |
| FW-REQ-6 | `connect-src` de la CSP native : autoriser l'origine **WebSocket** (`wss://`) de l'API et du canal de l'assistant IA (`EGEN_AI_CHANNEL_URL`) | framework | P6 vague 5 (assistant IA) | À ouvrir, **à confirmer** par E-05 | Avant la vague 5 de P6 |
| FW-REQ-7 | Composant `ExternalLink` (Web : `<a target="_blank" rel="noopener noreferrer">` inchangé ; natif : `navigate` vers `openExternal`) dans `esm-react-utils` | framework | P2 (copie locale en attendant), vague 1 de P6 | À ouvrir (**priorité haute** : 7 apps concernées) | Avant la vague 1 de P6 |
| HOST-REQ-1 | Servir l'artefact sous `/app` avec repli sur `index.html` | `egen-mobile` | P9 | Dépôt inexistant | Avant P9 |
| HOST-REQ-2 | Capacités `session`, `secureStorage`, `openExternal`, `lifecycle` annoncées au handshake | `egen-mobile` | P4 (test réel), P9 | Dépôt inexistant | Avant P9 |
| HOST-REQ-3 | Rafraîchissement du jeton côté Host (`session.refresh`) contre l'endpoint de `BE-REQ-1` | `egen-mobile` | P4 (test réel), P9 | Dépôt inexistant | Avant P9 |
| DIST-REQ-1 | Consommer `list-apps --platform <cible>` et les paquets `@egen/*-app` publiés | `egen-distributions` | P8 | Dépôt inexistant | Avant P8 |

**Règle de lecture** : une phase peut démarrer sans sa dépendance externe si elle est **simulée** par le banc de test de
P3 (faux Host, API interceptée). Seule la validation réelle (P9) exige les vrais Host, backend et distributions.
