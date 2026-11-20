# 05 — Session et login natifs : contrat, flux, erreurs

Ce document est la **référence unique** pour la phase P4. Il décrit comment un utilisateur se connecte, reste connecté et se
déconnecte dans l'application native, **sans cookie et sans jeton dans le WebView**.

Statut : **§1 à §5 et §7 à §11 sont fermes** (ils décrivent ce que fournit le framework et ce que le login doit faire).
**§6 (contrat backend) est une proposition à valider** : tant que le backend n'a pas répondu par écrit à Q1–Q8, la décision `D-06` reste
« Proposée » et la fusion de T4.4 est suspendue (voir [04](04-PLAN-PHASES.md) T4.0).

## 1. Principes

1. **Le jeton ne vit que dans le Host** (Keychain/Keystore). Le WebView le reçoit une seule fois, au moment de la connexion, pour le remettre au Host ;
   il n'est ensuite **jamais relu** par du code applicatif.
2. **Le Web ne change pas** : cookie de session, HTTP Basic à la connexion, aucun fournisseur d'autorisation.
3. **Une seule couche choisit** entre les deux mécanismes : `getAuthStrategy()` dans `esm-login-app/src/auth/` (voir [04](04-PLAN-PHASES.md) T4.1).
4. **Échouer explicitement** : un Host sans capacité `session` donne un message clair, pas une connexion « à moitié » (P-10).
5. Le framework fait **tout le reste** : en-tête `Authorization`, rafraîchissement, rejeu. Le core n'écrit aucun intercepteur.

## 2. Situation actuelle (Web)

| Étape | Mécanisme | Code |
| --- | --- | --- |
| Connexion | `GET /ws/rest/v1/session` avec `Authorization: Basic base64(identifiant:mot de passe)` | `refetchCurrentUser(username, password)` de `esm-api` (`current-user.ts` ligne 228-236), appelé par `login.component.tsx` (`handleSubmit`) ; `login.resource.ts` (`performLogin`) fait la même requête |
| Réponse | `Session` (`authenticated`, `user`, `privileges`…) **et cookie de session** posé par le backend | `handleSessionResponse` met à jour le magasin de session |
| Appels suivants | Le **cookie** accompagne chaque requête (`egenFetch`, même origine) | — |
| Déconnexion | `DELETE /ws/rest/v1/session`, vidage du cache SWR, `clearCurrentUser()`, puis `refetchCurrentUser()` | `redirect-logout/logout.resource.ts` |
| Tenant | En mode multi-tenant, `storeHeaderTenantId` écrit le tenant dans `localStorage` (`egen:tenant:active`), envoyé en `X-Tenant-ID` | `login.component.tsx` |
| Développement | `EGEN_DEV_NO_AUTH` simule une session ; **inerte** en natif | `applyDevAuthBypassForLogin` |
| Mot de passe | `POST /ws/rest/v1/password` avec `{ oldPassword, newPassword }` | `change-password.resource.ts` |

**Pourquoi ce flux ne peut pas servir en natif** : le WebView a une origine locale différente de celle de l'API ; le framework impose
`credentials: 'omit'` (aucun cookie ne partirait) ; et le framework attend un fournisseur d'autorisation alimenté par le Host.

## 3. Ce que fournit le framework (à ne pas réécrire)

### 3.1 La capacité `session` (cible native)

`getPlatform().session` expose (signatures vérifiées dans `esm-platform/src/types.ts`) :

```ts
interface SessionCapability {
  getAuthorization(): Promise<string | null>;   // valeur de l'en-tête (« Bearer … »), ou null s'il n'y a pas de session
  setTokens(tokens: { access: string; refresh?: string; expiresAt?: number }): Promise<void>;
  refresh(): Promise<boolean>;                  // true si un nouveau jeton a été obtenu
  clear(): Promise<void>;
}
```

