:wave: New to our project? Be sure to review the [Egen 3 Frontend Developer Documentation](https://egen.atlassian.net/wiki/x/IABBHg). You may find the [Introduction](https://egen.atlassian.net/wiki/x/94ABCQ) especially helpful.

Also see the [API documentation](./packages/framework/esm-framework/docs/API.md) for `@egen/esm-framework`, which is contained in this repository.

![Egen CI](https://github.com/egen/egen-esm-core/workflows/Egen%20CI/badge.svg)
![Check documentation](https://github.com/egen/egen-esm-core/actions/workflows/docs.yml/badge.svg)

Below is the documentation for this repository.

# O3 Frontend Core

This is a [monorepo](https://yarnpkg.com/advanced/lexicon#monorepo) containing the core packages for the O3 frontend. These packages handle cross-cutting concerns such as the configuration and extension systems, the core framework, global state management, the styleguide, and more.

## Available Packages

### Application

This contains tooling and the app shell.

- [egen](packages/tooling/egen)
- [@egen/esm-app-shell](packages/shell/esm-app-shell)

### Framework

The following common libraries have been developed. They may also be used independently of the app shell.

- [@egen/esm-api](packages/framework/esm-api): helps make API calls to the backend
- [@egen/esm-config](packages/framework/esm-config): validation and storage of frontend configuration
- [@egen/esm-context](packages/framework/esm-context): provides the AppContext for sharing contextual state across the app
- [@egen/esm-dynamic-loading](packages/framework/esm-dynamic-loading): provides functionality for dynamically loading frontend modules using Webpack Module Federation dynamic remotes
- [@egen/esm-error-handling](packages/framework/esm-error-handling): handles errors
- [@egen/esm-expression-evaluator](packages/framework/esm-expression-evaluator): provides functions that allow evaluation of user-defined expressions in a safer way than eval()
- [@egen/esm-extensions](packages/framework/esm-extensions): implementation of a frontend component extension system
- [@egen/esm-feature-flags](packages/framework/esm-feature-flags): hide features that are in progress
- [@egen/esm-globals](packages/framework/esm-globals): useful global variables and types
- [@egen/esm-navigation](packages/framework/esm-navigation): navigation utilities, breadcrumbs, and history
- [@egen/esm-offline](packages/framework/esm-offline): provides offline functionality
- [@egen/esm-react-utils](packages/framework/esm-react-utils): utilities for React components
- [@egen/esm-routes](packages/framework/esm-routes): provides helper functions for working with `routes.json` files in O3
- [@egen/esm-state](packages/framework/esm-state): brings in state management
- [@egen/esm-styleguide](packages/framework/esm-styleguide): styling and UI capabilities
- [@egen/esm-translations](packages/framework/esm-translations): common translations and utilities
- [@egen/esm-utils](packages/framework/esm-utils): general utility and helper functions

All libraries are aggregated in the `@egen/esm-framework` package:

- [@egen/esm-framework](packages/framework/esm-framework)

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

```sh
cd packages/tooling/egen
yarn build
./dist/cli.js
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
yarn turbo run test --filter="@egen/esm-styleguide"
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

You probably want to try out your changes to a framework library in a frontend module. Unfortunately, getting a working development environment for this is very finicky; no one technique works for all frontend modules all the time.

Note that even though frontend modules import from `@egen/esm-framework`, the package you need to link is the sub-library; for example, if you are trying to test changes in `packages/framework/esm-api`, you will need to link that sub-library.

If you're unsure whether your version of a core package is running, add a `console.log` at the top level of a file you're working on.

Here are the tools at your disposal for trying to get this to work:

#### Yarn link

This should be the first thing you try. To link the styleguide, for example, you would use

```sh
yarn link ../path/to/egen-esm-core/packages/framework/esm-styleguide
```

This will add a line to the "resolutions" section of the `package.json` file which uses the `portal:` protocol. The other protocol is `link:`. If you need to make changes to the `esm-framework` package, you will need to link it in as well. However, linking `@egen/esm-framework` as a portal created by `yarn link` will not work; instead manually add the line to the `resolutions` field in the `package.json` file:

```json
"resolutions": {
  "@egen/esm-framework": "link:../path/to/egen-esm-core/packages/framework/esm-framework"
}
```

#### Yalc

Sometimes, the build tooling will simply not work with `yarn link`. In this case, you will need to use `yalc`.
Install `yalc` on your computer with:

```sh
npm install -g yalc
```

Then, link the repository you are working on. For `esm-api`, for example, run:

```sh
# In this repository
cd packages/framework/esm-api
yalc publish
cd ../../../egen-esm-patient-chart  # for example
yalc link @egen/esm-api
```

In order for Patient Chart to receive further updates you make to esm-api, you will need to run `yalc push` in the esm-api directory and `yalc update` in the Patient Chart directory.

### Running with a local version of the core packages

After linking the packages (using `yarn link` or `yalc`), the build tooling is satisfied, but you must do one more step to get the frontend to load these dependencies at runtime.

Here, there are two options:

#### Method 1: Using the frontend dev server

In order to get your local version of the core packages to be served in your local dev server, you will need to link the tooling as well.

```sh
yarn link /path/to/esm-core/packages/tooling/egen
```

You can try using `yalc` for this as well, if `yarn link` doesn't work. Or manually create a `link:` resolution in `package.json`.
In `packages/shell/esm-app-shell`, run:

```sh
yarn build:development --watch
```

to ensure the built app shell is updated with your changes and available to Patient Chart. Then run your Patient Chart dev server as usual, with `yarn start`.

#### Method 2: Using import map overrides

In this repository, start the app shell with `yarn run:shell`. Then, in the Patient Chart repository, `cd` into whatever package(s) you are working on and run `yarn serve` from there. Then use the import map override tool in the browser to tell the frontend to load your local Patient Chart packages.

#### Once it's working

Please note that any of these techniques will modify the `package.json` file. These changes must be undone before creating your PR. If you used `yarn link`, you can undo these changes by running:

```sh
yarn unlink --all
```

in the Patient Chart repo.

### Version and release

We use Yarn [workspaces](https://yarnpkg.com/features/workspaces) to handle versioning in this monorepo.

To increment the version, run the following command:

```sh
yarn release [version]
```

Where version corresponds to:

- `patch` for bug fixes e.g., `3.2.0` → `3.2.1`
- `minor` for new features that are backwards-compatible e.g., `3.2.0` → `3.3.0`
- `major` for breaking changes e.g., `3.2.0` → `4.0.0`

Note that this command will not create a new tag, nor publish the packages. After running it, make a PR or merge to `main` with the resulting changeset. Note that the release commit message must resemble `(chore) Release vx.x.x` where `x.x.x` is the new version number prefixed with `v`. This is to avoid triggering a pre-release build when effecting a version bump.

Once the version bump commit is merged, go to GitHub and [draft a new release](https://github.com/egen/egen-esm-core/releases/new).

The tag should be prefixed with `v` (e.g., `v3.2.1`), while the release title should just be the version number (e.g., `3.2.1`). The creation of the GitHub release will cause GitHub Actions to publish the packages, completing the release process.

> Don't run `npm publish`, `yarn publish`, or `lerna publish`. Use the above process.

### Important Notes About Version Updates

When releasing a new major version (e.g., moving from v6 to v7), you must:

1. Update all peerDependencies that reference `@egen/` packages in every package that depends on them.
2. Change the version notation from the current major version to the new one (e.g., from `6.x` to `7.x`).

Example:

```jsonc
// Before (during v6)
"peerDependencies": {
  "@egen/esm-config": "6.x",
  "@egen/esm-utils": "6.x"
}

// After (for v7)
"peerDependencies": {
  "@egen/esm-config": "7.x",
  "@egen/esm-utils": "7.x"
}
```

This ensures that all packages use compatible versions and breaking changes are properly tracked.

## Design Patterns

For documentation about our design patterns, please visit our [design system documentation website](https://egen.alpha.vercel.com/design-system).

## Bumping Playwright

Be sure to update the Playwright version in the [Bamboo Playwright Docker image](e2e/support/bamboo/playwright.Dockerfile) whenever making version changes.
Also, ensure you specify fixed (pinned) versions of Playwright in the `package.json` file to maintain consistency between the Playwright version used in the Docker image for Bamboo test execution and the version used in the codebase.

## Documentation

The API documentation for `@egen/esm-framework` (under `packages/framework/esm-framework/docs/`) is generated by [TypeDoc](https://typedoc.org/) from the framework source. It's regenerated automatically by CI once a PR with framework changes has been approved — the bot pushes a `(chore) Add docs` commit back to the PR branch, so you don't need to run TypeDoc before submitting.

To preview locally:

```sh
yarn document
```

If a PR shouldn't update the docs (rare — typically only for reverts or release-version bumps), a maintainer can apply the `skip-docs` label to bypass regeneration.
# Frontend-esm-core

---

## Système Multi-Tenant (`@egen/esm-tenant`)

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
import { setupTenantSystem, registerTenantThemeApplier } from '@egen/esm-tenant';
import { applyAppThemeOverride } from '@egen/esm-theme';

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
import { registerAppTenantConfig } from '@egen/esm-framework';

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

Disponibles via `@egen/esm-framework` (ou `@egen/esm-react-utils`) :

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
} from '@egen/esm-framework';
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
} from '@egen/esm-framework';

// Via @egen/esm-api (sans dépendance React, utilisable dans egenFetch) :
import { getTenantId, tenantHeaders, getTenantApiBase } from '@egen/esm-api';
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
} from '@egen/esm-framework';

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
import { tenantStore } from '@egen/esm-tenant';
import { useStore } from '@egen/esm-react-utils';

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
  '@egen/esm-tenant': { singleton: true, eager: true },
  '@egen/esm-state':  { singleton: true, eager: true },
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
- [ ] Ajouter `@egen/esm-tenant: { singleton: true }` dans la config Module Federation
- [ ] Optionnel : appeler `registerAppTenantConfig()` dans chaque app qui a des exigences spécifiques
- [ ] Optionnel : utiliser `<TenantGuard>` pour protéger les routes sensibles
