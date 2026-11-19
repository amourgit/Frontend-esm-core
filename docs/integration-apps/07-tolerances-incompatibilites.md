# 07 — Tolérances, incompatibilités, pratiques à éviter

Chaque règle est classée **A** obligatoire · **B** acceptable · **C** acceptable sous conditions · **D** déconseillé · **E** à éviter absolument, avec sa justification technique. Niveaux de preuve : voir 00. Le niveau retenu suit la **conséquence mesurée dans le code** : E = casse le démarrage ou rend l'app inutilisable ; D = fonctionne mais fragilise ; jamais « interdit » sans cause.

## A. Obligatoire

| Règle | Justification | Si non respecté |
| --- | --- | --- |
| `name` unique, identique dans import map et registry | clé de lecture (`importDynamic`, `registerApp`) | `Could not find the package <nom> defined in the current importmap` ✅ |
| Bundle = conteneur MF `var` nommé `slugify(name)` | `window[slug]` (`dynamic-loading.ts`) | `The global variable … does not refer to a federated module` ✅ |
| Exposition `./start` | valeur fixe de `importDynamic` | `container.get('./start')` échoue ✅ |
| Chaque `component` = export fonction → lifecycles | `loadLifeCycles` | `console.warn` + lifecycle vide : app muette ✅ |
| `src/routes.json` présent (config EGEN) | `rspack-config` | build interrompu ✅ |
| `peerDependencies` défini (même `{}`) (config EGEN) | `Object.keys(peerDependencies)` | TypeError au build ✅ |
| Chaque page : `route` **ou** `routeRegex` | `tryRegisterPage` | page ignorée + warn ✅ |
| `containerDomId` existant dans le HTML du Shell | `finishRegisteringAllApps` | **exception au démarrage** ✅ |
| Extension/modale/workspace : `name` + `component` | `tryRegister*` | élément ignoré + erreur console ✅ |
| `featureName` et `moduleName` dans les options de lifecycle | `egenComponentDecorator` | `Error('Invalid options')` ✅ |

## B. Acceptable (différent de la convention, compatible)

