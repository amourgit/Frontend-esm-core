# 10 — Exemples de projets

Statut de chaque exemple :

| Exemple | Statut |
| --- | --- |
| 1. React interne | ✅ **calqué sur `esm-footer-app`** (fichiers réels du Core) ; non compilé pendant l'audit (🟡) |
| 2. React externe | ✅ contrat vérifié dans le code ; **non compilé** (🟡) |
| 3. Vue externe | ✅ **construit et chargé selon le protocole du Shell** avec `esm-vue-utils` (hors Shell réel) |
| 4. Angular externe | ✅ **construit et chargé selon le protocole du Shell** avec `esm-angular-utils` (sans zone.js ; AOT non vérifié) |
| 5. Next.js par iframe | ✅ pont `postMessage` testé (fenêtres simulées) |

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
    "@egen-civitas/esm-framework": "^5.0.1",
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
    "@egen-civitas/esm-framework": "^5.0.1",
    "@egen-civitas/esm-react-utils": "^3.0.1",
    "@egen-civitas/esm-config": "^2.0.0",
    "@egen-civitas/esm-globals": "^2.4.0",
    "@egen-civitas/esm-state": "^1.0.3"
  }
}
```
(Les dev-dépendances `react`, `vitest`, `happy-dom`… sont celles des autres apps ; copier `esm-footer-app`.) **Peers = ce qui est partagé ; `dependencies` = installation.**

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
`src/declarations.d.ts` : `declare module '*.module.css';` — `translations/en.json` : `{}` — `tsconfig.json`, `vitest.config.ts`, `setup-tests.ts` : identiques à `esm-footer-app` (04 §2).

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
dist/routes.json                            # + "version" + "frameworkRange": "^5.0.1"
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
    "@egen-civitas/esm-framework": "^5.0.1",
    "react": "18.x",
    "react-dom": "18.x",
    "react-i18next": "16.x",
    "rxjs": "7.x",
    "single-spa": "6.x",
    "swr": "2.x"
  },
  "dependencies": { "@egen-civitas/esm-framework": "^5.0.1" },
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

## Exemple 3 — App Vue **externe** (✅ construit et chargé selon le protocole du Shell)

Statut : **testé** avec Vue 3.5, `single-spa-vue` 3.0.1, Rspack 1.7 et `@egen-civitas/esm-vue-utils` (branche `feature/multi-techno-utils` du Framework, voir [13](13-extension-multi-technologies.md) §4). Chargement par `<script>`, `init`, `get('./start')`, montage page + extension, démontage : OK. **Non couvert** : Shell réel, cohabitation avec React.

### Arborescence
```
esm-acme-vue-app/
├── package.json
├── rspack.config.js
└── src/
    ├── index.ts          # OBLIGATOIRE (entrée par défaut de Rspack) : export * from './start'
    ├── start.ts          # exposé en ./start
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
  "scripts": { "build": "rspack --mode=production" },
  "egen:develop": { "command": "rspack serve --mode=development --port 8601", "url": "http://localhost:8601/acme-esm-vue-app.js" },
  "dependencies": { "vue": "^3.5.0", "@egen-civitas/esm-vue-utils": "^0.1.0" },
  "devDependencies": { "@rspack/cli": "^1.0.0", "@rspack/core": "^1.0.0", "typescript": "^5.8.3" }
}
```
(`@egen-civitas/esm-vue-utils` : disponible après publication ; voir 13 §7.)

### `src/start.ts`
```ts
import { defineComponent, h } from 'vue';
import { getSyncLifecycle, useComponentContext, useTranslation } from '@egen-civitas/esm-vue-utils';

const Page = defineComponent({
  setup() {
    const ctx = useComponentContext();
    const { t } = useTranslation();
    return () => h('section', [h('h1', t('title', 'Page Vue')), h('small', ctx.moduleName)]);
  },
});
const Widget = defineComponent({ render: () => h('div', 'widget Vue') });