- `access` est le **jeton d'accès brut** (sans le préfixe `Bearer `) ; `expiresAt` est un **instant en millisecondes depuis l'epoch** (indice facultatif).
- Les valeurs sont validées côté client avant l'envoi au Host (type, finitude de `expiresAt`) ; une valeur invalide donne `PlatformError('INVALID_ARGS')`.
- **Web** : `has('session')` est **vrai** mais la capacité est vide : `getAuthorization` → `null`, `refresh` → `false`, `clear` → sans effet,
  `setTokens` → `PlatformError('UNAVAILABLE')` (aucun jeton n'est jamais stocké dans le navigateur).

### 3.2 Le fournisseur d'autorisation d'`egenFetch`

En natif, le shell pose au démarrage un fournisseur `{ getAuthorization, refresh, credentials: 'omit' }` branché sur `platform.session`.
Conséquences pour le core :

- **Chaque** appel `egenFetch` porte `Authorization: <valeur du Host>` s'il y a une session, et **aucun cookie** ;
- sur **HTTP 401**, le framework appelle `refresh()` **une fois** (plusieurs 401 simultanés partagent un seul appel) et **rejoue** la requête une fois ;
  si `refresh()` retourne `false`, la réponse 401 est rendue à l'appelant ;
- le premier appel de session attend `getAuthorization()` ; si le handshake a échoué (Host incompatible), il **rejette** avec la `PlatformError` (le shell affiche alors son écran bloquant) ;
- pour un appel **sans** session (la connexion elle-même), `getAuthorization()` retourne `null` : **aucun en-tête** n'est ajouté.

### 3.3 `refetchCurrentUser()` sans identifiants

`refetchCurrentUser()` (sans argument) interroge `GET /ws/rest/v1/session` ; en natif, le fournisseur y ajoute `Bearer`. Le framework signale lui-même
le point ouvert : *« confirmer, avec le backend, si `sessionEndpoint` accepte Bearer ; sinon définir l'endpoint équivalent »* (voir Q4).

### 3.4 Répartition des responsabilités

| Sujet | Login (core) | Framework | Host | Backend |
| --- | --- | --- | --- | --- |
| Saisie et validation du formulaire | ✔ | | | |
| Échange identifiant/mot de passe → jetons | ✔ (appel HTTP) | | | ✔ (endpoint) |
| Conserver les jetons | | | ✔ (`setTokens`, Keychain/Keystore) | |
| Ajouter `Authorization` aux appels | | ✔ | fournit la valeur | vérifie |
| Rafraîchir sur 401 et rejouer | | ✔ (déclenche) | ✔ (`refresh` appelle le backend) | ✔ (endpoint) |
| Récupérer la `Session` utilisateur | ✔ (`refetchCurrentUser()`) | ✔ | | ✔ |
| Déconnexion locale | ✔ (`clear`) | | ✔ (efface) | |
| Révocation côté serveur | ✔ (appel HTTP, échec toléré) | | | ✔ |

### 3.5 Changement de mot de passe

`POST /ws/rest/v1/password` `{ oldPassword, newPassword }` est un appel `egenFetch` ordinaire : il porte `Bearer` en natif sans changement de code.
**À confirmer par le backend (Q7)** : l'endpoint accepte `Bearer`, et il ne **révoque pas** la session courante après changement (sinon l'app doit se
reconnecter ; dans ce cas, prévoir le message et le retour au login).

## 4. Flux natif cible

### 4.1 Connexion

```
Utilisateur     Login (WebView)               Framework/Host                Backend
    │  saisie        │                              │                          │
    ├───────────────►│                              │                          │
    │                │ POST {restBaseUrl}/auth/token { username, password }    │
    │                ├────────────────────────────────────────────────────────►│
    │                │              200 { accessToken, refreshToken, expiresIn }
    │                │◄────────────────────────────────────────────────────────┤
    │                │ valide la réponse (schéma zod)                          │
    │                │ session.setTokens({access, refresh, expiresAt})         │
    │                ├────────────────────►│ (Keychain/Keystore)               │
    │                │◄────────────────────┤ ok                                │
    │                │ efface les variables locales des jetons                  │
    │                │ refetchCurrentUser()  → GET /session + Authorization    │
    │                ├────────────────────────────────────────────────────────►│
    │                │◄──────────────────────────── 200 Session ───────────────┤
    │                │ stocker le tenant (non secret), rediriger (loginSuccess) │
```

