# 02 — État des lieux du core (faits vérifiés)

**Date de l'audit : 2026-11-15.** Dépôt audité : `Frontend-esm-core`, branche `main`, commit `6138348`.
Framework de référence : `Frontend-esm-framework` `main` (35 paquets publiés, voir §3).

Tout ce qui suit est un **fait** relevé dans le code ou sur le registre npm. Chaque section donne la commande qui
permet de le re-vérifier. Les **constats** (`F-xx`, §12) en sont tirés ; les **décisions** qui en découlent sont dans
[08](08-DECISIONS-ET-RISQUES.md).


> ## ⚠️ Mise à jour du 2026-11-17 — cet audit est PARTIELLEMENT PÉRIMÉ (à refaire : tâche R0)
>
> L'audit a été fait au commit `6138348`. Depuis, `main` a avancé (réforme de la barre supérieure T8→T12 terminée, dépendances alignées, nouveau document de vision).
> **Écarts constatés sur `main` (commit `552feb9`), à intégrer dans une version corrigée de ce document :**
>
> | Sujet | Audit (6138348) | `main` actuel (552feb9) |
> | --- | --- | --- |
> | Nombre d'apps | 26 | **30** (puis **28**, voir la ligne « Apps retirées ») : nouvelles `esm-launcher-app`, `esm-navigation-app`, `esm-search-app`, `esm-side-panel-app` (extensions du `topbar-slot`) |
> | `esm-primary-navigation-app` | 75 fichiers, annuaire, sons, lien d'apps, presse-papiers | **34 fichiers** : squelette neutre (kit + hôte) ; **plus** d'avatars `images.unsplash.com`, de `target="_blank"`, de presse-papiers, de `localStorage` (sons supprimés) |
> | Lien externe du lanceur d'apps | dans `primary-navigation` (`AppsMenuOption.tsx`) | **`esm-launcher-app/src/launcher/launcher.component.tsx:74`** (**10** `target="_blank"` au total depuis le retrait de `theme-studio`, qui en portait 4 ; mesure du 22/11 ; 7 apps : footer, help-menu, login, home, **launcher**, informations, ai-assistant) |
> | Presse-papiers (fil d'Ariane) | `primary-navigation/BreadcrumbNav.tsx:122` | **`esm-navigation-app/src/components/navigation/BreadcrumbNav.tsx:97`** |
> | Images `images.unsplash.com` (apps A/B) | 128 | **102** (annuaire 39, informations 40, home 19, sites 4) ; + `picsum.photos` 16, `cdn.21st.dev` 6, `prod.spline.design` 1 ⇒ **125** ressources à traiter (au lieu de 151) |
> | Interactions à la souris | non relevées | `esm-navigation-app` : `mousemove`/`mouseup` (glisser), `mousedown`, survol — **à auditer pour le tactile** (P7) |
> | `esm-quick-access-app` | « en cours de retrait » | **Faux** : seul un **bouton mort de la TopBar** a été supprimé ; l'app du rail droit existe toujours (6 extensions) |
> | Dépendances `@egen-civitas/*` | écarts avec npm | Commit `63dd2ef` « plages alignées » : **T0.1 probablement déjà fait — À VÉRIFIER** (`yarn deps:egen:check`). Le peer `esm-framework` vaut **toujours `>=3.0.0`** (T0.2 reste à faire) |
> | Qualité de l'existant | « `yarn verify` vert » supposé | Le suivi de la réforme indique des **échecs de tests/typecheck anciens** (hooks ignorés par choix, `--no-verify`) : **ne pas supposer `yarn verify` vert** ; T0.4 doit mesurer la réalité |
> | Apps retirées du core (19/11) | `esm-theme-studio-app` (Tweakcn) et `esm-character-factory-app` (Character) présentes | **Retirées** : elles sont devenues des projets autonomes (réformes Tweakcn et Character). **28 apps**. Toute ligne ou mesure les concernant est caduque ; elles sont corrigées ci-dessous quand le fait est mesurable |
> | Document de vision | — | `docs/architecture-declaration/ajustement-reforme.md` (apps créées par configuration : Penpot, Tweakcn, TokiForge) : **sans effet** sur ce programme, mais toute future app **déclarative** devra aussi déclarer `platforms` |
> | Dettes de mutualisation | — | `OptionButton`, `GlassPanel`, `WaterGlassModal` copiés dans plusieurs apps (suivi TopBar §6) : **même logique que `D-07`** (copie encadrée, puis promotion au framework) |
>
> **Classification provisoire à intégrer par R0** : `esm-launcher-app` → **B** (lien externe, survol) ; `esm-navigation-app` → **B** (presse-papiers, souris, gros volume : 33 fichiers, 11 tests) ;
> `esm-search-app` → **A** ; `esm-side-panel-app` → **A** ; `esm-primary-navigation-app` → **A** (squelette ; le gros du travail mobile reste en P7). Total attendu : **A 9, B 14, C 2, D 3 = 28** (C : offline-tools, tenant-routing) ; **23 apps natives**.
> Les tableaux des §2 à §12 ci-dessous **n'ont pas encore été corrigés** : se fier à ce bandeau en cas de différence.

## 1. Structure du dépôt

| Élément | Valeur constatée | Vérification |
| --- | --- | --- |
| Paquet racine | `@egen/esm-core`, version `9.0.2`, `private: true` | `jq '.name,.version,.private' package.json` |
| Gestionnaire | Yarn `4.10.3`, `nodeLinker: node-modules` | `.yarnrc.yml`, `package.json` (`packageManager`) |
| Espaces de travail | `packages/apps/*` uniquement (le framework n'est **pas** dans ce dépôt) | `jq .workspaces package.json` |
| Applications | **26** dossiers dans `packages/apps/` | `ls packages/apps \| wc -l` |
| Orchestration | Turborepo (`turbo.json`), `yarn build`, `yarn build:apps`, `yarn build:prod` | `package.json` (`scripts`) |
| Vérification | `yarn verify` = `node tools/check-nav-routes.mjs && turbo run lint test typescript` | `package.json` |
| Fichiers de test unitaire | **89** (`*.test.ts(x)` dans `packages/apps/*/src`) | `find packages/apps -name '*.test.ts*' -not -path '*/node_modules/*' \| wc -l` |
| E2E existant | 3 specs Playwright (`login`, `logout`, `navbar`) dans `e2e/specs`, lancés par `yarn test-e2e` (environnement Docker) | `ls e2e/specs` |
| CI | `ci.yml` : job « Build & verify » (`turbo build` puis `yarn verify`), job informatif de dérive des dépendances `@egen-civitas` (`deps-freshness`), job « Publication npm » (déclenché sur `release`/`push`, ignoré sans secret npm) ; autres workflows : e2e, bundle-size, docs, CodeQL, titres de PR | `ls .github/workflows` |
| Conventions de PR | Titre `feat(portée): Résumé` ou `(feat) Résumé` ; types `feat`, `fix`, `chore`, `docs`, `test` ; **`refactor` refusé** ; modèle de PR avec cases à cocher | `.github/workflows/pr-title-check.yml`, `.github/pull_request_template.md` |
| Publication | `yarn ci:publish` = `yarn workspaces foreach --all --topological --exclude @egen/esm-core --exclude @egen/storybook npm publish --tolerate-republish --access public --tag latest`. **C'est le champ `version` du `package.json` de chaque app qui décide** : une version déjà publiée est ignorée sans erreur (`--tolerate-republish`). Le dossier `.changeset/` contient **24 notes** mais **aucun `config.json` ni script `changeset`** : elles ne sont pas consommées par un outil (certaines visent d'anciens paquets, ex. `@egen/esm-app-shell`) | `package.json` (lignes 19-20), `ls -la .changeset` |
| Dépôts jumeaux | `civitas-tv-frontend` reçoit les fichiers listés dans `tools/shared-paths.txt` (`serve-prod.mjs`, `precompress.mjs`, `sync-egen-deps.mjs`, `turbo.json`, `.eslintrc`, `.github`…) | `tools/shared-paths.txt`, `docs/SYNC-CORE-TV.md` |

## 2. Les 24 applications auditées le 15/11 (hors les 2 retirées depuis)

« Fichiers source » compte les `.ts`/`.tsx` de `src/` (tests compris).

| App (`@egen/<nom>`) | Version | Fichiers source | Fichiers de test | Pages (`route`) | Extensions |
| --- | --- | --- | --- | --- | --- |
| esm-ai-assistant-app | 1.0.0 | 49 | 6 | tout sauf login/logout/change-password | 2 |
| esm-annuaire-app | 1.0.0 | 43 | 5 | `annuaire` | 5 |
| esm-appearance-app | 1.0.0 | 7 | 2 | — | 2 |
| esm-branding-app | 1.0.0 | 6 | 1 | — | 1 |
| esm-clock-app | 1.0.0 | 4 | 1 | — | 1 |
| esm-devtools-app | 9.0.2 | 9 | 1 | — (1 modale) | 0 |
| esm-footer-app | 1.0.0 | 8 | 2 | tout sauf login/logout/change-password | 0 |
| esm-help-menu-app | 9.0.2 | 6 | **0** | — | 4 |
| esm-home-app | 1.0.0 | 19 | 4 | `home` | 3 |
| esm-implementer-tools-app | 9.0.2 | 40 | 3 | (page sans route textuelle) | 1 |
| esm-informations-app | 1.0.0 | 48 | 5 | `informations` | 17 |
| esm-language-app | 1.0.0 | 11 | 3 | — (1 modale) | 2 |
| esm-login-app | 9.0.2 | 32 | 5 | `login`, `logout`, `change-password` | 2 (+ 1 modale) |
| esm-logs-app | 1.0.0 | 11 | 4 | tout sauf login/logout/change-password | 1 |
| esm-not-found-app | 1.0.0 | 6 | 1 | tout sauf les routes connues | 0 |
| esm-notifications-app | 1.0.0 | 7 | 2 | tout sauf login/logout/change-password | 1 |
| esm-offline-tools-app | 9.0.2 | 35 | 1 | `offline-tools` | 12 (+ 1 modale) |
| esm-primary-navigation-app | 9.0.2 | 75 | 21 | tout sauf login/logout/change-password | 2 |
| esm-quick-access-app | 1.0.0 | 15 | 1 | — | 6 |
| esm-settings-app | 1.0.0 | 8 | 1 | — | 3 |
| esm-sites-app | 1.0.0 | 26 | 2 | `sites` | 10 |
| esm-spaces-sites-app | 1.0.0 | 20 | 7 | — | 2 |
| esm-tenant-routing-app | 1.0.0 | 7 | **0** | `.*` (toutes) | 0 |
| esm-user-profile-app | 1.0.0 | 13 | 5 | tout sauf login…, et la racine | 2 |

Vérification : `for d in packages/apps/*/; do jq -r '[.name,.version]|@tsv' $d/package.json; done`.

**Constats sur cette table** : 2 apps n'ont aucun test (`help-menu`, `tenant-routing`) ; les versions
sont hétérogènes (**9.0.2** pour 6 apps, **1.0.0** pour 18 ; mesure du 22/11 sur les 28 apps actuelles : 6 en 9.0.2, 22 en 1.0.0) ; **aucune** `routes.json` ne contient les
champs `platforms` ni `requiredCapabilities` (vérification : `grep -l '"platforms"' packages/apps/*/src/routes.json` ne
renvoie rien).

## 3. Consommation du framework

### 3.1 Versions demandées par le core et dernières versions publiées

Les 26 apps déclarent `@egen-civitas/esm-framework` en `dependencies` à `^4.1.0` et en `peerDependencies` à
**`>=3.0.0`** (26/26). Les autres plages, identiques dans les 26 apps : `esm-api ^3.0.0`, `esm-globals ^2.2.0`,
`esm-routes ^1.2.0`, `esm-tenant ^1.0.2`, `esm-navigation ^1.0.2`, `esm-react-utils ^3.0.1`, `esm-styleguide ^4.0.0`
(23 apps).

Le `package.json` racine fixe en plus des **résolutions** : `esm-framework ^4.1.0`, `esm-styleguide ^4.0.0`,
`esm-app-shell ^2.9.0`, `rspack-config ^1.1.0`, et des `devDependencies` `egen ^2.3.0`, `esm-app-shell ^2.9.0`,
`rspack-config ^1.1.0`.

| Paquet | Demandé par le core | Dernière version publiée (2026-11-15) | Écart utile |
| --- | --- | --- | --- |
| `esm-framework` | `^4.1.0` | 4.1.0 | aucun |
| `esm-app-shell` | `^2.9.0` | **2.11.1** | **manque** : capacités natives P0 (2.10), `navigate` natif et écran d'incompatibilité (2.11), chemins (2.11.1) |
| `rspack-config` | `^1.1.0` | **1.2.0** | **manque** : estampillage de `frameworkRange` |
| `esm-routes` | `^1.2.0` | **1.3.0** | **manque** : schéma JSON de `routes.json` |
| `esm-globals` | `^2.2.0` | **2.4.0** | `frameworkRange` |
| `esm-api` | `^3.0.0` | 3.0.1 | correctif Host incompatible |
| `esm-tenant` | `^1.0.2` | **1.1.0** | **manque** : plus de lecture de jeton en natif |
| `esm-styleguide` | `^4.0.0` | 4.1.0 | conformité à la barre supérieure neutre du core (sans effet sur le natif) |
| `esm-platform` | (transitif) | 1.3.1 | capacités natives |
| `egen` (CLI) | `^2.3.0` | 2.3.0 | aucun |

Vérification : `node tools/sync-egen-deps.mjs --check` (compare à npm) ; versions du framework :
`npm view @egen-civitas/<paquet> version`.

### 3.2 Ce que le core utilise déjà de la couche plateforme

`grep -rn "getPlatform\|isNativePlatform\|isNativeTarget\|getEgenTarget" packages/apps --include=*.ts --include=*.tsx`
ne renvoie **aucun résultat** : **le core n'utilise aujourd'hui aucune API de plateforme**.

### 3.3 Mode de liaison

Le framework est consommé comme **paquets npm** ; deux essais de lien local (portail Yarn, `workspaces` en chemin relatif)
ont été abandonnés pour des raisons mesurées (voir `docs/dev-lien-local-framework.md`). Ce plan **conserve** ce mode.

## 4. Construction et service des apps (Web)

- Chaque app se construit avec `rspack.config.js` = `module.exports = require('@egen-civitas/egen/default-rspack-config')`.
- Le bundle est `dist/egen-<nom>.js` (champ `browser` du `package.json`), conteneur Module Federation ; `main` vaut
  `src/index.ts`.
- `tools/serve-prod.mjs` (Web uniquement) : lit les `package.json` et `src/routes.json` de **toutes** les apps, génère
  l'import map (`<nom du paquet>` → `/egen-civitas/spa/apps/<dossier>/<fichier>`) et le registre de routes (chaque
  `routes.json` + `version`), sert le shell précompilé du paquet `esm-app-shell` (donc la construction **Web**), les
  `dist/` des apps, et peut relayer l'API.
