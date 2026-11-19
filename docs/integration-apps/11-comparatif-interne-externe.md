# 11 — Comparatif : application interne vs externe

Synthèse de 04 et 05. Le **contrat côté Shell est identique** ; seuls diffèrent l'emplacement du code, la façon dont le bundle est produit/servi, et la **découverte**.

| Sujet | Interne (Core) | Externe (dépôt indépendant) |
| --- | --- | --- |
| **Emplacement** | `core/packages/apps/esm-<nom>-app/` (workspace Yarn) | dépôt propre |
| **Nom du paquet** | `@egen/esm-<nom>-app` (filtre `build:apps` : `@egen/*-app`) | libre (ex. `@acme/…`) ; suffixe `-app` seulement utile au `survey` d'`assemble` |
| **Commun (obligatoire des deux côtés)** | `name` unique · `browser` + `main` · conteneur MF `var` `slugify(name)` · `./start` · exports = fonctions → lifecycles · `routes.json` correspondant aux exports · `peerDependencies` défini (config EGEN) | idem |
| **Config de build** | config par défaut (27/28) ou enveloppe documentée (1/28) | config par défaut (React) ou maison (Vue/Angular) |
| **Générateurs d'import map/registry** | `egen develop` (dev) · `serve-prod.mjs` (prod) | `egen develop --sources/--importmap/--routes`, `egen:develop` (dev) · `egen assemble` (+ `egen build`) · fichiers à la main (prod) |
| **Découverte** | **automatique** par scan de `packages/apps/*` | ⛔ **aucune** : inscription explicite (import map **et** registry) |
| **Enregistrement** | aucun (le dossier suffit) | `spa-build-config.json` (npm/`file:`/`https:`) ou entrées d'URL |
| **Production avec `serve-prod.mjs`** | ✅ | ⛔ non supporté |
| **Production avec `egen assemble`/`build`** | possible (non utilisé par le Core) | ✅ voie prévue |
| **`frameworkRange` en production** | ⛔ non estampillé (`serve-prod` lit `src/routes.json`) | ✅ estampillé (`dist/routes.json` de l'assemblage) |
| **Dépendances EGEN** | `@egen-civitas/*` en `dependencies` **et** `peerDependencies` | idem (mode B) ; aucune en mode A |
| **Outil d'installation** | racine du monorepo (`yarn install`) | `@egen-civitas/egen` en devDependency |
| **Vérifications fournies** | `yarn verify` (`check-nav-routes` + lint + tests + types) | ⛔ aucune ; checklist de 09 §3 |
| **Test local** | `yarn start` (toutes) ou dans l'app | `egen develop --sources .` ; branchement possible sur un environnement déployé (`--importmap/--routes` URL) |
| **Mise à jour** | rebuild + redémarrage de `serve-prod` | nouveau paquet/bundle + nouvelle distribution ou nouvelle URL ; sans redéployer le Core si registry en URL |
| **Domaine** | même origine que le Shell | même origine ou autre (CORS/CSP) ; ⛔ impossible pour cibles natives (embarquer) |
| **Versions simultanées** | une | une (une clé = une URL) |
| **Frameworks supportés** | React (28/28) | React ✅ ; Vue/Angular ⛔ adaptateur, 🟡 contrat vérifié |
| **Responsabilité Core** | tout : build, scan, serveur, contrôle de navigation | uniquement le Shell + Framework (chargement, enregistrement) |
| **Responsabilité de l'équipe de l'app** | code + déclarations | code + déclarations + build conforme + hébergement + inscription |
| **Risques propres** | écarts Core↔Framework (E1), `moduleName` (E2) | découverte manuelle (G1/G2), conformité non validée (G4), routes `egen:develop` (G5) |
| **Spécifique au Core** | `topbar-nav-slot` (contrat `section/label/route`), `scaffold-app.py`, `serve-prod.mjs`, filtre `@egen/*-app` | — |
| **Spécifique aux projets externes** | — | `spa-build-config.json`, `--importmap/--routes`, `egen:develop`, `files: ["dist"]` |
