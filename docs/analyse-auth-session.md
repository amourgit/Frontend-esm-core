# Analyse — Système d'authentification, sessions, store global & bypass dev

**Date :** 17 juillet 2026
**Contexte :** vérification demandée du système d'authentification/session, et
diagnostic du bypass `EGEN_DEV_NO_AUTH` qui ne rendait pas la session visible
« comme une vraie connexion » dans toutes les apps et packages (notamment IA).
**Verdict :** le système d'auth lui-même (types `Session`, flux de login,
`egenFetch`, gestion des privilèges) est sain. Le problème réel n'était **pas**
propre au bypass : c'est un défaut de partage Module Federation qui touche
**tout le monorepo**, dont le bypass n'était qu'un symptôme visible. Deux bugs
fonctionnels réels ont aussi été trouvés et corrigés (faute de frappe, logout
qui ne se propageait pas en mode bypass).

---

## 1. Le vrai problème : `@egen/esm-state` n'était partagé nulle part

`sessionStore` (`esm-api/src/current-user.ts`) est créé via
`createGlobalStore('session', ...)` de `@egen/esm-state` — exactement le même
mécanisme que le store tenant déjà audité (voir `docs/analyse-esm-tenant.md`).
Ce store n'est un véritable singleton partagé entre le shell et chaque app
fédérée QUE si `@egen/esm-state` est marqué `shared: { singleton: true }`
dans la configuration Module Federation de **chaque conteneur**.

Audit systématique de tout le monorepo (`peerDependencies` de chaque
`package.json`, `dependencies.json` du shell) :

| Package | Utilisé par | Déclaré partagé avant cette session |
|---|---|---|
| `@egen/esm-state` | tenant, session, config, navigation, extensions, offline, styleguide, **ai-config**, **ai-context** (`createGlobalStore`, 10 packages) | Seulement 4 apps (celles déjà corrigées pour le tenant) |
| `@egen/esm-api` | `sessionStore`, `egenFetch`, `getTenantId` | **Aucune app**, y compris le shell (déclaré en `dependencies` mais jamais en `shared`) |
| `@egen/esm-react-utils` | `useSession()` (cache module-scope) | **Aucune app** |
| `@egen/esm-config` | `provide()`/`getConfig()` — utilisé par `egenFetch` pour lire `redirectAuthFailure` | **Aucune app**, y compris le shell |

Concrètement : le shell importe `initDevAuthBypass` **directement** depuis
`@egen/esm-api` (`run.ts`), alors que les apps remote l'utilisent quasi
toujours **via le barrel `@egen/esm-framework`** (toujours partagé, lui). Deux
chemins de résolution différents pour le même package, sans qu'aucun des deux
soit déclaré comme singleton par le conteneur qui l'utilise directement (le
shell) → risque réel de double instance du store de session entre le shell et
les apps, du même ordre que ce qui avait été diagnostiqué pour le tenant.

### Correctif

`@egen/esm-api`, `@egen/esm-config`, `@egen/esm-react-utils` et
`@egen/esm-state` sont désormais déclarés en `dependencies` **et**
`peerDependencies` dans les **10 apps** du monorepo, et ajoutés à
`esm-app-shell/dependencies.json` (shared Module Federation) — même
traitement que ce qui avait déjà été fait pour `@egen/esm-tenant`. Comme ces
4 packages sont le socle (`createGlobalStore`) de 10 autres packages
(config, tenant, session, navigation, extensions, offline, styleguide,
ai-config, ai-context), ce correctif résout la classe de bug entière, pas
seulement la session — y compris pour les packages IA, qui utilisent le même
mécanisme (`esm-ai-config`, `esm-ai-context`).

---

## 2. Faute de frappe : `@igen/esm-api` au lieu de `@egen/esm-api`

Dans `esm-app-shell/src/run.ts`, la désactivation de la redirection 401→/login
en mode bypass était enregistrée via :

```ts
provide({ '@igen/esm-api': { redirectAuthFailure: { enabled: false, ... } } }, 'igen-dev-no-auth-config');
```

Reliquat de l'ancien nom du projet (IGEN → EGEN). Comme `getConfig()` lit la
config par clé exacte (`getConfig('@egen/esm-api')`, voir `egen-fetch.ts`),
cette surcharge ne s'appliquait **jamais** au vrai module — `redirectAuthFailure.enabled`
restait à sa valeur par défaut (`true`). En bypass, un 401/403 inattendu sur
un appel API (hors session, non intercepté) aurait donc quand même pu
déclencher une redirection vers `/login`, ce qui va à l'encontre de l'objectif
du mode bypass. Corrigé (`@egen/esm-api`, label renommé
`egen-dev-no-auth-config`). Un balayage complet du repo n'a trouvé aucune
autre occurrence de `@igen/` résiduelle.

---

## 3. Bug réel : le logout ne fonctionnait pas en mode bypass

Le flux réel de déconnexion (`esm-login-app/src/redirect-logout/logout.resource.ts`) :

```ts
await egenFetch(`${restBaseUrl}/session`, { method: 'DELETE' });
clearCurrentUser();              // met authenticated:false dans le store local
await refetchCurrentUser();      // relit IMMÉDIATEMENT le endpoint session
```

