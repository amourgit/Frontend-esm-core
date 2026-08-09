# Analyse complète — Système Multi-Tenant (`@egen/esm-tenant`)

**Date de l'analyse :** 16 juillet 2026
**Périmètre :** `@egen/esm-tenant`, `@egen/esm-tenant-routing-app`, et l'ensemble des packages consommateurs (`esm-app-shell`, `esm-login-app`, `esm-primary-navigation-app`, `esm-api`, `esm-framework`, `esm-react-utils`), ainsi que les fichiers d'environnement et de build (`.env.development`, `rspack.config.js`, `dependencies.json`, `index.ejs`).
**Méthode :** lecture exhaustive du code source (2517 lignes dans le package `esm-tenant` seul), traçage de chaque export public jusqu'à ses points de consommation réels (`grep` systématique, pas d'hypothèse), lecture des tests existants, lecture des fichiers de configuration de build et d'environnement.

---

## Session du 8 août 2026 — Diagnostic de la panne de résolution + refonte architecturale complète (suppression de la registry)

**Contexte :** signalement direct — *"le système ne détecte rien, même quand un tenant est passé en sous-domaine directement dans l'URL"*, suivi d'une décision produit explicite de supprimer toute vérification de tenant côté frontend. Cette session couvre les deux : d'abord le diagnostic de la panne réelle, puis la refonte architecturale qui la rend obsolète.

### Partie A — Diagnostic segmenté et validé (3 tests, exécutés sur le code réel)

Un harnais de test isolé a été construit (Node + `tsx`, code source du package copié tel quel, seule dépendance interne stubée) pour diagnostiquer sans hypothèse.

| # | Test | Méthode | Résultat |
|---|---|---|---|
| 1 | Résolveur isolé | Exécution de `resolveActiveTenantId()` réel (subdomain/path/query/header/jwt/localStorage/static) contre une registry peuplée en mémoire | ✅ **11/11** — la logique de résolution elle-même était 100% correcte |
| 2 | Serveur HTTP réel | Reproduction fidèle des deux serveurs de dev du repo (rspack devServer natif ET le serveur Express de `egen develop`, utilisé par `yarn start`), requête vers `EGEN_TENANT_REGISTRY_URL=/tenants/registry.json` | ❌ **404 systématique**, pour deux raisons cumulatives (voir ci-dessous) |
| 3 | Bout en bout | `setupTenantSystem()` réel (code non modifié), `window.location.hostname = "mef.egen.gabon.gov.ga"` (sous-domaine tenant valide), registry servie comme en conditions réelles | ✅ Reproduit exactement le symptôme : `activeTenant` reste `null`, `status: "error"`, **malgré** un sous-domaine tenant valide dans l'URL |

