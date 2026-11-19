# 10 — Exemples de projets

Statut de chaque exemple :

| Exemple | Statut |
| --- | --- |
| 1. React interne | ✅ **calqué sur `esm-footer-app`** (fichiers réels du Core) ; non compilé pendant l'audit (🟡) |
| 2. React externe | ✅ contrat vérifié dans le code ; **non compilé** (🟡) |
| 3. Vue externe | ⚠️ **non éprouvé** : contrat EGEN vérifié, mais aucun adaptateur Vue n'existe dans EGEN ; les parties marquées **ÉCO** viennent de l'écosystème et doivent être validées par prototype |
| 4. Angular externe | ⚠️ **non éprouvé** (même réserve, risque plus élevé) |

Convention : `slug(name) = name.replace(/[\/\-@]/g, '_')`.

---

## Exemple 1 — App React **interne** au Core

### Arborescence
```
packages/apps/esm-hello-app/
├── package.json
├── rspack.config.js
├── tsconfig.json
├── vitest.config.ts
├── setup-tests.ts
├── translations/
│   └── en.json
└── src/
    ├── index.ts
    ├── constants.ts
    ├── routes.json
    ├── declarations.d.ts
    ├── root.component.tsx
    └── hello-modal.component.tsx
```
Génération du squelette : `python3 tools/scaffold-app.py esm-hello-app "Page de démonstration" "" ""` puis fichiers manuels ci-dessous (04 §6).

### `package.json`
```json
{
  "name": "@egen/esm-hello-app",
  "version": "1.0.0",
  "license": "MPL-2.0",
  "description": "Page de démonstration",
  "browser": "dist/egen-esm-hello-app.js",
  "main": "src/index.ts",
  "source": true,
  "scripts": {
    "start": "egen develop",
    "serve": "rspack serve --mode=development",
    "debug": "npm run serve",
    "test": "cross-env TZ=UTC vitest run --passWithNoTests",
    "build": "rspack --mode=production",
    "build:development": "rspack --mode=development",
    "analyze": "rspack --mode=production --env analyze=true",
    "typescript": "tsc",
    "lint": "eslint src --ext ts,tsx"
  },
  "keywords": ["egen", "microfrontends"],
  "browserslist": ["extends browserslist-config-egen"],
  "publishConfig": { "access": "public" },
  "peerDependencies": {
    "@egen-civitas/esm-framework": ">=4.0.0",
    "@egen-civitas/esm-react-utils": ">=3.0.0",
    "@egen-civitas/esm-config": ">=2.0.0",
    "@egen-civitas/esm-globals": ">=2.0.0",
    "@egen-civitas/esm-state": ">=1.0.3",
    "react": "18.x",
    "react-dom": "18.x",
    "react-i18next": "16.x",
    "react-router-dom": "6.x",
    "rxjs": "7.x",
    "single-spa": "6.x",
    "swr": "2.x"
  },
  "dependencies": {
    "@egen-civitas/esm-framework": "^4.1.0",
    "@egen-civitas/esm-react-utils": "^3.0.1",
    "@egen-civitas/esm-config": "^2.0.0",
    "@egen-civitas/esm-globals": "^2.4.0",
    "@egen-civitas/esm-state": "^1.0.3"
  }
}
```
(Les dev-dépendances `react`, `vitest`, `happy-dom`, `sass`… sont celles des autres apps ; copier `esm-footer-app`.) **Peers = ce qui est partagé ; `dependencies` = installation.**

### `rspack.config.js`
```js
module.exports = require('@egen-civitas/egen/default-rspack-config');
```

### `src/constants.ts`
```ts
// moduleName = name du package.json (voir 04 §3 / 08 E2)
export const moduleName = '@egen/esm-hello-app';
```

### `src/index.ts` (point d'entrée = ce que `./start` expose)
```ts
import { getSyncLifecycle, getAsyncLifecycle } from '@egen-civitas/esm-framework';
import { moduleName } from './constants';
import Root from './root.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = { featureName: 'hello', moduleName };

export const root = getSyncLifecycle(Root, options);
export const helloModal = getAsyncLifecycle(() => import('./hello-modal.component'), options);
```

### `src/root.component.tsx`
```tsx
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { showModal } from '@egen-civitas/esm-framework';

const Root: React.FC = () => (
  <BrowserRouter basename={window.getEgenSpaBase()}>
    <Routes>
      <Route
        path="hello"
        element={<button onClick={() => showModal('hello-modal')}>Bonjour</button>}
      />
    </Routes>
  </BrowserRouter>
);
export default Root;
```