### 4.2 Appel API ordinaire

`egenFetch(url)` → `getAuthorization()` (Host) → requête avec `Authorization`, sans cookie → réponse. Aucun code du core n'intervient.

### 4.3 Expiration du jeton d'accès, puis rafraîchissement

```
egenFetch ──► Backend : 401
egenFetch ──► Host : session.refresh()
Host ──► Backend : POST /auth/refresh { refreshToken }   (le Host détient le jeton de rafraîchissement)
Backend ──► Host : 200 { accessToken, refreshToken?, expiresIn }   → Host remplace ses jetons
Host ──► egenFetch : true
egenFetch ──► Backend : requête REJOUÉE (une seule fois) avec le nouveau jeton → 200
```

### 4.4 Échec du rafraîchissement

`Host.refresh()` retourne `false` (jeton de rafraîchissement expiré ou révoqué) → la réponse 401 est rendue à l'appelant → le comportement existant
de l'app (configuration `redirectAuthFailure`) renvoie l'utilisateur à `login` avec le message **« Votre session a expiré »** (clé `sessionExpired`).
Le login, à l'ouverture, **n'affiche pas d'erreur** et ne boucle pas (RC-5).

### 4.5 Déconnexion

1. Tentative de révocation : `DELETE /ws/rest/v1/session` avec `Bearer` (**échec toléré** : réseau coupé, 401, 5xx) ;
2. **Toujours** `session.clear()` ;
3. vidage du cache SWR ; `clearCurrentUser()` ;
4. redirection vers `login`.

L'ordre assure que l'utilisateur est déconnecté **localement** même hors ligne.

### 4.6 Démarrage à froid avec une session existante

1. Le shell démarre, le handshake réussit ;
2. `refetchCurrentUser()` s'exécute (via `setup` d'`esm-api`) : `getAuthorization()` retourne le jeton conservé ;
3. si le jeton est expiré → 401 → `refresh()` → rejeu (4.3) ; si le rafraîchissement échoue → `login` (4.4) ;
4. la garde de session (`esm-user-profile-app`) **attend que la session soit résolue** avant toute redirection (RC-5).

## 5. Erreurs et expérience utilisateur

| Condition | Source | Code interne | Clé de traduction | Message FR | Action |
| --- | --- | --- | --- | --- | --- |
| Identifiant ou mot de passe incorrect | 401 de l'échange | `AUTH_INVALID_CREDENTIALS` | `invalidCredentials` (existante) | « Identifiant ou mot de passe incorrect » | Rester sur le formulaire, vider le mot de passe |
| Compte verrouillé / accès refusé | 403 de l'échange | `AUTH_FORBIDDEN` | `accountLocked` (nouvelle) | « Accès refusé pour ce compte » | Idem |
| Trop de tentatives | 429 (avec `Retry-After`) | `AUTH_RATE_LIMITED` | `tooManyAttempts` (nouvelle) | « Trop de tentatives, réessayez dans quelques instants » | Désactiver le bouton pendant `Retry-After` |
| Réseau indisponible / délai dépassé | échec de `fetch` | `AUTH_NETWORK` | `networkError` (nouvelle) | « Connexion impossible. Vérifiez votre réseau » | Conserver l'identifiant |
| Réponse du backend hors contrat | validation du schéma | `AUTH_PROTOCOL` | `authProtocolError` (nouvelle) | « Réponse inattendue du serveur » | Journaliser **sans** donnée sensible |
| Le Host refuse de stocker les jetons | `PlatformError` `DENIED` ou `HOST_ERROR` de `setTokens` | `AUTH_SECURE_STORAGE` | `secureStorageError` (nouvelle) | « Impossible de sécuriser votre session sur cet appareil » | Ne pas poursuivre la connexion |
| Le Host ne fournit pas `session` | `has('session')` faux, ou `UNAVAILABLE` | `AUTH_NO_SESSION_CAPABILITY` | `hostSessionMissing` (nouvelle) | « Cette version de l'application ne peut pas se connecter. Mettez-la à jour » | Aucun envoi des identifiants |
| Session expirée | 401 après échec de `refresh()` | — | `sessionExpired` (nouvelle) | « Votre session a expiré, veuillez vous reconnecter » | Redirection vers `login` |
| Handshake en échec | `PlatformError` `INCOMPATIBLE` | — | (écran du shell) | « Mise à jour de l'application requise » | Écran bloquant, sans connexion |