- **Il n'existe aucun artefact natif** : rien dans le core ne construit le shell avec `EGEN_TARGET=android|ios`.
- `tools/check-nav-routes.mjs` vérifie que les entrées de navigation pointent vers des routes existantes.
- `tools/scaffold-app.py` crée une nouvelle app d'après `esm-user-profile-app` ; il ne connaît pas `platforms`.
- Publication : les apps sont publiques sur npm sous `@egen/*` (`publishConfig.access: public`, mot-clé `egen`) ; le
  framework les assemble avec `egen assemble`, qui extrait du paquet publié le dossier de l'entrée `browser` (`dist/`)
  **et attend `routes.json` dans ce dossier**.

## 5. Nommage et versions

| Élément | Constat |
| --- | --- |
| Noms des apps | `@egen/esm-<nom>-app` (portée `@egen`) |
| Noms des paquets du framework | `@egen-civitas/*` (portée `@egen-civitas`) |
| Versions des apps | 9.0.2 (6 apps : devtools, help-menu, implementer-tools, login, offline-tools, primary-navigation), 1.0.0 (18 autres ; 22 sur les 28 apps actuelles) |
| Rôle du nom d'une app | C'est son **identifiant** dans l'import map, dans le registre de routes, dans le filtrage de plateforme et dans `frameworkRange` : le renommer casse tous les consommateurs |
| Rôle de la version d'une app | Publication npm et champ `version` du registre de routes ; **aucun mécanisme n'exige que les versions soient égales entre apps** |