**Cause racine identifiée (deux bugs cumulatifs, jamais détectés par l'audit du 16 juillet) :**
- **Bug A** — `rspack.config.js` ne copiait jamais `public/tenants/registry.json` dans `dist/` : son `CopyRspackPlugin` énumère explicitement ses patterns (assets, thèmes, fonts…), et ce dossier n'y figurait pas.
- **Bug B** — même copié, l'URL configurée (`/tenants/registry.json`) ignorait le préfixe `egenPublicPath` (`/egen/spa`) sous lequel tout est réellement servi — contrairement au système de thème, qui résout correctement ses URLs par rapport à ce préfixe.

**Conséquence en aval, tracée jusqu'au symptôme visible :** `initTenantRegistry()` retournait 0 tenant → `setupTenantSystem()` levait `"La registry de tenants est vide"` **avant même d'essayer la stratégie `subdomain`** → `esm-tenant-routing-app` (le guard de routage) interrogeait indépendamment `getTenantByDomain()` sur cette registry vide → sous-domaine jugé "inconnu" → `unknownTenantBehavior` par défaut = `redirect-to-landing` → **redirection silencieuse vers `/home`, sans aucune erreur visible**. C'est exactement le comportement rapporté.

Le correctif direct (copier `public/tenants/` dans `dist/`, corriger l'URL) était prêt à être appliqué — mais la Partie B ci-dessous le rend intégralement obsolète : il n'y a plus de registry à servir du tout.

### Partie B — Refonte architecturale : suppression complète du système de registry/vérification

**Décision produit :** le système reposait sur une liste statique de tenants (`registry.json`) qu'il aurait fallu éditer manuellement à chaque nouvel enregistrement — incompatible avec un enregistrement dynamique des tenants côté backend. Nouvelle règle : **le frontend capture le tenant depuis l'URL et le rend disponible globalement, sans aucune vérification. Toute validation (existence, statut, permissions) est une responsabilité backend.**

#### Ce qui a été supprimé

| Élément | Emplacement | Raison |
|---|---|---|
| `TenantDefinition` (registry) | `esm-tenant/src/types.ts` | Remplacé par un simple `TenantId` (string) — plus de métadonnées locales (nom, permissions, thème, `allowedApps`, `suspended`, `featureFlags`) |
| `context/registry.ts` (entier) | `esm-tenant` | `initTenantRegistry`, `loadRemoteRegistry`, `getTenantByDomain`, `getTenantById`, `getAllTenants` — plus de liste à charger ni à interroger |
| `config/app-config.ts` (entier) | `esm-tenant` | `registerAppTenantConfig`/`TenantGuard`/`checkAppTenantRequirements` — confirmé **100 % inutilisé** dans tout le monorepo avant suppression |
| `TenantGuard`, `TenantRequired`, `TenantSuspendedBoundary`, `TenantSelector` | `esm-tenant/src/hooks/TenantProvider.tsx` | Composants de blocage/vérification de rendu — plus de donnée à vérifier |
| `useTenantAccess`, `useTenantFeatureFlag`, `useTenantPermission`, `useTenantIsSuspended`, `useTenantMeta`, `useTenantLocale`, `useTenantTimezone`, `useTenantApiBaseUrl`, `useAvailableTenants` | `esm-tenant/src/hooks/useTenant.ts` | Toutes dépendaient de métadonnées de la registry supprimée |
| Page + route `/tenant-suspended` | `esm-tenant-routing-app/src/screens/suspended.component.tsx` + toutes les regex de routes publiques (`esm-ai-assistant-app`, `esm-footer-app`, `esm-not-found-app`, `esm-primary-navigation-app`) | Le statut "suspendu" n'existe plus côté frontend |
| `unknownTenantBehavior`, `tenantSuspendedUrl`, `validateSubdomainWithBackend`, `backendValidationEndpoint` | `esm-tenant-routing-app/src/config-schema.ts` | Config de vérification devenue sans objet |
| `EGEN_TENANT_REGISTRY_URL`, `EGEN_TENANT_THEME_APPLY` (+ `window.egenTenant*` correspondants) | `.env.development`, `example.env`, `rspack.config.js`, `esm-globals/src/types.ts` | Plus de registry à charger, plus de thème piloté par tenant côté frontend |
| `registerTenantThemeApplier` + branchement `applyGlobalThemeOverride` par tenant | `esm-app-shell/src/run.ts` | Sans registry, plus de source de données (`themeOverride`/`themeUrl`) pour ce mécanisme |
| `public/tenants/registry.json` | `esm-app-shell/public/` | Fichier de démonstration devenu inutile |
| Liste déroulante "mes établissements" (`useAvailableTenants`) | `esm-primary-navigation-app` — `context-switcher.component.tsx` | Nécessitait une liste de tenants connus côté frontend, qui n'existe plus. **Remplacé par un simple indicateur du tenant courant** (pas de sélection). Note : un vrai sélecteur multi-espaces nécessiterait un endpoint backend dédié (ex: `GET /api/me/tenants`) — hors périmètre de cette refonte. |

#### Ce qui reste (le strict nécessaire, capture + exposition)

- `setupTenantSystem()` — **100 % synchrone** désormais (plus aucun accès réseau nécessaire, plus de `.catch()` requis côté `run.ts`)
- 7 stratégies de capture BRUTE, sans vérification : `subdomain`, `path`, `query`, `jwt`, `header` *(reprend en localStorage le tenant déjà connu côté client au login — ne lit pas un header HTTP réel)*, `localStorage`, `static`. La stratégie `first` (qui prenait le premier tenant de la registry) a été retirée — elle n'a plus de sens sans registry.
- Store Zustand simplifié : `{ mode, status, tenantId, source, resolvedAt, config }`
- `useTenant()` retourne désormais directement `TenantId | null` (un string), plus un objet `TenantDefinition`
- `switchTenant(tenantId)` — change le tenant actif sans aucune vérification
- `@egen/esm-api` (`getTenantId()`, `tenantHeaders()`, `isMultiTenant()`) — **inchangé dans son rôle**, c'est le pont déjà câblé qui injecte `X-Tenant-ID` sur chaque requête backend (`egenFetch`) ; c'est la brique qui réalise concrètement *"rendre le tenant consultable"*
- Le guard de routage (`esm-tenant-routing-app`) garde son rôle de **navigation** (landing globale si pas de sous-domaine, redirection login si non authentifié) mais plus aucune vérification de **validité** du tenant

#### Validation (test 4, sur le code réel réécrit)

| Scénario | Résultat |
|---|---|
| Sous-domaine tenant existant, **sans aucune registry nulle part** | ✅ Capturé (`tenantId: "mef"`, `source: "subdomain"`) |
| Sous-domaine **jamais vu, zéro configuration préalable** | ✅ Capturé directement (`tenantId: "tout-nouveau-lycee-jamais-vu"`) — **c'est exactement la demande : plus besoin de maintenir une liste** |
| Domaine racine seul (pas de sous-domaine) | ✅ `status: "idle"`, pas d'erreur, pas de crash |
| Lecture depuis le store global (équivalent `esm-api getTenantId()`/`tenantHeaders()`) | ✅ `X-Tenant-ID` correctement dérivé |
| `switchTenant()` sans vérification | ✅ Changement direct, immédiat |

**14/14 assertions passées.** Voir aussi le résultat 0 erreur de syntaxe sur les 28 fichiers modifiés (validation `esbuild`, en l'absence d'environnement `yarn`/`tsc` complet dans le sandbox d'exécution — un `yarn install && tsc --noEmit` de contrôle sur poste de dev reste recommandé avant la prochaine mise en prod).

#### Fichiers touchés (32 au total)

Réécrits : `esm-tenant/src/{types,setup,index}.ts`, `esm-tenant/src/config/env.ts`, `esm-tenant/src/context/{resolver,store}.ts`, `esm-tenant/src/hooks/{useTenant,TenantProvider}.tsx`, `esm-tenant/src/utils/tenant-utils.ts`, `esm-tenant/src/__tests__/{resolver,setup}.test.ts`, `esm-api/src/tenant.ts`, `esm-tenant-routing-app/src/{config-schema.ts,guard/use-tenant-routing.ts,index.ts,root.component.tsx}`, `esm-primary-navigation-app/src/components/context-switcher/context-switcher.component.tsx`, `esm-login-app/src/login/login.component.tsx`, `esm-ai-assistant-app/src/{root.component.tsx,root.component.test.tsx,base-routes.ts}`, `esm-app-shell/src/run.ts`, `esm-globals/src/types.ts`, `esm-app-shell/rspack.config.js`, `.env.development`, `example.env`.
Supprimés : `esm-tenant/src/context/registry.ts`, `esm-tenant/src/config/app-config.ts`, `esm-tenant/src/__tests__/registry.test.ts`, `esm-tenant-routing-app/src/screens/suspended.{component.tsx,scss}`, `esm-app-shell/public/tenants/registry.json`.
Nettoyés (retrait de `tenant-suspended` des regex de routes publiques) : `esm-footer-app/src/{root.component.tsx,root.component.test.tsx,routes.json}`, `esm-not-found-app/src/{index.ts,routes.json}`, `esm-primary-navigation-app/src/{root.component.tsx,routes.json}`, `esm-ai-assistant-app/src/routes.json`.

## 0. État des corrections (17 juillet 2026)

Tous les points ci-dessous ont été corrigés et poussés sur `main`, sauf le §6
(permissions fines par app) qui reste une décision volontairement différée.

| # | Constat | Statut | Commit |
|---|---|---|---|
| 1 | Système tenant inerte par défaut (pont `.env` cassé) | ✅ Corrigé — pont `EGEN_TENANT_*` → `window.egenTenant*` ajouté (même modèle que `EGEN_AI_*`), branche `import.meta.env` morte supprimée | `6957a18` |
| 2 | Risque de store dupliqué via Module Federation | ✅ Corrigé — `@egen/esm-state` + `@egen/esm-tenant` déclarés en peerDependencies partout où nécessaire et ajoutés au `shared` du shell | `660283a` |
| 3 | Suspension d'un tenant → page cassée | ✅ Corrigé — `activateTenant()` peuple désormais `activeTenant` même quand suspendu ; assertion manquante ajoutée au test existant | `6957a18` |
| 4 | Permissions fines par app jamais câblées | 🟡 Décision explicite : infrastructure conservée telle quelle (fonctionnelle, testée), **non adoptée automatiquement** — activer `registerAppTenantConfig`/`TenantGuard` par app est une décision de conception à faire consciemment app par app, pas quelque chose qu'il est sûr de deviner et de câbler à l'aveugle. Documentation clarifiée en conséquence (`index.ts`). Voir aussi le point 5bis ci-dessous pour ce qui a effectivement été câblé. | `1554b10` |
| 5 | Duplication esm-api ↔ esm-tenant | ✅ Corrigé — type dupliqué remplacé par un `import type` (zéro coût runtime) ; fonctions redondantes marquées `@deprecated` avec pointeur explicite, sans breaking change | `1554b10` |
| 5bis | Assistant IA non gaté par tenant (demande explicite) | ✅ Câblé — `useTenantFeatureFlag('ai-assistant', true)` (modèle opt-out, zéro régression hors multi-tenant) | `1554b10` |
| 6 | Résolveur : candidat invalide arrête la chaîne | ✅ Corrigé — toutes les stratégies sont maintenant strictes ; tests de régression ajoutés | `6957a18` |
| 7 | Stratégie "header" trompeuse | ✅ Documentation corrigée (comportement réel inchangé — c'est un choix valide, seul le nom/la doc induisaient en erreur) | `6957a18` |
| 8 | Triple implémentation du domaine racine | ✅ Corrigé — source unique `@egen/esm-tenant/utils/domain-utils.ts`, `rootDomain` exposé via le store et propagé aux deux apps consommatrices | `6957a18` |
| 9 | Chevauchement de routes `/tenant-suspended` | ✅ Corrigé — `root.component.tsx` ne monte plus que le guard ; `suspendedPage` reste seule propriétaire de la route | `1554b10` |
| 9.1 | `validateSubdomainWithBackend` jamais implémenté | 🟡 Laissé non implémenté (implémenter un vrai appel réseau demanderait de refondre le guard en machine à état async — risque trop élevé sans backend réel à tester) mais rendu explicite : avertissement console + description de config corrigées, plus de no-op silencieux | `f97ebe4` |
| 9.2 | `buildTenantSubdomainUrl` non utilisée | ✅ Résolu de fait — maintenant utilisée par `context-switcher.component.tsx` suite à la déduplication du §8 | `6957a18` |
| 9.3 | Dépendance fantôme `esm-app-shell` | ✅ Corrigé — déclarée explicitement dans `package.json` | `660283a` |
| 9.4 | Types non exportés du barrel | ✅ Corrigé — `TenantResolutionStrategy`/`TenantPathConfig`/`TenantJwtConfig` exportés | `6957a18` |
| 9.5 | `VITE_ROOT_DOMAIN` mort | ✅ Corrigé — renommé `EGEN_TENANT_ROOT_DOMAIN`, réellement câblé (voir §1 et §8) | `6957a18` |
| 9.6 | Ambiguïté ID/slug dans `getTenantById` | ⚪ Non traité — edge case mineur, laissé tel quel (voir §9 ci-dessous pour le détail) | — |
| 9.7 | État figé après suppression d'un tenant | ✅ Corrigé — `reloadTenantRegistry()` vide explicitement `activeTenant` si le tenant a disparu | `f97ebe4` |

Le reste de ce document est le rapport d'analyse **original**, conservé tel
quel comme trace du diagnostic — les sections ci-dessous décrivent donc les
bugs tels qu'ils étaient avant correction.

---

## 1. Résumé exécutif

Le package `@egen/esm-tenant` est **bien conçu sur le papier** : types complets, séparation claire des responsabilités (registry / resolver / store / hooks / setup), documentation abondante en tête de chaque fichier, tests unitaires présents. Mais l'audit fait ressortir un écart important entre **ce que le code prétend faire** et **ce qui se passe réellement une fois déployé** :

1. **🔴 CRITIQUE — Le système est inerte par défaut, y compris quand `.env.development` demande explicitement `VITE_TENANT_MODE=multi`.** La résolution de config par variables d'environnement (`resolveConfigFromEnv()`) ne peut techniquement pas fonctionner avec la chaîne de build actuelle (rspack, pas Vite), et le pont `window.egenTenant*` qui aurait dû compenser (sur le modèle de ce qui existe déjà pour `EGEN_AI_*`) n'a jamais été implémenté. Résultat : `setupTenantSystem()` démarre toujours en `mode: "off"`, silencieusement.
2. **🔴 CRITIQUE (à confirmer en runtime) — Risque de « split-brain » du store via Module Federation.** Le shell (le seul endroit où `setupTenantSystem()` est appelé) ne déclare pas `@egen/esm-tenant` dans son fichier `dependencies.json` de partage Module Federation, contrairement aux apps distantes qui le déclarent correctement. Le store que le shell initialise au boot pourrait ne pas être celui que les microfrontends lisent.
3. **🟠 ÉLEVÉ — La suspension d'un tenant casse la page dédiée qui doit l'afficher.** `activateTenant()` ne renseigne jamais `activeTenant` dans le store quand le tenant est suspendu ; la page `/tenant-suspended` (et tous les hooks qui en dépendent) reçoit donc systématiquement `tenant === null` et affiche un message générique au lieu du message personnalisé du tenant.
4. **🟠 ÉLEVÉ — Le système de permissions fines par application est mort-né.** `registerAppTenantConfig`, `getAppTenantConfig`, `checkAppTenantRequirements`, `TenantGuard`, `useTenantAccess` — c'est-à-dire exactement le mécanisme de gestion fine des permissions frontend par tenant/app — ne sont utilisés **nulle part** dans le monorepo. Les données `allowedApps` / `permissions` du registry de démo n'ont aujourd'hui aucun effet.
5. **🟡 MOYEN — Duplication d'implémentation entre `esm-tenant` et `esm-api`.** L'intégralité de l'API non-React de `esm-tenant/utils/tenant-utils.ts` (12 fonctions exportées, dont `fetchWithTenant`, `getTenantHeaders`) a 0 usage externe : c'est une réimplémentation parallèle dans `esm-api/src/tenant.ts` (noms différents) qui est réellement branchée sur le client HTTP.

Le reste du document détaille chaque point avec preuves (fichier + ligne), impact, et recommandation.

---

## 2. Cartographie — qui dépend réellement de quoi

Recherche exhaustive des imports réels (`from '@egen/esm-tenant'`, pas les commentaires) :

| Fichier | Ce qu'il importe |
|---|---|
| `esm-framework/src/index.ts` | `export * from '@egen/esm-tenant'` (barrel) |
| `esm-app-shell/src/run.ts` | `setupTenantSystem`, `registerTenantThemeApplier` — **le point de boot** |
| `esm-primary-navigation-app/.../topbar.component.tsx` | `useTenantMode` |
| `esm-primary-navigation-app/.../context-switcher.component.tsx` | `useTenant`, `useTenantMode`, `useAvailableTenants` |
| `esm-login-app/.../login.component.tsx` | `useTenant`, `useTenantMode`, `storeHeaderTenantId`, `getTenantStoreState` |
| `esm-tenant-routing-app/.../use-tenant-routing.ts` | `useTenantMode`, `useTenantStatus`, `useTenant`, `getTenantByDomain` |
| `esm-tenant-routing-app/.../suspended.component.tsx` | `useTenant` |

`esm-api/src/tenant.ts` **ne dépend délibérément pas** de `@egen/esm-tenant` (commentaire explicite dans le fichier) : il relit le store Zustand via `getGlobalStore('tenant')` de `@egen/esm-state` pour éviter une dépendance circulaire. C'est un choix d'architecture assumé, mais qui a un effet de bord documenté au §6.

Sur les 12 fonctions exportées par `utils/tenant-utils.ts` (l'API non-React « pour services/intercepteurs ») et les 4 fonctions de `config/app-config.ts` (l'API de permissions par app), **aucune n'a de consommateur en dehors du package lui-même.** Détail au §6 et §7.

---

## 3. 🔴 CRITIQUE #1 — Le système tenant est inerte par défaut

### Preuve, étape par étape

**a) Le fichier `.env.development`, committé à la racine du repo, active explicitement le multi-tenant :**

```env
# .env.development
VITE_TENANT_MODE=multi
VITE_TENANT_RESOLUTION_ORDER=subdomain,header,jwt,localStorage,query,static,first
VITE_ROOT_DOMAIN=egen.gabon.gov.ga
VITE_TENANT_REGISTRY_URL=/tenants/registry.json
VITE_TENANT_THEME_APPLY=true
VITE_TENANT_PERSIST=true
VITE_TENANT_JWT_CLAIM=tenantId
```

Quelqu'un a même préparé un registry de démonstration complet à `packages/shell/esm-app-shell/public/tenants/registry.json` (5 tenants, dont un `suspended-example` avec message personnalisé, et des `allowedApps`/`permissions` détaillés pour `mef-gabon` et `lycee-lb`). Tout indique une intention de faire fonctionner le mode multi-tenant en développement.

**b) `resolveConfigFromEnv()` (`esm-tenant/src/config/env.ts`, ligne 49-59) lit ces variables via `import.meta.env` :**

```ts
const env = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined') {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    if (metaEnv) {
      const v = metaEnv[key];   // ← accès dynamique par clé
      ...
```

`import.meta.env` est une fonctionnalité **spécifique à Vite**. Or ce monorepo n'utilise **pas Vite** : tous les `package.json` des apps ont `"build": "rspack --mode=production"`, et le shell utilise directement `@rspack/core`. rspack ne fournit pas nativement d'objet `import.meta.env` peuplé — et même s'il le faisait via une configuration ad hoc, l'accès `metaEnv[key]` est un accès **dynamique par variable**, alors que les mécanismes de remplacement statique de type `DefinePlugin` ne savent remplacer que des expressions littérales (`import.meta.env.VITE_TENANT_MODE`), jamais `import.meta.env[key]`. C'est très exactement le même écueil que celui déjà rencontré et documenté ailleurs dans ce repo pour `process.env[key]` (voir le commentaire dans `packages/tooling/rspack-config/src/index.ts` et dans `esm-app-shell/rspack.config.js`, qui expliquent pourquoi un pont `window.egenAi*` a dû être créé pour `EGEN_AI_*`).

**c) Confirmation dans la config de build : aucune des variables `VITE_TENANT_*` n'est jamais injectée.**

`packages/tooling/rspack-config/src/index.ts` (utilisé par toutes les apps remote) n'injecte via `DefinePlugin` que :
- `process.env.FRAMEWORK_VERSION`
- `process.env.EGEN_AI_*` (et uniquement ces clés, via `loadEgenAiEnvDefines()`)

`packages/shell/esm-app-shell/rspack.config.js` (le shell) n'injecte que :
- `process.env.BUILD_VERSION`, `process.env.FRAMEWORK_VERSION`, `process.env.NODE_ENV`, `process.env.EGEN_DEV_NO_AUTH`

Aucune trace de `VITE_TENANT_MODE`, `VITE_TENANT_ID`, etc. dans un `DefinePlugin` où que ce soit dans le monorepo.

**d) Le filet de sécurité « window » n'a jamais été câblé non plus.**