**Règles** : (1) aucun message n'affiche une valeur saisie ni un jeton ; (2) les **codes internes** servent aux tests et aux journaux, jamais à l'affichage ;
(3) chaque clé existe en français et en anglais ; (4) le champ mot de passe est **vidé** après chaque tentative en échec ; (5) **le code actuel affiche `error.message` tel quel**
(`login.component.tsx:264`) : en natif, **tout** message passe par la table ci-dessus, jamais par le texte brut d'une erreur (il peut contenir du texte renvoyé
par le serveur ou par le Host). Le comportement Web est conservé tel quel.

## 6. Contrat backend (**proposition — à valider**)

Hypothèse `H-01`. Cette proposition est la plus simple compatible avec le framework ; elle est écrite pour que le backend dise « oui », « oui avec ces
changements » ou « non, voici l'alternative ». **Aucune ligne de ce paragraphe n'est implémentée tant qu'elle n'est pas validée.**

### 6.1 Échange identifiant/mot de passe contre des jetons

```
POST {restBaseUrl}/auth/token
Content-Type: application/json
Accept: application/json
X-Tenant-ID: <tenant>            (si un tenant est actif)

{ "username": "…", "password": "…" }
```

Réponse `200` :

```json
{ "accessToken": "…", "refreshToken": "…", "expiresIn": 900, "tokenType": "Bearer" }
```

- `expiresIn` en **secondes** ; le login calcule `expiresAt = Date.now() + expiresIn * 1000` (indice facultatif, jamais utilisé pour une décision de sécurité).
- Erreurs : `400` (requête mal formée), `401` `{ "error": "invalid_credentials" }`, `403` `{ "error": "account_locked" }`, `429` (avec `Retry-After`), `5xx`.
- La requête **ne porte pas** d'en-tête `Authorization` (il n'y a pas encore de session).

### 6.2 Rafraîchissement (appelé **par le Host**, pas par le WebView)

```
POST {restBaseUrl}/auth/refresh
{ "refreshToken": "…" }
```

Réponse `200` : même forme que 6.1 (le `refreshToken` peut être **renouvelé** : le Host remplace alors ses deux jetons). `401` `{ "error": "invalid_refresh_token" }`
si expiré ou révoqué.

### 6.3 Session utilisateur

`GET {restBaseUrl}/session` avec `Authorization: Bearer <accessToken>` → `200` `Session` (même forme qu'aujourd'hui) ; `401` si le jeton est invalide.

### 6.4 Déconnexion et révocation