## 6. Authentification et session (Web)

Flux actuel, lu dans `packages/apps/esm-login-app` :

1. `login.component.tsx` (`handleSubmit`) appelle `refetchCurrentUser(identifiant, motDePasse)`.
2. Cette fonction (`esm-api`) interroge `GET {restBaseUrl}/session` avec l'en-tête `Authorization: Basic <base64(id:mot de passe)>`
   (`login.resource.ts` fait de même dans `performLogin`).
3. Le backend répond par la `Session` (`authenticated`, `user`, privilèges…) **et pose un cookie de session**.
4. Les appels suivants (`egenFetch`) s'authentifient **par le cookie**.
5. `redirect-logout/logout.resource.ts` : `DELETE {restBaseUrl}/session`, vidage du cache SWR, `clearCurrentUser()`, puis
   `refetchCurrentUser()`.
6. Après connexion, en mode multi-tenant, le tenant actif est écrit dans `localStorage` (`egen:tenant:active`) par
   `storeHeaderTenantId`.
7. Le contournement de développement `EGEN_DEV_NO_AUTH` injecte une session fictive (`applyDevAuthBypassForLogin`) ; il est
   **inerte** en cible native (framework, règle D2).

Conséquence : **le login actuel ne peut pas fonctionner en natif**. L'origine du WebView n'est pas celle de l'API, le
framework impose `credentials: 'omit'` (pas de cookie) et attend un jeton fourni par le Host.