`esm-tenant` prévoit un deuxième canal de configuration : `window.egenTenantMode`, `window.egenTenantId`, etc. (typés dans `esm-globals/src/types.ts` lignes 66-110). Mais contrairement au pont `EGEN_AI_*` → `window.egenAi*` qui existe réellement (`egenAiConfigDef` injecté dans `index.ejs`, visible ci-dessous), **aucun bloc équivalent n'existe pour le tenant** :

```html
<!-- packages/shell/esm-app-shell/src/index.ejs -->
<% if (egenAiConfigDef) { %>
    <script>
      // Pont EGEN_AI_* (.env, build) → window.egenAi* (lu par @egen/esm-ai-config au runtime)
      Object.assign(window, <%= egenAiConfigDef %>);
    </script>
<% } %>
<!-- AUCUN bloc équivalent "egenTenantConfigDef" n'existe -->
```

**e) Le point de démarrage réel confirme le diagnostic.**

`esm-app-shell/src/run.ts`, ligne 478 :

```ts
// Non bloquant : le shell démarre même si le système tenant échoue.
const tenantReady = setupTenantSystem().catch((err) => { ... });
```

`setupTenantSystem()` est appelée **sans aucun argument**. Le commentaire juste au-dessus (lignes 439-446) documente la configuration attendue via `.env` / `window.*` — les deux canaux qui ne fonctionnent pas. Sans config inline, `setup.ts` retombe sur `mode: 'off'` par défaut (ligne 155 de `setup.ts`).