`DELETE {restBaseUrl}/session` avec `Bearer` → `204`, et **révoque la session entière** (jeton d'accès **et** de rafraîchissement). Le WebView n'a pas accès au jeton de rafraîchissement
après `setTokens` : la révocation se fait donc **à partir du jeton d'accès**.

### 6.5 Exigences transverses

- **CORS** : l'origine locale du Host autorisée, avec les en-têtes `Accept`, `Authorization`, `Content-Type`, `Disable-WWW-Authenticate`, `X-Tenant-ID`
  (liste figée par test côté framework : `docs/cors-api-native.md` de `Frontend-esm-framework`) ; réponse de pré-vérification (`OPTIONS`) pour les routes ci-dessus.
- **Réponse 401 sans `WWW-Authenticate`** bloquant (le framework envoie `Disable-WWW-Authenticate`).
- **HTTPS uniquement.**
- **Durées recommandées** : jeton d'accès court (ex. 15 minutes), jeton de rafraîchissement long avec renouvellement ; à fixer par le backend.
- **Les endpoints Web existants ne changent pas.**

### 6.6 Questions à poser au backend (`BE-REQ-1`)

| # | Question | Réponse (à remplir) | Date | Par |
| --- | --- | --- | --- | --- |
| Q1 | Le backend peut-il exposer l'échange 6.1 (nom de route, forme des corps) ou propose-t-il un autre mécanisme ? | | | |
| Q2 | Le jeton de rafraîchissement est-il renouvelé à chaque usage (rotation) ? Que se passe-t-il si l'ancien est réutilisé ? | | | |
| Q3 | Durées de vie du jeton d'accès et du jeton de rafraîchissement ? | | | |
| Q4 | `GET /session` accepte-t-il `Authorization: Bearer` ? Sinon, quel endpoint équivalent retourne la `Session` ? | | | |
| Q5 | `DELETE /session` révoque-t-il les deux jetons ? Existe-t-il un endpoint de révocation distinct ? | | | |
| Q6 | Comment le tenant est-il déterminé pour l'échange (en-tête `X-Tenant-ID`, corps, domaine) ? | | | |
| Q7 | `POST /password` accepte-t-il `Bearer` ? Révoque-t-il la session courante ? | | | |
| Q8 | Politique de limitation de débit (429, `Retry-After`) et de verrouillage de compte (403) : codes et corps exacts ? | | | |

### 6.7 Si le backend répond autrement

La conséquence est **localisée** : seul `auth/token-strategy.ts` (et ses fixtures de test) change. Cas prévisibles :

- *Les jetons sont renvoyés dans des en-têtes au lieu du corps* : adapter la lecture dans la stratégie ; schéma de validation d'en-têtes.
- *Pas de jeton de rafraîchissement* : `setTokens({ access, expiresAt })` sans `refresh` ; `Host.refresh()` retournera `false` ; la session native dure la vie du jeton d'accès (à
  communiquer au produit).
- *Flux OAuth2/OIDC avec navigateur système* : hors périmètre du plan actuel ; nécessiterait une capacité supplémentaire du Host (décision de produit et du framework).

## 7. Règles de conception (RC)