### `src/hello-modal.component.tsx`
```tsx
import React from 'react';
const HelloModal: React.FC = () => <div>Bonjour depuis une modale</div>;
export default HelloModal;
```

### `src/routes.json`
```json
{
  "$schema": "https://egen.alpha.vercel.com/routes.schema.json",
  "pages": [
    { "component": "root", "route": "hello", "online": true, "offline": true }
  ],
  "modals": [
    { "name": "hello-modal", "component": "helloModal" }
  ]
}
```

### Divers
`src/declarations.d.ts` : `declare module '*.scss';` — `translations/en.json` : `{}` — `tsconfig.json`, `vitest.config.ts`, `setup-tests.ts` : identiques à `esm-footer-app` (04 §2).

### Commandes
```bash
yarn install                              # racine du Core
yarn start                                # toutes les apps (egen develop --sources "packages/apps/*")
cd packages/apps/esm-hello-app && yarn start   # cette app seule
yarn test && yarn typescript && yarn lint
yarn build                                # dans l'app
yarn build:prod && yarn start:prod        # production Core (serve-prod.mjs)
```

### Résultat du build (attendu, 🟡)
```
dist/egen-esm-hello-app.js                  # conteneur MF "var" _egen_esm_hello_app
dist/egen-esm-hello-app.js.buildmanifest.json
dist/routes.json                            # + "version" + "frameworkRange": ">=4.0.0"
dist/<chunks>.js                            # chunk de helloModal (import())
```

### Enregistrement
**Aucun** : `serve-prod.mjs` et `egen develop --sources "packages/apps/*"` trouvent le dossier. Condition : `dist/egen-esm-hello-app.js` existe (sinon `SKIP`).

### Cheminement de chargement
1. `serve-prod` → import map `{"@egen/esm-hello-app": "/…/apps/esm-hello-app/egen-esm-hello-app.js"}`, registry `{"@egen/esm-hello-app": {pages…, version}}`.
2. Shell : `setupApps` → `registerApp` → `registerApplication("@egen/esm-hello-app-page-0")`.
3. URL `<spaBase>/hello` : activité vraie → `loadLifeCycles('@egen/esm-hello-app','root')`.
4. `importDynamic` : `<script>` du bundle, `window._egen_esm_hello_app`, `init`, `get('./start')`.
5. `root()` → lifecycle → Single-SPA monte dans `#egen-apps-container`.
6. `showModal('hello-modal')` → parcel monté avec `domElement`.

---

## Exemple 2 — App React **externe** (dépôt indépendant)

### Arborescence
```
esm-acme-hello-app/                 # son propre dépôt
├── package.json
├── rspack.config.js
├── tsconfig.json
├── translations/en.json
└── src/
    ├── index.ts
    ├── root.component.tsx
    └── routes.json
```