### Impact

Dans **tout** environnement (dev comme prod), le système multi-tenant démarre désactivé, quelle que soit la configuration dans `.env*`. Toute la richesse fonctionnelle du package (résolution par sous-domaine, permissions par tenant, thèmes par tenant, sélecteur de contexte) est actuellement inaccessible sans modifier le code source pour passer une config inline à `setupTenantSystem({...})`.

### Recommandation

Répliquer le pattern déjà utilisé pour `EGEN_AI_*` :
1. Dans `esm-app-shell/rspack.config.js`, construire un objet `egenTenantConfigDef` à partir des variables `VITE_TENANT_*` (ou les renommer `EGEN_TENANT_*` pour cohérence avec `EGEN_AI_*`, qui n'a pas ce problème car il utilise `process.env`, remplaçable statiquement par clé connue).
2. L'injecter dans `index.ejs` sous forme de `window.egenTenant* = ...` comme c'est fait pour `egenAiConfigDef`.
3. Supprimer ou clairement marquer comme non fonctionnelle la branche `import.meta.env` de `env.ts` tant que ce projet n'utilise pas Vite — elle induit en erreur quiconque lit le code en pensant que `.env` suffit.

---

## 4. 🔴 CRITIQUE #2 — Risque de double instance du store via Module Federation (à confirmer en runtime)

### Preuve

Le fichier `esm-tenant/src/context/store.ts` documente lui-même l'exigence architecturale, en toutes lettres (lignes 9-12) :

```ts
//  IMPORTANT — SINGLETON MODULE FEDERATION :
//  Ce module DOIT être partagé en singleton via Module Federation pour que
//  toutes les microfrontends lisent le même état. Configurez :
//    shared: { '@egen/esm-tenant': { singleton: true, eager: true } }
```

Les apps remotes (`esm-login-app`, `esm-primary-navigation-app`, `esm-tenant-routing-app`) utilisent la config rspack partagée (`packages/tooling/rspack-config/src/index.ts`), qui construit automatiquement `shared` à partir de `peerDependencies` — et ces trois apps déclarent bien `@egen/esm-tenant` dans leurs `peerDependencies`. Jusqu'ici, correct.

**Mais le shell (`esm-app-shell`) — le seul endroit où `setupTenantSystem()` est appelé — utilise sa propre configuration de partage, indépendante :**

```js
// esm-app-shell/rspack.config.js
const sharedDependencies = require('./dependencies.json');
...
new ModuleFederationPlugin({
  name,
  shared: sharedDependencies.reduce((obj, depName) => { ... }),
})
```

Et `packages/shell/esm-app-shell/dependencies.json` contient :

```json
[
  "@carbon/react", "i18next", "dayjs", "react", "react-dom",
  "react-router-dom", "react-i18next",
  "@egen/esm-framework/src/internal",
  "rxjs", "single-spa", "swr"
]
```

**`@egen/esm-tenant` n'y figure pas.** `@egen/esm-framework/src/internal` y figure (et ré-exporte bien `esm-tenant` via son barrel), mais c'est une clé de partage *différente* dans le Module Federation shared scope — cela ne rend pas `@egen/esm-tenant` lui-même partagé sous son propre nom.

Confirmation complémentaire : `esm-app-shell/package.json` ne déclare `@egen/esm-tenant` dans **aucune** section (`dependencies`, `peerDependencies`, `devDependencies`) — voir aussi §8.3 (dépendance fantôme).

### Impact potentiel (à valider par une inspection runtime — voir recommandation)

Si Module Federation ne partage pas `@egen/esm-tenant` côté shell, le shell embarque sa propre copie **privée** du module (et donc de l'instance Zustand `tenantStore`, qui est un singleton *au niveau du module*, pas au niveau de l'application). `setupTenantSystem()` appelé dans `run.ts` écrirait alors dans cette instance privée — pendant que les apps remotes, elles, liraient/écriraient dans l'instance partagée du shared scope (initialisée par le premier remote qui la déclare). Les deux ne se rejoignent jamais : les hooks (`useTenant()`, etc.) dans les remotes verraient en permanence l'état par défaut (`mode: 'off'`, `activeTenant: null`), indépendamment de ce que `setupTenantSystem()` fait réellement.

Ce scénario n'a **pas été vérifié à l'exécution** dans le cadre de cette analyse statique (cela nécessiterait un build complet + inspection du runtime Module Federation dans le navigateur), mais la configuration statique va clairement à l'encontre de l'exigence documentée par le package lui-même. C'est un point à vérifier en priorité avant même de corriger le point #1 — car tant que le point #1 (mode toujours "off") n'est pas corrigé, ce second bug reste invisible.

### Recommandation

1. Ajouter `@egen/esm-tenant` (et vérifier `@egen/esm-state`, dont dépend `esm-tenant`) à `packages/shell/esm-app-shell/dependencies.json`.
2. Une fois le point #1 corrigé et le mode `multi` réellement actif, vérifier dans les DevTools réseau/console que `setupTenantSystem()` (dans le shell) et `useTenant()` (dans une app remote, ex. `esm-login-app`) pointent vers la même instance — par exemple en exposant temporairement `tenantStore` sur `window` des deux côtés et en comparant les références, ou en observant qu'un `switchTenant()` déclenché depuis une app se reflète bien dans une autre.

---

## 5. 🟠 ÉLEVÉ #3 — La suspension d'un tenant casse sa propre page d'affichage

### Chaîne de preuve complète

**a) `activateTenant()` ne peuple jamais le store quand le tenant est suspendu :**