## 7. Stockage navigateur

Toutes les écritures/lectures de `localStorage` (hors tests) :

| App | Clés | Nature | Sensible ? |
| --- | --- | --- | --- |
| esm-login-app | `egen:tenant:active` (via `storeHeaderTenantId`) | identifiant de tenant | Non |
| esm-primary-navigation-app | `egen_xbox_sound_muted`, `egen_xbox_sound_volume` | préférences sonores | Non |
| esm-ai-assistant-app | clés `STORAGE_KEY_VOICE_OUTPUT`, `…_CONTINUOUS`, `…_VOICE_ACTIVE`, `…_CHANNEL`, `…_SILENCE_TOLERANCE` | préférences vocales | Non |
| esm-implementer-tools-app | `egen:egenImplementerToolsConfigOpen`, `egen:isUIEditorEnabled`, `egen:getIsJsonModeEnabled` | préférences d'outil de développement | Non |
| esm-annuaire-app | `LANG_STORAGE_KEY` | préférence de langue | Non |

`sessionStorage`, `serviceWorker` : **aucun usage** dans les apps. `indexedDB` : **aucun usage** (depuis le retrait de `esm-character-factory-app`).
Vérification : `grep -rn "localStorage\.\(get\|set\|remove\)Item" packages/apps --include=*.ts --include=*.tsx | grep -v test`.