L'interception fetch du bypass ne distinguait ni la méthode HTTP ni un état
« déconnecté » — elle renvoyait **toujours** la session authentifiée fictive,
y compris pour un `DELETE`. Résultat : le `refetchCurrentUser()` juste après
`clearCurrentUser()` récupérait de nouveau `authenticated: true` et annulait
silencieusement la déconnexion. Un développeur cliquant sur « déconnexion »
en mode bypass restait connecté.

### Correctif

L'interception distingue maintenant la méthode :
- `DELETE /session` → marque l'état interne comme déconnecté, répond `204`.
- toute lecture suivante (`GET`) → répond `{authenticated:false}` tant que la
  session n'a pas été réinjectée (nouvelle soumission du formulaire de login,
  qui reste fonctionnel et réactive l'état connecté).

---

## 4. Changement de philosophie : injection immédiate au boot

**Avant :** `initDevAuthBypass()` (appelé au tout début de `run()`, avant
toute app) installait uniquement l'interception fetch. La session fictive
n'était écrite dans le store qu'à la **soumission du formulaire de login**
(`applyDevAuthBypassForLogin()`, appelé dans `handleSubmit`). Toute app qui ne
passe jamais par `/login` — l'assistant IA, la topbar au premier rendu, un
lien profond ouvert directement — pouvait se retrouver avec un
`sessionStore` non chargé ou vide, selon l'ordre de montage des
microfrontends et selon qu'elle déclenchait ou non son propre
`getSessionStore()`.

**Maintenant :** `initDevAuthBypass()` peuple **directement et
synchrones** le `sessionStore` global dès son appel — avant le montage de
la moindre app, sans passer par un cycle fetch (donc sans dépendre d'un
`window.fetch` déjà patché, ni du compteur de tentatives/échecs de
`current-user.ts`). C'est un cas de connexion déjà établi, comme si le
backend avait déjà répondu, disponible immédiatement pour
`useSession()`/`getSessionStore()`/`getCurrentUser()`/`getLoggedInUser()`
n'importe où dans l'app — y compris dans les packages IA qui ne touchent
jamais `/login`.

L'interception fetch reste en place comme filet de sécurité pour tout
refetch explicite ultérieur (`setUserProperties`, `setSessionLocation`,
logout).

---

## 5. Ce qui a été vérifié et jugé sain (pas de bug trouvé)

- **Types `Session`/`LoggedInUser`/`Privilege`/`Role`** (`esm-api/src/types.ts`) :
  cohérents avec ce que `handleSessionResponse()` attend.
- **`egenFetch`** : passe bien par `window.fetch` (donc correctement intercepté
  par le bypass), gère 204/200/erreurs proprement, injecte déjà
  `X-Tenant-ID` automatiquement (voir audit tenant).
- **`userHasAccess`/`userHasPrivilege`/`isSuperUser`** : logique de privilèges
  correcte, y compris le super-utilisateur "System Developer" — la session
  fictive du bypass déclare bien ce rôle, donc `userHasAccess(...)` retourne
  toujours `true` en bypass, comme attendu d'un admin de test.
- **`TopBar`** (`esm-primary-navigation-app`) : la règle de répartition des
  responsabilités entre le guard tenant (mode multi) et la TopBar elle-même
  (mode single/off) pour la redirection vers `/login` est cohérente et
  fonctionne identiquement avec la session bypass qu'avec une vraie session.
- **Page `/login`** : ne redirige pas automatiquement un utilisateur déjà
  authentifié qui y navigue directement (aucun garde en tête de composant) —
  ce comportement est **identique** en bypass et en connexion réelle (pas une
  régression du bypass, une caractéristique du système existant, hors
  périmètre de cette vérification).
- **`useSessionContext`/`useSessionContextStore`** : nom trompeur — ce sont
  des « sessions de travail » métier (type `WorkSession`), sans rapport avec
  la session d'authentification. Pas de bug, juste une collision de
  vocabulaire à garder en tête.

---

## 6. Vérification recommandée côté build réel

Cette analyse est basée sur une lecture exhaustive du code et une
vérification syntaxique fichier par fichier (l'installation complète du
monorepo via `yarn install` échoue dans cet environnement sandbox sur une
limitation WASM, empêchant l'exécution de la suite de tests). À valider une
fois un build réel possible :

1. `yarn workspace @egen/esm-api test` — couvre le nouveau fichier
   `dev-auth-bypass.test.ts` (injection au boot, logout, ré-authentification).
2. Lancer le shell avec `EGEN_DEV_NO_AUTH=true` et vérifier dans les DevTools
   que la topbar, l'assistant IA et toute autre app affichent immédiatement
   « Administrateur (Dev) » sans jamais passer par `/login`.
3. Tester le logout en bypass : après clic sur déconnexion, vérifier que
   l'état reste bien déconnecté (pas de ré-authentification silencieuse).
4. Optionnel mais recommandé : inspecter le Module Federation shared scope
   dans les DevTools réseau/sources pour confirmer qu'une seule instance de
   `@egen/esm-state` est chargée à travers shell + apps (pas une par
   conteneur).