```ts
// esm-tenant/src/setup.ts, lignes 88-97
async function activateTenant(tenant, config, previousTenant = null) {
  if (tenant.suspended) {
    setTenantStoreStatus('suspended', tenant.suspendedMessage ?? `Le tenant "${tenant.id}" est suspendu.`);
    console.warn(...);
    return;              // ← sort AVANT setActiveTenantInStore(tenant)
  }
  setActiveTenantInStore(tenant);   // jamais atteint si suspended
  ...
```

Résultat : `store.status === 'suspended'`, mais `store.activeTenant` reste `null` (valeur initiale). Le message de suspension personnalisé n'est stocké **que** dans `store.error` — un champ qu'aucun hook public exporté n'expose de façon réactive (`getTenantStoreState()` existe mais n'est pas un hook React réactif ; il n'y a pas de `useTenantError()`).

**b) `useTenantIsSuspended()` lit `activeTenant`, qui est donc toujours `null` dans ce cas précis :**

```ts
// esm-tenant/src/hooks/useTenant.ts, lignes 249-254
export function useTenantIsSuspended(): { suspended: boolean; message?: string } {
  return useTenantStoreSelector((s) => ({
    suspended: s.activeTenant?.suspended === true,   // → toujours false
    message: s.activeTenant?.suspendedMessage,        // → toujours undefined
  }));
}
```

**c) `TenantSuspendedBoundary` a exactement le même problème :**

```tsx
// esm-tenant/src/hooks/TenantProvider.tsx, lignes 185-196
export const TenantSuspendedBoundary: FC<...> = ({ children, fallback = null }) => {
  const status = useTenantStatus();
  const tenant = useTenant();          // → null
  if (status === 'suspended') {
    const message = tenant?.suspendedMessage;   // → toujours undefined
    ...
```

Le composant détecte correctement la suspension (via `status`) mais ne peut **jamais** transmettre le message personnalisé à son `fallback`.

**d) Impact concret et démontrable sur `SuspendedPage` (`esm-tenant-routing-app`) :**

```tsx
// esm-tenant-routing-app/src/screens/suspended.component.tsx, lignes 15-41, 102-106
const tenant = useTenant();   // → null quand status === 'suspended'
...
const tenantName = tenant?.name ?? tenant?.id ?? '';
const suspendedMsg = tenant?.suspendedMessage ?? t('suspendedDefaultMsg', 'Cet espace est temporairement...');
...
{tenant?.id && (
  <p>Référence : <code>{tenant.id}</code></p>   // ne s'affiche JAMAIS
)}
```

Conséquence vérifiable avec le tenant de démo `suspended-example` du registry (`suspendedMessage: "Cet espace a été suspendu suite à un impayé..."`) : la page affichera systématiquement le titre générique *« Espace temporairement suspendu »* et le message générique par défaut, **jamais** le message personnalisé configuré pour ce tenant, et jamais la référence `tenant.id` utile au support.

**e) Le guard de routage (`use-tenant-routing.ts`) calcule pourtant la bonne information, mais la jette.**

```ts
// esm-tenant-routing-app/src/guard/use-tenant-routing.ts, lignes 123-130
if (tenantFromRegistry.suspended) {
  return {
    action: 'redirect-suspended',
    tenantSlug: tenantFromRegistry.id,
    message: tenantFromRegistry.suspendedMessage,   // ← correctement calculé...
  };
}
```

```ts
// use-tenant-routing.ts, lignes 178-182 — useTenantRoutingNavigator
case 'redirect-suspended': {
  navigatedRef.current = key;
  navigate({ to: interpolateUrl(config.tenantSuspendedUrl) });   // ← ...mais jamais transmis
  break;
}
```

`decision.message` et `decision.tenantSlug` ne sont ni passés en query param, ni stockés nulle part : ils sont calculés puis silencieusement abandonnés lors de la navigation.

**f) Le test existant ne peut pas détecter ce bug — et c'est pourquoi il n'a jamais été vu :**

```ts
// esm-tenant/src/__tests__/setup.test.ts, lignes 85-96
describe('setupTenantSystem — tenant suspendu', () => {
  it('passe en status "suspended"', async () => {
    await setupTenantSystem({ mode: 'single', staticTenants: [{ id: 'suspended', ..., suspended: true, suspendedMessage: 'Maintenance' }], defaultTenantId: 'suspended', applyTheme: false });
    expect(getTenantStoreState().status).toBe('suspended');
    expect(getTenantStoreState().error).toBe('Maintenance');
    // ⚠ Aucune assertion sur `activeTenant` — c'est ce qui masque le bug.
    // Ajouter : expect(getTenantStoreState().activeTenant?.id).toBe('suspended')
    // → cette assertion échouerait aujourd'hui (activeTenant est null).
  });
});
```

### Recommandation

Dans `activateTenant()`, appeler `setActiveTenantInStore(tenant)` **avant** le `return` anticipé sur suspension (ou une variante qui peuple `activeTenant` mais laisse `status: 'suspended'` — `setActiveTenantInStore` calcule déjà `status` à partir de `tenant.suspended`, donc un simple réordonnancement suffit probablement). Ajouter l'assertion manquante dans le test existant. Envisager de transmettre `message`/`tenantSlug` en query param dans `redirect-suspended` par redondance/robustesse.