| Pratique | Pourquoi c'est compatible |
| --- | --- |
| Nommage de dossier/paquet hors `esm-*-app` pour une app **externe** | seuls `egen assemble --mode survey` (suffixe `-app`) et le filtre `@egen/*-app` du Core y sont sensibles |
| `version` différente (1.0.0 / 9.0.2 dans le Core) | purement informative |
| Pas de `startupApp` | facultatif (8 apps du Core n'en ont pas) |
| Pas de `config-schema.ts`, pas de `fr.json`, pas de `README` | conventions locales |
| Plusieurs pages dans une app ; `routeRegex` plutôt que `route` | pris en charge ✅ |
| `containerDomId` dédié (`egen-footer-app-container`…) | conteneurs prévus par le Shell |
| Export `module#export` vers une autre app | syntaxe de `loadLifeCycles` ✅ |
| Aucune dépendance `@egen-civitas/*` (mode A) | seul le contrat compte |
| App sans `routes.json` en **assemblage** | avertissement seulement ; app chargeable mais invisible |

## C. Acceptable sous conditions

| Pratique | Condition |
| --- | --- |
| **Config de build maison** (Webpack/Rspack/autre) | reproduire exactement le conteneur `var`, `./start`, `filename`, `publicPath:'auto'`, copie de `routes.json` (05 §2.3) |
| **App Vue / Angular** | adaptateur Single-SPA de l'écosystème + lifecycle compatible parcel + prototype validé (06) |
| **Serveur de dev externe** (`egen:develop`) | fournir les routes à `egen develop` (`--routes`), sinon l'app n'a pas de pages (05 §4.1) |
| **Hébergement sur un autre domaine** | CORS pour `routes.registry`/`importmap` s'ils sont hors domaine ; CSP ouverte ; incompatible avec cibles natives |
| **Dépendance embarquée au lieu de partagée** (ex. `lodash`) | acceptable si **non-singleton** ; poids du bundle |
| **Config Rspack enveloppée** (ex. `esm-ai-assistant-app`) | modifier seulement ce qui est documenté (`resolve`, règles) ; garder `ModuleFederationPlugin` intact |
| **`featureFlag` / `online` / `offline` sur page** | n'ont d'effet qu'avec `window.offlineEnabled` (✅ `pages.ts`) |
| **`platforms`** pour apps natives | cible de build correspondante ; `requiredCapabilities` fournies par l'hôte |
| **Importer `esm-tenant`/`esm-context`** | **directement** depuis leur paquet (03 §2) |

## D. Déconseillé

| Pratique | Risque |
| --- | --- |
| `moduleName` ≠ `name` du paquet | espace de noms i18n non résolvable via l'import map (**E2**, 08) ; Core actuel concerné (28/28) |
| Dupliquer un nom d'extension entre apps | 🟡 comportement du store non examiné ; collisions probables |
| Utiliser une clé `routes` (pluriel) dans une page | ignorée avec warn ✅ |
| Compter sur `backendDependencies` de `routes.json` | ⛔ aucun consommateur trouvé |
| Plages de peers très larges (`>=3.0.0` partout) | `frameworkRange` toujours satisfait : le garde-fou de version est **neutralisé** (28/28 apps du Core) |
| `peerDependencies` sans plage cohérente avec ce que le Shell fournit | `strictVersion: false` : aucune alerte en cas d'incompatibilité |
| Dépendre de `serve-prod.mjs` pour une app externe | ⛔ non supporté (05 §4.2) |
| Relancer `egen assemble` sans `--manifest` | difficulté à reproduire la distribution |
| Ressources référencées en chemins absolus fixes | cassent avec `publicPath:'auto'` et un autre domaine |
| Chunks nombreux | `maxAsyncRequests:3 / maxInitialRequests:1` : configuration volontaire, ne pas la contourner sans mesure |

## E. À éviter absolument

| Pratique | Justification (code) | Conséquence |
| --- | --- | --- |
| **Dupliquer React / react-dom / single-spa** (les mettre seulement en `dependencies`, ou en version incompatible) | `singleton` + `strictVersion:false` : MF ne bloque pas ; deux copies de React ⇒ hooks/contextes cassés | erreurs « Invalid hook call », contextes introuvables |
| **Identifiants de module dupliqués** | `Object.assign` (registry) et dernière balise gagnent | une app **remplace** silencieusement l'autre |
| **`containerDomId` inexistant** | exception dans `finishRegisteringAllApps` | **le Shell ne démarre pas** (toutes les apps) |
| **Export manquant ou non-fonction** | lifecycle vide | app inerte sans erreur visible |
| **`routes.json` ne correspondant pas aux exports** | idem | idem |
| **Lifecycle qui ne démonte pas** (`unmount` incomplet) | Single-SPA remonte la page à chaque navigation | fuites, double rendu, listeners cumulés |
| **Listeners globaux non retirés** (`window`/`document` : 29 fichiers `.tsx` du Core en posent) | un seul `window` partagé | doublons d'événements après remontage |
| **Styles CSS globaux** (hors CSS Modules / Tailwind) | un seul document ; la config EGEN préfixe les modules par app, une config maison non | fuite de styles entre apps |
| **Modifier le DOM hors de son `domElement`** | autres apps montées dans la même page | corruption visuelle |
| **Appeler des mécanismes internes du Shell** (`window.installedModules`, conteneurs, `initializeSpa`) | non contractuel ; change entre majeures (Shell 2.11 → 3.0) | rupture à la mise à jour |
| **Dépendre d'un serveur de développement en production** (`http://localhost:…` dans l'import map) | l'import map de dev est éphémère | app introuvable en production |
| **Utiliser `import-map-override` / `egen-routes` du `localStorage` comme déploiement** | no-op hors `spaEnv==='development'` | aucun effet en production ✅ |
| **Mises à jour indépendantes sans contrôle de version** | `strictVersion:false` + `frameworkRange` large | incompatibilité découverte à l'exécution |
| **Exposer autre chose que `./start`** en croyant que le Shell le chargera | `importDynamic` fixe `./start` | export jamais appelé |
| **Hôte de bundle non joignable** | rejet de `importDynamic` | page vide ; pas de repli EGEN |

## Autres risques identifiés par l'audit
- `esm-app-shell` partage encore `@carbon/react` (2.11.1) : toute app qui l'embarque crée une 2ᵉ copie ; le HEAD (3.0.x) ne le partage plus (08, E1).
- Les apps du Core ajoutent **29 fichiers** posant `addEventListener` : à auditer pour le nettoyage (`useEffect` + retour de fonction).
