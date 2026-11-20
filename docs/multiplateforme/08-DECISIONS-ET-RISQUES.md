# 08 — Décisions, demandes externes, risques et dérogations

Ce document est le **registre** du programme. Il répond à quatre questions : *qu'est-ce qui est décidé ?* (§1), *qu'attendons-nous des autres ?* (§2),
*qu'est-ce qui peut mal tourner ?* (§3), *qu'est-ce qui déroge à une règle ?* (§4). Le §5 liste ce qui **doit être validé par un humain** avant telle phase.

Statuts d'une décision : **Décidée** (en vigueur) · **Proposée** (recommandée, en attente de validation ; la phase qui en dépend ne démarre pas sans elle).

## 1. Registre des décisions

### D-01 — Périmètre natif : 19 apps — *Décidée*
- **Décision** : 6 apps de catégorie A et 13 de catégorie B sont natives ; 4 apps (C) sont web seulement ; 3 apps (D) sont des outils de développement exclus de toute distribution de production ([03](03-CLASSIFICATION-APPS.md)).
- **Pourquoi** : l'audit n'a trouvé d'incompatibilité bloquante que dans des apps dont la nature est web/bureau (éditeur de thème, outils hors ligne, résolution par sous-domaine) ou développeur.
- **Alternatives écartées** : « les 26 » (livrerait des outils de développement et des fonctions sans sens sur téléphone) ; « minimum login + accueil » (valeur trop faible).
- **Révision** : modifier [03](03-CLASSIFICATION-APPS.md) et la matrice dans la même PR.

### D-02 — Versions d'apps indépendantes, pas de renumérotation — *Décidée*
- **Décision** : chaque app garde sa version (`9.0.2`, `1.0.0`, `0.1.0` coexistent). On **incrémente selon SemVer** quand le comportement publié change : **patch** (correctif sans changement de contrat), **minor** (fonctionnalité compatible, p. ex. une app devient native), **major** (rupture : route retirée, configuration incompatible, plage du framework relevée de majeure).
- **Pourquoi** : npm n'accepte pas de republier une version plus basse ; rien n'exige que les versions soient égales entre apps ; la version ne sert qu'à la publication et au champ `version` du registre de routes.
- **Écartées** : unifier à 9.x (saut artificiel) ; versionnement synchrone de toutes les apps (republication inutile de 26 paquets).
- **Utilisé par** : T0.3, P-9.

### D-03 — Noms de paquets `@egen/*-app` inchangés — *Décidée*
- **Pourquoi** : le nom d'une app est son **identifiant** dans l'import map, le registre de routes, le filtrage de plateforme et `frameworkRange` ; il est publié sur npm. Le renommer casse tous les consommateurs.
- **Écartée** : migration vers `@egen-civitas/*` (aucun gain fonctionnel, risque élevé).

### D-04 — Filtrage au niveau de l'app ; apps mixtes — *Décidée*
- **Décision** : le framework filtre par app. Une petite partie web seulement est neutralisée à l'exécution (`isNativePlatform()`) et chargée paresseusement ; une partie dominante conduit à scinder l'app ; en cas de besoin récurrent, `FW-REQ-4`.
- **Utilisé par** : [03](03-CLASSIFICATION-APPS.md) §5, `appearance`, `home`, `ai-assistant`.

### D-05 — Déclaration explicite et règle de transition — *Décidée*
- **Décision** : chaque app déclare `platforms` ; la valeur est celle de la matrice ; une app A/B **non terminée** est `["web"]` avec `nativePending: true` ; la PR qui la termine bascule les deux champs.
- **Pourquoi** : sans déclaration, le framework enregistre l'app partout ; une app incomplète serait chargée en natif.

### D-06 — Authentification native par jetons `Bearer` (variante A) — *Proposée*
- **Décision** : échange identifiant/mot de passe contre jetons, remis au Host par `session.setTokens` ; rafraîchissement par le Host ; session par `GET /session` avec `Bearer` ([05](05-CONTRAT-SESSION-LOGIN.md) §6).
- **Validation requise** : réponses du backend à Q1–Q8 (`BE-REQ-1`). **Bloque** : fusion de T4.4 et suivantes.
- **Si refusée** : seul `auth/token-strategy.ts` et les fixtures changent ([05](05-CONTRAT-SESSION-LOGIN.md) §6.7).