---

## 6. 🟠 ÉLEVÉ #4 — Le système de permissions fines par application est mort-né

C'est le point le plus directement pertinent par rapport à l'objectif « gérer de façon optimale et fine les permissions niveau frontend » mentionné en amont de cette analyse.

### Ce que le package propose

`esm-tenant/src/config/app-config.ts` documente deux modes d'usage (lignes 10-37) :
1. **Déclaratif**, via un bloc `"tenant": {...}` dans le `routes.json` de chaque app.
2. **Programmatique**, via `registerAppTenantConfig(appName, config)` appelé dans le `run.ts` de chaque app.

Les guards liraient ensuite automatiquement cette config pour appliquer `requiredApp`, `requiredPermissions`, `allowInSingleMode`, `allowWhenModeOff`, `requiredFeatureFlags`.

Le hook `useTenantAccess()` et le composant `<TenantGuard>` sont les points d'application prévus de ce contrôle d'accès.

### Preuve que rien de tout cela n'est câblé

```bash
$ grep -rn "requiredApp\|allowInSingleMode\|allowWhenModeOff\|requiredPermissions\|requiredFeatureFlags" \
    --include="*.ts" --include="*.tsx" --include="*.json" . | grep -v esm-tenant/src
# → 0 résultat

$ grep -rl '"tenant"' --include="routes.json" .
# → 0 résultat (aucun routes.json ne déclare de bloc "tenant")

$ grep -rn "registerAppTenantConfig\|getAppTenantConfig\|checkAppTenantRequirements\|getAllAppTenantConfigs" \
    --include="*.ts" --include="*.tsx" . | grep -v "esm-tenant/src"
# → 0 résultat en dehors du package lui-même (uniquement des mentions dans les
#   commentaires JSDoc et le barrel d'export de esm-tenant/src/index.ts)

$ grep -rn "useTenantAccess" --include="*.ts" --include="*.tsx" . | grep -v esm-tenant/src
# → 0 résultat en dehors du package (le hook n'est appelé que par TenantGuard,
#   en interne)

$ grep -rn "<TenantGuard" --include="*.tsx" .
# → 0 résultat : AUCUNE app du monorepo ne monte <TenantGuard>
```

Résultat : ni l'approche déclarative (routes.json), ni l'approche programmatique (`registerAppTenantConfig`), ni le point d'application (`<TenantGuard>` / `useTenantAccess`) ne sont utilisés une seule fois. Le mécanisme complet — enregistrement, lecture, vérification — existe, est testé unitairement en isolation, mais n'est raccordé à rien.

### Preuve que les données existent pourtant côté registry

Le registry de démo (`packages/shell/esm-app-shell/public/tenants/registry.json`) contient bien des données `allowedApps` et `permissions` prêtes à l'emploi :

```json
{
  "id": "mef-gabon",
  "allowedApps": ["@egen/esm-national-dashboard-app", "@egen/esm-curriculum-app", "@egen/esm-reports-app"],
  "permissions": { "manage-tenants": true, "view-all-schools": true, "export-data": true }
},
{
  "id": "lycee-lb",
  "allowedApps": ["@egen/esm-school-dashboard-app", "@egen/esm-grades-app", ...],
  "permissions": { "manage-students": true, "manage-teachers": true, "view-reports": true, "export-data": false }
}
```

Ces données n'ont aujourd'hui **aucun effet** : un utilisateur du tenant `lycee-lb` qui accéderait (par URL directe ou via une future app) à une fonctionnalité hors de son `allowedApps` ne serait bloqué par rien côté frontend, puisque rien ne consulte jamais cette liste.

### Recommandation

Avant de construire de nouvelles fonctionnalités de permissions frontend par-dessus ce package, décider explicitement :
- Soit on active réellement ce mécanisme : câbler `<TenantGuard>` (ou `useTenantAccess`) autour des points d'entrée des apps sensibles, et appeler `registerAppTenantConfig()` dans leur `run.ts`.
- Soit on l'abandonne au profit d'un autre mécanisme (à documenter), et on retire `app-config.ts` du barrel public pour ne pas laisser croire qu'un contrôle est actif alors qu'il ne l'est pas — c'est le risque le plus important ici : un développeur ou un product owner pourrait raisonnablement croire, en lisant `registry.json` et la documentation du package, que les permissions par tenant sont déjà appliquées.

---

## 7. 🟡 MOYEN #5 — Duplication d'implémentation entre `esm-tenant` et `esm-api`

`esm-api/src/tenant.ts` réimplémente, sous des noms différents, la quasi-totalité de l'API non-React de `esm-tenant/src/utils/tenant-utils.ts` :

| `esm-tenant` (canonique, documentée comme l'API publique) | `esm-api` (réimplémentation, réellement utilisée) |
|---|---|
| `getCurrentTenantId()` | `getTenantId()` |
| `getCurrentTenant()` | `getActiveTenantInfo()` |
| `getTenantApiBaseUrl()` | `getTenantApiBase()` |
| `getTenantHeaders()` | `tenantHeaders()` |
| `isMultiTenantMode()` | `isMultiTenant()` |

Ce choix est assumé et documenté (`tenant.ts` ligne 10-12 : *"NE dépend PAS de @egen/esm-tenant... évite toute dépendance circulaire"*) — l'intention est légitime. Mais les conséquences n'ont pas été pleinement anticipées :

**a) L'API « canonique » de `esm-tenant` est totalement inutilisée :**

```bash
$ for fn in buildTenantUrl getTenantHeaders fetchWithTenant onTenantChange tenantHasFeatureFlag \
            tenantHasPermission isTenantActive isMultiTenantMode getTenantApiBaseUrl \
            getCurrentTenantId getCurrentTenant isTenantSystemActive; do
    grep -rln "\b$fn\b" . | grep -v esm-tenant/src   # → 0 pour chacune, sans exception
  done
```

**b) C'est bien la version `esm-api` qui est câblée sur le vrai client HTTP :**

```ts
// esm-api/src/egen-fetch.ts, ligne 7, 150-153
import { getTenantId } from './tenant';
...
if (typeof fetchInit.headers['X-Tenant-ID'] === 'undefined') {
  const tenantId = getTenantId();
  if (tenantId) fetchInit.headers['X-Tenant-ID'] = tenantId;
```

`fetchWithTenant()` / `getTenantHeaders()` documentés en tête de `esm-tenant/src/index.ts` comme faisant partie de « l'usage recommandé » ne sont donc jamais le mécanisme réel d'injection du header — c'est trompeur pour quiconque lit la documentation du package en s'attendant à devoir les utiliser.

**c) Risque de dérive de types.** `esm-api/src/tenant.ts` définit sa propre interface locale `MinimalTenantState` (lignes 34-46), dupliquée à la main depuis `TenantDefinition`/`TenantStore` de `esm-tenant/types.ts`, sans lien de type garanti par le compilateur. Un renommage de champ côté `esm-tenant` ne casserait pas la compilation de `esm-api` — juste son comportement à l'exécution.

### Recommandation