### `package.json`
```json
{
  "name": "@acme/esm-hello-app",
  "version": "1.0.0",
  "browser": "dist/acme-esm-hello-app.js",
  "main": "src/index.ts",
  "files": ["dist"],
  "scripts": {
    "start": "egen develop",
    "build": "rspack --mode=production",
    "typescript": "tsc"
  },
  "keywords": ["egen", "microfrontends"],
  "peerDependencies": {
    "@egen-civitas/esm-framework": ">=4.0.0",
    "react": "18.x",
    "react-dom": "18.x",
    "react-i18next": "16.x",
    "rxjs": "7.x",
    "single-spa": "6.x",
    "swr": "2.x"
  },
  "dependencies": { "@egen-civitas/esm-framework": "^4.1.0" },
  "devDependencies": {
    "@egen-civitas/egen": "^2.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^16.6.6",
    "i18next": "^25.10.10",
    "rxjs": "^7.8.1",
    "single-spa": "^6.0.0",
    "swr": "^2.2.0",
    "typescript": "^5.8.3"
  }
}
```
Points clés : `"files": ["dist"]` (le tarball **doit** contenir `dist/` avec `routes.json`) ; `swr` installé (la config EGEN le requiert dès qu'il est en peer) ; `@egen-civitas/egen` apporte `rspack`/`swc`.

### `rspack.config.js`
```js
module.exports = require('@egen-civitas/egen/default-rspack-config');
```

### `src/index.ts`
```ts
import { getSyncLifecycle } from '@egen-civitas/esm-framework';
import Root from './root.component';

const moduleName = '@acme/esm-hello-app';          // = name
export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');
export const root = getSyncLifecycle(Root, { featureName: 'acme-hello', moduleName });
```

### `src/routes.json`
```json
{ "pages": [ { "component": "root", "route": "acme-hello" } ] }
```

### Commandes
```bash
npm install
npx egen develop --sources .                      # dev avec le Shell EGEN (hors Core)
npx egen develop --sources . --importmap https://env.exemple.org/importmap.json \
                 --routes https://env.exemple.org/routes.registry.json   # branché sur un environnement déployé
npm run build && npm pack                          # → acme-esm-hello-app-1.0.0.tgz
```

### Résultat du build (🟡)
`dist/acme-esm-hello-app.js` (conteneur `var` `_acme_esm_hello_app`), `dist/routes.json` estampillé, chunks, `*.buildmanifest.json`.

### Enregistrement (3 voies, voir 05)
- **E2 — assemblage** (recommandé pour une distribution) :
  ```json
  // spa-build-config.json
  { "publicUrl": ".", "frontendModules": {
      "@egen/esm-footer-app": "1.0.0",
      "@acme/esm-hello-app": "file:./acme-esm-hello-app-1.0.0.tgz" } }
  ```
  ```bash
  npx egen assemble --mode config --config spa-build-config.json --target dist/assembled --manifest
  npx egen build --build-config spa-build-config.json --importmap dist/assembled/importmap.json --routes dist/assembled/routes.registry.json
  ```
  (les noms de fichiers produits sont ceux d'`assemble`, éventuellement hachés : vérifier la sortie — 🟡 non exécuté.)
- **E3 — URL** : publier `dist/` sur un hébergement stable, puis ajouter à l'import map `"@acme/esm-hello-app": "https://cdn.exemple.org/hello/1.0.0/acme-esm-hello-app.js"` et au registry l'entrée `"@acme/esm-hello-app": <contenu de dist/routes.json>`.
- ⛔ **Via `serve-prod.mjs` du Core : impossible** (05 §4.2).

### Cheminement de chargement
Identique à l'exemple 1 à partir de l'étape 2 ; la seule différence est l'**origine** de l'import map/registry (fichiers d'assemblage ou serveur).

---

## Exemple 3 — App Vue **externe** (⚠️ non éprouvé)

### Arborescence
```
esm-acme-vue-app/
├── package.json
├── rspack.config.js           # config MAISON (pas la config EGEN)
├── tsconfig.json
└── src/
    ├── start.ts               # exposé en ./start
    ├── App.vue
    └── routes.json
```

### `package.json`
```json
{
  "name": "@acme/esm-vue-app",
  "version": "1.0.0",
  "browser": "dist/acme-esm-vue-app.js",
  "main": "src/start.ts",
  "files": ["dist"],
  "scripts": {
    "start": "rspack serve --mode=development --port 8601",
    "build": "rspack --mode=production"
  },
  "egen:develop": { "command": "npm run start", "url": "http://localhost:8601/acme-esm-vue-app.js" },
  "dependencies": { "vue": "^3.5.0", "single-spa-vue": "^3.0.0" },
  "devDependencies": { "@rspack/cli": "^1.0.0", "@rspack/core": "^1.0.0", "vue-loader": "^17.0.0", "typescript": "^5.8.3" }
}
```
(`egen:develop` : voir 05 §4.1. Versions indicatives ; **ÉCO** : `single-spa-vue`, `vue-loader`.)

### `rspack.config.js` (squelette ; exigences EGEN en gras dans les commentaires)
```js
const path = require('path');
const { container, CopyRspackPlugin } = require('@rspack/core');
const { VueLoaderPlugin } = require('vue-loader');
const pkg = require('./package.json');
const slug = pkg.name.replace(/[\/\-@]/g, '_');             // EXIGENCE : global = slug(name)

module.exports = {
  entry: './src/start.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: path.basename(pkg.browser),
    publicPath: 'auto',                                       // EXIGENCE : chunks relatifs à l'URL du bundle
    library: { type: 'var', name: slug },                     // EXIGENCE : conteneur global
    clean: true,
  },
  resolve: { extensions: ['.ts', '.js', '.vue'] },
  devServer: { headers: { 'Access-Control-Allow-Origin': '*' }, port: 8601 },
  module: { rules: [
    { test: /\.vue$/, loader: 'vue-loader' },                 // ÉCO
    { test: /\.ts$/, loader: 'builtin:swc-loader', options: { jsc: { parser: { syntax: 'typescript' } } }, type: 'javascript/auto' },
  ]},
  plugins: [
    new VueLoaderPlugin(),
    new container.ModuleFederationPlugin({
      name: pkg.name,
      library: { type: 'var', name: slug },
      filename: path.basename(pkg.browser),
      exposes: { './start': './src/start.ts' },               // EXIGENCE : ./start
      shared: {},                                             // Vue embarqué (non partagé par le Shell)
    }),
    new CopyRspackPlugin({ patterns: [{ from: 'src/routes.json', to: 'routes.json' }] }), // EXIGENCE : routes.json à côté du bundle
  ],
};
```

### `src/start.ts`
```ts
import { h, createApp } from 'vue';
import singleSpaVue from 'single-spa-vue';       // ÉCO
import App from './App.vue';

const vueLifecycles = singleSpaVue({
  createApp,
  appOptions: (props) => ({ render: () => h(App, { ...props }) }),
  // ÉCO : pour extensions/modales, monter dans props.domElement
});

// EXIGENCE EGEN : chaque export = FONCTION renvoyant les lifecycles
export const root = () => Promise.resolve(vueLifecycles);
```

### `src/routes.json`
```json
{ "pages": [ { "component": "root", "route": "acme-vue" } ] }
```

### Commandes et enregistrement
- Dev : `npx egen develop --sources . --routes ./src/routes.registry.dev.json`, où ce fichier est `{"@acme/esm-vue-app": <contenu de routes.json>}` (**nécessaire** : routes non ajoutées pour `egen:develop`, 05 §4.1). Alternative : lancer `egen develop` puis « toucher » `src/routes.json`.
- Production : `npm run build && npm pack`, puis E2 ou E3 comme l'exemple 2.
- **À valider par prototype** : montage comme page, montage comme extension (parcel), démontage sans fuite, cohabitation avec une app React.

### Cheminement
Import map `@acme/esm-vue-app → URL` → `<script>` → `window._acme_esm_vue_app` → `get('./start')` → `root()` → lifecycle `single-spa-vue` → Vue monté dans le `<div id="single-spa-application:@acme/esm-vue-app-page-0">`.

---

## Exemple 4 — App Angular **externe** (⚠️ non éprouvé, risque plus élevé)

### Arborescence
```
esm-acme-ng-app/
├── package.json
├── webpack.config.js          # Module Federation (builder Webpack)
├── tsconfig.json
├── angular.json               # builder Webpack personnalisé (ÉCO)
└── src/
    ├── main.single-spa.ts     # exposé en ./start
    ├── app/app.component.ts …
    └── routes.json
```

### Exigences et squelette
```js
// webpack.config.js — les EXIGENCES EGEN sont identiques à celles de l'exemple 3
const { container } = require('webpack');
const pkg = require('./package.json');
const slug = pkg.name.replace(/[\/\-@]/g, '_');
module.exports = {
  output: { publicPath: 'auto', library: { type: 'var', name: slug }, uniqueName: slug },
  plugins: [ new container.ModuleFederationPlugin({
    name: pkg.name,
    library: { type: 'var', name: slug },
    filename: 'acme-esm-ng-app.js',
    exposes: { './start': './src/main.single-spa.ts' },
    shared: {},                                    // @angular/* embarqués
  }) ],
};
```
```ts
// src/main.single-spa.ts  (ÉCO : adaptateur single-spa-angular)
import { singleSpaAngular, getSingleSpaExtraProviders } from 'single-spa-angular';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

const lifecycles = singleSpaAngular({
  bootstrapFunction: (props) => platformBrowserDynamic(getSingleSpaExtraProviders()).bootstrapModule(AppModule),
  template: '<app-root />',
  NgZone: 'noop' as any,   // ÉCO : à arbitrer selon la gestion de zone.js
});
export const root = () => Promise.resolve(lifecycles);
```
`routes.json` : `{ "pages": [ { "component": "root", "route": "acme-ng" } ] }`.

### Points de vigilance propres à Angular (06 §4)
- `<base href>` posé par le Shell : définir `APP_BASE_HREF` à `window.getEgenSpaBase()`.
- `zone.js` : isolation à tester avec une app React présente simultanément.
- Le builder esbuild d'Angular ne produit pas de conteneur Webpack MF : builder Webpack requis.
- Dev : `egen:develop` (comme l'exemple 3) + routes fournies.
- Enregistrement et chargement : identiques aux exemples 2 et 3.

### Statut
À prototyper avant engagement ; à ne pas présenter comme fonctionnel tant que le montage page + extension + démontage n'est pas démontré.