### D-07 — Pas de paquet partagé dans le core ; copies `SHARED` encadrées — *Décidée*
- **Décision** : le core n'ajoute pas de nouvel espace de travail partagé. Un code utile à **une** app reste local ; à **deux** apps, on **demande** son intégration au framework (`FW-REQ`) ; si **trois apps ou plus** en ont besoin **avant** que le framework ne le livre, on fait une **copie locale identique** dans chaque app, avec le marqueur `// SHARED: <nom> v<n>` en première ligne, et `tools/check-shared-copies.mjs` impose l'identité des copies. Quand le framework livre, **une** PR remplace les copies.
- **Pourquoi** : un paquet partagé interne alourdirait le build et la publication ; l'absence de règle ferait diverger les copies.
- **Utilisé par** : `ExternalLink` (7 apps, `FW-REQ-7`), avatar à initiales (2 apps), image protégée (`FW-REQ-5`).

### D-08 — Politique d'images et de ressources — *Décidée (sauf ligne « API publique », Proposée)*
- **Décision** : démonstration → avatar à initiales ou visuel local ; illustration d'interface → fichier local ; **protégé** → `egenFetch` + `blob:` ; **public de l'API** → seulement après `FW-REQ-2` (*Proposée*) ; polices embarquées ; script/iframe/vidéo distants interdits ; budget ≤ 60 Ko/image, ≤ 600 Ko/app.
- **Pourquoi** : CSP native (`img-src 'self' data: blob:`) et impossibilité de joindre un `Bearer` à un `<img>`.

### D-09 — Tenant natif fixé au build ; `tenant-routing` web seulement — *Proposée*
- **Décision** : une distribution native fixe `EGEN_TENANT_MODE=single` et `EGEN_TENANT_ID` au build ; `esm-tenant-routing-app` (résolution par sous-domaine) n'est pas native.
- **Validation requise** : le produit confirme qu'aucun produit natif n'est multi-tenant à l'exécution. **Si faux** : étudier une résolution par choix explicite dans le login (nouvelle décision, hors plan).

### D-10 — Source maps et budget de taille — *Proposée*
- **Décision** : les `.map` (12,2 Mo sur 33 Mo pour le shell seul) ne sont **pas** embarqués dans l'application native (`FW-REQ-3` / packaging) ; la **baseline** (T0.4, T3.5) fixe le budget ; règle : pas de hausse > 10 % par PR sans justification. La valeur absolue est **fixée après la mesure**.
- **Validation requise** : le responsable produit valide la valeur chiffrée après P3.

### D-11 — Outils et jumeaux — *Décidée pour P0–P7, différée pour la suite*
- **Décision** : pendant P0–P7, les nouveaux outils et la configuration ESLint native **ne sont pas** ajoutés à `tools/shared-paths.txt` (la configuration ESLint est un fichier en cascade sous `packages/apps/`, absent des jumeaux). **T8.3** décide du partage avec l'équipe des projets métier.
- **Pourquoi** : éviter de casser un dépôt jumeau qui n'a ni la matrice ni les mêmes apps (R-10).

### D-12 — Banc e2e natif propre au core — *Décidée*
- **Pourquoi** : l'e2e existant dépend d'un backend Docker ; le banc natif simule le Host et l'API et doit tourner partout.

### D-13 — Voix désactivée en natif (v1) — *Décidée*
- **Pourquoi** : micro et dictée exigent la capacité `permissions` (non livrée) et `SpeechRecognition` est probablement indisponible dans le WebView iOS (H-07). L'assistant fonctionne en mode texte.
- **Réexamen** : P10.

### D-14 — Plein écran masqué en natif — *Décidée*
- **Pourquoi** : l'app native est déjà plein écran ; l'API n'est pas fiable en WebView iOS.

### D-15 — `reload()` en natif — *Proposée, à trancher sur appareil (P9)*
- **Décision provisoire** : `window.location.reload()` est conservé (langue, 404) **si** `HOST-REQ-1` (repli `index.html`) est validé ; sinon, remplacé par `window.location.replace(window.getEgenSpaBase())`.
- **Validation** : parcours P9-11.