**Aucune app ne stocke de jeton ni de mot de passe dans le navigateur aujourd'hui** (le mécanisme est le cookie).

## 8. Navigation et URL

Usages de `window.location` (hors tests) et ce qu'ils deviennent en natif (servi sous `/app`, origine locale) :

| Fichier (ligne) | Usage | Risque en natif |
| --- | --- | --- |
| `esm-not-found-app/src/not-found/not-found-page.component.tsx` (34, 42, 45, 51) | `location.reload()` ; `location.href = "/"` | `"/"` sort de la base `/app` : **navigation cassée** |
| `esm-annuaire-app/src/directory/employee-card.component.tsx` (47) ; `employee-detail-modal.component.tsx` (366) | `window.location.href = 'mailto:…'` | Le WebView **quitte l'app** au lieu d'ouvrir la messagerie |
| `esm-language-app/src/change-language/change-language.resource.ts` (22, 34) | `location.reload()` après changement de langue | Exige que le Host serve `index.html` pour toute route (H-02) |
| `esm-devtools-app/…/list.component.tsx` (259, 284) ; `import-map.modal.tsx` (25-32) | rechargement ; URL `localhost:<port>` | Outil de développement : sans objet en production |
| `esm-user-profile-app/src/session/session-guard.component.tsx` (29) | lit `pathname` et le découpe avec `getEgenSpaBase()` | Correct sous `/app` (utilise la base) ; à tester |
| `esm-spaces-sites-app/src/sites/site-route.ts` (32) | lit `pathname` | Idem, à tester |
| `esm-tenant-routing-app/src/guard/*` | analyse du **hostname** (sous-domaine) et `login` | En natif le nom d'hôte est local : aucune information de tenant |
| `esm-informations-app` (4 fichiers) | `navigator.clipboard.writeText(window.location.href \| origin + '/informations/agenda?event=…')` | Le lien copié est une URL **locale** non partageable |

