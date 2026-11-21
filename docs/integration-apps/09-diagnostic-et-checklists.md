# 09 — Diagnostic et checklists

## 1. Erreurs fréquentes : symptôme → cause → remède

Messages **exacts** relevés dans le code (✅). La console du navigateur est le premier outil.

| Symptôme / message | Cause | Remède | Source |
| --- | --- | --- | --- |
| `Could not find the package <nom> defined in the current importmap` | clé absente de l'import map (nom différent, app non assemblée) | inscrire/corriger la clé = `name` du `package.json` | `dynamic-loading.ts` |
| `The global variable <slug> does not refer to a federated module` | bundle chargé mais pas de conteneur `var` | config MF : `library {type:'var', name:slugify(name)}` | idem |
| Script jamais chargé (avertissement après 5 s) | URL du bundle erronée, CORS/CSP, hôte injoignable | tester l'URL ; vérifier `publicPath`/CSP | `dynamic-loading.ts` |
| L'app est chargée mais **rien ne s'affiche** | export manquant/non fonction (`console.warn`) ; `routes.json` absent du registry ; `route` ne correspond pas à l'URL | comparer `component` ↔ exports ; chercher l'app dans `window.installedModules` (diagnostic seulement) et dans le registry | `load-lifecycles.ts`, `pages.ts` |
| `… is missing a route` / `…missing a 'component'` | déclaration incomplète | compléter `routes.json` (02) | `pages.ts`, `components.ts` |
| `… cannot be mounted to "<id>"; DOM element does not exist.` | `containerDomId` inconnu du Shell | utiliser un conteneur existant (01 §7) | `pages.ts` |
| `[egen] L'application <x> n'est pas enregistrée…` | `platforms`, `frameworkRange` ou `requiredCapabilities` non satisfaits | aligner plage/plateforme | `availability.ts` |
| `L'extension <x> de <app> est sur un slot de rail … mais ne s'affichera pas : …` | `meta` de rail invalide | corriger `ToolWindowMeta` (02 §5) | `components.ts` |
| `Invalid options` au chargement | `featureName`/`moduleName` manquants | les fournir | `egenComponentDecorator.tsx` |
| `Module <ns> does not export an importTranslation function` / `…does not return a promise` | export absent ou `require.context` non `'lazy'` | `require.context('../translations', false, /.json$/, 'lazy')` | `locale.ts` |
| Build : `This app does not define a routes.json…` (code 9819023573289) | `src/routes.json` absent | le créer (`{}` minimal) | `rspack-config` |
| Build : `TypeError … Object.keys(undefined)` | pas de `peerDependencies` | ajouter `"peerDependencies": {}` | `rspack-config` |
| `egen develop` : app Vue/Angular sans pages | routes non fournies avec `egen:develop` | `--routes` ou « toucher » `src/routes.json` (05 §4.1) | `importmap.ts` |
| Textes traduits non appliqués (Core) | E2 confirmé : `moduleName` ≠ `name` (`Could not find the package @egen-civitas/… defined in the current importmap`) | table `aliases` (08, E2) ou `moduleName` = `name` pour une nouvelle app | `locale.ts`, `dynamic-loading.ts` |
| Hooks cassés (« Invalid hook call ») | deux copies de React | `react*` seulement en `peerDependencies` | 07 E |
| Une app « remplace » une autre | même clé dans le registry | noms uniques | `route-maps.ts` |
| Surcharge `localStorage` sans effet | `spaEnv` ≠ `development` | normal en production | `import-maps.ts` |

### Procédure en 6 étapes
1. Console : chercher `[egen]`, `Could not find…`, `…federated module`.
2. Réseau : le bundle (URL de l'import map) répond-il en 200, type JS ?
3. L'import map contient-elle `name` ? Le registry contient-il `name` avec `pages`/`extensions` ?
4. Le global `window[slugify(name)]` existe-t-il (`typeof …get === 'function'`) ?
5. `await window[slug].get('./start')` renvoie-t-il les exports attendus ?
6. Les exports sont-ils des fonctions renvoyant `bootstrap/mount/unmount` ?

## 2. Checklist — app interne (Core)

- [ ] Dossier `packages/apps/esm-<nom>-app/` ; `name` = `@egen/esm-<nom>-app` (filtre `build:apps`)
- [ ] `package.json` : `browser: dist/egen-esm-<nom>-app.js`, `main: src/index.ts`, `peerDependencies` défini
- [ ] Peers partagés : `react`, `react-dom`, `react-i18next`, `rxjs`, `swr` (+ `@egen-civitas/*` utilisés)
- [ ] `rspack.config.js` = config par défaut (ou enveloppe documentée)
- [ ] `src/routes.json` valide, `$schema`, chaque `component` exporté
- [ ] `src/index.ts` : `importTranslation` (lazy), `startupApp` si config, fabriques `get*Lifecycle` avec `featureName` + `moduleName` (= `name`)
- [ ] `translations/en.json` présent
- [ ] Page : `route` **ou** `routeRegex` ; `containerDomId` valide
- [ ] Extensions de nav : `meta.section/label/route` et route déclarée (`yarn verify`)
- [ ] `yarn test`, `yarn typescript`, `yarn lint` verts ; `yarn build` produit `dist/` + `dist/routes.json`
- [ ] `unmount` propre ; listeners retirés ; aucun CSS global
- [ ] Changeset / README / entrée dans le README racine

## 3. Checklist — app externe

- [ ] `name` unique ; `version`, `browser`, `main` ; `peerDependencies` (config EGEN)
- [ ] Conteneur MF `var` `slugify(name)`, `exposes {'./start'}`, `publicPath:'auto'`
- [ ] Exports = fonctions → lifecycles (compatibles parcel : `domElement`)
- [ ] `routes.json` dans le même dossier que `browser` (dist/) ; correspond aux exports
- [ ] Runtimes singletons en peers (mode B) ou embarqués sans conflit (mode A)
- [ ] Forme d'intégration choisie : E1 dev / E2 npm assemblé / E3 URL ; entrées d'import map **et** de registry écrites
- [ ] Hors domaine : CORS + CSP ; natif : embarquée par `assemble`
- [ ] `frameworkRange` resserré ; versions publiées et immuables
- [ ] Test : `await window[slug].get('./start')` ; app visible ; navigation aller-retour sans fuite
- [ ] Plan de rollback (ancienne URL conservée)

## 4. Vérification de compatibilité (script à lancer par l'équipe)

```js
// Console du navigateur, une fois le Shell chargé
const name = '@acme/esm-mon-app';
const slug = name.replace(/[\/\-@]/g, '_');
console.log('import map :', document.querySelector('script[type="systemjs-importmap"]')?.textContent?.includes(name));
const c = window[slug];
console.log('conteneur :', c && typeof c.init === 'function' && typeof c.get === 'function');
c.get('./start').then(f => { const m = f(); console.log('exports :', Object.keys(m)); });
```
À lancer après qu'au moins une page de l'app a été chargée (le share scope du conteneur est alors initialisé). Cette vérification est une **aide manuelle** : aucun outil EGEN ne l'automatise (G4).
