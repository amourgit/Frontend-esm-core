# Guide d'implémentation — `esm-agenda-app` (Agenda EGEN) basé sur DayFront

> **Objet** : intégrer un calendrier CalDAV complet (mois / semaine / jour / agenda, événements, récurrence, tâches, calendriers multiples) dans l'écosystème **EGEN**, en réutilisant le code de [DayFront](https://github.com/Erik-A-Smith/DayFront) (licence MIT), avec **Radicale** comme serveur CalDAV et l'identité **EGEN / Keycloak**.
>
> **Public** : Samuel (lead dev CIVITAS/EGEN).
> **Date de l'étude** : 5 octobre 2026.
> **Méthode** : lecture réelle (clonage) de `Frontend-esm-framework` (`cbf344f`), `Frontend-esm-core` (`0f967e7`) et `DayFront` (`8aef796`). Chaque affirmation de la section 2 est tirée d'un fichier précis, cité entre `backticks`. Tout ce qui n'a **pas** pu être vérifié est marqué **⚠ À VÉRIFIER**.
> **Statut** : aucun dépôt n'a été modifié. Ce document est un plan d'exécution, pas un patch.

---

## Table des matières

1. [Verdict et corrections de l'hypothèse initiale](#1-verdict-et-corrections-de-lhypothèse-initiale)
2. [Ce que l'étude des dépôts a établi (faits vérifiés)](#2-ce-que-létude-des-dépôts-a-établi-faits-vérifiés)
3. [Fichiers à lire (et à ne pas lire) — budget de lecture ciblé](#3-fichiers-à-lire-et-à-ne-pas-lire--budget-de-lecture-ciblé)
4. [Architecture cible](#4-architecture-cible)
5. [Décisions d'architecture (ADR)](#5-décisions-darchitecture-adr)
6. [Plan de mise en œuvre](#6-plan-de-mise-en-œuvre)
   - [Phase 0 — Préparation](#phase-0--préparation)
   - [Phase 1 — Infrastructure : Radicale + reverse proxy](#phase-1--infrastructure--radicale--reverse-proxy)
   - [Phase 2 — La gateway (BFF dérivé de DayFront API)](#phase-2--la-gateway-bff-dérivé-de-dayfront-api)
   - [Phase 3 — Squelette `esm-agenda-app` dans le Core](#phase-3--squelette-esm-agenda-app-dans-le-core)
   - [Phase 4 — Portage de l'UI DayFront](#phase-4--portage-de-lui-dayfront)
   - [Phase 5 — Intégration au shell (navigation, 404, fil d'Ariane)](#phase-5--intégration-au-shell-navigation-404-fil-dariane)
   - [Phase 6 — i18n, thème, accessibilité](#phase-6--i18n-thème-accessibilité)
   - [Phase 7 — Tests](#phase-7--tests)
   - [Phase 8 — CI, build, publication, déploiement](#phase-8--ci-build-publication-déploiement)
   - [Phase 9 — Extensions EGEN et calendriers collectifs](#phase-9--extensions-egen-et-calendriers-collectifs)
7. [Sécurité](#7-sécurité)
8. [Checklists de validation (Definition of Done)](#8-checklists-de-validation-definition-of-done)
9. [Risques, limites et questions ouvertes](#9-risques-limites-et-questions-ouvertes)
10. [Annexes — code et configuration complets](#10-annexes--code-et-configuration-complets)

---

## 1. Verdict et corrections de l'hypothèse initiale

Le document de départ (celui que tu as collé) propose de « forker DayFront, extraire la logique CalDAV, supprimer l'authentification, brancher Module Federation ». **La direction est bonne, mais trois hypothèses du document sont fausses ou incomplètes**, et elles changent le plan :

| # | Hypothèse du document initial | Réalité (vérifiée dans le code) | Conséquence |
|---|---|---|---|
| 1 | « DayFront = une application web avec un client CalDAV dedans » | **DayFront est un monorepo pnpm à deux applications** : `apps/web` (React + Vite + FullCalendar) et `apps/api` (**serveur Express 5 qui parle CalDAV**). Le navigateur ne parle **jamais** CalDAV : il appelle `/api/v1/...` (JSON) sur l'API DayFront, qui traduit en CalDAV/WebDAV vers Radicale (`apps/api/src/caldav/client.ts`, `apps/api/src/calendar/*`). | Il faut **deux livrables** : un microfrontend (`esm-agenda-app`) **et** un service backend (la « gateway »). On ne peut pas « garder la logique CalDAV » dans le microfrontend. |
| 2 | « Supprimer l'authentification de DayFront, EGEN/Keycloak décide » | L'auth DayFront n'est pas un simple écran à retirer : en mode `caldav-login`, la session est un **cookie chiffré contenant le login ET le mot de passe CalDAV** (`apps/api/src/auth.ts`, AES-256-GCM, cookie `dayfront_session`, `SameSite=Strict`), puis réutilisé pour chaque requête vers Radicale. En mode `single-user`, un **compte CalDAV unique partagé** sert tout le monde. **Aucun des deux modes n'est compatible avec Keycloak/SSO.** | Il faut **écrire un nouveau mode d'authentification côté gateway** (identité EGEN → principal Radicale), pas seulement retirer `LoginPage.tsx`. |
| 3 | « Radicale reste responsable de l'accès réel aux collections » | Vrai **uniquement si** Radicale authentifie lui-même les utilisateurs. Avec SSO, le modèle réaliste est : la gateway est de confiance et transmet l'identité à Radicale via un en-tête (`X-Remote-User`). Dans ce modèle **la gateway devient le point d'application des politiques** et Radicale ne doit **jamais** être joignable autrement que par elle. | Section 7 (sécurité) : isolation réseau obligatoire, sinon usurpation d'identité triviale. |

Trois autres constats qui n'étaient pas dans le document initial et qui pèsent sur le planning :

- **React 19 (DayFront) vs React 18.3 (Core/Framework).** Les apps EGEN partagent `react`/`react-dom` en singleton Module Federation (`peerDependencies`, voir `rspack-config/src/index.ts`) en version `18.x`. Le code DayFront n'utilise **pas** d'API exclusive à React 19 (recherche faite : pas de `use`, `useActionState`, `useOptimistic`, `useFormStatus`), donc le portage vers 18.3 est a priori direct. **⚠ À VÉRIFIER** par `tsc` avec `@types/react` 18.3.25 (épinglé dans les `resolutions` du Core).
- **Le CSS de DayFront est global** (`:root`, `html, body, #root`, `body { background: radial-gradient… }`, `* { box-sizing }`, `button, input…`, `:root[data-theme=…]`). Dans un shell single-spa, **ça casserait le shell et les autres apps**. De plus, **la règle rspack du Core traite tout `.css` comme CSS Modules** (noms de classes hachés), ce qui casserait aussi les `className="calendar-entry-content"` de DayFront. Le CSS demande un traitement spécifique (Phase 4.4).
- **DayFront est en anglais, en dur.** Aucune i18n. Le Core utilise `react-i18next` + `translations/fr.json`/`en.json`.

**Verdict global : faisable, en 9 phases, effort réaliste de 2 à 3 semaines pour un développeur qui connaît déjà le Core.** Le gros du risque est dans (a) la gateway/identité, (b) le CSS global. Le reste est du portage mécanique.

---

## 2. Ce que l'étude des dépôts a établi (faits vérifiés)

### 2.1 `Frontend-esm-framework` (`cbf344f`)

Monorepo Yarn 4.10.3 / Turbo. Workspaces : `packages/framework/*` (≈ 27 paquets `@egen-civitas/esm-*`), `packages/tooling/*` (`egen`, `rspack-config`, `tailwind-preset`, `webpack-config`, `storybook`, …), `packages/shell/esm-app-shell`.

Points qui gouvernent la construction d'une app :

1. **`packages/tooling/rspack-config/src/index.ts`** (667 lignes) — c'est **la** source de vérité du build d'une app. Ce qu'il impose :
   - **`src/routes.json` obligatoire** : sinon le build quitte avec un code d'erreur (`process.exit(9819023573289)`).
   - **Module Federation** : `name` = champ `name` du `package.json` ; `library: { type: 'var', name: slugify(name) }` ; `exposes: { './start': <fichier main> }` ; `filename` = basename du champ `browser`.
   - **`shared` généré automatiquement depuis `peerDependencies`** : chaque clé de `peerDependencies` devient un partage `singleton: true`, plus `@egen-civitas/esm-framework/src/internal`. **Conséquence directe : tout ce que tu mets en `peerDependencies` est partagé ; tout ce que tu mets en `dependencies` seule est embarqué dans le bundle de l'app.** FullCalendar et zod doivent donc rester **hors** `peerDependencies`.
   - Cas spécial `swr` (partagé avec la clé `swr/`).
   - `splitChunks: { maxAsyncRequests: 3, maxInitialRequests: 1 }` : volontairement peu de chunks par app.
   - **Règles de style** : `.css` → `style-loader` + `css-loader` **avec `modules` actif sans condition** (noms hachés `${ident}__[name]__[local]___[hash]`) ; `.scss` idem avec `sass-loader` ; **`*.tw.css` → `css-loader` SANS modules + `postcss-loader` + `@tailwindcss/postcss`** (classes globales stables) ; images `asset/resource` ; **`.svg` → `asset/source`** (importé comme chaîne, pas comme URL).
   - Variables d'environnement « publiques » : préfixes `EGEN_AI_`, `EGEN_DEV_`, `EGEN_TENANT_` seulement (`PUBLIC_ENV_PREFIXES`). **Une variable `EGEN_AGENDA_…` ne traverserait pas jusqu'au navigateur** sans modifier cette liste. On passera par le **système de configuration runtime** (`defineConfigSchema`) à la place — voir Phase 3.
   - `mode === 'production'` : `version` de `routes.json` = version du `package.json` ; en dev : prerelease `local`.

2. **`packages/tooling/egen/src/cli.ts` + `commands/develop.ts`** — le serveur de dev (`egen develop`) :
   - Options clés : `--port` (8081 par défaut ou suivant), `--backend` (défaut `http://localhost:8082`), `--spa-path`, `--api-url`, `--sources`, `--importmap`, `--routes`, `--config-file`, `--config-url`.
   - **Il sert le shell pré-compilé** (`@egen-civitas/esm-app-shell/dist`) et **proxifie tout ce qui commence par `apiUrl` vers `--backend`** (`createProxyMiddleware`, `changeOrigin: true`). C'est **le mécanisme qui rend possible l'appel de la gateway en same-origin en développement** (voir ADR-3).
   - Les variables `EGEN_DEV_NO_AUTH`, `EGEN_TENANT_*` sont « pontées » en `window.*` au service de la page (`RUNTIME_BRIDGED_VARS`).
   - Surveille les `routes.json` des sources locales (`node-watch`) et recharge la table de routes sans rebuild.

3. **`packages/framework/esm-api/src/egen-fetch.ts`** — le client HTTP à utiliser :
   - `egenFetch(path, init)` **préfixe `window.egenBase`** à `path` (`makeUrl`), exige `window.egenBase`.
   - Ajoute `Accept: application/json` (sauf si fourni), **injecte automatiquement `X-Tenant-ID`** depuis le store tenant si un tenant est actif.
   - **Stringifie automatiquement un `body` objet simple** (`isPlainObject`) mais **ne définit PAS `Content-Type`** → à fournir explicitement.
   - Réponse : `response.data` = JSON déjà parsé ; `204` → `data = null`.
   - Erreur : lève `EgenFetchError` avec `.response`, `.responseBody` (JSON parsé si possible), `.problem` (RFC 9457 si présent).
   - **Redirection automatique vers `/login` sur 401** (config `redirectAuthFailure`, `enabled: true`, `errors: [401]` par défaut) ; la promesse reste alors pendante. Un 403 sur `/session` redirige aussi.
   - Constantes : `restBaseUrl = '/ws/rest/v1'`, `sessionEndpoint = '/ws/rest/v1/session'`.

4. **`esm-api/src/types/user-resource.ts`** — forme de la session : `Session { authenticated, sessionId, locale?, user?: LoggedInUser }` ; `LoggedInUser { uuid, display, username, systemId, userProperties, person, privileges[], roles?… }`. C'est ce que la gateway pourra relire côté serveur pour identifier l'utilisateur (voir Phase 2).

5. **`esm-api/src/tenant.ts`** — `getTenantId()` / `tenantHeaders()` : le frontend capture le tenant depuis l'URL (sous-domaine…) **sans vérification** ; « toute validation (existence, statut) est une responsabilité backend » (commentaire du fichier et `.env.development` du Core). **La gateway devra donc valider elle-même le tenant.**

6. **`esm-config/src/public.ts`** — exporte `defineConfigSchema`, `Type`, `validators`, `getConfig`. Utilisé pour la configuration runtime par app (`useConfig` côté React).

7. **`esm-app-shell/dependencies.json`** — liste des dépendances partagées côté shell : `@carbon/react`, `i18next`, `dayjs`, `react`, `react-dom`, `react-router-dom`, `react-i18next`, `@egen-civitas/esm-framework/src/internal`, `esm-api`, `esm-config`, `esm-react-utils`, `esm-state`, `esm-tenant`, `rxjs`, `single-spa`, `swr`. **Ce que tu peux supposer présent et partagé** dans l'agenda : React 18, react-router-dom 6, i18next/react-i18next, dayjs.

8. **`tooling/tailwind-preset`** (v1.4.0) — point d'entrée Tailwind v4 partagé (`@egen-civitas/tailwind-preset/tailwind.tw.css`), « preflight » en `@layer base`. À importer **une fois en tête de `root.component.tsx`** si l'app utilise Tailwind.

9. **`MIGRATION.md`** du framework — décrit le modèle « projet consommateur » (shell copié depuis le template, apps dans `packages/apps/*`).

### 2.2 `Frontend-esm-core` (`0f967e7`)

Monorepo `@egen/esm-core` (privé, v9.0.2), Yarn 4.10.3, Turbo, `workspaces: ["packages/apps/*"]`. **Aucun code framework** : tout vient de npm (`@egen-civitas/*`, ex. `esm-framework ^1.1.4`, `esm-app-shell ^2.4.0`, `egen ^2.0.2`, `rspack-config ^1.1.0`).

Apps existantes (13) : `esm-ai-assistant-app`, `esm-annuaire-app`, `esm-devtools-app`, `esm-footer-app`, `esm-help-menu-app`, `esm-home-app`, `esm-implementer-tools-app`, `esm-informations-app`, `esm-login-app`, `esm-not-found-app`, `esm-offline-tools-app`, `esm-primary-navigation-app`, `esm-tenant-routing-app`.

**`esm-annuaire-app` est le modèle de référence** : app métier autonome, route `annuaire`, entrées de navigation de niveau 2, portée depuis un projet externe (`Civitas---GED`) « par copie intégrale puis adaptation » — exactement ce qu'on fait avec DayFront. Ce qu'elle montre :

- **`package.json`** : `name: "@egen/esm-annuaire-app"`, `browser: "dist/egen-esm-annuaire-app.js"`, `main: "src/index.ts"`, `source: true`, scripts `start` (`egen develop`), `serve`, `build` (`rspack --mode=production`), `test` (`cross-env TZ=UTC vitest run --passWithNoTests`), `typescript` (`tsc`), `lint`, `extract-translations`. `dependencies` = tout `@egen-civitas/*` + libs métier (`framer-motion`, `lucide-react`, `swr`, `dayjs`…). **`peerDependencies` = les paquets `@egen-civitas/*` en `1.x`/`2.x` + `react 18.x`, `react-dom 18.x`, `react-i18next 16.x`, `react-router-dom 6.x`, `rxjs 7.x`, `single-spa 6.x`, `swr 2.x`, `dayjs 1.x`, `@carbon/react 1.x`.**
- **`rspack.config.js`** : une seule ligne — `module.exports = require('@egen-civitas/egen/default-rspack-config');`
- **`src/index.ts`** : `getSyncLifecycle(rootComponent, { featureName, moduleName })`, `defineConfigSchema(moduleName, configSchema)` dans `startupApp`, `importTranslation = require.context('../translations', false, /.json$/, 'lazy')`, et une extension `navEntry` qui ne rend rien (`getSyncLifecycle(() => null, …)`).
  - ⚠ **Incohérence à connaître** : `package.json` dit `@egen/esm-annuaire-app` mais `index.ts` utilise `moduleName = '@egen-civitas/esm-annuaire-app'`. Le nom Module Federation vient du `package.json` ; le `moduleName` sert à la config/traductions. Pour l'agenda, **choisis une convention et tiens-la** (recommandation : même motif que l'annuaire pour rester homogène, et documenter l'écart) — **⚠ À VÉRIFIER** l'effet exact sur `importTranslation`/`getConfig`.
- **`src/root.component.tsx`** : `BrowserRouter basename={window.getEgenSpaBase()}` + `Routes`. Import Tailwind en tout premier.
- **`src/routes.json`** : 1 `pages[]` (`component: "root"`, `route: "annuaire"`, `online: true`, `offline: false`) + `extensions[]` sur le slot **`topbar-level2-nav`** (composant `navEntry`, `order`, `meta: { section, sectionLabel, group, groupLabel, label, description, icon, route }`).
- **Tests** : `vitest.config.ts` (environnement `happy-dom`, alias `@egen-civitas/esm-framework` → `@egen-civitas/esm-framework/mock`, plugin `scss-identity`), `src/test-utils/{setup.tsx,framework-mock.ts,shell-background.ts}`.
- **`tsconfig.json`** : `jsx: react`, `moduleResolution: bundler`, `include: ["src/**/*"]`, `noEmit`.
- **`src/declarations.d.ts`** : déclare `*.scss`, `*.css`, `*.png/.svg/.jpg/.jpeg`.

**Points de couplage hors de l'app** (pièges classiques quand on ajoute une route) :

- `packages/apps/esm-not-found-app/src/routes.json` : `routeRegex` = `^(?!(?:login|logout|change-password|home|informations|annuaire|offline-tools)/?)(?!^$)`. **Toute nouvelle route doit être ajoutée à cette liste**, sinon la page 404 se superpose à l'app.
- `packages/apps/esm-primary-navigation-app/NAVIGATION.md` : explique que **la TopBar consolide les entrées déclarées par chaque app** (`useSlotNavEntries` → `buildNavItemsFromSlot`). Une section déclarée par une app **remplace** les sous-menus de la maquette `data/workspaceMockData.ts`. `icon` doit être dans la **liste blanche** `data/navIcons.ts` (qui contient déjà `Calendar` et `CalendarCheck`).
- `workspaceMockData.ts` contient déjà **des liens `'/informations/agenda'`** (lignes ≈ 133-157, 213-216, 512-514, 600-602) : **l'ancien emplacement prévu de l'agenda était dans l'app Informations**. Il faut décider ce qu'on en fait (Phase 5).
- `BreadcrumbLevel2Nav.tsx` contient de la logique **codée en dur pour `annuaire`** (lignes ≈ 74-180, 413). Elle ne gère pas `agenda` : le fil d'Ariane s'affichera sans cas particulier (acceptable) ou demandera un petit ajout.
- `tools/check-nav-routes.mjs` (lancé par `yarn verify` et la CI) **échoue** si une entrée `topbar-level2-nav` n'a pas `section`, `group`, `label`, `route`, ou si `route` ne correspond à aucun `pages[].route` (égalité ou sous-route).
- `tools/sync-egen-deps.mjs` (`yarn deps:egen`) aligne toutes les dépendances `@egen-civitas/*` sur la dernière version npm. La CI le lance en mode `--check` (informatif).

**Docs internes à connaître** (`Frontend-esm-core/docs/`) : `analyse-auth-session.md` (le store de session, `egenFetch`, bypass dev ; **règle importante : `esm-api`, `esm-config`, `esm-react-utils`, `esm-state`, `esm-tenant` doivent être déclarés partagés en singleton dans chaque app** — c'est ce que fait la liste de `peerDependencies` copiée de l'annuaire), `analyse-esm-tenant.md` (54 Ko — multi-tenant), `analyse-separation-framework.md`, `dev-lien-local-framework.md` (**ne pas relier le framework en workspace/portal : essayé deux fois, abandonné** ; utiliser `yarn link` ciblé sur un seul paquet ou publier), `guide-composants-et-theme.md` (31 Ko — composants et thème).

**Environnement** (`.env.development`, `example.env`) : `EGEN_DEV_NO_AUTH=true` par défaut en dev (session admin fictive **côté navigateur uniquement** : voir ADR-4 pour l'impact sur l'agenda), `EGEN_TENANT_MODE=multi`, `EGEN_PUBLIC_PATH=/egen/spa`, `EGEN_API_URL=/egen`, `EGEN_PROXY_TARGET=http://localhost:8081/` (« ton backend EGEN local (FastAPI / Keycloak) »).

**CI** (`.github/workflows/ci.yml`) : `yarn install --immutable` → `yarn turbo run build --concurrency=5` → `yarn verify --concurrency=5` (= `check-nav-routes` + `turbo run lint test typescript`). Publication npm **sur release GitHub** ou `workflow_dispatch` (`ci:publish` publie **tous** les workspaces sauf `@egen/esm-core` et `@egen/storybook`) — donc une nouvelle app sera publiée sous `@egen/esm-agenda-app` sauf si tu la marques `private`.

### 2.3 `DayFront` (`8aef796`, v1.4.0, MIT)

Monorepo **pnpm 10.14**, Node **≥ 24**. Trois paquets :

**`packages/shared`** (`src/calendar.ts`, 269 lignes) — schémas **zod** et types partagés front/back : `Calendar`, `CalendarMutation`, `CalendarEvent` (`id`, `resourceId`, `calendarId`, `uid`, `title`, `start`, `end?`, `allDay`, `description?`, `location?`, `version` (= ETag), `entryType: 'event'|'note'|'todo'`, `recurring`, `recurrenceId?`, `recurrenceRule?`, `readOnly?`), `EventMutation` (avec `recurrenceScope: 'series'|'occurrence'`, `occurrenceStart`), `CalendarTask` (`status`, `priority 0-9`, sous-tâches `parentUid/childUids`), `TaskMutation`, `publicConfig`, `health`.

**`apps/api`** (Express 5.2.1, `ical.js`, `fast-xml-parser`, `pino`, `yaml`, `zod 4.4`) :
- `src/app.ts` (170 l.) : assemble `securityHeaders` → `express.json(1mb)` → request-id/log → `authentication.session` → `/health`, `/ready`, `/api/v1/config`, `/api/v1/auth/{session,login,logout}` → **`/api/v1/*` protégé par `requireSession` + `requireSameOrigin` + `mutationRateLimit` + `calendarRouter(...)`** → static du web (`webRoot`) en option.
- `src/auth.ts` (387 l.) : `createAuthentication(config)` renvoie `{ session, status, login, logout, requireSession, requireSameOrigin, client(request) }`. **C'est la seule couture à remplacer** pour l'identité EGEN. `client(request)` retourne le `CalDavClient` de l'utilisateur courant.
- `src/caldav/client.ts` (430 l.) : `CalDavClient(config.caldav, { fetch? })`. Construit `Authorization: Basic …` **une fois** dans le constructeur ; l'envoie dans `request()` (ligne ≈ 312 : `headers: { Authorization: this.authorization, ...init.headers }`). Découverte : `PROPFIND` → `current-user-principal` → `calendar-home-set` → collections. **Pour passer un en-tête de confiance, il suffit d'ajouter une option `extraHeaders` fusionnée à cet endroit** (≈ 5 lignes).
- `src/calendar/routes.ts` (684 l.) : routes REST — `GET/POST /calendars`, `PUT/DELETE /calendars/:id`, `GET /events` (`start`, `end`, `calendarId*`), `GET /events/search`, `GET /tasks`, `POST /calendars/:id/events|tasks`, `GET/PUT/DELETE /events/:resourceId`, `…/tasks/:resourceId` ; concurrence optimiste via **`If-Match: <version>`** ; suppression d'occurrence via `?scope=occurrence&recurrenceId=…`.
- `src/calendar/{event,task}-{mapper,editor}.ts`, `subscriptions.ts` (flux `.ics` externes, lecture seule), `src/security.ts` (headers : `X-Frame-Options: DENY`, CSP stricte, HSTS ; **rate-limit mutations** 120/min par IP), `src/config.ts` (402 l. ; YAML + variables `DAYFRONT_*` ; schéma zod).
- `sameOrigin()` (dans `auth.ts`) : en mode multi-utilisateur, **rejette** toute requête dont l'en-tête `Origin` ne correspond pas à `Host` + protocole (protection CSRF). Derrière un proxy, nécessite `server.trustProxy: true`.

**`apps/web`** (React 19.2.8, Vite 8, **FullCalendar 6.1.21** — `core`, `daygrid`, `interaction`, `list`, `react`, `timegrid`) :
- `src/App.tsx` (**1890 lignes**) : **deux composants exportés qui comptent** — `CalendarApp` (le vrai calendrier ; props optionnelles `username`, `onLogout`) et **`App`** (lignes ≈ 1800-1890, **simple enveloppe d'authentification** : charge la config publique, bascule entre `LoginPage` et `CalendarApp`). **Le portage consiste largement à jeter `App` et à exporter `CalendarApp`.** C'est une très bonne nouvelle : la couture UI/auth est propre.
- `src/api.ts` (297 l.) : toutes les requêtes `fetch('/api/v1/…')` en **chemins absolus**, `credentials: 'same-origin'`, validation zod des réponses, événement `dayfront:authentication-required` sur 401. **À réécrire avec `egenFetch`** (annexe A.6).
- `src/{EventDialog,TaskDialog,CalendarManager,RecurrenceActionDialog,ClockInput}.tsx`, `calendar-display.ts`, `search.ts` : composants de présentation, **réutilisables presque tels quels**.
- `src/styles.css` (1666 l.) + `src/visual-refresh.css` (1952 l.) : **CSS global**, deux feuilles dont la seconde surcharge la première ; thème par `document.documentElement.dataset.theme` (`auto|light|dark`) + `@media (prefers-color-scheme: light)`.
- Points d'attention repérés par `grep` dans `App.tsx` : manipulation de `window.location`/`history` pour un paramètre `?date=` (≈ l. 148-165) et écoute de `popstate` (≈ l. 707) — **conflit potentiel avec le routeur du shell** ; `document.documentElement.dataset.theme = …` (≈ l. 714, 729) ; `window.addEventListener(authenticationRequiredEvent …)` (≈ l. 1824). `EventDialog.tsx` fait `document.querySelector('#event-title')` (id global, ≈ l. 129).
- Les dialogues sont des `div role="dialog"` (pas `<dialog>` natif) — leur `z-index` devra être vérifié face à la TopBar du shell.
- `LoginPage.tsx` contient un lien « Buy Me a Coffee » : **à supprimer avec la page**. La licence MIT exige seulement de **conserver la notice de copyright et le texte de licence** dans le code dérivé (voir Phase 0).
- Tests web : `vitest 4.1` + `jsdom` + `@testing-library/react`. Tests API : `vitest` + `supertest`, dont `caldav.integration.test.ts` (nécessite un vrai serveur CalDAV, `DAYFRONT_INTEGRATION_TEST=true`).

**Compatibilité Radicale** : le README DayFront annonce la découverte CalDAV standard (`current-user-principal` → `calendar-home-set`), donc compatible Radicale. Le dossier `tests/fixtures/caldav/*` contient des réponses types.

---

## 3. Fichiers à lire (et à ne pas lire) — budget de lecture ciblé

Objectif : **ne pas brûler de tokens** sur ce qui est générique. Trois niveaux, du plus rentable au moins rentable. Chemins relatifs à la racine de chaque dépôt.

### 3.1 Niveau 1 — À lire en entier avant de coder (≈ 25 fichiers, ≈ 4 500 lignes utiles)

**Core** (`Frontend-esm-core`) :

| Fichier | Pourquoi | Taille |
|---|---|---|
| `packages/apps/esm-annuaire-app/package.json` | Modèle exact de `dependencies`/`peerDependencies`/scripts | 130 l. |
| `packages/apps/esm-annuaire-app/src/index.ts` | Cycle de vie, config schema, traductions, `navEntry` | 30 l. |
| `packages/apps/esm-annuaire-app/src/routes.json` | Format `pages` + `extensions` du slot de navigation | 70 l. |
| `packages/apps/esm-annuaire-app/src/root.component.tsx` | Routeur `basename`, import Tailwind | 40 l. |
| `packages/apps/esm-annuaire-app/vitest.config.ts` + `src/test-utils/setup.tsx` + `src/test-utils/framework-mock.ts` | Environnement de test à copier | 80 l. |
| `packages/apps/esm-not-found-app/src/routes.json` | Le `routeRegex` à modifier | 15 l. |
| `packages/apps/esm-primary-navigation-app/NAVIGATION.md` | Contrat de navigation niveau 2 | 50 l. |
| `tools/check-nav-routes.mjs` | Règle de cohérence qui bloque la CI | 40 l. |
| `docs/analyse-auth-session.md` | Session, `egenFetch`, bypass dev, singletons MF | 200 l. |
| `.env.development` | Variables et bypass auth | 130 l. |
| `.github/workflows/ci.yml` | Pipeline et publication | 120 l. |

**Framework** (`Frontend-esm-framework`) :

| Fichier | Pourquoi |
|---|---|
| `packages/tooling/rspack-config/src/index.ts` (**lire les lignes 330-667**, le reste est de la doc/env) | Règles CSS, Module Federation, `shared`, `routes.json` |
| `packages/framework/esm-api/src/egen-fetch.ts` | Contrat exact de `egenFetch` (préfixe, headers, 401) |
| `packages/framework/esm-api/src/types/user-resource.ts` | Forme de `Session`/`LoggedInUser` |
| `packages/tooling/egen/src/commands/develop.ts` | Proxy dev, pont `window.*`, sources locales |
| `packages/tooling/egen/src/cli.ts` (lignes 40-130) | Options `--backend`, `--api-url`, `--sources`… |
| `packages/shell/esm-app-shell/dependencies.json` | Ce qui est partagé par le shell |

**DayFront** :

| Fichier | Pourquoi |
|---|---|
| `apps/web/src/App.tsx` : lignes **1-120** (imports), **140-170** (URL `?date=`), **700-740** (config/thème), **1795-1890** (enveloppe d'auth) | Les 4 zones à modifier |
| `apps/web/src/api.ts` | À remplacer par `egenFetch` |
| `packages/shared/src/calendar.ts` | Contrat de données complet |
| `apps/api/src/app.ts` | Ordre des middlewares |
| `apps/api/src/auth.ts` : fonctions `createAuthentication`, `sameOrigin`, `requireSession`, `client` | La couture à remplacer |
| `apps/api/src/caldav/client.ts` : constructeur et `request()` (≈ l. 35-50 et 295-330) | Ajout de `extraHeaders` |
| `apps/api/src/config.ts` : schéma zod `authentication` et table `DAYFRONT_*` (≈ l. 200-270) | Ajout d'un mode |
| `docs/security.md`, `docs/deployment.md` | Hypothèses de sécurité et de déploiement |

### 3.2 Niveau 2 — À parcourir seulement si le point correspondant bloque

| Fichier | Quand |
|---|---|
| `packages/apps/esm-primary-navigation-app/src/intranet-topbar/data/navIcons.ts` | Pour choisir/ajouter une icône de nav |
| `…/data/workspaceMockData.ts` (lignes 120-220, 500-520, 595-605) | Décider du sort des liens `/informations/agenda` |
| `…/components/navigation/BreadcrumbLevel2Nav.tsx` (lignes 60-190) | Si tu veux un fil d'Ariane propre pour l'agenda |
| `docs/guide-composants-et-theme.md` | Pour aligner les composants sur le design system (Phase 6) |
| `docs/analyse-esm-tenant.md` | Pour le comportement multi-tenant fin |
| `packages/framework/esm-theme/src/{engine,flatten,types}.ts` et `src/themes/` | Pour connaître les **noms exacts** des variables CSS du thème (Phase 6) |
| `packages/framework/esm-react-utils/src/{getLifecycle,useConfig,useSession}.ts*` | Signatures exactes des hooks |
| `packages/framework/esm-extensions/src/{extensions,render,nav-entry}.ts` | Phase 9 (extensions) |
| `packages/tooling/tailwind-preset/tailwind.tw.css` | Si tu utilises Tailwind dans l'agenda |
| `DayFront/apps/api/src/calendar/{routes,event-mapper,event-editor}.ts` | Si tu modifies la sémantique (récurrence, fuseaux) |
| `DayFront/apps/web/src/{EventDialog,TaskDialog}.tsx` | Pour traduire les chaînes (Phase 6) |

### 3.3 Niveau 3 — À **ne pas** lire

- `Frontend-esm-core/iam-central-services.txt` (**91 Ko**) : dump de services d'un **autre** projet (`IAM-Central---Frontend`). Aucun rapport avec l'agenda.
- `Frontend-esm-core/yarn.lock`, `Frontend-esm-framework/yarn.lock`, `DayFront/pnpm-lock.yaml`, `.yarn/releases/*`.
- Les 20 workflows `.github/workflows/docs-*.yml`, `tx-*.yml`, `code-ql.yml`, `e2e.yml` (sauf si tu ajoutes des tests e2e).
- `Frontend-esm-framework/packages/framework/esm-ai-*` (assistant IA), `esm-offline`, `esm-feature-flags`, `esm-expression-evaluator`, `storybook`, `typedoc-plugin-*`.
- Les autres apps du Core (`esm-ai-assistant-app`, `esm-home-app`, `esm-login-app`, `esm-devtools-app`, …) — sauf `esm-annuaire-app` (modèle) et `esm-primary-navigation-app` (nav).
- `DayFront/unraid/`, `Dockerfile`, `docker-entrypoint.sh`, `ca_profile.xml`, `CHANGELOG.md`, `docs/images/` (on reconstruit notre propre déploiement).
- `DayFront/apps/web/src/styles.css` et `visual-refresh.css` : **ne les lis pas ligne à ligne** ; on les traite par transformation mécanique (Phase 4.4).
- `DayFront/apps/api/test/*` : utiles comme exemples mais pas à lire d'avance.

---

## 4. Architecture cible

### 4.1 Vue d'ensemble

```text
 Navigateur (SPA EGEN — single-spa + Module Federation)
 ┌──────────────────────────────────────────────────────────────────────┐
 │  esm-app-shell                                                        │
 │   ├─ esm-primary-navigation-app   (TopBar, méga-menu niveau 2)        │
 │   ├─ esm-login-app                (login EGEN / Keycloak)             │
 │   ├─ esm-annuaire-app, esm-informations-app, …                        │
 │   └─ esm-agenda-app   ◄── NOUVEAU (route `agenda`)                    │
 │          │  CalendarApp (UI DayFront portée, FullCalendar)            │
 │          │  api.ts → egenFetch('/agenda-api/v1/…')                    │
 └──────────┼───────────────────────────────────────────────────────────┘
            │  même origine :  {origine}/egen/agenda-api/v1/…
            │  (cookie de session EGEN + X-Tenant-ID ajoutés par egenFetch)
            ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │ Reverse proxy (nginx / Traefik)                                       │
 │   /egen/agenda-api/  ──►  agenda-gateway:8080   (réécrit → /api/…)    │
 │   /egen/             ──►  backend EGEN (FastAPI / Quarkus / Keycloak) │
 │   /egen/spa/         ──►  fichiers statiques du shell + apps          │
 └──────────────────────────────────────────────────────────────────────┘
            │                                         │
            ▼                                         ▼
 ┌─────────────────────────────┐        ┌─────────────────────────────┐
 │ agenda-gateway  (Node 24)    │        │ Backend EGEN                 │
 │  = DayFront `apps/api` forké │ ─────► │ GET /ws/rest/v1/session      │
 │  1. identifie l'utilisateur  │ valide │ (cookie transmis)            │
 │     (session EGEN)           │ la     └─────────────────────────────┘
 │  2. valide le tenant         │ session
 │  3. mappe → principal        │
 │  4. CalDAV + X-Remote-User   │
 └──────────────┬──────────────┘
                │ réseau Docker INTERNE uniquement (port non publié)
                ▼
 ┌─────────────────────────────┐
 │ Radicale  (CalDAV)           │
 │  auth = http_x_remote_user   │
 │  stockage = volume           │
 └─────────────────────────────┘
```

### 4.2 Les trois composants et leurs dépôts

| Composant | Rôle | Où vit le code | Nature |
|---|---|---|---|
| **`esm-agenda-app`** | UI : calendrier, dialogues, tâches ; intégrée au shell | `Frontend-esm-core/packages/apps/esm-agenda-app/` | Microfrontend (Module Federation), publié sous `@egen/esm-agenda-app` |
| **`agenda-gateway`** | API JSON ↔ CalDAV ; **identité EGEN → principal Radicale** | Nouveau dépôt, ex. `amourgit/EGEN-agenda-gateway` (fork de DayFront, **sans `apps/web`**) | Service Node 24 conteneurisé |
| **Radicale** | Stockage CalDAV | Image officielle + `config` + `rights` versionnés dans le dépôt d'infra | Service interne |

> **Pourquoi pas dans `Frontend-esm-framework` ?** Le framework est « générique et agnostique » (`docs/analyse-separation-framework.md`). Un calendrier métier est une **app**, donc **Core**. Seul un éventuel **composant générique réutilisable** (ex. un futur `EventPicker`) pourrait monter plus tard dans `esm-styleguide`.

### 4.3 Flux d'une requête (exemple : charger les événements d'un mois)

1. `CalendarApp` appelle `getEvents({ start, end, calendarIds })` (`api.ts`).
2. `egenFetch('/agenda-api/v1/events?start=…&end=…&calendarId=…')` → URL finale `/egen/agenda-api/v1/events?…` ; ajoute `Accept`, `X-Tenant-ID`.
3. Le proxy envoie vers la gateway en réécrivant `/egen/agenda-api/v1/` → `/api/v1/`.
4. Middleware `egenAuthentication` : lit le cookie de session EGEN, appelle `GET {EGEN_BACKEND}/ws/rest/v1/session` (avec cache court), obtient `user.uuid` ; valide le tenant ; calcule `principal = <tenant>__<uuid>`.
5. `calendarRouter` → `CalDavClient` (avec `X-Remote-User: <principal>`) → `PROPFIND`/`REPORT` vers Radicale.
6. Réponse JSON validée par zod côté front → FullCalendar.

---

## 5. Décisions d'architecture (ADR)

Chaque ADR donne la décision **recommandée**, les alternatives, et ce qui te ferait changer d'avis.

### ADR-1 — Garder une gateway (BFF) plutôt que parler CalDAV depuis le navigateur

- **Décision** : conserver le modèle DayFront (navigateur ↔ API JSON ↔ CalDAV).
- **Pourquoi** : (1) CalDAV/WebDAV (XML, `PROPFIND`, `REPORT`, ETag, iCalendar, récurrence `RRULE`/`EXDATE`) est lourd et fragile à réimplémenter côté navigateur ; DayFront a déjà 3 500 lignes de mappers testés. (2) Les identifiants Radicale ne doivent jamais atteindre le navigateur. (3) CORS/`SameSite` : la gateway en same-origin évite tout un pan de problèmes.
- **Alternative écartée** : « extraire seulement la logique CalDAV dans le microfrontend » (option 3 du document initial) — c'est ce que le document appelait « résultat le plus propre » mais c'est **inexact** car cette logique est côté serveur ; ce serait une **réécriture** (client CalDAV navigateur + ical.js), pas une extraction.
- **Te ferait changer d'avis** : un besoin 100 % hors-ligne (le shell a un mode offline) → alors seulement envisager un client CalDAV navigateur ; hors périmètre ici (`offline: false`).

### ADR-2 — Identité : session EGEN validée côté gateway, principal Radicale dérivé

- **Décision** : la gateway **n'a plus de login propre**. Elle reçoit le cookie de session EGEN (same-origin), le **fait valider par le backend EGEN** (`GET /ws/rest/v1/session`), puis dérive le principal Radicale.
- **Format du principal** : `<tenant>__<user.uuid>` en minuscules, caractères `[a-z0-9_-]` seulement (sinon rejet). Tenant absent (mode `off`) → `default`. **On utilise l'`uuid`**, pas le `username` : le username peut changer, l'uuid non (type `LoggedInUser.uuid`).
- **Alternative A** : valider un **JWT Keycloak** (`Authorization: Bearer`) via JWKS. Plus « pur SSO », mais exige que le navigateur détienne et transmette le token — or `egenFetch` repose sur le **cookie de session** (`/session`), pas sur un Bearer. À garder comme **plan B** si ton backend expose déjà le JWT au front. **⚠ À VÉRIFIER** : comment ton backend EGEN réalise réellement le login (cookie ↔ Keycloak).
- **Alternative B** : laisser Radicale authentifier lui-même (htpasswd/LDAP/Keycloak via `oauth2-proxy`) → double gestion des utilisateurs : **c'est exactement ce que le document initial voulait éviter** (« supprimer les utilisateurs dupliqués »).
- **Détail critique** : **⚠ À VÉRIFIER** la forme exacte de la réponse de `/ws/rest/v1/session` de **ton** backend (le front attend `Session { authenticated, user.uuid, … }`). Si ton backend est le kernel Quarkus et non FastAPI, adapte l'URL — l'important est le **contrat** : « avec ce cookie, donne-moi l'identité ».

### ADR-3 — Same-origin via reverse proxy, y compris en développement

- **Décision** : la gateway est exposée **sous le même hôte que le shell**, préfixe `{apiUrl}/agenda-api/` (ex. `/egen/agenda-api/`).
- **Pourquoi** : `egenFetch` préfixe `window.egenBase` ; le cookie EGEN part automatiquement ; pas de CORS ; `sameOrigin()` de DayFront reste satisfait ; `X-Tenant-ID` voyage tel quel.
- **En dev** : `egen develop` **proxifie déjà tout `apiUrl/*` vers `--backend`** (`develop.ts`). Donc `--backend` doit pointer sur un **nginx local** qui lui-même route `agenda-api` → gateway et le reste → backend EGEN (annexe A.2). Pas besoin de toucher au CLI.

### ADR-4 — Le bypass d'authentification de dev (`EGEN_DEV_NO_AUTH`) ne couvre pas l'agenda

- **Constat** : `EGEN_DEV_NO_AUTH=true` (valeur par défaut de `.env.development`) **injecte une session fictive côté navigateur** et intercepte `fetch` pour `/session` (voir `analyse-auth-session.md`). Les appels vers `/agenda-api/…` **ne sont pas interceptés** : ils arriveront à la gateway **sans cookie de session valide**.
- **Décision** : la gateway accepte, **uniquement hors production et uniquement si explicitement activé**, une variable `AGENDA_DEV_USER` (ex. `dev-user`) qui court-circuite la validation. **La gateway refuse de démarrer si `NODE_ENV=production` et `AGENDA_DEV_USER` est défini.** (Code en annexe A.3.)
- **Sinon** : lancer le dev avec `EGEN_DEV_NO_AUTH=false` et un vrai login.

### ADR-5 — Calendriers collectifs (Direction, IT, salles) : pas dans le MVP

- **Constat** : **Radicale n'implémente pas le partage CalDAV** (delegation/ACL inter-principals) ; DayFront, de son côté, ne liste que le `calendar-home-set` du principal courant.
- **Décision** : MVP = **calendriers personnels** uniquement (+ abonnements `.ics` en lecture seule, ex. jours fériés). Les calendriers collectifs sont traités en **Phase 9** via des **principals techniques** (`org__<tenant>__direction`) que la gateway agrège selon les **groupes/rôles** de l'utilisateur.
- **Conséquence** : le document initial, qui présentait la matrice « Personnel / IT / Direction / Salle 1 » comme acquise via Keycloak, **sous-estimait ce chantier**. C'est faisable mais c'est de la logique **dans la gateway**, pas une propriété de Radicale.

### ADR-6 — Chargement : `getAsyncLifecycle` plutôt que `getSyncLifecycle`

- **Décision** : `export const root = getAsyncLifecycle(() => import('./root.component'), options)`.
- **Pourquoi** : FullCalendar (6 paquets) est lourd ; avec un lifecycle asynchrone, son code n'est chargé qu'à la première visite de `/agenda`. L'annuaire utilise `getSyncLifecycle`, mais il n'embarque pas de bibliothèque de ce poids. **⚠ À VÉRIFIER** par `yarn workspace @egen/esm-agenda-app analyze` (cible : mesurer avant/après). `splitChunks.maxAsyncRequests: 3` est une contrainte à garder en tête.

### ADR-7 — Portage « fidèle d'abord, refactor ensuite »

- **Décision** : phase 4 = **porter sans réécrire** (`CalendarApp` intact, UI inchangée), valider de bout en bout, **puis** remplacer progressivement l'UI par le design system EGEN. Éviter de mélanger portage et refonte (source n°1 de régressions).
- **Conséquence UI** : à l'issue de la Phase 4 l'agenda a **l'apparence DayFront** (isolée) ; la Phase 6 l'aligne sur le thème EGEN.

### ADR-8 — Licence et traçabilité

- DayFront est **MIT** : conserver `LICENSE` (copyright Erik Smith) dans le dépôt de la gateway et un fichier `THIRD_PARTY_NOTICES.md` / en-tête dans `esm-agenda-app` (annexe A.12). Noter le **commit source** (`8aef796`) pour pouvoir rejouer les correctifs amont.
- Les packages du Core sont publiés sous `MPL-2.0` (cf. `esm-annuaire-app/package.json`) : MIT et MPL-2.0 sont compatibles ; garder les deux mentions.


---

## 6. Plan de mise en œuvre

**Estimation indicative** (1 développeur connaissant le Core) :

| Phase | Contenu | Effort |
|---|---|---|
| 0 | Préparation, fork, POC DayFront ↔ Radicale | 1 j |
| 1 | Infra Radicale + reverse proxy (dev) | 0,5 j |
| 2 | Gateway (auth EGEN, principal, tests) | 3 j |
| 3 | Squelette `esm-agenda-app` | 0,5 j |
| 4 | Portage UI (API, CSS, App) | 3 j |
| 5 | Intégration shell | 0,5 j |
| 6 | i18n, thème, accessibilité | 2 j |
| 7 | Tests | 2 j |
| 8 | CI, publication, déploiement | 1,5 j |
| 9 | Extensions + calendriers collectifs | 4-6 j (hors MVP) |
| **MVP (0→8)** | | **≈ 14 j** |

**Ordre impératif** : 0 → 1 → 2 → 3 → 4 → 5, puis 6/7/8 en parallèle. Ne commence **pas** la Phase 4 avant que la Phase 2 réponde correctement à un `curl` authentifié : tu déboguerais le front contre un backend qui n'existe pas encore.

---

### Phase 0 — Préparation

**Objectif** : sortir de cette phase avec (a) un fork de DayFront propre et tracé, (b) la preuve que DayFront fonctionne avec **ton** Radicale, (c) les prérequis outils.

#### 0.1 Prérequis outils

| Outil | Version | Pour |
|---|---|---|
| Node.js | **22** (CI du Core) pour `Frontend-esm-core` ; **24+** pour la gateway (`engines` de DayFront) | build |
| Corepack | activé (`corepack enable`) | Yarn 4.10.3 (Core) et pnpm 10.14.0 (gateway) |
| Docker + Compose | récent | Radicale, nginx, gateway |
| Accès npm | lecture du scope `@egen-civitas` | dépendances du Core |

> **Node 24** : vérifie sa disponibilité sur ton serveur de déploiement **maintenant**. Si impossible, la gateway peut être **conteneurisée** (image `node:24-*`), ce qui rend la contrainte invisible côté hôte — c'est la voie recommandée.

#### 0.2 Hygiène du token GitHub

Le token `github_pat_…` a été collé en clair dans une conversation. **Révoque-le et régénère-en un** (GitHub → Settings → Developer settings → Fine-grained tokens). Pour la suite, utilise un token **fine-grained, limité aux dépôts concernés, en lecture seule** tant que tu ne pousses rien, et ne le mets **jamais** dans un fichier suivi par git, ni dans `.env.development` (suivi par git dans le Core !).

#### 0.3 Fork de DayFront → dépôt de la gateway

```bash
# 1. Cloner en gardant l'historique (traçabilité de la licence et des correctifs amont)
git clone https://github.com/Erik-A-Smith/DayFront.git EGEN-agenda-gateway
cd EGEN-agenda-gateway

# 2. Épingler la base de travail
git tag egen/base-8aef796 8aef796
git remote rename origin upstream
git remote add origin git@github.com:amourgit/EGEN-agenda-gateway.git

# 3. Branche de travail
git checkout -b egen/main
```

Créer d'abord le dépôt vide `amourgit/EGEN-agenda-gateway` sur GitHub (privé), puis `git push -u origin egen/main --tags`.

**Règle** : on ne modifie **jamais** `upstream` ; pour récupérer un correctif amont : `git fetch upstream && git cherry-pick <sha>`.

#### 0.4 POC : DayFront tel quel contre Radicale

But : **valider Radicale comme serveur CalDAV pour tes besoins avant d'investir**. Utilise temporairement l'authentification Basic de Radicale (htpasswd) — le POC est jetable.

```bash
mkdir -p poc && cd poc
# htpasswd (apache2-utils) : crée l'utilisateur de test
docker run --rm httpd:2.4-alpine htpasswd -Bbn testuser 'change-me-poc' > users
```

`poc/compose.yaml` :

```yaml
services:
  radicale:
    image: tomsquest/docker-radicale:latest   # ⚠ épingler une version précise ensuite
    volumes:
      - ./users:/config/users:ro
      - radicale-data:/data
    environment:
      - RADICALE_CONFIG=/config/config
    ports: ["5232:5232"]                       # POC seulement
volumes:
  radicale-data:
```

> L'image Radicale à retenir n'a pas été testée ici : **⚠ À VÉRIFIER** (image officielle `ghcr.io/kozea/radicale` ou communautaire) et **épingler la version**. La configuration Radicale « de production » est en annexe A.1.

Puis, dans le dépôt DayFront :

```bash
corepack enable
pnpm install --frozen-lockfile
cp config.example.yaml config.yaml
# éditer config.yaml : caldav.url=http://localhost:5232, username=testuser, password=change-me-poc
pnpm dev
# → http://localhost:5173
```

**Critères de réussite du POC** (coche chaque ligne ; note tout échec) :

- [ ] Création / suppression d'un calendrier
- [ ] Événement simple, journée entière, multi-jours
- [ ] Événement récurrent (hebdo), **modification d'une seule occurrence**, **de toute la série**, **suppression d'une occurrence**
- [ ] Tâches (VTODO), sous-tâches, tâche récurrente
- [ ] Recherche d'événements
- [ ] Glisser-déposer d'un événement
- [ ] Rechargement de page : les données persistent
- [ ] Redémarrage du conteneur Radicale : les données persistent

Si un point échoue **avec Radicale**, c'est un problème de compatibilité serveur, pas d'intégration EGEN : ouvre-le dès maintenant (le README DayFront accepte les rapports de compatibilité).

#### 0.5 Lire avant de passer à la suite

Niveau 1 de la section 3, **dans cet ordre** : `rspack-config/src/index.ts` (330-667) → `egen-fetch.ts` → `esm-annuaire-app/{package.json,index.ts,routes.json,root.component.tsx}` → `analyse-auth-session.md`.

---

### Phase 1 — Infrastructure : Radicale + reverse proxy

**Objectif** : une pile locale reproductible où `http://localhost:8081/egen/agenda-api/…` atteint la gateway et `http://localhost:8081/egen/…` atteint ton backend EGEN.

#### 1.1 Où mettre ça

Un dépôt d'infra (ou dossier `deploy/` du dépôt gateway) : `compose.yaml`, `radicale/config`, `radicale/rights`, `nginx/dev.conf`. Fichiers complets en **annexes A.1 et A.2**.

#### 1.2 Points de configuration Radicale qui comptent

| Clé Radicale | Valeur | Raison |
|---|---|---|
| `[server] hosts` | `0.0.0.0:5232` | écoute dans le conteneur |
| `[auth] type` | `http_x_remote_user` | l'identité vient de l'en-tête posé par la gateway |
| `[rights] type` | `owner_only` (MVP) | chacun n'accède qu'à sa collection |
| `[storage] filesystem_folder` | `/data/collections` | volume persistant |
| `[web] type` | `none` | pas d'interface web Radicale exposée |
| `[logging] level` | `info` | |

> **⚠ À VÉRIFIER** sur ta version de Radicale : (1) que le type `http_x_remote_user` est disponible (Radicale 3.x récent), (2) si la **collection principale d'un utilisateur est créée automatiquement** à la première requête — sinon la gateway doit la créer (voir 2.5). Les noms de clés ci-dessus sont ceux de la documentation Radicale 3 ; confronte-les à la doc de **la version que tu déploies**.

#### 1.3 Isolation réseau — **non négociable**

Avec `http_x_remote_user`, **n'importe qui pouvant joindre Radicale peut se faire passer pour n'importe quel utilisateur** en envoyant l'en-tête. Donc :

- Radicale **ne publie aucun port** vers l'hôte (pas de `ports:`), il n'est sur que le réseau Docker interne `agenda-internal`.
- Seule la gateway est sur ce réseau **et** sur le réseau du proxy.
- Le proxy (nginx) **supprime** tout en-tête `X-Remote-User` entrant (annexe A.2) — défense en profondeur, la gateway ne lit de toute façon jamais cet en-tête du client.

#### 1.4 nginx de dev

Rôle : imiter la production. `egen develop --backend http://localhost:8081` envoie tout `/egen/*` non statique vers nginx ; nginx route `agenda-api` vers la gateway et le reste vers ton backend EGEN réel (annexe A.2).

> **⚠ À VÉRIFIER** : l'URL et le port de ton backend EGEN local (`example.env` : `EGEN_PROXY_TARGET=http://localhost:8081/`). Si ton backend écoute déjà sur 8081, **choisis un autre port pour nginx** (ex. 8090) et passe `--backend http://localhost:8090` à `egen develop`. Adapte A.2 en conséquence.

#### 1.5 Vérification de la phase 1

```bash
docker compose up -d
# Radicale NON joignable depuis l'hôte :
curl -sS -m 3 http://localhost:5232/ || echo "OK : injoignable de l'extérieur"
# Depuis le réseau interne, avec un en-tête de confiance (conteneur jetable) :
docker run --rm --network agenda-internal curlimages/curl \
  -sS -X PROPFIND -H 'X-Remote-User: default__test' -H 'Depth: 0' http://radicale:5232/
```

Attendu : réponse `207 Multi-Status` (XML) pour la requête interne, échec pour l'externe.

---

### Phase 2 — La gateway (BFF dérivé de DayFront API)

**Objectif** : un service qui expose **exactement l'API `/api/v1/*` de DayFront**, mais dont l'identité vient d'EGEN. Le front n'a ainsi presque rien à changer côté contrat.

**Principe de conception** : *remplacer une couture, pas réécrire*. `createAuthentication()` retourne `{ session, status, login, logout, requireSession, requireSameOrigin, client }` et `app.ts` ne consomme que ça. On ajoute `createEgenAuthentication()` avec **la même interface**, et on choisit laquelle instancier selon `config.authentication.mode`.

#### 2.1 Élaguer le dépôt

```bash
git rm -r apps/web unraid Dockerfile docker-entrypoint.sh ca_profile.xml compose.yaml tests/fixtures/web
# pnpm-workspace.yaml : garder apps/api et packages/*
# package.json (racine) : retirer le filtre @dayfront/web du script "dev"
```

Dans `apps/api/src/app.ts`, **ne pas supprimer** le bloc `webRoot` (il est conditionnel et inoffensif) ; simplement ne jamais passer `webRoot`.

Renommer les paquets si tu veux (`@egen-agenda/gateway`), **mais** garder le fichier `LICENSE` d'origine.

#### 2.2 Ajouter le mode d'authentification `egen-session`

Dans `apps/api/src/config.ts` (⚠ lire l'objet zod `authentication` — il n'a été lu qu'en partie : seule la table `DAYFRONT_*` lignes ≈ 207-231 l'a été) :

1. Étendre l'énumération `mode` : `'single-user' | 'caldav-login' | 'egen-session'`.
2. Ajouter un bloc :

```yaml
authentication:
  mode: egen-session
  egen:
    sessionUrl: http://egen-backend:8081/egen/ws/rest/v1/session   # ⚠ URL interne de TON backend
    cacheTtlSeconds: 30
    allowedTenants: []          # liste blanche ; vide = tout tenant bien formé
    requireTenant: true         # refuse si X-Tenant-ID absent (mode multi)
    allowedOrigins: []          # DEV UNIQUEMENT (ex. ["http://localhost:8081"]) — voir piège en A.1 ; vide en production
caldav:
  url: http://radicale:5232
  trustedUserHeader: X-Remote-User
  # username/password : plus nécessaires en mode egen-session
```

3. Rendre `caldav.username`/`password` **optionnels** quand `mode === 'egen-session'` (DayFront les exige en `single-user` : `config.example.yaml` « Required in single-user mode »).
4. Ajouter à la table des variables : `DAYFRONT_EGEN_SESSION_URL`, `DAYFRONT_EGEN_CACHE_TTL_SECONDS`, `DAYFRONT_CALDAV_TRUSTED_USER_HEADER`, `DAYFRONT_EGEN_REQUIRE_TENANT` (suivre le motif `DAYFRONT_*: ['section','clé']` existant, et la liste des entiers/booléens plus bas dans le fichier).

> Garde le préfixe `DAYFRONT_` pour limiter les écarts avec l'amont (rebase plus simple).

#### 2.3 Ajouter `extraHeaders` au client CalDAV

Dans `apps/api/src/caldav/client.ts` :

```ts
export interface CalDavClientOptions {
  fetch?: typeof fetch;
  extraHeaders?: Record<string, string>;   // ← ajout
}

export class CalDavClient {
  private readonly extraHeaders: Record<string, string>;   // ← ajout
  constructor(private readonly config: DayFrontConfig['caldav'], options: CalDavClientOptions = {}) {
    // … existant …
    this.extraHeaders = options.extraHeaders ?? {};          // ← ajout
  }
  // dans request(), là où se trouve :
  //   headers: { Authorization: this.authorization, ...init.headers }
  // devient :
  //   headers: { Authorization: this.authorization, ...this.extraHeaders, ...init.headers }
}
```

En mode `egen-session`, on construit le client avec `username = principal`, `password = 'unused'` (l'en-tête `Authorization: Basic` sera ignoré par Radicale en `http_x_remote_user`) **et** `extraHeaders: { 'X-Remote-User': principal }`.

#### 2.4 Écrire `egen-auth.ts`

Fichier complet en **annexe A.3**. Comportement :

1. `session` (middleware global) : lit `Cookie` (transmis tel quel) et `X-Tenant-ID`.
2. Appelle `sessionUrl` avec ces deux en-têtes, **timeout court (3 s)**, **cache mémoire** `sha256(cookie|tenant) → { principal, expiresAt }` (TTL `cacheTtlSeconds`, **jamais plus de 60 s**, pour que la déconnexion se propage vite).
3. Si `authenticated !== true` → `401` avec le **même format d'erreur que DayFront** : `{ error: { code: 'AUTHENTICATION_REQUIRED', … } }`. **Important** : `egenFetch` redirige vers `/login` sur 401 ; c'est le comportement voulu.
4. Valide le tenant (format `^[a-z0-9][a-z0-9-]{0,62}$`, liste blanche si fournie) → sinon `400 INVALID_TENANT`.
5. Construit `principal = ${tenant}__${user.uuid}` (assainis `user.uuid` : `[a-z0-9-]`).
6. `requireSession` : refuse si pas de principal ; `requireSameOrigin` : **toujours actif** (en DayFront il n'est actif qu'en multi-utilisateur), avec une liste `allowedOrigins` **réservée au développement** (le proxy de `egen develop` réécrit `Host`, cf. piège en A.1) ; `client(request)` : `new CalDavClient(cfg, { extraHeaders })`.
7. `login`/`logout`/`status` : `login` → `404` ; `logout` → `204` sans effet (la déconnexion est EGEN) ; `status` → `{ data: { mode: 'egen-session', authenticated: true, username: <display> } }`.
8. **Garde-fou dev** (ADR-4) : voir A.3.

#### 2.5 Provisionner le principal et le calendrier par défaut

Selon ta version de Radicale (⚠ cf. 1.2), la collection `/<principal>/` peut ne pas exister à la première requête. Ajoute dans la gateway une fonction `ensurePrincipal(client, principal)` appelée **une fois par principal et par processus** (mémoïsée) :

1. `PROPFIND /<principal>/` (Depth 0). Si 404 → `MKCOL /<principal>/` avec corps `resourcetype = principal` selon Radicale. **⚠ À VÉRIFIER** la requête exacte acceptée par ta version (certaines créent automatiquement).
2. Si `GET /calendars` renvoie une liste vide → créer le calendrier par défaut **« Mon agenda »** (`MKCALENDAR`, composants `VEVENT` + `VTODO`) — réutilise la logique de `POST /calendars` de `routes.ts` plutôt que de la réécrire.

> Sans cette étape, un nouvel utilisateur verrait un agenda **sans calendrier**, donc sans moyen de créer un événement (DayFront ne propose pas de créer un événement sans calendrier cible).

#### 2.6 Multi-tenant

- La gateway **valide** le tenant (le front ne le fait pas — cf. `esm-api/src/tenant.ts`).
- Préfixe de principal = tenant → **isolation physique par dossier** côté Radicale (`/<tenant>__<uuid>/…`).
- **Test obligatoire** (Phase 7) : un utilisateur du tenant A, en forgeant `X-Tenant-ID: B`, ne doit **pas** accéder aux données de B. Comme le principal contient l'uuid, il tomberait sur un principal vide `B__<uuid-de-A>` — pas sur les données de quelqu'un d'autre ; mais **ça créerait un principal fantôme**. Pour l'éviter, vérifier que **le tenant demandé est cohérent avec la session** (si le backend renvoie le tenant de l'utilisateur dans `/session`, le comparer ; **⚠ À VÉRIFIER** ce que ton backend renvoie).

#### 2.7 Configuration réseau et en-têtes

- `server.trustProxy: true` (derrière nginx) — nécessaire pour `request.ip` (rate-limit) et pour `sameOrigin()` (`Host`/`X-Forwarded-Host`).
- `mutationRateLimit` : 120 mutations/min **par IP** ; derrière un proxy de campus (beaucoup d'utilisateurs, même IP) c'est trop bas → **clé par `principal`**, pas par IP (modifier `security.ts` : `const key = request.ip` → principal si présent).
- `securityHeaders()` : conserve tel quel (API pure). Le CSP et `X-Frame-Options: DENY` n'affectent pas les réponses JSON.

#### 2.8 Journalisation

Pino est déjà en place. Règles : **ne jamais logguer** le cookie, ni l'en-tête `Authorization`, ni le corps des requêtes ; logguer `requestId`, `principal` **haché** (`sha256(principal).slice(0,12)`), méthode, chemin, statut.

#### 2.9 Dockerfile de la gateway

Annexe A.4 (multi-stage, Node 24, pnpm via corepack, utilisateur non-root, `HEALTHCHECK` sur `/health`).

> `/ready` de DayFront renvoie **toujours 503** (« The live CalDAV readiness check remains pending » dans `app.ts`). **Ne l'utilise pas** comme sonde de readiness orchestrateur ; utilise `/health` (liveness) ou implémente la vérification CalDAV (un `PROPFIND` de la racine suffit).

#### 2.10 Vérification de la phase 2 (avant de toucher au front)

```bash
# Gateway lancée avec AGENDA_DEV_USER=dev-user (hors production)
curl -sS http://localhost:8080/api/v1/auth/session
curl -sS -H 'X-Tenant-ID: demo' http://localhost:8080/api/v1/calendars
# Création d'un événement (même origine : pas d'en-tête Origin → autorisé ; avec Origin étranger → 403)
curl -sS -X POST http://localhost:8080/api/v1/calendars/<id>/events \
  -H 'Content-Type: application/json' \
  -d '{"calendarId":"<id>","title":"Test","start":"2026-10-12T09:00:00Z","end":"2026-10-12T10:00:00Z","allDay":false}'
```

Attendu : calendrier par défaut créé, événement créé, relisible. **Tests automatiques** : voir Phase 7.

---

### Phase 3 — Squelette `esm-agenda-app` dans le Core

**Objectif** : une app **vide mais complète** (build, lint, test, nav, route) qui s'affiche dans le shell. On portera le calendrier ensuite.

#### 3.1 Créer l'arborescence (copie de l'annuaire)

```bash
cd Frontend-esm-core
git checkout -b feat/esm-agenda-app
A=packages/apps/esm-agenda-app
mkdir -p $A/src/{agenda,components,shared,styles,test-utils} $A/translations

# Fichiers de configuration copiés de l'annuaire
cp packages/apps/esm-annuaire-app/rspack.config.js        $A/
cp packages/apps/esm-annuaire-app/tsconfig.json           $A/
cp packages/apps/esm-annuaire-app/vitest.config.ts        $A/
cp packages/apps/esm-annuaire-app/src/declarations.d.ts   $A/src/
cp packages/apps/esm-annuaire-app/src/test-utils/setup.tsx        $A/src/test-utils/
cp packages/apps/esm-annuaire-app/src/test-utils/framework-mock.ts $A/src/test-utils/
cp packages/apps/esm-annuaire-app/package.json            $A/
```

> **N'utilise pas** `cp -r` de toute l'annuaire : tu embarquerais ses composants, son image de fond et ses traductions.

#### 3.2 `package.json`

Annexe **A.5** (complet). Points à comprendre :

- `name: "@egen/esm-agenda-app"`, `browser: "dist/egen-esm-agenda-app.js"` (le nom de fichier suit le motif de l'annuaire), `main: "src/index.ts"`, `source: true`.
- **`dependencies`** : tous les `@egen-civitas/*` de l'annuaire (mêmes plages) + **`@fullcalendar/*` ×6 en version exacte `6.1.21`** + `zod` + `lucide-react` (déjà utilisé dans le Core) + `dayjs`, `swr`, `rxjs`, `single-spa`…
- **`peerDependencies`** : **copie conservatrice** de la liste de l'annuaire. **N'y mets pas** `@fullcalendar/*` ni `zod` (sinon ils deviennent partagés/singleton et exigent une version compatible dans le shell). Rappel : la liste des peers **est** la liste des modules partagés (`rspack-config`).
- Après modification : `yarn install` à la **racine** (met à jour `yarn.lock` ; **commite-le** : la CI fait `--immutable`).

Dépendance non couverte : **FullCalendar 6.1.21 déclare `react ^16.7 || ^17 || ^18 || ^19`** (vérifié sur le registre npm) → compatible React 18.3.

#### 3.3 `src/routes.json`

Annexe **A.7**. Une page `route: "agenda"` et **une** entrée de navigation de niveau 2 (« Mon agenda »). Rappel de la règle `check-nav-routes` : **chaque `meta.route` doit être égal à un `pages[].route` ou en être une sous-route** (chemin seul, sans query string) ; d'autres entrées (`agenda/taches`, `agenda/calendriers`) ne deviennent possibles que si l'app gère ces sous-routes (voir note en A.7).

#### 3.4 `src/index.ts`

Annexe **A.8**. Différence avec l'annuaire : **lifecycle asynchrone** (ADR-6) et un **vrai** `configSchema` (Annexe A.9).

#### 3.5 `src/config-schema.ts` — la configuration runtime

L'agenda n'a **pas besoin** de variable d'environnement build-time : tout passe par `defineConfigSchema` (modifiable sans rebuild via les fichiers/URL de config du shell : `--config-file` en dev, `configUrls` en prod). Clés proposées : `apiBasePath` (défaut `/agenda-api/v1`), `defaultView` (`month|week|day|agenda`), `timeFormat` (`12h|24h` → défaut **`24h`** pour le contexte gabonais), `weekStartsOn` (défaut `1`), `showTasks`, `showCalendarsSidebar`, `sidebarDefaultOpen`, `maxOccurrences`.

Exemple de fichier de config pour `egen develop --config-file` :

```json
{
  "@egen-civitas/esm-agenda-app": {
    "defaultView": "week",
    "timeFormat": "24h"
  }
}
```

> **⚠ Cohérence du nom de module** : la clé de config est le `moduleName` passé à `defineConfigSchema`. Dans l'annuaire c'est `@egen-civitas/esm-annuaire-app` alors que le paquet s'appelle `@egen/esm-annuaire-app`. Pour l'agenda, **utilise la même chaîne dans `index.ts` (`moduleName`) et dans tes fichiers de config** ; et note-la dans le README de l'app.

#### 3.6 `src/root.component.tsx` minimal (pour valider la route)

```tsx
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const Placeholder: React.FC = () => <main data-testid="agenda-placeholder">Agenda — en construction</main>;

const Root: React.FC = () => (
  <BrowserRouter basename={window.getEgenSpaBase()}>
    <Routes>
      <Route path="agenda/*" element={<Placeholder />} />
    </Routes>
  </BrowserRouter>
);
export default Root;
```

#### 3.7 Lancer

```bash
yarn install
yarn start --sources packages/apps/esm-agenda-app          # shell + uniquement cette app
# ou, pour avoir TOUTES les apps (plus lourd) : yarn start
# Avec le proxy nginx de la Phase 1 :
yarn run:egen develop --sources packages/apps/esm-agenda-app --backend http://localhost:8090 --api-url /egen --spa-path /egen/spa
```

> **⚠ À VÉRIFIER** les valeurs exactes de `--api-url`/`--spa-path` attendues par ton shell : les défauts du CLI sont `/egen-civitas/` et `/egen-civitas/spa/`, alors que `example.env` du Core utilise `/egen` et `/egen/spa`. Reprends celles de tes scripts habituels.

Ouvre `/egen/spa/agenda` : tu dois voir « Agenda — en construction ». Si tu vois la **page 404**, c'est la Phase 5.1 (regex) qui manque — fais-la maintenant.

#### 3.8 Vérification de la phase 3

```bash
yarn workspace @egen/esm-agenda-app build
yarn workspace @egen/esm-agenda-app typescript
yarn workspace @egen/esm-agenda-app lint
yarn workspace @egen/esm-agenda-app test          # --passWithNoTests tant qu'il n'y en a pas
node tools/check-nav-routes.mjs
```

---

### Phase 4 — Portage de l'UI DayFront

**Objectif** : l'agenda DayFront fonctionne dans le shell, parlant à la gateway, sans fuite de style.

#### 4.1 Table de portage fichier par fichier

Source : `DayFront/apps/web/src/` → Destination : `Frontend-esm-core/packages/apps/esm-agenda-app/src/`

| Source | Destination | Action |
|---|---|---|
| `main.tsx` | — | **Supprimer** (remplacé par `index.ts` + `root.component.tsx`) |
| `../index.html`, `vite.config.ts`, `tsconfig.*.json` | — | **Supprimer** (Rspack/`egen`) |
| `App.tsx` | `agenda/calendar-app.component.tsx` | **Copier**, puis appliquer les patchs 4.5 (supprimer `App`, exporter `CalendarApp`) |
| `api.ts` | `agenda/api.ts` | **Réécrire** avec `egenFetch` (annexe A.6) |
| `LoginPage.tsx` | — | **Supprimer** (et le lien Buy Me a Coffee) |
| `CalendarManager.tsx` | `agenda/calendar-manager.component.tsx` | Copier ; i18n (Phase 6) |
| `EventDialog.tsx` | `agenda/event-dialog.component.tsx` | Copier ; **remplacer `#event-title`** (4.7) ; i18n |
| `TaskDialog.tsx` | `agenda/task-dialog.component.tsx` | Copier ; i18n |
| `RecurrenceActionDialog.tsx` | `agenda/recurrence-action-dialog.component.tsx` | Copier ; i18n |
| `ClockInput.tsx` | `agenda/clock-input.component.tsx` | Copier |
| `calendar-display.ts`, `search.ts` | `agenda/calendar-display.ts`, `agenda/search.ts` | Copier tels quels |
| `styles.css` | `styles/agenda-base.tw.css` | **Transformer** (4.4) |
| `visual-refresh.css` | `styles/agenda-refresh.tw.css` | **Transformer** (4.4) |
| `../../packages/shared/src/calendar.ts` | `shared/calendar.ts` | Copier ; ajouter la notice de licence |
| `test/*.test.ts(x)` | `agenda/*.test.ts(x)` | Porter en Phase 7 |

> **Convention de nommage** : le Core utilise `*.component.tsx` (important : le script `extract-translations` ne scanne que `src/**/*.component.tsx`, `*.extension.tsx` — cf. `package.json` de l'annuaire). Un composant nommé autrement **ne sera pas** extrait pour la traduction.

> **Imports `.js`** : DayFront écrit `import … from './api.js'` (ESM Node). Rspack les résout via `extensionAlias` (`.js` → `.ts/.tsx/.js`, cf. `rspack-config`). **Tu peux les laisser**, mais pour rester homogène avec le Core, retire le suffixe `.js` lors d'un passage de nettoyage.

#### 4.2 Types partagés

`shared/calendar.ts` est copié tel quel. Ajoute `zod` aux `dependencies` (même major que DayFront, `4.x`, **⚠ À VÉRIFIER** qu'aucune autre app du Core n'impose un zod 3 — sinon pas de conflit car non partagé, mais deux zod dans le bundle d'autres apps est sans effet ici : chaque app embarque le sien).

Changer l'import dans tout le code porté : `from '@dayfront/shared'` → `from '../shared/calendar'`.

#### 4.3 `api.ts` avec `egenFetch`

Annexe **A.6**. Différences de comportement à connaître :

- `egenFetch` ajoute le préfixe `window.egenBase` → les chemins deviennent `'/agenda-api/v1/…'` (pas `'/api/v1/…'`).
- **`Content-Type: application/json` à fournir** explicitement pour les `POST/PUT`.
- `egenFetch` **lève** sur non-2xx (`EgenFetchError`) et **redirige vers `/login` sur 401** (promesse pendante) → **plus besoin** de l'événement `dayfront:authentication-required`.
- Les réponses sont déjà parsées (`response.data`) ; on garde la **validation zod**.
- `204` → `data === null` (suppressions).

#### 4.4 CSS — le point le plus délicat

**Problème** (rappel) : (1) sélecteurs globaux (`:root`, `html`, `body`, `#root`, `*`, `button…`) qui contamineraient le shell ; (2) `.css` = **CSS Modules** dans ce monorepo → noms de classes hachés → `className="calendar-entry-content"` ne matcherait plus rien.

**Stratégie en 3 temps** :

**(a) Éviter les CSS Modules** : nommer les feuilles **`*.tw.css`**. D'après `rspack-config`, cette extension passe par `css-loader` **sans modules** (+ PostCSS/Tailwind, inoffensif sur du CSS ordinaire) ⇒ noms de classes **globaux et stables**. C'est exactement le contournement documenté dans le commentaire « TAILWIND — pourquoi une extension dédiée » de `rspack-config`.

**(b) Préfixer tous les sélecteurs** par `.agenda-root` avec un script PostCSS **exécuté une seule fois** (annexe A.10), en convertissant `:root`, `html`, `body`, `#root` en `.agenda-root`. Le résultat est **commité** (pas de build step supplémentaire) puis relu à la main.

**(c) Corriger à la main** les cas que le script ne peut pas deviner :

| Cas | Correction |
|---|---|
| `body { background: radial-gradient(…) }` | Soit supprimer (le fond est géré par le shell), soit le garder sur `.agenda-root`. **Recommandé : supprimer**, pour hériter du fond EGEN. |
| `* { box-sizing: border-box }` | → `.agenda-root, .agenda-root * { box-sizing: border-box }` (le script le fait) |
| `@media (prefers-color-scheme: light) { :root {…} }` | **Supprimer** : le thème sera piloté par attribut (4.5.e), pas par l'OS |
| `:root[data-theme='dark'|'light']` | → `.agenda-root[data-theme='dark'|'light']` (le script le fait) |
| `font-family: Inter, ui-sans-serif…` | → `font-family: inherit` (pas de police web chargée par DayFront : vérifié, aucun `@import`/`@font-face`) |
| `min-height: 100vh` sur le body | → `min-height: 100%` ou la hauteur disponible sous la TopBar — **à ajuster visuellement** |
| `position: fixed` / `z-index` des dialogues et du panneau latéral | **Comparer au `z-index` de la TopBar** (⚠ non lu) et ajuster |

**FullCalendar** injecte son propre CSS par JavaScript (classes `.fc …`) : il n'est pas concerné par le préfixage, mais **tes surcharges** `.fc …` dans les feuilles DayFront deviennent `.agenda-root .fc …` (plus spécifiques → conserveront la priorité). Les popovers de FullCalendar sont rendus dans le conteneur du calendrier ; **⚠ À VÉRIFIER** visuellement qu'ils ne sont pas rognés (`overflow: hidden` d'un parent).

**Vérification anti-fuite** (obligatoire, à répéter à chaque modification de CSS) :

```bash
# 1. aucune règle top-level hors .agenda-root (hors @keyframes/@font-face/@media/@supports)
node scripts/check-css-scope.mjs packages/apps/esm-agenda-app/src/styles/*.tw.css
```

(`check-css-scope.mjs` en annexe A.10.) **Et** contrôle visuel : ouvrir `/home`, `/annuaire`, la TopBar, **avant et après** avoir visité `/agenda` (navigation SPA sans rechargement) ; rien ne doit changer (fond, polices, boutons Carbon, espacements).

#### 4.5 Patchs de `calendar-app.component.tsx` (ex-`App.tsx`)

Repères = numéros de ligne **au commit `8aef796`** (re-vérifie avec `grep` si tu pars d'un autre commit).

**a) Imports (l. 1-55)** — retirer `authenticationRequiredEvent`, `getAuthSession`, `login`, `logout`, `getPublicConfig` de l'import de `./api` et supprimer `import { LoginPage } …`. Remplacer l'import de `@dayfront/shared`.

**b) Composant `App` (l. ≈ 1800-1890)** — **supprimer entièrement** la fonction `App` (états `auth`, `authMode`, effets `authenticationRequiredEvent`/`getPublicConfig`/`getAuthSession`, branches `LoginPage`). Exporter `CalendarApp` :

```tsx
export function CalendarApp(props: { username?: string }) { … }   // ex-fonction CalendarApp, SANS onLogout
```

La déconnexion appartient à la TopBar d'EGEN : supprimer la prop `onLogout` **et** le bouton conditionnel qui l'utilise (⚠ le repérer dans `CalendarApp` : `grep -n onLogout`). Le nom d'utilisateur affiché vient de `useSession()` (`@egen-civitas/esm-framework`) → `session.user.display`.

**c) Effet de configuration (l. ≈ 710-735)** — remplacer `getPublicConfig()` par `useConfig<ConfigSchema>()` :

```tsx
const config = useConfig<ConfigSchema>();
// à la place de setTimeFormat/setSidebarSettings/changeView issus de getPublicConfig() :
const views = { month: 'dayGridMonth', week: 'timeGridWeek', day: 'timeGridDay', agenda: 'listMonth' } as const;
useEffect(() => { calendarRef.current?.getApi().changeView(views[config.defaultView]); }, [config.defaultView]);
```

et dériver `timeFormat`, `sidebar` de `config` directement (plus d'état initialisé en asynchrone, donc plus de « flash »).

**d) URL `?date=` (l. ≈ 148-165 et 707)** — DayFront lit/écrit `window.location` et `popstate`. Dans un shell où `react-router` gère l'historique, un `history.replaceState(null, …)` **efface `history.state`** (clés/index du routeur) et peut casser le bouton « précédent ». Deux options :
 - **Recommandée** : remplacer par `useSearchParams()` de `react-router-dom` (déjà partagé) ;
 - **Minimale** : conserver, mais utiliser `window.history.replaceState(window.history.state, '', url)`.

**e) Thème (l. ≈ 714 et 729)** — **supprimer** `document.documentElement.dataset.theme = …` (modifie `<html>` : **fuite globale**). À la place, poser l'attribut sur le conteneur : `<div className="agenda-root" data-theme={theme}>`, avec `theme` dérivé du thème EGEN (Phase 6.2).

**f) Rendu racine** — envelopper le retour de `CalendarApp` dans `<div className="agenda-root" data-theme={…}>` (si ce n'est pas déjà le cas via le composant `AgendaPage`, annexe A.11).

#### 4.6 FullCalendar : langue, semaine, fuseau

- Ajouter : `import frLocale from '@fullcalendar/core/locales/fr';` et passer `locales={[frLocale]} locale={i18n.language.startsWith('fr') ? 'fr' : 'en'}` au composant `<FullCalendar>`.
- `firstDay={config.weekStartsOn}` (1 = lundi).
- **Fuseau** : FullCalendar natif ne gère que `local` et `UTC` ; les fuseaux IANA nommés exigent un plugin (luxon/moment). DayFront expose `calendar.timezone` (« `local`, UTC, ou nom IANA ») : **⚠ À VÉRIFIER** comment il l'implémente (`grep -n timeZone apps/web/src/*.tsx`). Pour le Gabon (UTC+1 fixe, sans heure d'été) **`local`** convient si les utilisateurs sont sur place ; sinon prévoir `Africa/Libreville`.

#### 4.7 Identifiants globaux et dialogues

- `document.querySelector('#event-title')` (`EventDialog.tsx` l. ≈ 129) : remplacer par une **`ref`** sur l'input (un `id` global peut entrer en collision avec le shell ou une seconde instance).
- Tous les `id=` du code porté : les préfixer `agenda-` (`grep -n 'id="' src/agenda/*.tsx`).
- Les dialogues sont des `div role="dialog"` : **ajouter** `aria-modal="true"`, **piéger le focus** et **fermer sur Échap** si DayFront ne le fait pas déjà (⚠ non vérifié — voir Phase 6.3).

#### 4.8 Dépendances à ajouter

```bash
yarn workspace @egen/esm-agenda-app add --exact \
  @fullcalendar/core@6.1.21 @fullcalendar/daygrid@6.1.21 @fullcalendar/interaction@6.1.21 \
  @fullcalendar/list@6.1.21 @fullcalendar/react@6.1.21 @fullcalendar/timegrid@6.1.21
yarn workspace @egen/esm-agenda-app add zod
```

(Versions **exactes** et **identiques entre elles** : les paquets FullCalendar exigent des versions alignées — `@fullcalendar/react` déclare `@fullcalendar/core ~6.1.21`.)

#### 4.9 Premier lancement et smoke test

Avec la pile de la Phase 1 + gateway Phase 2 (`AGENDA_DEV_USER` actif) :

1. `/egen/spa/agenda` s'affiche, calendrier en mois, **aucune erreur console**.
2. Onglet réseau : les appels partent vers `/egen/agenda-api/v1/calendars` et `…/events?…` avec **`X-Tenant-ID`** si un tenant est actif.
3. Créer un événement → il apparaît ; recharger → il persiste.
4. Naviguer vers `/home` puis `/annuaire` **sans recharger** : aucun changement visuel (anti-fuite CSS).

---

### Phase 5 — Intégration au shell (navigation, 404, fil d'Ariane)

#### 5.1 Page 404 — modifier le `routeRegex` (**bloquant**)

Fichier : `packages/apps/esm-not-found-app/src/routes.json`.

```diff
-"routeRegex": "^(?!(?:login|logout|change-password|home|informations|annuaire|offline-tools)/?)(?!^$)",
+"routeRegex": "^(?!(?:login|logout|change-password|home|informations|annuaire|agenda|offline-tools)/?)(?!^$)",
```

Sans ça : la page « introuvable » s'affiche **en plus** de l'agenda (le regex est un « tout sauf ces routes »).

> **⚠** `esm-not-found-app` est dans le **même** dépôt : la modification passe dans la même PR. Si une autre app ajoutait une route en parallèle, **conflit** sur cette ligne — fais-la tôt.

#### 5.2 Entrées de navigation niveau 2

Déjà déclarées dans `routes.json` (A.7). Vérifie :

- `meta.icon` ∈ liste blanche `esm-primary-navigation-app/src/intranet-topbar/data/navIcons.ts` (contient déjà **`Calendar`** et **`CalendarCheck`**). Pour une autre icône lucide (`ListTodo`, `CalendarDays`…), **ajoute-la** à ce fichier (modif dans l'app de navigation, même dépôt).
- `order` : l'annuaire utilise 510-530 ; prendre 540-560 pour l'agenda (⚠ vérifier qu'aucune autre app n'utilise cette plage : `grep -rn '"order"' packages/apps/*/src/routes.json`).
- `privileges` / `featureFlag` (acceptés par la TopBar, cf. `NAVIGATION.md`) : à ajouter **quand** un privilège backend « utiliser l'agenda » existera (**à coordonner avec le backend**).

#### 5.3 Liens existants `/informations/agenda`

`workspaceMockData.ts` contient plusieurs liens vers **`/informations/agenda`** (entrées « Agenda », « Calendrier d'Équipe », « EGEN Calendrier & Événements », etc.). Décision à prendre :

- **Option A (recommandée)** : remplacer ces liens par **`/agenda`** (ou `/agenda/...`). Les sous-menus déclarés par l'app (`section: "agenda"`) **remplaceront** ceux de la maquette **si la clé de section correspond** (cf. `NAVIGATION.md`) — vérifie la **clé de section** utilisée par la maquette autour de la ligne 133.
- **Option B** : laisser tel quel et faire un **alias de route** dans `esm-informations-app`. À éviter : deux chemins pour la même chose.

> **⚠ À VÉRIFIER** : lire les lignes 120-220, 500-520, 595-605 de `workspaceMockData.ts` (niveau 2).

#### 5.4 Fil d'Ariane

`BreadcrumbLevel2Nav.tsx` code `annuaire` en dur. Pour l'agenda, **le comportement par défaut suffit** au MVP. Si le fil d'Ariane affiche un intitulé incorrect, ajouter un cas dans les blocs ≈ 74-110 et 155-180, **en suivant le motif de l'annuaire** (ne refactore pas ce composant dans cette PR).

#### 5.5 Vérification

```bash
yarn verify:nav            # = node tools/check-nav-routes.mjs
```

---

### Phase 6 — i18n, thème, accessibilité

#### 6.1 i18n (FR par défaut, EN en second)

**Mécanisme du Core** : `react-i18next` ; fichiers `translations/en.json` et `translations/fr.json` ; chargés via `importTranslation = require.context('../translations', false, /.json$/, 'lazy')` dans `index.ts` ; extraction automatique : `yarn workspace @egen/esm-agenda-app extract-translations` (parcourt `src/**/*.component.tsx`, `*.extension.tsx` avec `tools/i18next-parser.config.js`).

**Procédure** :

1. Dans chaque composant : `const { t } = useTranslation();` puis remplacer **chaque chaîne anglaise** par `t('cle', 'English default')`.
2. Trouver les chaînes : `grep -nE "(>[[:space:]]*[A-Z][A-Za-z ,.'’!?-]{2,}<|aria-label=\"|title=\"|placeholder=\"|label=\")" src/agenda/*.tsx`, plus les constantes (`entrySymbols` : « Event », « Note », « Todo » ; « Recurring series » ; messages d'erreur).
3. `yarn extract-translations` → `translations/en.json` ; **traduire à la main** dans `fr.json` (le script ne traduit pas).
4. Dates/heures : `dayjs` (partagé) avec locale `fr`, **et** la locale FullCalendar (4.6).
5. Convention de clés : `agenda.<zone>.<intention>` (ex. `agenda.event.title`, `agenda.recurrence.thisOccurrence`).

> **Ne mélange pas** les deux dictionnaires : l'annuaire garde son dictionnaire FR/EN **en dur dans le composant** (README annuaire : « copie GED »). **Pour l'agenda, utilise `react-i18next`** : c'est la voie standard du framework et elle suit la langue de session.

#### 6.2 Thème

**Objectif** : l'agenda suit le thème EGEN (clair/sombre, couleurs, rayons) au lieu de son propre thème.

1. **Lire** `packages/framework/esm-theme/src/{types,flatten,engine}.ts` et `src/themes/` pour **connaître les noms exacts des variables CSS** générées (`flattenToCssVars`). Aucun nom n'a été relevé dans cette étude — **ne les invente pas**.
2. Dans `agenda-base.tw.css`, DayFront définit ses tokens (`--panel`, `--panel-soft`, `--line`, `--muted`, `--accent`, `--today-bg`, `--today-ring`, + ceux de `visual-refresh.css` : `--text`, `--canvas`, `--shadow-sm`, `--shadow-lg`…). **Remplacer leurs valeurs** par des `var(--<token-egen>)` dans le bloc `.agenda-root { … }` — **c'est le seul endroit à modifier** si les composants n'utilisent que ces variables.
3. `data-theme` : le dériver de l'état de thème d'EGEN (⚠ non identifié : lire `esm-theme/src/singleton.ts` et le sélecteur de thème de la TopBar). Si EGEN n'expose qu'un mode, fixer `data-theme` en conséquence.
4. Remplacer les **couleurs de calendrier** par défaut (`fallbackColors` dans `App.tsx`) par des couleurs conformes à la charte (facultatif).

> Référence design : `docs/guide-composants-et-theme.md` du Core (31 Ko) — **à lire seulement pour cette phase**.

#### 6.3 Accessibilité

À contrôler (DayFront ne l'a pas été **vérifié** ici) : (1) focus piégé dans les dialogues, retour du focus à l'élément déclencheur ; (2) fermeture par **Échap** ; (3) tous les boutons-icônes ont un `aria-label` traduit ; (4) navigation clavier de FullCalendar (activée par défaut sur les événements focusables) ; (5) contraste suffisant en clair **et** sombre ; (6) `prefers-reduced-motion` respecté (DayFront a des animations de balayage tactile `is-swipe-*` : les couper si demandé) ; (7) symboles `◆ ▤ ☑ ↻` (texte Unicode) → icônes `lucide-react` avec `aria-label`.

---

### Phase 7 — Tests

#### 7.1 Frontend (`esm-agenda-app`)

- **Environnement** : copie de l'annuaire (`vitest.config.ts` avec `happy-dom`, alias `@egen-civitas/esm-framework` → `…/mock`, plugin `scss-identity`). Scripts `test` = `cross-env TZ=UTC vitest run --passWithNoTests` (**TZ=UTC** : indispensable pour des dates déterministes).
- **FullCalendar sous happy-dom** : installer `matchMedia` et `ResizeObserver` (déjà dans `test-utils/setup.tsx` de l'annuaire) et `window.getEgenSpaBase = () => '/'`.
- **Mock de `egenFetch`** : le `framework-mock.ts` de l'annuaire ne l'inclut pas ; pour l'agenda, **fournis-le explicitement** (A.13). Constat de l'étude : `esm-framework/mock.tsx` définit `showToast = vi.fn()`, mais `egenFetch`, `useConfig`, `useSession` n'y apparaissent pas sous leur nom (grep) — **⚠ À VÉRIFIER** s'ils y sont ré-exportés autrement avant de les redéfinir.
- **Port des tests DayFront** : `test/api.test.ts` → `api.test.ts` (mock d'`egenFetch` au lieu de `fetch`), `test/App.test.tsx` → `calendar-app.test.tsx` (retirer les cas d'authentification), `test/checkboxes.test.tsx` tel quel (jsdom → happy-dom).
- **Nouveaux tests** : `routes` (`/agenda`, `/agenda/taches`), non-fuite CSS (aucun `style` global ajouté à `document.documentElement`), `api.ts` (préfixe `/agenda-api/v1`, `Content-Type`, erreur → message), rendu sans calendrier (état vide).

#### 7.2 Gateway

- **Garder** les tests DayFront (`pnpm test`).
- **Ajouter `egen-auth.test.ts`** couvrant : session valide → principal attendu ; session expirée/`authenticated:false` → 401 `AUTHENTICATION_REQUIRED` ; cookie absent → 401 ; **tenant invalide** (`../x`, trop long, majuscules) → 400 ; **cache** : 2 requêtes → 1 appel au backend, expiration respectée (horloge simulée) ; **timeout** du backend → 503 (pas 500 opaque) ; `AGENDA_DEV_USER` actif + `NODE_ENV=production` → **le démarrage échoue** ; **en-tête `X-Remote-User` envoyé par le client ignoré** ; `requireSameOrigin` rejette `Origin` étrangère sur POST/PUT/DELETE ; `login` → 404.
- **Test d'intégration** (service Radicale en CI) : `caldav.integration.test.ts` de DayFront (`DAYFRONT_INTEGRATION_TEST=true`) **adapté** pour `http_x_remote_user`.
- **Test d'isolation** : deux principals ; l'un crée un événement, l'autre ne le voit pas (`GET /events`) et reçoit 404 sur son `resourceId`.

#### 7.3 Scénarios manuels de recette (à exécuter avant le merge)

1. Premier accès d'un utilisateur neuf : calendrier « Mon agenda » créé.
2. Vues mois/semaine/jour/agenda ; changement de mois ; « aujourd'hui ».
3. Événement simple ; durée ; **journée entière** ; **multi-jours** ; modification ; suppression.
4. Récurrence hebdomadaire : modifier **une occurrence**, **la série**, supprimer **une occurrence**.
5. Glisser-déposer d'un événement ; redimensionnement.
6. Tâches : créer, terminer, sous-tâche, tâche récurrente, priorité.
7. Créer/renommer/recolorer/supprimer un calendrier ; masquer/afficher.
8. Recherche.
9. Conflit d'édition : ouvrir le même événement dans deux onglets, modifier dans l'un, enregistrer dans l'autre → **message de conflit clair** (`If-Match` → 412 attendu ; ⚠ vérifier le message affiché).
10. Expiration de session : supprimer le cookie → la prochaine requête **redirige vers `/login`**.
11. Changement de langue FR ↔ EN.
12. Mobile (≈ 380 px) : balayage entre périodes (DayFront en a), dialogues utilisables.
13. Deux tenants : isolation.

---

### Phase 8 — CI, build, publication, déploiement

#### 8.1 Core

- **Aucune modification de workflow nécessaire** : `ci.yml` construit et vérifie tous les workspaces (`yarn turbo run build`, `yarn verify`). L'app est découverte via `workspaces: ["packages/apps/*"]`.
- **Obligatoire** : `yarn.lock` mis à jour et commité (`yarn install --immutable` en CI).
- **PR** : le dépôt contient `pr-title-check.yml` et `pr-description-check.yml` (⚠ non lus) — **lis-les avant d'ouvrir la PR** pour respecter le format de titre/description. Utilise aussi `.changeset/` si ton flux de release l'exige (dossier présent dans le Core ; ⚠ vérifier son usage actuel).
- **Publication npm** : `ci:publish` publie **tous** les workspaces sauf `@egen/esm-core` et `@egen/storybook` → l'agenda sera publié sous **`@egen/esm-agenda-app`**. Si tu ne veux pas cela au début, mets `"private": true` dans son `package.json` (et retire-le au moment voulu). L'annuaire est publiable (`publishConfig.access: public`).
- **Taille du bundle** : `yarn workspace @egen/esm-agenda-app analyze` ; ordre de grandeur à documenter dans la PR (ADR-6). Le workflow `bundle-size.yml` existe (⚠ non lu).

#### 8.2 Comment l'app arrive dans le SPA de production

Le CLI `egen` a une commande `assemble` (`tooling/egen/src/commands/assemble.ts`, 321 lignes) alimentée par une **configuration de build du SPA** (`--build-config`, défaut `spa-build-config.json`) et construit un **import map** + **registre de routes**. Le détail de ce fichier **n'a pas été lu** : **⚠ À VÉRIFIER** (niveau 2) comment ton déploiement actuel déclare la liste des modules frontend (nom de paquet + version) et **ajoute-y `@egen/esm-agenda-app`** à côté de l'annuaire. Sans cette entrée, l'agenda fonctionnera en dev (`--sources`) **mais pas en production**.

#### 8.3 Gateway — CI

`.github/workflows/ci.yml` du dépôt gateway : Node 24, `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm verify`, service **Radicale** pour l'intégration, puis build et push de l'image vers GHCR (le workflow `publish-container.yml` de DayFront est un bon point de départ — **⚠ non lu**). **Épingler les actions par SHA** comme le fait le Core.

#### 8.4 Déploiement

Annexe A.1 (compose de production). Points d'exploitation :

- **Secrets** : aucun secret n'est requis par la gateway en mode `egen-session` (pas de `sessionSecret`, pas de mot de passe CalDAV). C'est un **gain de sécurité** par rapport au mode DayFront d'origine.
- **Sondes** : `/health` (liveness). Implémenter la readiness CalDAV (2.9).
- **Sauvegarde** : le volume Radicale = un fichier `.ics`/`.vcf` par élément, plus des fichiers `.Radicale.props` par collection. Sauvegarde **quotidienne** (archive du volume) + **test de restauration** documenté. Chiffrer les sauvegardes (données personnelles).
- **Journaux** : JSON (`logging.format: json` si disponible, sinon `pretty` désactivé en prod — ⚠ vérifier les valeurs acceptées dans `config.ts`).
- **Mise à jour de Radicale** : épingler la version, lire les notes de migration (changements de format de stockage possibles entre versions majeures).
- **TLS** terminé au proxy ; `Strict-Transport-Security` est déjà émis par la gateway quand `request.secure`.

---

### Phase 9 — Extensions EGEN et calendriers collectifs

**Hors MVP.** À ne lancer que MVP stable (checklist section 8 cochée).

#### 9.1 Points d'extension dans l'agenda

Le framework fournit des slots/extensions (`esm-extensions`, composant `ExtensionSlot` dans `esm-react-utils/src/ExtensionSlot.tsx`). Définir des **noms de slots stables** et les documenter :

| Slot (proposé) | Où | Usage |
|---|---|---|
| `agenda-event-dialog-actions` | pied du dialogue d'événement | « Réserver une salle », « Ajouter une visio » |
| `agenda-toolbar-actions` | barre du calendrier | exports, impressions |
| `agenda-sidebar-sections` | panneau latéral | calendriers collectifs, filtres métier |

Dans l'agenda : `<ExtensionSlot name="agenda-event-dialog-actions" state={{ event, calendar }} />`.
Dans l'app contributrice (`routes.json` de l'app de réservation) :

```json
{ "name": "room-booking-event-action", "slot": "agenda-event-dialog-actions",
  "component": "roomBookingAction", "online": true, "offline": false }
```

> **⚠ À VÉRIFIER** la signature de `ExtensionSlot` et le passage d'`state` (lire `ExtensionSlot.tsx`, `useExtensionSlot.ts`). Le *design* ci-dessus suit le modèle O3 mais n'a pas été exécuté ici.

#### 9.2 Calendriers collectifs (Direction, IT, salles, institution)

Contrainte (ADR-5) : Radicale n'a pas de partage inter-principals. **Modèle proposé** :

1. **Catalogue déclaratif** dans la config de la gateway (`collectiveCalendars`) :

```yaml
collectiveCalendars:
  - id: direction
    principal: org__{tenant}__direction     # principal technique Radicale
    displayName: Direction
    color: "#1d4ed8"
    access:
      read:  [direction, secretariat]       # groupes / rôles EGEN
      write: [direction]
  - id: salle-1
    principal: org__{tenant}__salles
    displayName: Salle de conférence 1
    access: { read: ["*"], write: [reservation] }
```

2. **Agrégation** : `GET /calendars` renvoie les calendriers personnels **+** les collectifs accessibles à l'utilisateur, chacun marqué `readOnly` si pas d'écriture. Les identifiants sont **préfixés** (`shared:direction:…`) pour que la gateway sache quel principal interroger — **⚠ À VÉRIFIER** la forme des `id`/`resourceId` produits par DayFront (ce sont probablement des `href`/hash dérivés de la collection ; lire `calendar/event-mapper.ts` avant de décider du préfixage).
3. **Autorisation dans la gateway** (jamais seulement dans le front) : pour toute route portant un `calendarId`/`resourceId`, résoudre le propriétaire, vérifier le groupe, puis utiliser le `CalDavClient` **du principal technique**.
4. **Source des groupes** : **⚠ À VÉRIFIER** ce que la session EGEN expose (`LoggedInUser.privileges`, `roles`) ou ce qu'un appel Keycloak/backend peut fournir.
5. **Réservation de salle** : Radicale n'implémente pas le *scheduling* CalDAV (invitations iTIP, free-busy automatique). **Détection de conflit** à écrire dans la gateway : avant écriture, `REPORT` sur la plage ; **sérialiser** les écritures par salle (verrou en mémoire ou, en multi-instances, verrou externe) pour éviter la double réservation (condition de concurrence).

#### 9.3 Hors périmètre (à ne pas promettre)

Invitations/participants (iTIP/iMIP), rappels par e-mail, free-busy inter-utilisateurs, synchronisation hors-ligne dans le navigateur. Les **clients natifs** (téléphone) peuvent se connecter à Radicale **uniquement** si tu exposes un chemin CalDAV authentifié séparément de la gateway — décision d'architecture distincte (ne pas exposer Radicale tel quel, cf. section 7).

---

## 7. Sécurité

### 7.1 Modèle de menaces

| Menace | Vecteur | Contre-mesure |
|---|---|---|
| **Usurpation d'identité vers Radicale** | Atteindre Radicale directement et poser `X-Remote-User` | Radicale sur réseau interne **sans port publié** ; proxy qui **supprime** l'en-tête ; test de non-régression en CI |
| **Contournement d'auth gateway** | Requête sans cookie / cookie rejoué | Validation **à chaque requête** via cache ≤ 60 s ; 401 → `egenFetch` redirige vers `/login` |
| **Forge de tenant** | `X-Tenant-ID` arbitraire (le front ne valide rien) | Validation de format + liste blanche + cohérence avec la session (2.6) |
| **CSRF** | Page tierce déclenchant un `POST` avec le cookie de session | `requireSameOrigin` **toujours actif** (Origin = Host) ; cookie EGEN `SameSite` — **⚠ À VÉRIFIER** sa valeur côté backend |
| **Bypass de dev en production** | `AGENDA_DEV_USER` oublié | Refus de démarrer si `NODE_ENV=production` (A.3) |
| **Fuite d'identifiants** | Journaux, erreurs | Pas de cookie/Authorization/corps dans les logs ; erreurs génériques côté client |
| **XSS via description d'événement** | Contenu importé (`.ics`, saisie) affiché | React échappe par défaut : **interdire `dangerouslySetInnerHTML`** (`grep -rn dangerouslySetInnerHTML src` doit être vide) |
| **SSRF via abonnements `.ics`** | URL fournie → la gateway la télécharge | Abonnements **définis par l'admin uniquement** (config), pas par l'utilisateur ; ne jamais ajouter d'endpoint utilisateur d'abonnement sans liste blanche d'hôtes |
| **Déni de service** | Rafales d'écritures, très grandes séries récurrentes | Rate-limit par principal ; `calendar.maxOccurrences` (5000 par défaut) ; corps JSON ≤ 1 Mo (déjà en place) |
| **Fuite inter-tenants** | Bug de préfixe de principal | Test d'isolation automatisé (7.2) |
| **Perte de données** | Volume corrompu/supprimé | Sauvegardes quotidiennes + restauration testée |

### 7.2 Données personnelles

Les agendas contiennent des **données personnelles** (rendez-vous, lieux, participants). Prévois : durée de conservation, droit d'accès/suppression d'un utilisateur (suppression du principal = suppression de son dossier Radicale — **procédure à documenter et tester**), chiffrement des sauvegardes, et journalisation des accès administrateur. Le cadre légal gabonais applicable (loi sur la protection des données à caractère personnel et autorité de contrôle) est **à confirmer avec ton conseil juridique** : je ne peux pas le valider ici.

### 7.3 Ce que la sécurité du front ne garantit pas

Le front n'est **jamais** une couche de sécurité : masquer un bouton « Réserver » ne protège rien. Toute autorisation (collectifs, salles) est appliquée **dans la gateway**. Radicale `owner_only` reste une **défense en profondeur** (un principal ne peut lire que sa collection même si la gateway avait un bug de routage, tant que l'en-tête est correct).

---

## 8. Checklists de validation (Definition of Done)

### 8.1 Fonctionnel
- [ ] Vues mois / semaine / jour / agenda
- [ ] Événements : créer, modifier, supprimer ; journée entière ; multi-jours ; glisser-déposer ; redimensionnement
- [ ] Récurrence : série et occurrence (modifier, supprimer)
- [ ] Tâches : cycle de vie complet, sous-tâches, récurrentes, priorités
- [ ] Calendriers : créer, renommer, recolorer, supprimer, afficher/masquer
- [ ] Recherche
- [ ] Abonnement `.ics` (jours fériés) en lecture seule, si configuré
- [ ] Premier accès : calendrier par défaut créé automatiquement
- [ ] Conflit de modification géré avec message clair

### 8.2 Intégration EGEN
- [ ] Route `agenda` active, **pas de page 404 superposée**
- [ ] Entrées du méga-menu visibles et correctes ; `yarn verify:nav` OK
- [ ] Liens `/informations/agenda` traités (5.3)
- [ ] Déconnexion EGEN → l'agenda redirige vers `/login` à la requête suivante
- [ ] `X-Tenant-ID` transmis ; isolation inter-tenants vérifiée
- [ ] Langue FR/EN suit la session ; dates en français
- [ ] Thème aligné (clair/sombre)

### 8.3 Technique
- [ ] `yarn workspace @egen/esm-agenda-app build` / `typescript` / `lint` / `test` verts
- [ ] `yarn verify` (racine) vert
- [ ] **Aucune règle CSS globale** (script `check-css-scope`) ; aucune modification de `document.documentElement` ou `document.body`
- [ ] `peerDependencies` = copie de l'annuaire ; FullCalendar et zod **absents** des peers
- [ ] Une seule instance de React (DevTools réseau : pas de second `react` chargé)
- [ ] Taille de bundle mesurée et consignée
- [ ] Aucune erreur/avertissement console au chargement et pendant l'usage
- [ ] `yarn.lock` commité

### 8.4 Sécurité / exploitation
- [ ] Radicale **injoignable** de l'extérieur (test `curl` depuis l'hôte et depuis Internet)
- [ ] `X-Remote-User` envoyé par un client ignoré/supprimé
- [ ] Gateway refuse de démarrer avec `AGENDA_DEV_USER` en production
- [ ] Aucun secret dans git (grep sur `token|secret|password`)
- [ ] Sauvegarde + **restauration testée**
- [ ] `/health` surveillé ; logs sans données sensibles
- [ ] Image gateway épinglée (digest) et rebuild planifié pour correctifs Node

---

## 9. Risques, limites et questions ouvertes

### 9.1 Risques

| # | Risque | Prob. | Impact | Mitigation |
|---|---|---|---|---|
| R1 | CSS DayFront (3 600 lignes) fuit ou casse le shell | Élevée | Élevé | Préfixage automatisé + script de contrôle + recette visuelle avant/après (4.4) |
| R2 | Contrat `/session` du backend différent de l'hypothèse | Moyenne | Élevé | **Lire/curl le vrai endpoint avant la Phase 2** ; isoler dans un adaptateur `resolveIdentity()` |
| R3 | Radicale ne crée pas le principal / comportement `http_x_remote_user` différent | Moyenne | Moyen | Spike d'une heure en Phase 1 (1.5) ; `ensurePrincipal` (2.5) |
| R4 | Dérive amont de DayFront (mises à jour) | Moyenne | Faible | Garder les modifs minimales et localisées (3 fichiers gateway) ; tag `egen/base-8aef796` |
| R5 | Poids du bundle (FullCalendar) | Moyenne | Faible | Lifecycle asynchrone (ADR-6) ; mesure |
| R6 | Besoin de calendriers collectifs dès le MVP | Moyenne | Élevé | **Question n°4 ci-dessous** — à trancher avant de planifier |
| R7 | Port de gateway/compat Node 24 sur l'hébergement | Faible | Moyen | Conteneur (0.1) |
| R8 | Fuseaux horaires nommés (Gabon) | Faible | Faible | `local` ; vérifier l'implémentation DayFront (4.6) |
| R9 | Fuite du token GitHub collé en chat | Réalisée | Élevé | **Révoquer maintenant** (0.2) |

### 9.2 Questions ouvertes (à trancher par toi)

1. **Contrat d'authentification** : que renvoie exactement `GET /ws/rest/v1/session` sur ton backend (FastAPI ou kernel Quarkus) ? Le cookie est-il la seule preuve de session, ou y a-t-il un JWT Keycloak côté navigateur ?
2. **Groupes/rôles** : où lire les groupes Keycloak (session, endpoint dédié, JWT) ?
3. **Tenant ↔ session** : le backend renvoie-t-il le tenant de l'utilisateur, pour vérifier la cohérence avec `X-Tenant-ID` ?
4. **Calendriers collectifs au MVP ?** (Direction/IT/salles). Si oui, la Phase 9.2 entre dans le chemin critique (+4-6 j).
5. **Emplacement dans la navigation** : l'agenda est-il une section autonome (`agenda`) ou reste-t-il sous « Informations » (liens actuels `/informations/agenda`) ?
6. **Publication** : l'app doit-elle être publiée sur npm sous `@egen/esm-agenda-app` dès le début, ou rester `private` ?
7. **Hébergement** : où tournent gateway + Radicale (même hôte que le backend EGEN ? Kubernetes ? Docker Compose) ? Node 24 disponible ?
8. **Clients natifs** : faut-il pouvoir synchroniser un téléphone ? (change radicalement l'exposition de Radicale — section 9.3).
9. **Rétention et conformité** : durée de conservation, procédure de suppression d'un compte.
10. **Mode hors-ligne** : exclu du MVP (`offline: false`) — confirmer.

### 9.3 Ce que cette étude n'a **pas** vérifié

Liste exhaustive, pour ne pas laisser croire à une certitude :

- Le **comportement réel** de Radicale (création automatique du principal, syntaxe exacte des droits, `http_x_remote_user`) : **aucune instance n'a été lancée**.
- Le **build** : `yarn install`/`turbo build` n'ont **pas** été exécutés (le document `analyse-separation-framework.md` signale déjà que le Yarn Berry du bac à sable échoue en WASM ; aucun essai ici).
- Le **rendu visuel** de DayFront dans le shell : aucun navigateur n'a été lancé.
- `esm-theme` (noms de variables), `esm-extensions` (API exacte), `assemble.ts` (config du SPA), `workspaceMockData.ts` (clés de section), `TopBar` (`z-index`), workflows `pr-*-check.yml`, `bundle-size.yml`.
- L'implémentation DayFront des **fuseaux nommés**, de la **gestion du focus** dans les dialogues, et du **message de conflit** (412).
- La **forme des `id`/`resourceId`** DayFront (pertinent pour les calendriers collectifs).
- Le droit gabonais applicable aux données personnelles.

Chacun de ces points est signalé **⚠ À VÉRIFIER** à l'endroit où il compte.


---

## 10. Annexes — code et configuration complets

> **Statut du code ci-dessous** : écrit pour cette étude à partir des fichiers lus ; **non compilé, non exécuté**. Les endroits où il dépend d'un détail non lu sont marqués `// ⚠`. Traite-le comme un **premier jet précis**, pas comme du code éprouvé : compile, lance les tests de la Phase 7, corrige.

### A.1 — Pile Docker (`compose.yaml`, Radicale, config gateway)

**`compose.yaml`**

```yaml
name: egen-agenda

networks:
  agenda-internal:
    internal: true        # aucun accès sortant ni entrant depuis l'hôte : Radicale n'est joignable que par la gateway
  edge: {}

services:
  radicale:
    build: ./radicale
    restart: unless-stopped
    networks: [agenda-internal]        # SEUL réseau. Surtout : AUCUN "ports:".
    volumes:
      - ./radicale/config:/config:ro
      - radicale-data:/data
    read_only: true
    tmpfs: [/tmp]
    user: "1000:1000"

  gateway:
    image: ghcr.io/amourgit/egen-agenda-gateway:dev     # ⚠ ou "build: ../EGEN-agenda-gateway"
    restart: unless-stopped
    networks: [agenda-internal, edge]
    depends_on: [radicale]
    environment:
      DAYFRONT_CONFIG_FILE: /config/gateway.yaml
      NODE_ENV: development             # "production" en prod
      AGENDA_DEV_USER: "dev-user"       # ⚠ DÉVELOPPEMENT UNIQUEMENT — doit être ABSENT en production
      TZ: Africa/Libreville
    volumes:
      - ./gateway/gateway.yaml:/config/gateway.yaml:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"   # pour joindre le backend EGEN lancé sur l'hôte (dev)

  proxy:                                # dev uniquement : en prod c'est votre reverse proxy existant
    image: nginx:1.27-alpine
    restart: unless-stopped
    networks: [edge]
    ports: ["8090:8090"]
    volumes:
      - ./nginx/dev.conf:/etc/nginx/nginx.conf:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on: [gateway]

volumes:
  radicale-data:
```

**`radicale/Dockerfile`** (évite de dépendre d'une image communautaire non vérifiée)

```dockerfile
FROM python:3.12-alpine
# ⚠ Épingler une version EXACTE après avoir vérifié la dernière 3.x stable (ex. radicale==3.x.y)
RUN pip install --no-cache-dir "radicale==3.*"
RUN adduser -D -u 1000 radicale && mkdir -p /data/collections && chown -R radicale /data
USER radicale
EXPOSE 5232
CMD ["python", "-m", "radicale", "--config", "/config/config"]
```

**`radicale/config/config`**

```ini
[server]
hosts = 0.0.0.0:5232

[auth]
# L'identité est posée par la gateway (réseau interne uniquement !). ⚠ vérifier que ce type existe dans ta version.
type = http_x_remote_user

[rights]
# MVP : chacun n'accède qu'à ses propres collections.
type = owner_only
# Calendriers collectifs (Phase 9) : passer à "from_file" avec un fichier de droits, ⚠ syntaxe à lire dans la doc de ta version.

[storage]
filesystem_folder = /data/collections

[web]
type = none

[logging]
level = info
```

**`gateway/gateway.yaml`**

```yaml
caldav:
  url: http://radicale:5232
  timeoutMs: 10000
  trustedUserHeader: X-Remote-User     # ← clé ajoutée (2.2)

authentication:
  mode: egen-session                    # ← mode ajouté (2.2)
  egen:
    sessionUrl: http://host.docker.internal:8081/egen/ws/rest/v1/session   # ⚠ URL INTERNE de TON backend
    cacheTtlSeconds: 30
    requireTenant: true
    allowedTenants: []
    # Dev uniquement : en dev, l'Origin vu par la gateway est celle du serveur `egen develop`
    # (le proxy HPM réécrit Host) → on l'autorise explicitement. VIDE en production.
    allowedOrigins:
      - http://localhost:8081

server:
  host: 0.0.0.0
  port: 8080
  trustProxy: true

calendar:
  timezone: local
  weekStartsOn: 1
  maxOccurrences: 5000

ui:                                     # le schéma DayFront peut encore l'exiger : ⚠ vérifier dans config.ts
  defaultView: month
  darkMode: auto
  timeFormat: 24h
  sidebar: { enabled: true, defaultOpen: false, showBrand: false, showTasks: true, showCalendars: true }

# calendar_subscriptions:               # ex. jours fériés — fournir ta propre URL .ics
#   - id: jours-feries
#     name: Jours fériés
#     url: https://example.org/jours-feries.ics
#     enabled: true
#     color: "#16a34a"
#     refresh_interval: 24h

logging:
  level: info
  format: json                          # ⚠ vérifier les valeurs acceptées (config.ts)
```

> **Piège de développement (Origin)** : le navigateur appelle `localhost:8081` (serveur `egen develop`) → ce dernier proxifie vers nginx avec `changeOrigin: true` (cf. `develop.ts`), donc la gateway voit un `Host` différent de l'`Origin` du navigateur et la vérification CSRF (`sameOrigin`) échouerait en **403 ORIGIN_REJECTED**. D'où `allowedOrigins` ci-dessus, **réservé au développement**. En production (même hôte via le reverse proxy, `X-Forwarded-Host` correct), laisser la liste **vide**.

### A.2 — nginx de développement (`nginx/dev.conf`)

```nginx
worker_processes 1;
events { worker_connections 1024; }

http {
  server_tokens off;
  # Le backend EGEN tourne sur l'hôte (⚠ adapter le port ; ne pas entrer en conflit avec nginx)
  upstream egen_backend { server host.docker.internal:8081; }
  upstream agenda_gateway { server gateway:8080; }

  server {
    listen 8090;

    # ── Agenda : /egen/agenda-api/v1/*  →  gateway  /api/v1/*
    location /egen/agenda-api/v1/ {
      proxy_pass http://agenda_gateway/api/v1/;
      proxy_http_version 1.1;
      proxy_set_header Host              $http_host;
      proxy_set_header X-Forwarded-Host  $http_host;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
      proxy_set_header X-Remote-User     "";          # ← JAMAIS transmis depuis l'extérieur
      client_max_body_size 1m;
    }

    # Santé de la gateway (optionnel)
    location = /egen/agenda-api/health {
      proxy_pass http://agenda_gateway/health;
    }

    # ── Tout le reste de /egen/ → backend EGEN (chemin conservé)
    location /egen/ {
      proxy_pass http://egen_backend;
      proxy_http_version 1.1;
      proxy_set_header Host              $http_host;
      proxy_set_header X-Forwarded-Host  $http_host;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    }
  }
}
```

Lancement du shell de dev contre cette pile (⚠ adapter `--api-url`/`--spa-path` à tes scripts habituels) :

```bash
yarn run:egen develop --sources packages/apps/esm-agenda-app \
  --backend http://localhost:8090 --api-url /egen --spa-path /egen/spa
```

### A.3 — Gateway : `apps/api/src/egen-auth.ts`

```ts
import { createHash } from 'node:crypto';

import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { CalDavClient } from './caldav/client.js';
import type { DayFrontConfig } from './config.js';   // ⚠ type étendu en 2.2 (authentication.egen, caldav.trustedUserHeader)
import { ApiError } from './errors.js';

// ─── Types ────────────────────────────────────────────────────────────────
interface Identity {
  principal: string;     // <tenant>__<uuid>
  display: string;
}
interface CacheEntry { identity: Identity | null; expiresAt: number }
interface SessionBody {
  authenticated?: boolean;
  user?: { uuid?: string; display?: string; username?: string };
}

const TENANT_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
const UUID_RE = /^[a-z0-9-]{8,64}$/;
const MAX_CACHE = 5_000;
const MAX_TTL_MS = 60_000;          // jamais plus : la déconnexion doit se propager vite
const identities = new WeakMap<Request, Identity>();

// ─── Garde-fou mode développement (ADR-4) ─────────────────────────────────
export function assertSafeDevMode(env: NodeJS.ProcessEnv = process.env): void {
  if (env.AGENDA_DEV_USER && env.NODE_ENV === 'production') {
    // On refuse de démarrer plutôt que d'ouvrir silencieusement un contournement d'authentification.
    throw new Error('AGENDA_DEV_USER est défini alors que NODE_ENV=production : démarrage refusé.');
  }
}

function sanitizeUuid(value: string | undefined): string | undefined {
  const v = value?.trim().toLowerCase();
  return v && UUID_RE.test(v) ? v : undefined;
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

// ─── Fabrique ─────────────────────────────────────────────────────────────
export function createEgenAuthentication(
  config: DayFrontConfig,
  deps: { fetch?: typeof fetch; now?: () => number } = {},
) {
  assertSafeDevMode();
  const cfg = config.authentication.egen;                       // ⚠ ajouté en 2.2
  const doFetch = deps.fetch ?? globalThis.fetch;
  const now = deps.now ?? Date.now;
  const ttlMs = Math.min(Math.max(cfg.cacheTtlSeconds, 0) * 1000, MAX_TTL_MS);
  const cache = new Map<string, CacheEntry>();
  const devUser = process.env.AGENDA_DEV_USER;
  const trustedHeader = config.caldav.trustedUserHeader ?? 'X-Remote-User';

  function prune(t: number) {
    if (cache.size < MAX_CACHE) return;
    for (const [k, v] of cache) if (v.expiresAt <= t) cache.delete(k);
    if (cache.size >= MAX_CACHE) cache.clear();                 // dernier recours : jamais de croissance sans borne
  }

  function tenantOf(request: Request): string {
    const raw = request.header('x-tenant-id')?.trim().toLowerCase();
    if (!raw) {
      if (cfg.requireTenant) throw new ApiError(400, 'INVALID_TENANT', 'Tenant manquant.');
      return 'default';
    }
    if (!TENANT_RE.test(raw)) throw new ApiError(400, 'INVALID_TENANT', 'Tenant invalide.');
    if (cfg.allowedTenants.length > 0 && !cfg.allowedTenants.includes(raw))
      throw new ApiError(403, 'TENANT_FORBIDDEN', 'Tenant non autorisé.');
    return raw;
  }

  async function resolveIdentity(cookie: string | undefined, tenant: string): Promise<Identity | null> {
    if (devUser) {
      const uuid = sanitizeUuid(devUser) ?? 'dev-user-0000';
      return { principal: `${tenant}__${uuid}`, display: 'Utilisateur (dev)' };
    }
    if (!cookie) return null;
    const key = hash(`${cookie}|${tenant}`);
    const t = now();
    const hit = cache.get(key);
    if (hit && hit.expiresAt > t) return hit.identity;

    let body: SessionBody;
    try {
      const response = await doFetch(cfg.sessionUrl, {
        headers: { Cookie: cookie, 'X-Tenant-ID': tenant, Accept: 'application/json' },
        signal: AbortSignal.timeout(3_000),
      });
      if (response.status === 401 || response.status === 403) {
        cache.set(key, { identity: null, expiresAt: t + Math.min(ttlMs, 5_000) });   // cache négatif très court
        return null;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      body = (await response.json()) as SessionBody;
    } catch {
      // Backend d'identité indisponible : on NE considère PAS l'utilisateur comme authentifié, et on le dit clairement.
      throw new ApiError(503, 'IDENTITY_UNAVAILABLE', "Le service d'identité est indisponible.");
    }

    const uuid = sanitizeUuid(body.user?.uuid);
    const identity: Identity | null =
      body.authenticated === true && uuid
        ? { principal: `${tenant}__${uuid}`, display: body.user?.display ?? body.user?.username ?? 'Utilisateur' }
        : null;
    prune(t);
    cache.set(key, { identity, expiresAt: t + ttlMs });
    return identity;
  }

  // ─── Middlewares (même interface que createAuthentication de DayFront) ───
  const session: RequestHandler = (request, _response, next) => {
    (async () => {
      const tenant = tenantOf(request);
      const identity = await resolveIdentity(request.header('cookie'), tenant);
      if (identity) identities.set(request, identity);
    })().then(() => next(), next);
  };

  const requireSession: RequestHandler = (request, _response, next) => {
    if (!identities.has(request)) {
      next(new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Authentification requise.'));
      return;
    }
    next();
  };

  function sameOrigin(request: Request): boolean {
    const origin = request.header('origin');
    if (!origin) return true;                                   // comme DayFront : appels non-navigateur
    try {
      const parsed = new URL(origin);
      if (cfg.allowedOrigins.includes(parsed.origin)) return true;   // DEV uniquement (liste vide en prod)
      return parsed.protocol === `${request.protocol}:` && parsed.host === request.get('host');
    } catch {
      return false;
    }
  }

  const requireSameOrigin: RequestHandler = (request, _response, next) => {
    if (!sameOrigin(request)) {
      next(new ApiError(403, 'ORIGIN_REJECTED', "L'origine de la requête a été rejetée."));
      return;
    }
    next();
  };

  const status: RequestHandler = (request, response: Response) => {
    const identity = identities.get(request);
    response.setHeader('Cache-Control', 'no-store');
    response.json({
      data: { mode: 'egen-session', authenticated: Boolean(identity), username: identity?.display },
      meta: { requestId: String(response.locals.requestId) },
    });
  };

  const login: RequestHandler = (_request, _response, next: NextFunction) =>
    next(new ApiError(404, 'NOT_FOUND', 'Login is not enabled.'));      // la connexion est gérée par EGEN

  const logout: RequestHandler = (_request, response) => { response.status(204).end(); };   // sans effet

  /** Client CalDAV de l'utilisateur courant : identité transmise à Radicale par l'en-tête de confiance. */
  function client(request: Request): CalDavClient {
    const identity = identities.get(request);
    if (!identity) throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Authentification requise.');
    return new CalDavClient(
      { ...config.caldav, username: identity.principal, password: 'unused' },     // Authorization: Basic ignoré par Radicale
      { extraHeaders: { [trustedHeader]: identity.principal } },                  // ← option ajoutée en 2.3
    );
  }

  return { session, status, login, logout, requireSession, requireSameOrigin, client };
}
```

**Branchement dans `app.ts`** (à la place de l'appel unique à `createAuthentication`) :

```ts
const authentication =
  config.authentication.mode === 'egen-session'
    ? createEgenAuthentication(config)
    : createAuthentication(config, caldavFetch ? { fetch: caldavFetch } : {});
```

et, dans le `calendarRouter(...)`, utiliser `(request) => authentication.client(request)` pour **les deux** modes multi-utilisateurs (`caldav-login` **et** `egen-session`) — la condition actuelle `config.authentication.mode === 'caldav-login'` doit devenir `!== 'single-user'`.

> `ensurePrincipal` (2.5) se branche dans `client()` ou dans un middleware juste après `requireSession` ; à écrire une fois le comportement de Radicale constaté (1.5).

### A.4 — Dockerfile de la gateway (squelette)

> ⚠ Le `Dockerfile` amont de DayFront **n'a pas été lu**. Pars de lui (`git show egen/base-8aef796:Dockerfile`) : retire les étapes de build du front (`apps/web`) et conserve sa manière d'installer/exécuter l'API. Le squelette ci-dessous donne seulement les **exigences** à retrouver.

```dockerfile
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dayfront/api build          # tsup → apps/api/dist/server.js

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
# ⚠ Copier ce dont dist/server.js a besoin à l'exécution (node_modules de prod) selon la config tsup
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["node", "dist/server.js"]
```

### A.5 — `packages/apps/esm-agenda-app/package.json`

```json
{
  "name": "@egen/esm-agenda-app",
  "version": "1.0.0",
  "license": "MPL-2.0",
  "description": "Agenda EGEN — calendrier CalDAV (mois, semaine, jour, agenda), événements, récurrences, tâches. UI portée de DayFront (MIT).",
  "browser": "dist/egen-esm-agenda-app.js",
  "main": "src/index.ts",
  "source": true,
  "scripts": {
    "start": "egen develop",
    "serve": "rspack serve --mode=development",
    "debug": "npm run serve",
    "test": "cross-env TZ=UTC vitest run --passWithNoTests",
    "test:watch": "cross-env TZ=UTC vitest watch",
    "build": "rspack --mode=production",
    "build:development": "rspack --mode=development",
    "analyze": "rspack --mode=production --env analyze=true",
    "typescript": "tsc",
    "lint": "eslint src --ext ts,tsx",
    "extract-translations": "i18next 'src/**/*.component.tsx' 'src/**/*.extension.tsx' --config='../../../tools/i18next-parser.config.js'",
    "coverage": "cross-env TZ=UTC vitest run --coverage --passWithNoTests"
  },
  "keywords": ["egen", "microfrontends", "agenda", "calendar", "caldav"],
  "browserslist": ["extends browserslist-config-egen"],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/amourgit/Frontend-esm-core.git",
    "directory": "packages/apps/esm-agenda-app"
  },
  "publishConfig": { "access": "public" },
  "dependencies": {
    "@carbon/react": "^1.92.1",
    "@egen-civitas/esm-api": "^1.1.2",
    "@egen-civitas/esm-config": "^1.0.2",
    "@egen-civitas/esm-context": "^1.0.1",
    "@egen-civitas/esm-data-api": "^1.0.2",
    "@egen-civitas/esm-dynamic-loading": "^2.0.0",
    "@egen-civitas/esm-error-handling": "^1.0.1",
    "@egen-civitas/esm-expression-evaluator": "^1.0.1",
    "@egen-civitas/esm-extensions": "^1.1.1",
    "@egen-civitas/esm-feature-flags": "^1.0.1",
    "@egen-civitas/esm-framework": "^1.1.4",
    "@egen-civitas/esm-globals": "^1.0.2",
    "@egen-civitas/esm-navigation": "^1.0.2",
    "@egen-civitas/esm-offline": "^1.0.1",
    "@egen-civitas/esm-react-utils": "^1.0.5",
    "@egen-civitas/esm-routes": "^1.0.2",
    "@egen-civitas/esm-state": "^1.0.2",
    "@egen-civitas/esm-styleguide": "^1.9.0",
    "@egen-civitas/esm-tenant": "^1.0.2",
    "@egen-civitas/esm-theme": "^1.0.1",
    "@egen-civitas/esm-translations": "^1.0.1",
    "@egen-civitas/esm-utils": "^1.0.2",
    "@fullcalendar/core": "6.1.21",
    "@fullcalendar/daygrid": "6.1.21",
    "@fullcalendar/interaction": "6.1.21",
    "@fullcalendar/list": "6.1.21",
    "@fullcalendar/react": "6.1.21",
    "@fullcalendar/timegrid": "6.1.21",
    "dayjs": "^1.11.10",
    "lucide-react": "^0.469.0",
    "react-is": "^17.0.2",
    "rxjs": "^7.8.1",
    "single-spa": "^6.0.0",
    "swr": "^2.2.0",
    "zod": "^4.4.3"
  },
  "peerDependencies": {
    "@carbon/react": "1.x",
    "@egen-civitas/esm-api": "1.x",
    "@egen-civitas/esm-config": "1.x",
    "@egen-civitas/esm-context": "1.x",
    "@egen-civitas/esm-data-api": "1.x",
    "@egen-civitas/esm-dynamic-loading": "2.x",
    "@egen-civitas/esm-error-handling": "1.x",
    "@egen-civitas/esm-extensions": "1.x",
    "@egen-civitas/esm-feature-flags": "1.x",
    "@egen-civitas/esm-framework": "1.x",
    "@egen-civitas/esm-globals": "1.x",
    "@egen-civitas/esm-navigation": "1.x",
    "@egen-civitas/esm-react-utils": "1.x",
    "@egen-civitas/esm-routes": "1.x",
    "@egen-civitas/esm-state": "1.x",
    "@egen-civitas/esm-styleguide": "1.x",
    "@egen-civitas/esm-tenant": "1.x",
    "@egen-civitas/esm-theme": "1.x",
    "@egen-civitas/esm-utils": "1.x",
    "dayjs": "1.x",
    "react": "18.x",
    "react-dom": "18.x",
    "react-i18next": "16.x",
    "react-router-dom": "6.x",
    "rxjs": "7.x",
    "single-spa": "6.x",
    "swr": "2.x"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^4.1.2",
    "cross-env": "^10.1.0",
    "happy-dom": "^20.6.0",
    "i18next": "^25.5.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^16.0.0",
    "react-router-dom": "^6.3.0",
    "rxjs": "^7.8.1",
    "sass": "^1.98.0",
    "swr": "2.2.5",
    "vitest": "^4.1.2"
  },
  "bugs": { "url": "https://github.com/amourgit/Frontend-esm-core/issues" },
  "homepage": "https://github.com/amourgit/Frontend-esm-core/tree/main/packages/apps/esm-agenda-app#readme"
}
```

> **Écarts volontaires avec l'annuaire** : retrait de `framer-motion`, `@radix-ui/react-tabs` et `@egen-civitas/tailwind-preset` (non utilisés par l'agenda) ; ajout des 6 `@fullcalendar/*` (versions **exactes**) et de `zod`. Les `@egen-civitas/*` et leurs plages sont **recopiés de l'annuaire au commit `0f967e7`** : lance `yarn deps:egen` après l'ajout si les plages ont bougé. `@carbon/react` reste en peer **uniquement pour homogénéité** (c'est le motif de l'annuaire) — si l'agenda n'importe jamais Carbon, tu peux le retirer des deux sections.

### A.6 — `src/agenda/api.ts` (client HTTP via `egenFetch`)

```ts
import { egenFetch } from '@egen-civitas/esm-framework';

import {
  calendarEventResponseSchema,
  calendarEventsResponseSchema,
  calendarResponseSchema,
  calendarTaskResponseSchema,
  calendarTasksResponseSchema,
  calendarsResponseSchema,
  type Calendar,
  type CalendarEvent,
  type CalendarMutation,
  type CalendarTask,
  type EventMutation,
  type TaskMutation,
} from '../shared/calendar';

// egenFetch préfixe lui-même `window.egenBase` : on ne fournit QUE le chemin relatif à la racine d'API EGEN.
let basePath = '/agenda-api/v1';
export function setApiBasePath(path: string) {
  basePath = path.replace(/\/+$/, '');
}

export class AgendaApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AgendaApiError';
  }
}

function errorCode(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('error' in body)) return undefined;
  const e = (body as { error?: unknown }).error;
  if (typeof e !== 'object' || e === null || !('code' in e)) return undefined;
  const c = (e as { code?: unknown }).code;
  return typeof c === 'string' ? c : undefined;
}

function toAgendaError(err: unknown): AgendaApiError {
  const e = err as { response?: { status?: number }; responseBody?: unknown; message?: string };
  const status = e?.response?.status;
  const code = errorCode(e?.responseBody);
  const message = code ? `${code} (${status})` : (e?.message ?? 'Request failed');
  return new AgendaApiError(message, status, code);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
  try {
    const response = await egenFetch(`${basePath}${path}`, {
      method: options.method ?? 'GET',
      // egenFetch stringifie le body objet mais NE fixe PAS Content-Type
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
      ...(options.body ? { body: options.body } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
    return response.data;     // 204 → null
  } catch (err) {
    // 401 : egenFetch redirige déjà vers /login (promesse pendante) ; on ne passe ici que pour les autres erreurs.
    throw toAgendaError(err);
  }
}

export interface EventRange {
  start: Date;
  end: Date;
  calendarIds: readonly string[];
}

function rangeQuery(range: EventRange): string {
  const q = new URLSearchParams({ start: range.start.toISOString(), end: range.end.toISOString() });
  range.calendarIds.forEach((id) => q.append('calendarId', id));
  return q.toString();
}

function idsQuery(ids: readonly string[]): string {
  const q = new URLSearchParams();
  ids.forEach((id) => q.append('calendarId', id));
  return q.toString();
}

const enc = encodeURIComponent;

// ─── Calendriers ──────────────────────────────────────────────────────────
export async function getCalendars(signal?: AbortSignal): Promise<Calendar[]> {
  return calendarsResponseSchema.parse(await request('/calendars', { ...(signal ? { signal } : {}) })).data;
}
export async function createCalendar(input: CalendarMutation): Promise<Calendar> {
  return calendarResponseSchema.parse(await request('/calendars', { method: 'POST', body: input })).data;
}
export async function updateCalendar(id: string, input: CalendarMutation): Promise<Calendar> {
  return calendarResponseSchema.parse(await request(`/calendars/${enc(id)}`, { method: 'PUT', body: input })).data;
}
export async function deleteCalendar(id: string): Promise<void> {
  await request(`/calendars/${enc(id)}`, { method: 'DELETE' });
}

// ─── Événements ───────────────────────────────────────────────────────────
export async function getEvents(range: EventRange): Promise<CalendarEvent[]> {
  if (range.calendarIds.length === 0) return [];
  return calendarEventsResponseSchema.parse(await request(`/events?${rangeQuery(range)}`)).data;
}
export async function searchEvents(
  query: string | undefined,
  calendarIds: string[],
  signal?: AbortSignal,
): Promise<CalendarEvent[]> {
  const q = new URLSearchParams(query ? { q: query } : {});
  calendarIds.forEach((id) => q.append('calendarId', id));
  return calendarEventsResponseSchema.parse(
    await request(`/events/search?${q}`, { ...(signal ? { signal } : {}) }),
  ).data;
}
export async function createEvent(input: EventMutation): Promise<CalendarEvent> {
  return calendarEventResponseSchema.parse(
    await request(`/calendars/${enc(input.calendarId)}/events`, { method: 'POST', body: input }),
  ).data;
}
export async function updateEvent(resourceId: string, version: string, input: EventMutation): Promise<CalendarEvent> {
  return calendarEventResponseSchema.parse(
    await request(`/events/${enc(resourceId)}`, { method: 'PUT', body: input, headers: { 'If-Match': version } }),
  ).data;
}
export async function deleteEvent(
  resourceId: string,
  version: string,
  occurrence?: { recurrenceId: string },
): Promise<void> {
  const q = occurrence
    ? `?${new URLSearchParams({ scope: 'occurrence', recurrenceId: occurrence.recurrenceId })}`
    : '';
  await request(`/events/${enc(resourceId)}${q}`, { method: 'DELETE', headers: { 'If-Match': version } });
}

// ─── Tâches ───────────────────────────────────────────────────────────────
export async function getTasks(range: EventRange): Promise<CalendarTask[]> {
  if (range.calendarIds.length === 0) return [];
  return calendarTasksResponseSchema.parse(await request(`/tasks?${rangeQuery(range)}`)).data;
}
export async function getTaskList(calendarIds: readonly string[], signal?: AbortSignal): Promise<CalendarTask[]> {
  if (calendarIds.length === 0) return [];
  return calendarTasksResponseSchema.parse(
    await request(`/tasks?${idsQuery(calendarIds)}`, { ...(signal ? { signal } : {}) }),
  ).data;
}
export async function createTask(input: TaskMutation): Promise<CalendarTask> {
  return calendarTaskResponseSchema.parse(
    await request(`/calendars/${enc(input.calendarId)}/tasks`, { method: 'POST', body: input }),
  ).data;
}
export async function updateTask(resourceId: string, version: string, input: TaskMutation): Promise<CalendarTask> {
  return calendarTaskResponseSchema.parse(
    await request(`/tasks/${enc(resourceId)}`, { method: 'PUT', body: input, headers: { 'If-Match': version } }),
  ).data;
}
export async function deleteTask(
  resourceId: string,
  version: string,
  occurrence?: { recurrenceId: string },
): Promise<void> {
  const q = occurrence
    ? `?${new URLSearchParams({ scope: 'occurrence', recurrenceId: occurrence.recurrenceId })}`
    : '';
  await request(`/tasks/${enc(resourceId)}${q}`, { method: 'DELETE', headers: { 'If-Match': version } });
}
```

> Les types `CalendarMutation`/`EventMutation`/`TaskMutation` sont des objets zod inférés : selon la configuration TS, `body: input` peut exiger un cast `as Record<string, unknown>` (⚠ à constater à la compilation). `getHealth`, `getAuthSession`, `login`, `logout`, `getPublicConfig` **n'existent plus** (voir 4.5).

### A.7 — `src/routes.json`

```json
{
  "$schema": "https://egen.alpha.vercel.com/routes.schema.json",
  "pages": [
    { "component": "root", "route": "agenda", "online": true, "offline": false }
  ],
  "extensions": [
    {
      "name": "agenda-nav-mon-agenda",
      "slot": "topbar-level2-nav",
      "component": "navEntry",
      "online": true,
      "offline": false,
      "order": 540,
      "meta": {
        "section": "agenda",
        "sectionLabel": "Agenda",
        "group": "calendrier",
        "groupLabel": "Calendrier",
        "label": "Mon agenda",
        "description": "Événements, tâches et calendriers personnels",
        "icon": "Calendar",
        "route": "agenda"
      }
    }
  ]
}
```

> **Une seule entrée au MVP**, volontairement : `check-nav-routes` exige que `meta.route` soit **égal à un `pages[].route` ou en soit une sous-route** (chemin, **sans** query string). Des entrées « Tâches » / « Calendriers » ne sont possibles que si l'app gère des sous-routes (`agenda/taches`, `agenda/calendriers`) — c'est-à-dire si `CalendarApp` accepte une prop `initialPanel` (petite évolution : ouvrir la barre latérale sur les tâches ou le gestionnaire de calendriers). À faire en Phase 6 si souhaité ; la route de page `agenda` couvre déjà ces sous-routes (`agenda/*`, cf. A.11).

### A.8 — `src/index.ts`

```ts
import { defineConfigSchema, getAsyncLifecycle, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';

// =============================================================================
//  ESM AGENDA APP — Point d'entrée
//  Calendrier CalDAV (UI portée de DayFront, MIT — voir THIRD_PARTY_NOTICES.md).
//  Route SPA : 'agenda'. Données : gateway CalDAV (voir README / guide d'implémentation).
// =============================================================================

// ⚠ Même convention que l'annuaire (moduleName en @egen-civitas/…, paquet en @egen/…) :
//   à garder IDENTIQUE dans les fichiers de configuration runtime.
const moduleName = '@egen-civitas/esm-agenda-app';

const options = { featureName: 'agenda', moduleName };

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Lifecycle ASYNCHRONE : FullCalendar n'est chargé qu'à la première visite de /agenda (ADR-6).
export const root = getAsyncLifecycle(() => import('./root.component'), options);

// Extension de navigation (slot `topbar-level2-nav`) : ne rend rien, seule sa `meta` est lue.
export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'agenda-nav-entry' });
```

### A.9 — `src/config-schema.ts`

```ts
import { Type, validators } from '@egen-civitas/esm-framework';   // ⚠ vérifier que `Type`/`validators` sont ré-exportés par esm-framework (ils sont exportés par esm-config)

export const configSchema = {
  apiBasePath: {
    _type: Type.String,
    _default: '/agenda-api/v1',
    _description: "Chemin de l'API de la gateway, relatif à la racine d'API EGEN (préfixée par window.egenBase).",
  },
  defaultView: {
    _type: Type.String,
    _default: 'month',
    _validators: [validators.oneOf(['month', 'week', 'day', 'agenda'])],
    _description: 'Vue affichée à l’ouverture.',
  },
  timeFormat: {
    _type: Type.String,
    _default: '24h',
    _validators: [validators.oneOf(['12h', '24h'])],
    _description: 'Format des heures.',
  },
  weekStartsOn: {
    _type: Type.Number,
    _default: 1,
    _validators: [validators.inRange(0, 6)],
    _description: 'Premier jour de la semaine (0 = dimanche, 1 = lundi).',
  },
  showTasks: { _type: Type.Boolean, _default: true, _description: 'Afficher les tâches.' },
  showCalendarsSidebar: { _type: Type.Boolean, _default: true, _description: 'Afficher la liste des calendriers.' },
  sidebarDefaultOpen: { _type: Type.Boolean, _default: false, _description: 'Barre latérale ouverte au chargement.' },
};

export interface ConfigSchema {
  apiBasePath: string;
  defaultView: 'month' | 'week' | 'day' | 'agenda';
  timeFormat: '12h' | '24h';
  weekStartsOn: number;
  showTasks: boolean;
  showCalendarsSidebar: boolean;
  sidebarDefaultOpen: boolean;
}
```

### A.10 — Scripts CSS (préfixage et contrôle)

**`scripts/scope-css.mjs`** — outil **jetable** : à exécuter une fois depuis un dossier hors dépôt (`npm i postcss postcss-prefix-selector`).

```js
// usage : node scope-css.mjs <entrée.css> <sortie.tw.css>
import { readFileSync, writeFileSync } from 'node:fs';
import postcss from 'postcss';
import prefixer from 'postcss-prefix-selector';

const [input, output] = process.argv.slice(2);
const PREFIX = '.agenda-root';
let droppedMedia = 0;

const dropThemeMedia = {
  postcssPlugin: 'drop-color-scheme-media',
  AtRule: {
    media(rule) {
      // Le thème est piloté par l'attribut data-theme, pas par l'OS (cf. guide 4.4)
      if (/prefers-color-scheme/.test(rule.params)) { rule.remove(); droppedMedia++; }
    },
  },
};

const result = await postcss([
  dropThemeMedia,
  prefixer({
    prefix: PREFIX,
    transform(prefix, selector, prefixed) {
      const s = selector.trim();
      if (s === '*') return `${prefix}, ${prefix} *`;
      if (/^(html|body|#root)(\s|$|[.:\[])/.test(s)) return s.replace(/^(html|body|#root)/, prefix);   // html/body/#root → racine scopée
      if (/^:root(\s|$|[.:\[])/.test(s)) return s.replace(/^:root/, prefix);                          // :root, :root[data-theme=…] → racine scopée
      return prefixed;                                                                                // cas général : ".x" → ".agenda-root .x"
    },
  }),
]).process(readFileSync(input, 'utf8'), { from: input });

writeFileSync(output, result.css);
console.log(`écrit ${output} — ${droppedMedia} bloc(s) @media prefers-color-scheme supprimé(s)`);
```

> **Relire le résultat à la main** (4.4.c) : le script ne sait pas que `body { background: radial-gradient(...) }` devient `.agenda-root { background … }` et qu'il faut peut-être le retirer ; ni ajuster les `100vh`.

**`scripts/check-css-scope.mjs`** — à committer dans le Core (utilisable dans `yarn verify` si tu l'ajoutes au script du workspace).

```js
// usage : node scripts/check-css-scope.mjs <fichier.css> [...]
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const ROOT = '.agenda-root';
const SKIP_PARENTS = new Set(['keyframes', '-webkit-keyframes', 'font-face', 'property']);
let bad = 0;

for (const file of process.argv.slice(2)) {
  const root = postcss.parse(readFileSync(file, 'utf8'), { from: file });
  root.walkRules((rule) => {
    const parent = rule.parent;
    if (parent?.type === 'atrule' && SKIP_PARENTS.has(parent.name)) return;
    for (const sel of rule.selectors) {
      if (!sel.trim().startsWith(ROOT)) {
        console.error(`${file}:${rule.source?.start?.line} sélecteur hors ${ROOT} : ${sel.trim()}`);
        bad++;
      }
    }
  });
}
if (bad) { console.error(`${bad} sélecteur(s) global(aux)`); process.exit(1); }
console.log('CSS scopé : OK');
```

(`postcss` est déjà une dépendance transitive de la chaîne de build du Core via `rspack-config` ; l'ajouter explicitement en `devDependencies` du workspace avant de brancher le script.)

### A.11 — `src/root.component.tsx` et `agenda/agenda-page.component.tsx`

```tsx
// src/root.component.tsx
import './styles/agenda-base.tw.css';       // ordre = celui de DayFront (main.tsx) : base puis refresh
import './styles/agenda-refresh.tw.css';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AgendaPage } from './agenda/agenda-page.component';

// Route 'agenda' (espace authentifié, TopBar au-dessus) :
//   agenda            → calendrier
//   agenda/*          → idem (sous-routes réservées : taches, calendriers — cf. A.7)
const Root: React.FC = () => (
  <BrowserRouter basename={window.getEgenSpaBase()}>
    <Routes>
      <Route path="agenda/*" element={<AgendaPage />} />
    </Routes>
  </BrowserRouter>
);

export default Root;
```

```tsx
// src/agenda/agenda-page.component.tsx
import React, { useEffect } from 'react';
import { useConfig, useSession } from '@egen-civitas/esm-framework';
import type { ConfigSchema } from '../config-schema';
import { setApiBasePath } from './api';
import { CalendarApp } from './calendar-app.component';

export const AgendaPage: React.FC = () => {
  const config = useConfig<ConfigSchema>();
  const session = useSession();
  useEffect(() => setApiBasePath(config.apiBasePath), [config.apiBasePath]);

  // ⚠ Thème : dériver de l'état de thème EGEN (Phase 6.2). En attendant : valeur fixe.
  const theme: 'light' | 'dark' = 'light';

  return (
    <div className="agenda-root" data-theme={theme}>
      <CalendarApp username={session.user?.display} />
    </div>
  );
};
```

### A.12 — `THIRD_PARTY_NOTICES.md` (à la racine de `esm-agenda-app`) et notice dans la gateway

```markdown
# Notices de tiers

Cette application contient du code dérivé de **DayFront** (https://github.com/Erik-A-Smith/DayFront),
commit `8aef796`, distribué sous licence MIT.

MIT License

Copyright (c) 2026 Erik Smith

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.
```

Ajouter aussi, en tête des fichiers portés significativement (`calendar-app.component.tsx`, `shared/calendar.ts`) : `// Dérivé de DayFront (MIT) — voir THIRD_PARTY_NOTICES.md`. Dans le dépôt gateway : **conserver `LICENSE` tel quel**.

### A.13 — Fichiers de test à créer (extraits)

**`src/test-utils/framework-mock.ts`** (extension de celui de l'annuaire) :

```ts
import { vi } from 'vitest';

// ⚠ `@egen-civitas/esm-framework/mock` (mock.tsx) exporte `showToast = vi.fn()` ; la présence de `useConfig`, `useSession`
//   et `egenFetch` dans ce mock n'a pas été constatée (pas trouvés par grep sur leurs noms) — on les fournit donc explicitement.
export const egenFetchMock = vi.fn();

export async function frameworkMock() {
  return {
    egenFetch: egenFetchMock,
    useConfig: () => ({
      apiBasePath: '/agenda-api/v1', defaultView: 'month', timeFormat: '24h', weekStartsOn: 1,
      showTasks: true, showCalendarsSidebar: true, sidebarDefaultOpen: false,
    }),
    useSession: () => ({ authenticated: true, user: { uuid: 'u-1', display: 'Test User' } }),
    showToast: vi.fn(),
  };
}
```

**`src/agenda/api.test.ts`** (squelette) :

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { egenFetchMock } from '../test-utils/framework-mock';

vi.mock('@egen-civitas/esm-framework', async () => (await import('../test-utils/framework-mock')).frameworkMock());

import { getCalendars, createEvent, setApiBasePath } from './api';

beforeEach(() => { egenFetchMock.mockReset(); setApiBasePath('/agenda-api/v1'); });

describe('api (egenFetch)', () => {
  it('préfixe /agenda-api/v1 et valide la réponse', async () => {
    egenFetchMock.mockResolvedValue({ data: { data: [{ id: 'c1', displayName: 'Perso', components: ['VEVENT'] }] } });
    const calendars = await getCalendars();
    expect(egenFetchMock).toHaveBeenCalledWith('/agenda-api/v1/calendars', expect.objectContaining({ method: 'GET' }));
    expect(calendars[0]?.id).toBe('c1');
  });

  it('envoie Content-Type JSON sur un POST', async () => {
    egenFetchMock.mockResolvedValue({ data: { data: { /* événement valide selon calendarEventSchema */ } } });
    await createEvent({ calendarId: 'c1', title: 'T', start: '2026-10-12T09:00:00Z', allDay: false }).catch(() => undefined);
    expect(egenFetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });
});
```

---

## 11. Ordre de lecture conseillé de ce guide

1. Section 1 (verdict) puis 9.2 (questions) : **réponds aux questions 1, 3, 4, 5 avant de coder**.
2. Sections 4-5 (architecture, ADR) pour valider les décisions.
3. Phases 0 → 2, puis annexes A.1-A.3 (le chemin critique).
4. Phases 3 → 5, puis annexes A.5-A.11.
5. Phases 6-8 en parallèle.

*Fin du guide.*
