# 08 — Écarts, lacunes et recommandations

Aucun code n'a été modifié pour cet audit. Les recommandations (💡) découlent des constats (✅/🟡/⛔) et sont ordonnées par **importance** : 🔴 bloque une capacité visée · 🟠 dégrade fiabilité/compatibilité · 🟢 confort/uniformité.

## 1. Inventaire des capacités

| Capacité | État |
| --- | --- |
| Charger une app interne du Core (dev et prod) | ✅ disponible |
| Déclarer pages/extensions/modales/workspaces/flags | ✅ disponible (workspaces/flags non utilisés dans le Core) |
| Charger une app externe en **développement** | ✅ disponible (`egen develop --sources/--importmap/--routes`, `egen:develop`) |
| Distribuer des apps externes **npm/tarball** | ✅ disponible, 🟡 non joué, non utilisé par le Core |
| Charger une app externe **en production du Core** (`serve-prod.mjs`) | ⛔ absent |
| Découverte automatique (manifeste, balayage de domaine) | ⛔ absent |
| Validation de conformité d'une app externe | ⛔ absent |
| Adaptateurs Vue / Angular | ⛔ absents |
| Multi-versions d'une même app | ⛔ absent |
| Documentation d'intégration externe | ⛔ absente avant ce dossier |

## 2. Écarts détaillés

### Blocs « intégration externe »

| # | Écart | Preuve | Importance | Impact sur la compatibilité | Option (💡) |
| --- | --- | --- | --- | --- | --- |
| **G1** | `serve-prod.mjs` ne voit que `packages/apps/*` | `serve-prod.mjs` l.60–80 | 🔴 | Aucune app externe en production Core | (a) `external-apps.json` lu au démarrage et fusionné (import map + registry) ; (b) consommer un registry URL ; (c) abandonner le serveur maison pour `egen assemble` + `egen build` (déjà dans le Framework) |
| **G2** | Pas de découverte | `route-maps.ts` ne lit que le DOM | 🟠 | Inscription manuelle obligatoire | fichier de manifeste d'app (URL conventionnelle) lu par un service d'assemblage ; reste du ressort de l'opérateur |
| **G3** | `serve-prod` lit `src/routes.json` : pas de `frameworkRange` | idem | 🟠 | garde-fou de version inactif en production Core | lire `dist/routes.json` (déjà estampillé par le build) |
| **G4** | Pas de validateur de conformité | recherche négative | 🟠 | erreurs d'intégration découvertes à l'exécution | commande `egen check-app` : vérifie `name`, `browser`, conteneur `var`, `./start`, `routes.json` ↔ exports |
| **G5** | `egen:develop` n'enregistre pas les routes | `runProject` | 🟠 | app Vue/Angular sans pages en dev tant que `routes.json` n'a pas « updaté » | renseigner `routes[project.name]` aussi dans cette branche |
| **G6** | Multi-version impossible au runtime | une clé = une URL | 🟢 | pas de canary par app | clé versionnée (`nom@major`) côté registry si besoin |
| **G7** | Nom d'exposition fixé `./start` | `dynamic-loading.ts` | 🟢 | contrainte pour outillages tiers | documenter (fait) |
| **G8** | Mode `async` des conteneurs `type: 'module'` non pris en charge | `window[slug]` | 🟢 | Vite-federation ESM ne convient pas sans adaptation | documenter / adapter `importDynamic` |
| **G9** | Vue/Angular : pas d'adaptateur ni d'exemple | recherche négative | 🟠 | compat. non démontrée | prototype Vue puis Angular (06), puis paquet `esm-vue-utils`/`esm-angular-utils` si validé |

### Incohérences et dette (Core ↔ Framework)