### D-16 — URL publique de partage — *Proposée*
- **Décision** : clé de configuration `publicBaseUrl` dans `esm-informations-app` ; Web : défaut `window.location.origin` (inchangé) ; natif : si absente, **le partage est masqué**.
- **Validation requise** : le produit confirme le nom de la clé et d'où vient la valeur dans une distribution.

### D-17 — Plage de compatibilité : peer `^4.1.0` — *Décidée*
- **Décision** : le peer `@egen-civitas/esm-framework` de chaque app vaut `^4.1.0` ; il est la **seule** plage estampillée dans `frameworkRange`.
- **Conséquence** : à la sortie d'une version **majeure** du framework, les apps doivent être republiées (c'est voulu : compatibilité explicite).

### D-18 — Dosage des règles ESLint natives — *Décidée*
- **Décision** : avertissement tant que l'app est `nativePending`, erreur ensuite, désactivées pour C et D ; configuration en cascade sous `packages/apps/`.

### D-19 — Procédure de version et de publication — *Décidée*
- **Décision** : incrément **manuel** de `version` + note `.changeset/<nom>.md` ; l'outil Changesets **n'est pas activé** dans ce programme (aucune configuration n'existe, 24 notes anciennes ne sont pas consommées). `tools/check-version-bump.mjs` détecte l'oubli.
- **Pourquoi** : `npm publish --tolerate-republish` ignore silencieusement une version déjà publiée.

### D-20 — Artefact d'essai jamais publié — *Décidée*
- L'artefact de `build-native-preview` sert aux tests ; l'artefact de produit est fabriqué par `egen-distributions`.

### D-21 — Le comportement Web observable ne change pas — *Décidée*
- **Décision** : P-1 s'applique au **comportement observable** : un lien qui ouvrait un nouvel onglet continue de le faire (`ExternalLink`) ; `esm-not-found-app` garde `window.location.href = "/"` en Web (`X-01`, F-24) ; une correction de défaut Web préexistant est un **autre** chantier.

## 2. Demandes externes

Chaque demande est formulée pour être **envoyée telle quelle**.

### 2.1 Au framework (`FW-REQ-*`)

| ID | Priorité | Titre | Demande | Critère d'acceptation | Bloque |
| --- | --- | --- | --- | --- | --- |
| FW-REQ-1 | **Haute** | Zones sûres | Pour la cible native, le shell déclare `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` (aujourd'hui sans `viewport-fit=cover`, `esm-app-shell/src/index.ejs`) et documente l'usage de `env(safe-area-inset-*)` ; idéalement des variables CSS exposées | L'artefact natif contient `viewport-fit=cover` ; la documentation du shell décrit les variables | P7 (E-31) |
| FW-REQ-2 | Moyenne | Origine de l'API dans `img-src` | La CSP native ajoute, de façon configurable, l'origine de `EGEN_API_URL` à `img-src` (aujourd'hui `'self' data: blob:`) | CSP de l'artefact : `img-src 'self' data: blob: <api>` quand activé ; test dans `targets.test` | P5 (images publiques) |
| FW-REQ-3 | Moyenne | Exclure les `.map` du natif | Ne pas émettre (ou isoler dans un dossier à part) les `.map` pour une cible native | L'artefact natif ne contient aucun `.map` à la racine | P8 (PACK-004) |
| FW-REQ-4 | Basse | Filtre fin | `platforms` accepté au niveau d'une page ou d'une extension | Schéma et loaders mis à jour ; tests | Aucune (confort, `D-04`) |
| FW-REQ-5 | Basse | Image authentifiée | `useAuthenticatedObjectUrl(path)` dans `esm-react-utils` ([06](06-GUIDE-DEVELOPPEUR.md) §4.4) | Hook publié, testé | Aucune (règle des deux usages) |
| FW-REQ-6 | Moyenne | `connect-src` et WebSocket | La CSP native autorise `wss://` pour l'origine de l'API et pour le canal de l'assistant IA (`EGEN_AI_CHANNEL_URL`) | CSP contenant les sources `wss:` utiles ; E-05 vert | P6 vague 5 (**à confirmer** par E-05) |
| FW-REQ-7 | **Haute** | `ExternalLink` | Composant dans `esm-react-utils` : Web → `<a target="_blank" rel="noopener noreferrer">` inchangé ; natif → `navigate({ to })` vers `openExternal` ; mêmes tests que T2.5 | Composant publié ; les copies locales sont remplacées dans **une** PR | Vague 1 de P6 (copie locale entre-temps) |

### 2.2 Au backend (`BE-REQ-*`)

| ID | Titre | Demande | Bloque |
| --- | --- | --- | --- |
| BE-REQ-1 | Contrat d'authentification natif | Répondre à Q1–Q8 de [05](05-CONTRAT-SESSION-LOGIN.md) §6.6 et publier le contrat | **P4** (début) |
| BE-REQ-2 | CORS natif | Autoriser l'origine locale du Host avec les en-têtes `Accept`, `Authorization`, `Content-Type`, `Disable-WWW-Authenticate`, `X-Tenant-ID` (`docs/cors-api-native.md` du framework) | Test réel, P9 |
| BE-REQ-3 | Fichiers protégés compatibles `Bearer` | Confirmer comment servir images/fichiers protégés à une app sans cookie (route à jeton dans l'en-tête, aucune URL signée sans besoin) | P5 (images protégées), vague 2 |

### 2.3 Au Host `egen-mobile` (`HOST-REQ-*`)

| ID | Titre | Exigence |
| --- | --- | --- |
| HOST-REQ-1 | Service de l'artefact | Servir l'artefact sous `/app` ; **repli sur `index.html`** pour toute route inconnue (`/app/home`, `/app/annuaire`…) |
| HOST-REQ-2 | Capacités | Annoncer au handshake `session`, `secureStorage`, `openExternal`, `lifecycle` ; n'autoriser `openExternal` que pour `https:`, `mailto:`, `tel:` |
| HOST-REQ-3 | Rafraîchissement | `session.refresh` appelle l'endpoint de rafraîchissement du backend (`BE-REQ-1`), remplace les deux jetons si rotation, retourne `false` en cas d'échec |
| HOST-REQ-4 | Jetons | Les conserver dans Keychain/Keystore ; n'exposer au WebView que `getAuthorization()` (jamais les jetons bruts) |

### 2.4 À `egen-distributions` (`DIST-REQ-1`)

Consommer `node tools/list-apps.mjs --platform <p> --production --json` et les paquets `@egen/*-app` publiés ; n'inclure **aucune** app de catégorie D ; fixer `EGEN_TENANT_MODE`/`EGEN_TENANT_ID` et fournir `publicBaseUrl` (`D-16`) ; ne pas embarquer les `.map` (`D-10`).

## 3. Registre des risques

Probabilité (P) et impact (I) : B = basse, M = moyenne, H = haute.

| ID | Risque | P | I | Parade | Déclencheur d'alerte |
| --- | --- | --- | --- | --- | --- |
| R-01 | Le contrat backend est tardif ou différent | M | H | Isolation par `AuthStrategy` ; contrat versionné ; P4 simulée | Pas de réponse à Q1–Q8 à la fin de P3 |
| R-02 | Régression Web | M | H | P-1 ; tests nommés `Web :` ; scénarios E-90 à E-94 ; PR petites | Un test Web rouge ou un retour utilisateur |
| R-03 | L'adaptation mobile (F-14) est plus lourde que prévu | H | H | Audit tôt (T7.2) ; parcours prioritaires ; dette datée | Plus de 30 violations E-30/E-32 au premier rapport |
| R-04 | Ressources bloquées non détectées statiquement (CSS `url()`, scripts tiers, WebSocket), ou `publicPath` des assets incorrect | M | H | E-02/E-04 en CSP réelle ; témoin positif T5.2 | `securitypolicyviolation` ou asset 404 |
| R-05 | Les images locales gonflent l'artefact | M | M | Avatars à initiales ; déduplication ; budget | Hausse > 10 % de la baseline |
| R-06 | `reload()` casse (404 sur route profonde) | M | M | `HOST-REQ-1` ; P9-11 ; repli `D-15` | KO sur P9-11 |
| R-07 | La réforme TopBar (`SUIVI-REFORME-TOPBAR`, T8→T12) modifie `primary-navigation` en parallèle | H | M | Coordination ; vague 4 en dernier ; lecture du suivi avant chaque tâche | Conflit de fusion sur `intranet-topbar/` |
| R-08 | Dérive des versions du framework pendant le programme | M | M | `deps:egen:check` en CI (informatif) ; revue mensuelle | Écart > 1 mineure |
| R-09 | Apps sans test masquent des régressions | M | M | Tests de rendu ajoutés ; `help-menu` en vague 1 | — |
| R-10 | Une modification de fichier partagé (`.github`, `tools/`) casse un dépôt jumeau | M | M | `D-11` ; PR dédiées « à synchroniser » ; prévenir l'équipe des projets métier | Échec de CI d'un jumeau après synchronisation |
| R-11 | Appareils indisponibles pour P9 | M | M | Réserver tôt ; émulateurs en complément (non suffisants pour P9-08 à P9-14) | Aucune réservation 4 semaines avant P9 |
| R-12 | Un jeton transite par la mémoire JS à la connexion | B | H | RC-1 à RC-3 ; pas de journal ; test E-14 ; évolution `session.login` (P10) | — |
| R-13 | Une app non terminée est déclarée native | B | H | Règle de transition ; `PLAT-004` | `check-platforms` rouge |
| R-14 | Performance insuffisante sur appareils d'entrée de gamme | M | M | Budget ; chargement paresseux ; mesure T7.7 et P9-19 | Démarrage > baseline +10 % |
| R-15 | Accessibilité insuffisante (cibles, contrastes) | M | M | E-32, E-33, E-34 | Violations `serious` |
| R-16 | Oubli d'incrément de version : changement non publié | M | M | `check-version-bump` ; case du modèle de PR | PR d'app sans incrément |
| R-17 | Copies `SHARED` divergentes | B | M | `check-shared-copies` (`SHARED-001`) | Échec du contrôle |
| R-18 | Un mock partiel masque le comportement natif (test vert à tort) | M | M | [06](06-GUIDE-DEVELOPPEUR.md) §8.1 ; E-20 en réel | Test natif qui passe sans `window.egenTarget` |

## 4. Registre des dérogations

Une dérogation est une **exception datée** à une règle de [06](06-GUIDE-DEVELOPPEUR.md), à ESLint ou à un test obligatoire. Procédure : [06](06-GUIDE-DEVELOPPEUR.md) §11.

| ID | Règle | Fichier | Raison | Ouverte le | Réexamen | Responsable |
| --- | --- | --- | --- | --- | --- | --- |
| X-01 | `N-03` (affectation à `location.href`) | `esm-not-found-app/src/not-found/not-found-page.component.tsx` (branche **Web**) | Conserver le comportement Web (`D-21`, F-24) | 2026-11-15 (préenregistrée) | À la fin de P6 | Équipe core |

Aucune autre dérogation n'est préenregistrée.

## 5. Points à valider par un humain

| # | À valider | Par | Avant |
| --- | --- | --- | --- |
| V-1 | Périmètre natif : 19 apps (D-01) et reclassements éventuels ([03](03-CLASSIFICATION-APPS.md)) | Responsable produit | P1 |
| V-2 | Décision de rendre `check-version-bump` bloquant (D-19) | Responsable core | Fin de P1 |
| V-3 | Contrat d'authentification (D-06, `BE-REQ-1`) | Backend + core | **Début de P4** |
| V-4 | Tenant natif fixé au build (D-09) | Responsable produit | P3 (build de l'artefact) |
| V-5 | Valeur chiffrée du budget de taille (D-10) | Responsable produit | Fin de P3 |
| V-6 | Origine et nom de `publicBaseUrl` (D-16) | Responsable produit | Vague 3 de P6 |
| V-7 | Versions minimales d'Android et d'iOS à supporter (H-06) | Responsable produit | P9 |
| V-8 | Liste des 20 parcours P9 et appareils (T9.1) | Produit + mobile | P9 |
| V-9 | `D-15` (rechargement) | Équipe core sur appareil | Fin de P9 |
| V-10 | Protection de branche : `e2e-native` requis | Responsable core | Après 3 exécutions vertes |