Liens `<a target="_blank">` bruts (hors tests), **10 occurrences** (mesure du 22/11, après le retrait de `esm-theme-studio-app`) : `esm-help-menu-app` (3 :
`release-notes`, `contact-us`, `docs`), `esm-footer-app` (2), `esm-launcher-app` (lien externe du lanceur),
`esm-ai-assistant-app` (`assistant-panel.component.tsx:87`), `esm-login-app` (`login-footer.component.tsx:32`),
`esm-home-app` (`social-links.component.tsx:103`), `esm-informations-app` (`event-details-modal.component.tsx:240`).
Aucun `window.open` (mesure du 22/11).

## 9. Ressources distantes chargées à l'exécution

La CSP de la cible native (définie par le framework) est :
`default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' <origine de l'API>; base-uri 'self'; form-action 'self'`.
**Tout ce qui suit serait bloqué en natif.**

| Hôte | Apps / fichiers | Nature |
| --- | --- | --- |
| `images.unsplash.com` (≈ 128 occurrences) | `esm-informations-app` (`hero.data.ts`, `events.data.ts`, `news.data.ts`, `news-feed-view.component.tsx`, `data/events-mock-data.ts`), `esm-annuaire-app` (`data/directory-data.ts`, `home-sections/directory/directory.data.ts`, `collaborateur/collaborateur-review-list.component.tsx`), `esm-primary-navigation-app` (`intranet-topbar/data/directoryData.ts`), `esm-home-app` (`component-showcase.page.tsx`), `esm-sites-app` (`pages/sites-list.page.tsx`) | **Données de démonstration** (photos, avatars, couvertures) |
| `picsum.photos` | `esm-home-app` (`component-showcase.page.tsx`) | Images de démonstration |
| `cdn.21st.dev` | `esm-not-found-app` (`not-found-page.component.tsx`, 6 images) | Illustrations de la page 404 |
| `prod.spline.design` | `esm-home-app` (`new-components-showcase.component.tsx:122`) | Scène 3D distante (le framework neutralise `SplineScene` en natif à l'exécution) |
| `civitas-africa.vercel.app` | `esm-login-app` (`brand.ts`) | Lien (pas une ressource) |

Point d'attention technique : `img-src` **n'autorise pas l'origine de l'API**. Une image servie par le backend serait
donc bloquée aussi ; et comme l'authentification natif est un jeton `Bearer` (impossible à joindre à un `<img src>`), les
images protégées devront de toute façon passer par `egenFetch` puis une URL d'objet (`blob:`). Voir `D-08`.

Vérification : `grep -rlE "images.unsplash.com|picsum.photos|cdn.21st.dev" packages/apps --include=*.ts --include=*.tsx`.

## 10. API du navigateur à risque en WebView

| API | Où | Risque |
| --- | --- | --- |
| Dictée vocale `SpeechRecognition`/`webkitSpeechRecognition` et micro `getUserMedia` | `esm-ai-assistant-app` : `hooks/use-speech-recognition.ts`, `components/chat-input/chat-input.component.tsx`, `assistant-experience/services/vadService.ts`, `AssistantGlobalVoiceContext.tsx` | Permission micro à obtenir par le Host ; `SpeechRecognition` probablement indisponible dans le WebView iOS (H-07, à vérifier) |
| API plein écran | `esm-appearance-app/src/appearance/fullscreen-toggle.component.tsx` | Non fiable en WebView iOS ; inutile en natif (l'app est déjà plein écran) |
| `navigator.clipboard` | 10 usages (lignes) dans `navigation`, `annuaire`, `logs`, `informations` (mesure du 22/11) | Fonctionne en contexte sécurisé ; à tester sur appareil ; liens copiés non partageables (§8) |
| Audio | `esm-primary-navigation-app/src/intranet-topbar/utils/xboxAudio.ts` | Lecture audio soumise à un geste de l'utilisateur dans les WebView |
| WebSocket | `esm-ai-assistant-app` (via `esm-ai-framework`, canal `EGEN_AI_CHANNEL_URL`, par défaut `${egenBase}/api/ai/ws`) | `connect-src 'self' https://<api>` n'autorise probablement **pas** `wss://<api>` (une source `https:` ne couvre pas le schéma `wss:`) : **à confirmer** par un test en CSP réelle (E-05) |
| EventSource | `esm-logs-app/src/logs/log-store.ts:207` (flux `${baseUrl}/stream` des logs du terminal `egen develop`) | Fonction de développement : sans objet en production |

## 11. Documentation existante

| Document | État |
| --- | --- |
| `docs/analyse-auth-session.md` | Valide sur le fond, mais écrit avec l'ancienne portée `@egen/esm-*` pour les paquets du framework (désormais `@egen-civitas/*`) |
| `docs/analyse-separation-framework.md`, `docs/dev-lien-local-framework.md` | Historiques (statut indiqué en tête) |
| `.github/copilot-instructions.md` | **Obsolète** : décrit `packages/framework`, `packages/shell` et `packages/tooling` comme faisant partie du dépôt ; ils n'y sont plus |
| `docs/SUIVI-REFORME-TOPBAR.md` | Valide ; fixe la **convention de suivi** reprise ici |
| `README.md` (racine) | Pas de section multiplateforme |

## 12. Constats (`F-xx`)

Gravité : **C**ritique (bloque la cible), **H**aute (casse une fonction), **M**oyenne, **B**asse, **I**nfo.

| # | Constat | Gravité | Preuve | Traité par |
| --- | --- | --- | --- | --- |
| F-01 | Le login repose sur Basic Auth + cookie ; impossible en natif | **C** | §6 | P4 |
| F-02 | Images, polices et scène 3D distantes bloquées par la CSP native | **H** | §9 | P5 |
| F-03 | `img-src` exclut l'origine de l'API ; un jeton `Bearer` ne peut pas authentifier un `<img>` | **H** | §9 | P5, `FW-REQ-2`, `BE-REQ-3` |
| F-04 | `location.href = "/"` sort de la base `/app` ; `location.href = 'mailto:…'` quitte l'app | **H** | §8 | P6 vague 1 et 2 |
| F-05 | `location.reload()` (langue, 404) suppose que le Host sert `index.html` pour toute route | M | §8 | P9, `HOST-REQ-1`, `D-15` |
| F-06 | 14 liens `target="_blank"` bruts : comportement indéfini en WebView | M | §8 | P2 (règle), P6 |
| F-07 | Dictée et micro (assistant) : permission et API probablement indisponibles sur iOS | M | §10 | `D-13`, P10 |
| F-08 | Plein écran inutile et non fiable | B | §10 | P6 vague 1 |
| F-09 | Liens de partage construits avec `window.location.origin` : non partageables | M | §8 | P6 vague 3 |
| F-10 | Résolution du tenant par sous-domaine sans objet en natif | M | §8 | `D-09`, P1 |
| F-11 | Les 26 apps déclarent `esm-framework` en peer `>=3.0.0` alors qu'elles requièrent la 4.1 : `frameworkRange` trop permissif | M | §3.1 | P0, P1 |
| F-12 | Versions d'apps hétérogènes (9.0.2 / 1.0.0 / 0.1.0) | I | §5 | `D-02` |
| F-13 | Le shell déclare `viewport` sans `viewport-fit=cover` : zones sûres inutilisables | M | `esm-app-shell/src/index.ejs` du framework | P7, `FW-REQ-1` |
| F-14 | Interface conçue pour un intranet de bureau (rails, barre supérieure, panneaux), jamais auditée sur petit écran | **H** | revue des apps | P7 |
| F-15 | Pas de service worker en natif : l'app `offline-tools` n'a pas de sens | I | framework A4 | [03](03-CLASSIFICATION-APPS.md) |
| F-16 | 3 apps sans test ; aucune vérification de déclaration de plateforme ; aucun e2e natif | M | §2 | P1, P3, P6 |
| F-17 | `.github/copilot-instructions.md` décrit une structure qui n'existe plus | B | §11 | P0 |
| F-18 | Données de démonstration (annuaire, actualités, événements, vitrine) embarquées dans le code des apps | M | §9 | H-05, P5 |
| F-19 | Aucun artefact natif ni outil pour le construire dans le core | **H** | §4 | P3 |
| F-20 | `esm-app-shell`, `rspack-config`, `esm-routes`, `esm-tenant` en retard sur le framework publié | **H** | §3.1 | P0 |
| F-21 | Le canal WebSocket de l'assistant IA serait refusé par `connect-src` natif (schéma `wss:` non couvert) — hypothèse **à confirmer** | M | §10 | E-05, `FW-REQ-6` |
| F-22 | `esm-logs-app` est un outil de développement (flux du terminal `egen develop`) affiché dans le rail pour tous les utilisateurs | B | `log-store.ts` | [03](03-CLASSIFICATION-APPS.md) (catégorie D) |
| F-23 | Mécanisme de version **manuel** : sans incrément de `version`, un changement d'app n'est pas republié (publication silencieusement ignorée) ; `.changeset/` sans configuration, 24 notes jamais consommées | M | §1 | P0 (`D-02`, `D-19`) |
| F-24 | Web : `esm-not-found-app` renvoie à `window.location.href = "/"` (racine du site, pas la base du SPA) : possible défaut Web préexistant, à ne **pas** corriger dans ce programme (P-1) | B | §8 | `D-21`, T6.1.5 |

## 13. Commandes de re-vérification (à lancer avant de s'appuyer sur ce document)

```bash
git rev-parse --short HEAD                                   # commit audité : 6138348
ls packages/apps | wc -l                                      # 26
grep -l '"platforms"' packages/apps/*/src/routes.json         # (aucune ligne)
grep -rn "getPlatform\|isNativePlatform" packages/apps --include=*.ts --include=*.tsx | wc -l   # 0
grep -rn "window.location.href *=" packages/apps --include=*.ts --include=*.tsx | grep -v test
grep -rn 'target="_blank"' packages/apps --include=*.tsx | grep -v test | wc -l                # 14
node tools/sync-egen-deps.mjs --check                          # écarts avec npm
```

*Journal des mises à jour de l'état des lieux (ajouter une ligne datée, ne pas réécrire ci-dessus) :*

| Date | Changement constaté |
| --- | --- |
| 2026-11-15 | Rédaction initiale |