Documenter clairement dans `esm-tenant/src/index.ts` que les fonctions non-React (`getTenantHeaders`, `fetchWithTenant`, etc.) sont dépréciées au profit de `@egen/esm-api`, ou inversement supprimer la duplication côté `esm-api` si la dépendance circulaire peut être évitée autrement (ex. injection tardive/lazy import). Envisager de faire dériver `MinimalTenantState` d'un `Pick<TenantDefinition, ...>` importé en `type-only` (ce qui ne crée pas de dépendance runtime circulaire, seulement une dépendance de type).

---

## 8. 🟡 MOYEN — Autres anomalies de conception

### 8.1 Logique de résolution fragile : un résultat non valide arrête la chaîne de priorité

`resolveActiveTenantId()` (`context/resolver.ts`, lignes 192-236) essaie chaque stratégie dans l'ordre et s'arrête à la première qui renvoie une valeur *non vide* :

```ts
if (result) { ... return result; }
```

Or plusieurs stratégies renvoient la valeur brute même quand elle **ne correspond à aucun tenant connu** :

```ts
// resolveByQuery, resolveByHeader, resolveByLocalStorage, resolveByStatic — même motif :
const tenant = getTenantById(value);
return tenant?.id ?? value;   // ← renvoie `value` même si `tenant` est undefined
```

Seules `resolveBySubdomain` (via `getTenantByDomain`) et la branche `resolveByPath` sans préfixe font une vérification stricte d'existence. Concrètement : si un JWT contient un `tenantId` périmé (tenant supprimé du registry depuis), la stratégie `'jwt'` « réussit » techniquement avec une valeur invalide, empêchant les stratégies suivantes (`header`, `localStorage`, `static`, `first`) — potentiellement correctes — d'être essayées. `setup.ts` rattrape le coup en dernier ressort en retombant sur `allTenants[0]` (avec un `console.warn`), mais ce filet de sécurité choisit un tenant arbitraire plutôt que de poursuivre la chaîne de priorité voulue.

### 8.2 La stratégie « header » ne lit jamais de header HTTP

La documentation de `types.ts` (ligne 31) décrit la stratégie `header` comme lisant *« X‑Tenant‑ID (lu depuis la réponse du backend lors du login) »* — ce qui suggère une confirmation côté serveur. En réalité :

```ts
// context/resolver.ts, lignes 73-83
function resolveByHeader(storageKey: string): TenantId | undefined {
  ...
  const value = window.localStorage.getItem(`${storageKey}:header`);   // localStorage, pas un header HTTP
```

Et la seule écriture de cette clé (`login.component.tsx`, ligne 210-211) réutilise `effectiveTenantSlug`, qui est **la valeur déjà résolue côté client avant le login** (via sous-domaine ou query param) — pas une valeur renvoyée par le backend :

```ts
if (isMultiTenant && effectiveTenantSlug) {
  storeHeaderTenantId(effectiveTenantSlug, ...);
}
```

```bash
$ grep -rn "headers.get(.X-Tenant\|X-Tenant-ID.*response" .
# → 0 résultat dans tout le monorepo
```

Aucun code ne lit jamais un en-tête `X-Tenant-ID` depuis un `Response` HTTP. Le nom et la documentation de cette stratégie sont trompeurs : il s'agit d'un simple report en localStorage d'une valeur déjà connue côté client, pas d'une validation serveur. Ce n'est pas une faille de sécurité en soi (aucune élévation de tenant n'est possible via ce mécanisme), mais la documentation devrait être corrigée pour éviter toute fausse impression de contrôle côté backend.

### 8.3 Triple implémentation indépendante de l'inférence de domaine racine

La logique « déduire le domaine racine / sous-domaine à partir du hostname » est implémentée **trois fois**, indépendamment :

1. `esm-tenant/src/context/registry.ts` → `getTenantByDomain()` (comparaison directe aux `domains[]` déclarés)
2. `esm-tenant-routing-app/src/guard/subdomain-utils.ts` → `inferRootDomain()`, avec un avertissement explicite sur son imprécision pour les TLD multi-niveaux (`gov.ga`) et une recommandation de configurer `rootDomain` explicitement
3. `esm-primary-navigation-app/.../context-switcher.component.tsx` (ligne 90) → une troisième heuristique inline :

```ts
const rootDomain = hostname.split('.').slice(1).join('.') || hostname;
```

Cette troisième version ne lit **jamais** la config `rootDomain` d'`esm-tenant-routing-app` (les deux apps ne partagent pas cet espace de config) : même si un administrateur configure correctement `rootDomain: "egen.gabon.gov.ga"` pour corriger l'imprécision documentée au point 2, le sélecteur de tenant dans la topbar (`context-switcher`) reconstruira quand même une URL de bascule de tenant avec la même heuristique naïve et potentiellement incorrecte sur un domaine à plusieurs niveaux comme `gov.ga`.

### 8.4 Chevauchement de routes → double montage probable de la page suspendue

`esm-tenant-routing-app/src/routes.json` déclare deux entrées :

```json
{ "component": "root", "routeRegex": "^(?!(?:home)/?)", ... },
{ "component": "suspendedPage", "route": "tenant-suspended", ... }
```

`root` (qui monte `<TenantRoutingGuard/>` **et** un `<Routes><Route path="tenant-suspended" element={<SuspendedPage/>}/></Routes>` interne) matche `^(?!(?:home)/?)` — c'est-à-dire *toute* route sauf `/home*`, y compris `/tenant-suspended`. `suspendedPage` matche exactement `/tenant-suspended`. Le mécanisme d'enregistrement des pages du shell (`esm-routes/src/loaders/pages.ts`) crée une fonction d'activité single-spa indépendante par entrée de `routes.json` : les deux composants seraient donc actifs simultanément sur `/tenant-suspended`, chacun rendant `<SuspendedPage/>` — un rendu en double probable sur cette route. Le guard lui-même reste inoffensif (`isPublicRoute` l'exempte de toute redirection sur cette route), donc pas de boucle de redirection, mais un doublon visuel probable.

---

## 9. 🟢 FAIBLE — Divers