const options = { moduleName: '@acme/esm-vue-app', featureName: 'vue-demo' }; // moduleName = name
export const root = getSyncLifecycle(Page, options);
export const widget = getSyncLifecycle(Widget, options);
```
`src/index.ts` : `export * from './start';` — `src/routes.json` :
```json
{ "pages": [ { "component": "root", "route": "acme-vue" } ],
  "extensions": [ { "name": "acme-vue-widget", "component": "widget", "slot": "home-sections" } ] }
```
(Fichiers `.vue` : ajouter `vue-loader` + `VueLoaderPlugin` à la config ; l'essai n'a utilisé que des fonctions de rendu.)

### `rspack.config.js` (configuration testée)
```js
const path = require('path');
const { container, CopyRspackPlugin } = require('@rspack/core');
const pkg = require('./package.json');
const slug = pkg.name.replace(/[\/\-@]/g, '_');             // global attendu par le Shell

module.exports = {
  mode: 'production',
  // PAS de `entry` ni de `output.filename` : le conteneur MF porte le nom du fichier
  output: { path: path.resolve(__dirname, 'dist'), publicPath: 'auto', clean: true },
  resolve: { extensions: ['.ts', '.js', '.json'], extensionAlias: { '.js': ['.ts', '.tsx', '.js'] } },
  module: { rules: [{ test: /\.ts$/, loader: 'builtin:swc-loader', type: 'javascript/auto',
    options: { jsc: { parser: { syntax: 'typescript' }, target: 'es2020' } } }] },
  plugins: [
    new container.ModuleFederationPlugin({
      name: pkg.name,
      library: { type: 'var', name: slug },                  // EXIGENCE : conteneur global
      filename: path.basename(pkg.browser),
      exposes: { './start': './src/start.ts' },              // EXIGENCE : ./start
      shared: {},                                            // vue embarqué (non partagé par le Shell)
    }),
    new CopyRspackPlugin({ patterns: [{ from: 'src/routes.json', to: 'routes.json' }] }), // à côté du bundle
  ],
};
```

### Commandes, résultat, enregistrement
```bash
npm run build                  # dist/acme-esm-vue-app.js (conteneur), routes.json, chunks, main.js
npm pack                       # acme-esm-vue-app-1.0.0.tgz
# Core : external-apps.json → { "apps": { "@acme/esm-vue-app": "file:/chemin/acme-esm-vue-app-1.0.0.tgz" } }
yarn external:sync && kill -HUP <pid-serve-prod>
```
Développement : `egen:develop` + `--routes` (05 §4.1 : routes non ajoutées automatiquement dans ce cas).

### Cheminement vérifié
`<script>` → `window._acme_esm_vue_app` → `init({})` → `get('./start')()` → `root()` → lifecycles `single-spa-vue` → monté dans `#single-spa-application:<nom>` (page) ou `domElement` (extension).

---

## Exemple 4 — App Angular **externe** (✅ construit et chargé selon le protocole du Shell)

Statut : **testé** avec Angular 22, `single-spa-angular` 22.0.1, Rspack 1.7 et `@egen-civitas/esm-angular-utils` (branche `feature/multi-techno-utils`, voir [13](13-extension-multi-technologies.md) §5). Chargement par `<script>`, `init`, `get('./start')`, montage page + extension, démontage, **sans zone.js** : OK. **Non couvert** : Angular CLI en compilation AOT, routeur Angular, Shell réel.

### Arborescence
```
esm-acme-ng-app/
├── package.json
├── rspack.config.js          # identique à l'exemple 3 (conteneur var, ./start, routes.json copié)
└── src/
    ├── index.ts              # OBLIGATOIRE : export * from './start'
    ├── start.ts              # exposé en ./start
    └── routes.json
```

### `package.json` (extrait)
```json
{
  "name": "@acme/esm-ng-app",
  "browser": "dist/acme-esm-ng-app.js",
  "main": "src/start.ts",
  "files": ["dist"],
  "dependencies": {
    "@angular/core": "^22.0.0", "@angular/common": "^22.0.0", "@angular/compiler": "^22.0.0",
    "@angular/platform-browser": "^22.0.0", "rxjs": "^7.8.0", "single-spa-angular": "^22.0.1",
    "@egen-civitas/esm-angular-utils": "^0.1.0"
  }
}
```
`single-spa-angular` doit avoir **la même version majeure qu'Angular**.

