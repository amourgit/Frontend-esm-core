:wave: New to our project? Be sure to review the [Egen 3 Frontend Developer Documentation](https://egen.atlassian.net/wiki/x/IABBHg). You may find the [Introduction](https://egen.atlassian.net/wiki/x/94ABCQ) especially helpful.

> **Séparation Framework / Core :** depuis la restructuration, ce dépôt (`Frontend-esm-core`) ne contient plus que le code spécifique à l'application ESM Core (les frontend modules sous `packages/apps/*`). Tout le code générique et réutilisable (`@egen-civitas/esm-*`, l'app shell, le CLI `egen`) vit désormais dans le dépôt séparé [`Frontend-esm-framework`](https://github.com/amourgit/Frontend-esm-framework), publié sur npm sous le scope `@egen-civitas` et consommé ici comme une vraie dépendance externe versionnée (voir `docs/analyse-separation-framework.md` pour l'historique de la migration).

Below is the documentation for this repository.

# ESM Core

This repository contains the application-specific frontend modules for ESM Core. It consumes [`Frontend-esm-framework`](https://github.com/amourgit/Frontend-esm-framework) — the app shell, the `egen` CLI, and all the `@egen-civitas/esm-*` framework packages (configuration, extension system, state management, styleguide, etc.) — as an external dependency rather than embedding that code here.

## Available Packages

### Frontend modules

A set of frontend modules provides the core technical functionality of the application.

- [@egen/esm-devtools-app](packages/apps/esm-devtools-app)
- [@egen/esm-help-menu-app](packages/apps/esm-help-menu-app)
- [@egen/esm-implementer-tools-app](packages/apps/esm-implementer-tools-app)
- [@egen/esm-login-app](packages/apps/esm-login-app)
- [@egen/esm-primary-navigation-app](packages/apps/esm-primary-navigation-app)
- [@egen/esm-offline-tools-app](packages/apps/esm-offline-tools-app)

## Development

### Getting Started

To set up the repository for development, run the following commands:

```sh
yarn
yarn setup
```

> **Note:** If `yarn setup` fails or causes system resource issues, use this alternative instead:
>
> ```sh
> yarn build --concurrency 1
> ```
>
> Both commands build all the packages — once either completes successfully, you can proceed to [running the app shell and the framework](#running-the-app-shell-and-the-framework).

### Building

To build all packages in the repository, run the following command:

```sh
yarn build
```

You can also verify all packages in one step using `yarn`:

```sh
yarn verify
```

### Running the app shell and the framework

```sh
yarn run:shell
```

`run:shell` runs only the shell and the framework (not the frontend modules).

### Running the frontend modules in `apps`

```sh
yarn start --sources packages/apps/<app folder>
```

For example, to run the Login app, run:

```sh
yarn start --sources packages/apps/esm-login-app
```

This will spin up a development server with hot module reloading so any changes you make to the code in the app will be reflected automatically in the browser.

### Running the tooling

The `egen` CLI is defined in `Frontend-esm-framework` (`packages/tooling/egen`) but installed here as a regular devDependency (`@egen-civitas/egen`). Just run it directly:

```sh
yarn run:egen --help
```

### Running tests

#### Unit tests

To run tests for all packages, run:

```bash
yarn turbo run test
```

To run tests in `watch` mode, run:

```bash
yarn turbo run test:watch
```

To run tests for a specific package, pass the package name to the `--filter` flag. For example:

```bash
yarn turbo run test --filter="@egen-civitas/esm-styleguide"
```

To run a specific test file, run:

```bash
yarn turbo run test -- login
```

This command runs tests only in files whose names match the provided string.

You can also run those matching tests in watch mode by running:

```bash
yarn turbo run test:watch -- login.test
```

To generate a `coverage` report, run:

```bash
yarn turbo run coverage
```

By default, `turbo` will cache test runs. This means that re-running tests without changing any of the related files will return the cached logs from the last run. To bypass the cache, run tests with the `force` flag, as follows:

```bash
yarn turbo run test --force
```

#### Running End-to-End (E2E) tests

E2E tests run against a complete Egen stack in Docker containers. The test runner handles everything automatically: building the frontend, starting containers, running tests, and cleanup.

**Prerequisites:**

Install Playwright browsers before your first run:

```bash
npx playwright install
```

**Running E2E tests:**

```bash
yarn test-e2e
```

This single command will:
1. Build the frontend with your local changes
2. Start Docker containers (backend, database, gateway, frontend)
3. Wait for the backend to be ready
4. Run all E2E tests in headless mode
5. Automatically stop and remove containers when done

**Common options:**

```bash
# Run tests with browser visible
yarn test-e2e -- --headed

# Run tests in Playwright's interactive UI mode
yarn test-e2e -- --ui

# Run a specific test file
yarn test-e2e -- login.spec.ts

# Keep containers running on test failure (for debugging)
yarn test-e2e --keep-on-failure

# CLI-friendly output (no browser popup, useful for LLM tools)
yarn test-e2e --list
```

**Running tests on multiple branches:**

You can run E2E tests on different branches simultaneously in separate terminal windows. Each run automatically uses a unique port and container names based on your git branch, so there's no interference between concurrent test runs.

**Testing against a remote instance:**

To test against a remote instance instead of Docker containers, set the `E2E_BASE_URL` environment variable:

```bash
E2E_BASE_URL=https://dev.egen.alpha.vercel.com/egen yarn playwright test
```

Note: When testing against a remote instance, use `yarn playwright test` directly (not `yarn test-e2e`) since you don't need the Docker environment.

Read the [e2e testing guide](https://egen.atlassian.net/wiki/spaces/docs/pages/150962731/Testing+Frontend+Modules+O3) to learn more about End-to-End tests in this project.

### Linking the framework

`Frontend-esm-framework` is now consumed as a regular published npm dependency (`@egen-civitas/*`, real semver ranges) — no more relative workspace path to a sibling clone. Day-to-day, `yarn install` here just pulls the published packages like any other dependency.

To test a not-yet-published change to a framework package against this repo, use `yarn link` (or `yalc` if `yarn link` gives you trouble):

1. In `Frontend-esm-framework`, build the package you're changing (`yarn turbo run build --filter=@egen-civitas/<package-name>`), then `yarn link` inside that package's directory.
2. Back in this repo, `yarn link @egen-civitas/<package-name>`.
3. Restart your dev server (`yarn start`) — it now resolves that package from your local framework checkout instead of the published version.
4. **Undo the link before opening a PR** (`yarn unlink @egen-civitas/<package-name>` in this repo, then reinstall) — a linked local path must never end up in a committed lockfile.

If you're unsure whether your linked version is actually being used, add a `console.log` at the top level of a file you're working on and check whether it prints.

### Version and release, and framework API documentation

Versioning, releasing, and publishing `@egen-civitas/*` packages (and generating their TypeDoc API documentation) is no longer done from this repository — that process now lives in [`Frontend-esm-framework`](https://github.com/amourgit/Frontend-esm-framework), since that's where those packages are actually defined. See that repository's own README for the current process.

> **⚠️ `.github/workflows/docs-build.yml` (and the other `docs-*.yml` workflows) need attention.** They run `yarn turbo run document`, which builds `esm-framework`'s TypeDoc output at `packages/framework/esm-framework/docs/` — a path that only ever existed here through the now-removed relative workspace link. `core`'s own `packages/` has never contained a literal `framework/` directory, so this pipeline could not have produced real output even before this change. It should be moved to live in `Frontend-esm-framework` (where the source now canonically resides) rather than patched in place — not done as part of this fix given how security-sensitive that workflow is (PR-triggered code execution, attack-file gating, artifact validation). Flagged here rather than silently left for someone to discover via a failed CI run.

This repo's own `package.json` is `"private": true` and isn't published; it's versioned and deployed independently of the framework.

## Design Patterns

For documentation about our design patterns, please visit our [design system documentation website](https://egen.alpha.vercel.com/design-system).

## Bumping Playwright

Be sure to update the Playwright version in the [Bamboo Playwright Docker image](e2e/support/bamboo/playwright.Dockerfile) whenever making version changes.
Also, ensure you specify fixed (pinned) versions of Playwright in the `package.json` file to maintain consistency between the Playwright version used in the Docker image for Bamboo test execution and the version used in the codebase.

---

## Système Multi-Tenant (`@egen-civitas/esm-tenant`)

> `esm-tenant` lui-même est un package du Framework (`Frontend-esm-framework/packages/framework/esm-tenant`) — cette section reste ici car elle documente comment les apps de **ce** dépôt le consomment et le configurent, pas son implémentation.

EGEN intègre un système de gestion des tenants **configurable et non-intrusif**. Il est **désactivé par défaut** (`mode: "off"`) — les projets qui n'en ont pas besoin n'ont rien à faire et ne subissent aucun overhead.

### Philosophie

Le système est conçu pour être la **base de tout projet spécialisé** développé à partir d'EGEN. Qu'il s'agisse d'une plateforme éducative, d'un ERP, d'un portail santé ou d'un SaaS multi-organisation, le mécanisme tenant est le même. Seule la configuration change.

```
                     ┌──────────────────────────────────────┐
                     │         EGEN (ce dépôt)             │
                     │  framework agnostique + esm-tenant   │
                     └──────────────────┬───────────────────┘
                                        │ base pour
              ┌─────────────────────────┼──────────────────────┐
              ▼                         ▼                      ▼
     Projet Académique          Projet ERP              Projet Santé
  (mode: "single",            (mode: "multi",         (mode: "off",
   tenant: "univ-omar-bongo")  tenants par org)        pas de tenant)
```

### Les trois modes

| Mode | Description | Quand l'utiliser |
|------|-------------|-----------------|
| `"off"` | Système désactivé **(défaut)** | Projet mono-organisation sans besoin de tenant |
| `"single"` | Un seul tenant fixe | Déploiement dédié à une organisation, branding spécifique |
| `"multi"` | Plusieurs tenants, résolution dynamique | SaaS, portail multi-organisations, plateforme nationale |

### Niveaux de configuration

Le système tenant est configurable à **trois niveaux**, par ordre de priorité décroissante :

#### Niveau 1 — Programmatique dans `run.ts` (priorité maximale)

C'est le point d'entrée principal. La configuration passée ici écrase tout le reste.

```ts
// packages/shell/esm-app-shell/src/run.ts
import { setupTenantSystem, registerTenantThemeApplier } from '@egen-civitas/esm-tenant';
import { applyAppThemeOverride } from '@egen-civitas/esm-theme';

// Optionnel : brancher le thème tenant sur le moteur de thème EGEN
registerTenantThemeApplier(async (tenantId, schema, themeUrl) => {
  if (schema) applyAppThemeOverride(`tenant-${tenantId}`, schema, { priority: 10 });
});

// Mode single — tenant unique fixe, chargé depuis une URL JSON
await setupTenantSystem({
  mode: 'single',
  defaultTenantId: 'civitas',
  registryUrl: '/public/tenants/registry.json',
  applyTheme: true,
});

// Mode multi — résolution depuis le sous-domaine ou le JWT
await setupTenantSystem({
  mode: 'multi',
  registryUrl: '/api/tenants',
  resolutionOrder: ['subdomain', 'jwt', 'localStorage'],
  jwtConfig: { claim: 'org' },
  onTenantActivated: (tenant) => console.info('Tenant activé :', tenant.name),
  onError: (err) => console.error('Erreur tenant :', err),
});

// Désactivé — zero code, zero overhead
await setupTenantSystem({ mode: 'off' });
// ou simplement ne pas appeler setupTenantSystem() du tout
```

#### Niveau 2 — Variables d'environnement build-time (`VITE_TENANT_*`)

Configurez dans `.env`, `.env.production`, `.env.staging`, etc. :

```ini
# Mode
VITE_TENANT_MODE=multi

# Tenant par défaut / unique
VITE_TENANT_ID=civitas

# Registry distante
VITE_TENANT_REGISTRY_URL=/public/tenants/registry.json

# Ordre de résolution (CSV)
VITE_TENANT_RESOLUTION_ORDER=subdomain,jwt,localStorage,static

# Stratégie "path" : /t/acme/dashboard → tenant "acme"
VITE_TENANT_PATH_PREFIX=/t/

# Claim JWT portant l'ID tenant
VITE_TENANT_JWT_CLAIM=tenantId

# Thème automatique
VITE_TENANT_THEME_APPLY=true

# Persistance localStorage
VITE_TENANT_PERSIST=true
```

Ces variables sont lues par `resolveConfigFromEnv()` au boot et fusionnées avec les options de `setupTenantSystem()`. **Les options programmatiques sont toujours prioritaires.**

#### Niveau 3 — Injection runtime via `window.*` (priorité sur les env vars)

Le serveur peut injecter ces variables dans `index.html` sans rebuild. Utile pour les déploiements dynamiques (Docker, Kubernetes, CDN multi-tenant) :

```html
<!-- index.html — injecté par le serveur -->
<script>
  window.egenTenantMode = 'multi';
  window.egenTenantId = 'acme';
  window.egenTenantRegistryUrl = '/api/tenants';
  window.egenTenantApplyTheme = 'true';
  window.egenTenantPersist = 'true';
  window.egenTenantResolutionOrder = 'subdomain,jwt,localStorage';
  window.egenTenantPathPrefix = '/t/';
  window.egenTenantJwtClaim = 'tenantId';
</script>
```

#### Niveau 4 — Configuration par application (décentralisée)

Chaque microfrontend peut déclarer ses propres exigences tenant sans toucher à la config globale :

```ts
// Dans le run.ts ou l'entrypoint de votre app
import { registerAppTenantConfig } from '@egen-civitas/esm-framework';

registerAppTenantConfig('@egen/esm-academique-app', {
  requiredApp: 'egen-academique',          // Doit être dans tenant.allowedApps
  requiredPermissions: ['manage-students'], // Doit être dans tenant.permissions
  requiredFeatureFlags: ['module-notes'],   // Doit être dans tenant.featureFlags
  allowInSingleMode: true,                  // Accès libre en mode "single"
  onTenantChange: (tenant) => {
    // Rechargement des données quand le tenant change
    queryClient.invalidateQueries(['students']);
  },
});
```

### Définition des tenants

Un tenant est défini par `TenantDefinition`. Seuls `id` et `name` sont obligatoires :

```ts
// Exemple minimal
{ id: 'civitas', name: 'CIVITAS' }

// Exemple complet
{
  id: 'univ-omar-bongo',
  name: 'Université Omar Bongo',
  slug: 'uob',                          // Alias URL (si différent de id)
  domains: ['uob.egen.ga', 'uob'],     // Pour la résolution par sous-domaine
  locale: 'fr-GA',
  timezone: 'Africa/Libreville',
  apiBaseUrl: 'https://api.uob.egen.ga', // Backend dédié
  themeUrl: '/themes/uob.json',           // Thème JSON (chargé par esm-theme)
  themeOverride: {                        // Surcharge inline (prioritaire sur themeUrl)
    colors: { primary: '#003087' }
  },
  importMapUrls: ['/uob/importmap.json'], // MFEs spécifiques à ce tenant
  featureFlags: {
    'module-notes': true,
    'module-bibliotheque': false,
  },
  allowedApps: [                          // Apps autorisées pour ce tenant
    '@egen/esm-academique-app',
    '@egen/esm-notes-app',
  ],
  permissions: {
    'manage-students': true,
    'manage-finances': ['admin', 'daf'],  // Limité à certains rôles
    'export-data': false,
  },
  meta: {
    logoUrl: '/assets/logos/uob.svg',
    primaryColor: '#003087',
    plan: 'premium',
  },
  active: true,
  suspended: false,
}
```

La registry peut être fournie de deux façons (ou les deux, fusionnées) :
- **`staticTenants`** : tableau inline dans `setupTenantSystem()`
- **`registryUrl`** : URL d'un fichier JSON `TenantDefinition[]` chargé au boot

### Stratégies de résolution

En mode `"multi"`, EGEN essaie les stratégies dans l'ordre configuré jusqu'à trouver un tenant valide :

| Stratégie | Source | Exemple |
|-----------|--------|---------|
| `subdomain` | `window.location.hostname` | `acme.app.com` → `"acme"` |
| `path` | `window.location.pathname` | `/t/acme/dashboard` → `"acme"` |
| `query` | `window.location.search` | `?tenant=acme` → `"acme"` |
| `jwt` | Claim JWT de session | `token.tenantId = "acme"` |
| `header` | Header `X-Tenant-ID` (stocké au login) | Propagé par le backend |
| `localStorage` | `localStorage['egen:tenant:active']` | Survie aux rechargements |
| `static` | `window.egenTenantId` / `VITE_TENANT_ID` | Config fixe |
| `first` | Premier tenant de la registry | Fallback ultime |

### API — Hooks React

Disponibles via `@egen-civitas/esm-framework` (ou `@egen-civitas/esm-react-utils`) :

```tsx
import {
  useTenant,            // TenantDefinition | null — tenant actif
  useTenantMode,        // "off" | "single" | "multi"
  useTenantStatus,      // "idle" | "loading" | "active" | "error" | "suspended"
  useAvailableTenants,  // TenantDefinition[] — tous les tenants
  useIsMultiTenant,     // boolean
  useSwitchTenant,      // { switchTo(id), switching }
  useTenantAccess,      // { allowed, reason, tenant }
  useTenantFeatureFlag, // boolean
  useTenantPermission,  // boolean | string[] | undefined
  useTenantMeta,        // T | undefined
  useTenantLocale,      // string | undefined — ex: "fr-GA"
  useTenantTimezone,    // string | undefined — ex: "Africa/Libreville"
  useTenantApiBaseUrl,  // string | undefined
  useTenantIsSuspended, // { suspended, message }
} from '@egen-civitas/esm-framework';
```

### API — Services (non-React)

```ts
import {
  getCurrentTenant,      // TenantDefinition | null
  getCurrentTenantId,    // string | undefined
  getTenantApiBaseUrl,   // string | undefined
  getTenantHeaders,      // Record<string,string> — { 'X-Tenant-ID': '...' }
  fetchWithTenant,       // fetch() avec X-Tenant-ID auto-injecté
  tenantHasFeatureFlag,  // (flag: string) => boolean
  tenantHasPermission,   // (key: string) => boolean
  onTenantChange,        // (cb) => unsubscribe — réagir aux changements hors React
  buildTenantUrl,        // ('/dashboard') => '/t/acme/dashboard'
  isTenantSystemActive,  // boolean
  isMultiTenantMode,     // boolean
} from '@egen-civitas/esm-framework';

// Via @egen-civitas/esm-api (sans dépendance React, utilisable dans egenFetch) :
import { getTenantId, tenantHeaders, getTenantApiBase } from '@egen-civitas/esm-api';
```

> **Note :** `egenFetch` injecte automatiquement le header `X-Tenant-ID` à chaque requête quand un tenant est actif. Vous n'avez rien à faire.

### Composants React

```tsx
import {
  TenantProvider,           // Context Provider (optionnel si useStore suffit)
  TenantGuard,              // Protège un sous-arbre selon les droits tenant
  TenantRequired,           // S'assure qu'un tenant est résolu avant de rendre
  TenantSuspendedBoundary,  // Écran de maintenance si tenant.suspended = true
  TenantSelector,           // Sélecteur headless (mode "multi")
} from '@egen-civitas/esm-framework';

// Exemple : protéger une app
function AcademiqueRoot() {
  return (
    <TenantSuspendedBoundary fallback={(msg) => <MaintenancePage message={msg} />}>
      <TenantGuard
        appName="@egen/esm-academique-app"
        permission="manage-students"
        fallback={<AccessDenied />}
        loadingFallback={<Spinner />}
      >
        <AcademiqueApp />
      </TenantGuard>
    </TenantSuspendedBoundary>
  );
}

// Exemple : sélecteur de tenant
function TenantSwitcher() {
  return (
    <TenantSelector
      render={({ tenants, activeTenant, switchTo, switching }) => (
        <select
          value={activeTenant?.id ?? ''}
          onChange={(e) => switchTo(e.target.value)}
          disabled={switching}
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      )}
    />
  );
}
```

### Accès direct au store

Pour les intégrations avancées (DevTools, tests, monitoring) :

```ts
import { tenantStore } from '@egen-civitas/esm-tenant';
import { useStore } from '@egen-civitas/esm-react-utils';

// Dans un composant React
const { activeTenant, mode, availableTenants, status, error } = useStore(tenantStore);

// Hors React — abonnement manuel
const unsubscribe = tenantStore.subscribe((state) => {
  console.log('Tenant changed:', state.activeTenant?.id);
});
```

### Module Federation — configuration requise

Pour que le store soit un singleton partagé entre tous les microfrontends, ajoutez dans chaque `webpack.config.js` ou `vite.config.ts` :

```js
// webpack.config.js
shared: {
  '@egen-civitas/esm-tenant': { singleton: true, eager: true },
  '@egen-civitas/esm-state':  { singleton: true, eager: true },
}
```

### Événements DOM

Le système émet des événements `CustomEvent` sur `window` lors des transitions :

| Événement | Payload | Quand |
|-----------|---------|-------|
| `esm:tenant-activated` | `{ tenant, previousTenantId }` | Premier tenant résolu au boot |
| `esm:tenant-changed` | `{ from, to }` | Changement de tenant via `switchTenant()` |

```ts
window.addEventListener('esm:tenant-activated', (e: CustomEvent) => {
  const { tenant } = e.detail;
  analytics.identify(tenant.id);
});
```

### Checklist d'intégration pour un projet dérivé

- [ ] Copier `.env.example` → `.env` et configurer `VITE_TENANT_MODE`
- [ ] Appeler `setupTenantSystem()` dans `run.ts` avec la config souhaitée
- [ ] Si thème par tenant : appeler `registerTenantThemeApplier()` avant `setupTenantSystem()`
- [ ] Définir les tenants (soit `staticTenants`, soit `registryUrl`)
- [ ] Ajouter `@egen-civitas/esm-tenant: { singleton: true }` dans la config Module Federation
- [ ] Optionnel : appeler `registerAppTenantConfig()` dans chaque app qui a des exigences spécifiques
- [ ] Optionnel : utiliser `<TenantGuard>` pour protéger les routes sensibles