| # | Constat | Fichier | Détail |
|---|---|---|---|
| 9.1 | Config déclarée mais jamais lue | `esm-tenant-routing-app/src/config-schema.ts` | `validateSubdomainWithBackend` et `backendValidationEndpoint` sont documentés (validation d'un sous-domaine côté backend) mais ne sont référencés nulle part dans `use-tenant-routing.ts` : la validation reste toujours purement locale (registry en mémoire), quelle que soit la config. |
| 9.2 | Code mort | `esm-tenant-routing-app/src/guard/subdomain-utils.ts` | `buildTenantSubdomainUrl()` est exportée mais n'a aucun appelant dans le monorepo. |
| 9.3 | Dépendance fantôme | `esm-app-shell/package.json` | `run.ts` importe directement `@egen/esm-tenant` (`setupTenantSystem`, `registerTenantThemeApplier`), mais le package n'apparaît dans aucune section du `package.json` du shell (`dependencies`/`peerDependencies`/`devDependencies`). Ne fonctionne aujourd'hui que grâce au hoisting du workspace — fragile, et à corriger de toute façon en même temps que le point §4 (Module Federation). |
| 9.4 | Types non ré-exportés | `esm-tenant/src/index.ts` | `TenantResolutionStrategy`, `TenantPathConfig`, `TenantJwtConfig` sont définis dans `types.ts` mais absents du barrel public — un consommateur ne peut pas typer explicitement `const order: TenantResolutionStrategy[] = [...]` sans un import profond dans les internes du package. |
| 9.5 | `VITE_ROOT_DOMAIN` mort | `.env.development` | Variable déclarée dans l'env mais jamais lue par aucun code (`esm-tenant-routing-app` attend `rootDomain` via le système de config EGEN, pas via une variable d'environnement). |
| 9.6 | Ambiguïté ID/slug mineure | `esm-tenant/src/context/registry.ts` — `getTenantById()` | Recherche d'abord par ID exact, puis par `slug` sur l'ensemble du registre : si le `slug` d'un tenant B est identique à l'`id` d'un tenant A, le comportement dépend de l'ordre d'itération de la `Map`. Cas limite, mais à valider si les tenants sont un jour créés dynamiquement par des utilisateurs. |
| 9.7 | État figé après suppression d'un tenant | `esm-tenant/src/setup.ts` — `reloadTenantRegistry()` | Si le tenant actif disparaît d'un registry rechargé, la fonction ne fait rien (`if (refreshed) ...`) : le store garde silencieusement l'ancien tenant actif au lieu de transitionner vers un état d'erreur explicite. |

---

## 10. Pourquoi ces bugs n'ont pas été détectés par les tests existants

Les trois fichiers de test (`registry.test.ts`, `resolver.test.ts`, `setup.test.ts`, 45 tests au total) couvrent bien la logique **unitaire et isolée** de chaque module (résolution d'une stratégie donnée, fusion registry statique/distante, transitions de `status`). Mais :

- Aucun test n'assert sur `activeTenant` dans le cas suspendu (§5.f) — c'est directement ce qui a laissé passer le bug le plus visible.
- Aucun test n'existe pour `app-config.ts` en intégration avec un guard réel (seulement, implicitement, en isolation — la fonction `checkAppTenantRequirements` elle-même n'a pas de fichier de test dédié trouvé dans `__tests__/`).
- Aucun test n'exerce le chemin `resolveConfigFromEnv()` dans un contexte de build rspack réel (les tests tournent sous Vitest, qui **fournit** un véritable `import.meta.env`, ce qui masque complètement le problème documenté au §3 — le test unitaire « voit » un comportement qui n'existe pas dans le build de production réel).
- Il n'existe aucun test d'intégration Module Federation multi-conteneurs (ce qui est normal — ce type de test est coûteux à mettre en place — mais cela signifie que le risque du §4 n'a jamais pu être détecté automatiquement).

---

## 11. Tableau récapitulatif

| Sévérité | # | Constat | Statut de la preuve |
|---|---|---|---|
| 🔴 Critique | 1 | Système tenant inerte par défaut (env vars non branchées, ni Vite ni pont `window`) | Prouvé statiquement, à 100% |
| 🔴 Critique | 2 | Risque de store dupliqué via Module Federation (shell exclu du shared scope) | Prouvé statiquement ; effet runtime à confirmer |
| 🟠 Élevé | 3 | Suspension d'un tenant → `activeTenant` jamais peuplé → page suspendue casse | Prouvé de bout en bout, y compris via le test existant incomplet |
| 🟠 Élevé | 4 | Permissions fines par app (`AppTenantConfig`, `TenantGuard`) jamais câblées | Prouvé statiquement, 0 usage externe confirmé |
| 🟡 Moyen | 5 | Duplication `esm-tenant`/`esm-api`, API canonique 100% inutilisée | Prouvé statiquement |
| 🟡 Moyen | 6 | Résolveur : un résultat non-existant arrête la chaîne de priorité | Prouvé statiquement |
| 🟡 Moyen | 7 | Stratégie « header » trompeuse (ne lit jamais un header HTTP réel) | Prouvé statiquement |
| 🟡 Moyen | 8 | Triple implémentation de l'inférence de domaine racine, incohérente | Prouvé statiquement |
| 🟡 Moyen | 9 | Chevauchement de routes → double montage probable de `/tenant-suspended` | Prouvé statiquement ; rendu double à confirmer visuellement |
| 🟢 Faible | 10-16 | Config/fonctions mortes, dépendance fantôme, types non exportés, etc. | Voir tableau §9 |

---

## 12. Plan d'action recommandé (par priorité)

1. **Décider si le système tenant doit être activé prochainement.** Si oui, corriger le §3 en premier (pont `window.egenTenant*`, sur le modèle exact de `egenAiConfigDef`) — sans ça, aucun des autres bugs ne peut même être observé en conditions réelles.
2. **Corriger le §4** avant toute mise en production multi-tenant (`dependencies.json` du shell) et valider en runtime que le store est bien unique à travers shell + remotes.
3. **Corriger le §5** (`activateTenant` / suspension) — fix localisé et à faible risque, avec un test de non-régression déjà à moitié écrit (`setup.test.ts` existe, il manque une assertion).
4. **Trancher sur le §6** (permissions par app) : l'implémenter réellement partout où c'est pertinent, ou le retirer/déprécier explicitement pour ne pas laisser un faux sentiment de sécurité côté permissions frontend — décision d'autant plus importante que c'est précisément la brique attendue pour la gestion fine des permissions du futur frontend EGEN/CIVITAS-Acquisition.
5. Les points §7 à §9 peuvent être traités ensuite, par ordre de simplicité (le §9.2/9.3/9.4 sont des correctifs triviaux d'une ligne).

---

## 13. Fichiers analysés (référence)

**Package `@egen/esm-tenant`** (2080 lignes) : `types.ts`, `config/app-config.ts`, `config/env.ts`, `context/registry.ts`, `context/resolver.ts`, `context/store.ts`, `hooks/TenantProvider.tsx`, `hooks/useTenant.ts`, `setup.ts`, `utils/tenant-utils.ts`, `index.ts`, ainsi que les 3 fichiers `__tests__/*.test.ts`.

**Package `@egen/esm-tenant-routing-app`** : `config-schema.ts`, `guard/subdomain-utils.ts`, `guard/tenant-routing-guard.tsx`, `guard/use-tenant-routing.ts`, `index.ts`, `root.component.tsx`, `routes.json`, `screens/suspended.component.tsx`.

**Consommateurs** : `esm-app-shell/src/run.ts`, `esm-app-shell/src/index.ejs`, `esm-app-shell/rspack.config.js`, `esm-app-shell/dependencies.json`, `esm-framework/src/index.ts`, `esm-react-utils/src/{index,public}.ts`, `esm-api/src/tenant.ts`, `esm-api/src/egen-fetch.ts`, `esm-login-app/src/login/login.component.tsx`, `esm-primary-navigation-app/.../topbar.component.tsx`, `esm-primary-navigation-app/.../context-switcher.component.tsx`.

**Build & environnement** : `packages/tooling/rspack-config/src/index.ts`, `.env.development` (racine), `packages/shell/esm-app-shell/public/tenants/registry.json`.

**Méthode de vérification des usages** : recherche exhaustive (`grep -rn`) de chaque export public du package sur l'ensemble du monorepo (hors `node_modules`), en excluant les faux positifs de commentaires/JSDoc pour ne compter que les imports réels (`from '@egen/esm-tenant'`).