### `src/start.ts`
```ts
import '@angular/compiler'; // JIT, uniquement parce que cet exemple n'est pas compilé par l'Angular CLI
import { Component, computed } from '@angular/core';
import { getSyncLifecycle, injectComponentContext, injectTranslate } from '@egen-civitas/esm-angular-utils';

class PageCmp {
  ctx = injectComponentContext();
  t = injectTranslate();
  title = computed(() => this.t('title', 'Page Angular'));
}
const Page = Component({
  selector: 'acme-ng-page', // selector d'élément simple obligatoire
  template: '<section><h1>{{ title() }}</h1><small>{{ ctx.moduleName }}</small></section>',
})(PageCmp);

class WidgetCmp {}
const Widget = Component({ selector: 'acme-ng-widget', template: '<div>widget Angular</div>' })(WidgetCmp);

const options = { moduleName: '@acme/esm-ng-app', featureName: 'ng-demo' }; // moduleName = name
export const root = getSyncLifecycle(Page, options);
export const widget = getSyncLifecycle(Widget, options);
```
Avec l'Angular CLI, écrire les composants avec le décorateur `@Component({...})` habituel (compilation AOT : 🟡 non vérifiée ici).

`src/routes.json` :
```json
{ "pages": [ { "component": "root", "route": "acme-ng" } ],
  "extensions": [ { "name": "acme-ng-widget", "component": "widget", "slot": "home-sections" } ] }
```

### Résultat et enregistrement
`npm run build` → `dist/acme-esm-ng-app.js` (conteneur), `routes.json`, chunks. Enregistrement : comme l'exemple 3 (`external-apps.json` + `yarn external:sync`). Plus de point de vigilance `zone.js` : le mode sans zone est le défaut ; pour utiliser zone.js : `zone: true`, charger zone.js dans l'app et `provideZoneChangeDetection()` dans `providers`.

---

## Exemple 5 — Application autonome (Next.js) par iframe (✅ pont testé avec fenêtres simulées)

> ⚠️ **Ancien pipeline, en voie de retrait** (décision du 2026-11-26). L'exemple ci-dessous utilise `esm-nextjs-utils` (pont 1.1) + une enveloppe « wrapper ». La voie actuelle est le SDK embed : `egen-config.json` + `connectToEgen` — voir [17](17-sdk-embed-protocole-v2.md). Conservé comme référence historique.

Statut : `@egen-civitas/esm-nextjs-utils` (voir [13](13-extension-multi-technologies.md) §6). L'application Next reste **hors du bundle** : le Core n'embarque qu'une petite app « enveloppe » (un export). Non couvert : exécution inter-fenêtres dans un vrai navigateur.

### App enveloppe (dans le Core ou en externe)
```ts
// src/start.ts
import { getSyncLifecycle } from '@egen-civitas/esm-nextjs-utils';
export const root = getSyncLifecycle({
  moduleName: '@acme/esm-mon-next',
  featureName: 'mon-next',
  url: 'https://next.exemple.org/app',   // origine autorisée = origine de l'URL
});
```
`routes.json` : `{ "pages": [ { "component": "root", "routeRegex": "^mon-next(/.*)?$" } ] }`

### Côté Next.js (composant client)
```tsx
'use client';
import { useEffect, useState } from 'react';
import { createEgenBridge } from '@egen-civitas/esm-nextjs-utils/client';

export function EgenSession() {
  const [state, setState] = useState<any>({});
  useEffect(() => {
    const b = createEgenBridge({ moduleName: '@acme/esm-mon-next', allowedHostOrigins: ['https://shell.exemple.org'] });
    const off = b.subscribe(setState);
    const stop = b.autoResize();
    return () => { off(); stop(); b.destroy(); };
  }, []);
  return <p>{state.session?.user?.display ?? '…'}</p>;
}
```

### Réglages d'hébergement indispensables
- Next : en-tête `Content-Security-Policy: frame-ancestors https://shell.exemple.org` (sans `X-Frame-Options: DENY/SAMEORIGIN`) ;
- Shell : `frame-src` vers l'application ; même site (sous-domaines) pour les cookies de session ;
- Cibles natives : non adapté (contenu distant).