| # | Règle |
| --- | --- |
| RC-1 | Le jeton n'est manipulé que dans `token-strategy.ts`, **dans une seule fonction**, et n'est ni journalisé, ni mis en état React, ni passé en prop |
| RC-2 | Aucune écriture de stockage navigateur contenant un jeton, un mot de passe ou un nom évoquant un secret (règle ESLint N-05, scénario E-14) |
| RC-3 | Après `setTokens`, les variables locales qui contenaient les jetons sont **hors de portée** (pas de variable de module) |
| RC-4 | Le champ mot de passe est vidé après chaque tentative ; `autoComplete` reste celui du formulaire actuel (aucun changement pour le Web) |
| RC-5 | La garde de session **attend la résolution** de la session avant toute redirection ; une session en cours de chargement n'est ni « connecté » ni « déconnecté ». Garantie aujourd'hui par `useSession()` (Suspense jusqu'à `loaded`) : **ne pas la contourner** (ne pas lire le magasin de session sans attendre `loaded`) |
| RC-6 | La stratégie jeton ne s'active que si `isNativePlatform()` **et** `has('session')` ; sinon erreur explicite (P-10) |
| RC-7 | La déconnexion locale (`clear`) a lieu **même si** la révocation échoue |
| RC-8 | Toute réponse du backend est **validée** (schéma) avant usage ; une réponse hors schéma est une erreur, jamais une valeur par défaut |
| RC-9 | Le tenant (non secret) peut continuer d'être stocké (`egen:tenant:active`) ; **aucune autre donnée de session** n'est persistée dans le WebView |

## 8. Sécurité

| Sujet | Position |
| --- | --- |
| Où vivent les jetons | Keychain/Keystore du Host. Le WebView les voit **une fois** (réponse de l'échange) avant de les remettre au Host ; c'est une **limite connue** (R-12) |
| Durcissement possible | Capacité `session.login` où le Host fait lui-même l'échange (les jetons ne passent jamais par le JS) : évolution du framework et du Host, hors plan actuel (P10) |
| Journaux | Aucun journal applicatif ne contient de jeton, de mot de passe, d'en-tête ou de corps de requête de connexion (le framework garantit que les `PlatformError` n'embarquent aucun argument d'appel) |
| Messages d'erreur | Jamais de valeur saisie ni de jeton ; codes internes non affichés |
| Capture d'écran / aperçu des tâches | Hors périmètre du core (comportement du Host) ; le champ mot de passe reste de type `password` |
| Transport | HTTPS uniquement ; épinglage de certificat éventuel = affaire du Host |
| Injection (XSS) | Les jetons n'étant pas lisibles depuis le JS après la connexion, un script injecté ne peut pas les exfiltrer (le Web, lui, repose sur le cookie `HttpOnly` du backend) |

## 9. Tests (mapping vers [07](07-TESTS-ET-CI.md))

| Scénario | Précondition | Assertions principales |
| --- | --- | --- |
| E-10 | Host simulé avec `session` ; API simulée selon 6.1 | `setTokens` reçu **une fois** avec `access`, `refresh`, `expiresAt` cohérent ; la page d'accueil s'affiche |
| E-11 | Connecté | Les requêtes suivantes portent `Authorization: Bearer …` ; **aucun cookie** |
| E-12 | L'API répond `401` une fois puis `200` | `session.refresh` appelé **1 fois** ; requête rejouée avec le nouveau jeton ; l'utilisateur ne voit rien |
| E-13 | `refresh` retourne `false` | Retour à `login`, message `sessionExpired`, pas de boucle (≤ 2 requêtes de session) |
| E-14 | Après E-10 | `localStorage`, `sessionStorage`, cookies et IndexedDB **ne contiennent** ni `accessToken` ni `refreshToken` ; seule `egen:tenant:active` est admise |
| E-15 | Host **sans** `session` | Message `hostSessionMissing` ; **aucune** requête d'échange envoyée |
| E-16 | Connecté ; API coupée | `session.clear` appelé ; retour à `login` |
| E-17 | API répond `401 invalid_credentials` | Message `invalidCredentials`, champ mot de passe vidé, aucun `setTokens` |
| E-18 | API injoignable | Message `networkError`, aucun `setTokens` |
| E-19 | Connecté | `POST /password` porte `Bearer` |
| E-90 (Web) | Sans Host | Le login Web envoie `Authorization: Basic` ; aucun appel à `setTokens` |

Fixtures : `e2e-native/fixtures/auth-token-success.json`, `auth-token-401.json`, `auth-token-403.json`, `auth-token-429.json`, `auth-malformed.json`, `session-200.json`.

## 10. Compatibilité et migration

- **Web** : aucune migration. La stratégie cookie est le comportement actuel, déplacé sans modification.
- **Natif** : nouvelle stratégie. `requiredCapabilities: ["session"]` dans `routes.json` : un Host sans `session` ne charge pas le login et l'utilisateur est informé par l'écran du shell ou par `hostSessionMissing`.
- **Versions** : le login passe en **minor** (nouvelle fonctionnalité compatible) ; son `routes.json` publié porte `platforms` natives à la fin de P4.

## 11. Ce que ce document ne couvre pas

Authentification **sans mot de passe** (SSO, OIDC avec navigateur système, biométrie), **inscription** et **récupération de mot de passe** (inexistantes dans l'app actuelle),
**multi-comptes** sur un même appareil, **verrouillage biométrique** de l'app (P10).