| # | Constat | Preuve | Importance | Impact | Option (💡) |
| --- | --- | --- | --- | --- | --- |
| **E1** | **Écart de versions Core ↔ Framework** : Core sur `esm-framework 4.1.0 / app-shell 2.11.1 / rspack-config 1.2.0` (Carbon partagé, SCSS) ; HEAD du Framework 5.0.0 / 3.0.2 / 2.0.0 **sans Carbon ni SCSS** | package.json publiés vs HEAD ; Core (28 apps, mesure après fusion) : 27 apps dépendent de `@carbon/react`, 44 fichiers l'importent, 74 fichiers SCSS | 🔴 | passer aux nouvelles majeures est une **migration** (hors périmètre de cet audit), pas un bump ; `peer ">=3.0.0"` laisse croire l'inverse | plan de migration par lots (le Framework fournit `docs/MIGRATION-CARBON.md`) ; en attendant ne pas lancer `deps:egen` sur les majeures |
| **E2** | **`moduleName` ≠ `name` du paquet dans 28/28 apps** (`@egen-civitas/x` vs `@egen/x`) ; i18n charge `importDynamic(moduleName)` qui interroge l'import map (clés `@egen/x`) | `constants.ts` ; `egenComponentDecorator.tsx` (`defaultNS`) ; `locale.ts` ; `serve-prod.mjs` (`importMap[pkg.name]`) | 🟠 (🟡 à confirmer) | traductions par fichiers `translations/*.json` potentiellement **jamais chargées** (repli sur le texte par défaut du code) ; config : `registerModuleWithConfigSystem('@egen/x')` crée un schéma implicite distinct de celui défini sous `@egen-civitas/x` | **Vérifier** : ouvrir une app en prod et chercher dans la console `Could not find the package @egen-civitas/…` ; puis aligner `moduleName` sur `name` (28 constantes) |
| **E3** | `esm-framework` : `index` ≠ `internal` (tenant/context/ai-framework absents de l'entrée runtime) | `esm-framework/src/{index,internal}.ts` | 🟠 | import via le paquet agrégateur = `undefined` à l'exécution (🟡) | corriger l'entrée `internal` ou documenter l'import direct (fait) |
| **E4** | `frameworkRange` neutralisé : peer `esm-framework >=3.0.0` sur 28/28 | `package.json` des apps | 🟠 | aucune app n'est jamais écartée pour incompatibilité | resserrer (`^4`) et lire `dist/routes.json` (G3) |
| **E5** | `backendDependencies` déclaré (28 apps, type, schéma) mais sans consommateur | recherche négative | 🟢 | fausse impression de contrôle backend | l'implémenter ou le retirer |
| **E6** | `registerApp` accepte `routes` (pluriel) pour une page mais `tryRegisterPage` l'ignore | `pages.ts` | 🟢 | piège de saisie | aligner la garde |
| **E7** | `scaffold-app.py` dépend de `esm-user-profile-app` et `esm-primary-navigation-app` comme modèles | `tools/scaffold-app.py` | 🟢 | outil fragile aux refontes d'apps | embarquer des gabarits |
| **E8** | Versions d'apps hétérogènes (1.0.0 / 9.0.2) | scan | 🟢 | confusion de suivi | uniformiser (changesets) |
| **E9** | Variantes de `tsconfig.json` (18/8/1/1) | scan | 🟢 | dérive | gabarit commun |
| **E10** | `esm-ai-assistant-app` : seule config Rspack personnalisée | scan | 🟢 | exception légitime | la conserver, documentée (04) |

## 3. Ce qui est disponible mais insuffisamment documenté
`egen:develop`, `--importmap`/`--routes` en URL, `assemble` par `file:`/`https:`, cibles natives, slots de rails (`ToolWindowMeta`), `frameworkRange`/`platforms`/`requiredCapabilities`, `module#export`, `startupApp`, `disableTranslations`. Ce dossier les couvre.

## 4. Recommandations par ordre de priorité

1. 🔴 **Trancher la voie d'intégration externe de production** (G1) : l'option (c) réutilise du code déjà maintenu par le Framework ; l'option (a) est la plus rapide.
2. 🔴 **Planifier la migration Carbon/SCSS** (E1) avant tout alignement de versions.
3. 🟠 **Vérifier puis corriger E2** (alignement `moduleName`) — peu coûteux, effet potentiellement visible sur les traductions.
4. 🟠 Prototyper Vue (puis Angular) pour passer de « contrat vérifié » à « compatibilité démontrée » (G9).
5. 🟠 Corriger G5 et G3, ajouter G4.
6. 🟢 Uniformiser (E8, E9, E7), nettoyer E5/E6.
