# 08 — Écarts, lacunes et recommandations

Aucun code n'a été modifié pour cet audit. Les recommandations (💡) découlent des constats (✅/🟡/⛔) et sont ordonnées par **importance** : 🔴 bloque une capacité visée · 🟠 dégrade fiabilité/compatibilité · 🟢 confort/uniformité.

## 1. Inventaire des capacités

| Capacité | État |
| --- | --- |
| Charger une app interne du Core (dev et prod) | ✅ disponible |
| Déclarer pages/extensions/modales/workspaces/flags | ✅ disponible (workspaces/flags non utilisés dans le Core) |
| Charger une app externe en **développement** | ✅ disponible (`egen develop --sources/--importmap/--routes`, `egen:develop`) |
| Distribuer des apps externes **npm/tarball** | ✅ disponible, 🟡 non joué, non utilisé par le Core |
| Charger une app externe **en production du Core** (`serve-prod.mjs`) | ✅ disponible (`yarn external:sync`, doc 12) |
| Découverte automatique (manifeste, balayage de domaine) | ⛔ absent |
| Validation de conformité d'une app externe | 🟡 partielle : validation côté Core à la publication (doc 12) ; pas de `egen check-app` côté Framework |
| Adaptateurs Vue / Angular | ⛔ absents |
| Multi-versions d'une même app | ⛔ absent |
| Documentation d'intégration externe | ⛔ absente avant ce dossier |

## 2. Écarts détaillés

### Blocs « intégration externe »

| # | Écart | Preuve | Importance | Impact sur la compatibilité | Option (💡) |
| --- | --- | --- | --- | --- | --- |
| **G1** ✅ **traité** (doc 12) | `serve-prod.mjs` ne voyait que `packages/apps/*` | `serve-prod.mjs` (version d'origine) | 🔴 | Aucune app externe en production Core | (a) `external-apps.json` lu au démarrage et fusionné (import map + registry) ; (b) consommer un registry URL ; (c) abandonner le serveur maison pour `egen assemble` + `egen build` (déjà dans le Framework) |
| **G2** | Pas de découverte | `route-maps.ts` ne lit que le DOM | 🟠 | Inscription manuelle obligatoire | fichier de manifeste d'app (URL conventionnelle) lu par un service d'assemblage ; reste du ressort de l'opérateur |
| **G3** | `serve-prod` lit `src/routes.json` : pas de `frameworkRange` | idem | 🟠 | garde-fou de version inactif en production Core | lire `dist/routes.json` (déjà estampillé par le build) |
| **G4** | Pas de validateur de conformité | recherche négative | 🟠 | erreurs d'intégration découvertes à l'exécution | commande `egen check-app` : vérifie `name`, `browser`, conteneur `var`, `./start`, `routes.json` ↔ exports |
| **G5** | `egen:develop` n'enregistre pas les routes | `runProject` | 🟠 | app Vue/Angular sans pages en dev tant que `routes.json` n'a pas « updaté » | renseigner `routes[project.name]` aussi dans cette branche |
| **G6** | Multi-version impossible au runtime | une clé = une URL | 🟢 | pas de canary par app | clé versionnée (`nom@major`) côté registry si besoin |
| **G7** | Nom d'exposition fixé `./start` | `dynamic-loading.ts` | 🟢 | contrainte pour outillages tiers | documenter (fait) |
| **G8** | Mode `async` des conteneurs `type: 'module'` non pris en charge | `window[slug]` | 🟢 | Vite-federation ESM ne convient pas sans adaptation | documenter / adapter `importDynamic` |
| **G9** | Vue ✅ **traité** (`esm-vue-utils`, doc 13) ; Angular et Next.js : à faire | recherche négative puis implémentation | 🟠 | Vue démontré hors Shell ; Angular/Next non démontrés | prototype Angular puis `esm-angular-utils` ; cadrage Next.js (13 §5–6) |

### Incohérences et dette (Core ↔ Framework)

| # | Constat | Preuve | Importance | Impact | Option (💡) |
| --- | --- | --- | --- | --- | --- |
| **E1** ✅ **traité** (migration réalisée, voir [14](14-plan-migration-carbon.md)) | Écart de versions Core ↔ Framework (Core en 4.x/2.x avec Carbon+SCSS, Framework en 5.x/3.x sans) | Mesure avant : 44 fichiers `@carbon/react` dans 7 apps, 74 `.scss`. **Après (main du 2026-11-21)** : 0 import Carbon, 0 `.scss`, 0 `sass`, 74 `*.module.css`, Core sur `esm-framework 5.0.1` / Shell 3.0.6 / `rspack-config` 2.0.0 ; garde-fou `tools/check-no-carbon.mjs` | 🟢 | plus d'écart de versions majeur ; reste le peer `esm-framework >=3.0.0` (E4) | conserver le garde-fou dans `yarn verify` |
| **E2** ✅ **confirmé à l'exécution, correctif livré (à activer)** | `moduleName` ≠ `name` du paquet dans 28/28 apps (`@egen-civitas/x` vs `@egen/x`) ; l'i18n charge `importDynamic(moduleName)`, qui interroge l'import map (clés `@egen/x`) | `constants.ts` ; `egenComponentDecorator.tsx` (`defaultNS`) ; `locale.ts` ; **essai avec le vrai `importDynamic` publié** : `@egen-civitas/esm-footer-app` → *Could not find the package … defined in the current importmap*, `@egen/esm-footer-app` trouvé | 🟠 | les traductions `translations/*.json` des 28 apps ne sont pas chargées (repli sur les textes par défaut du code). **Renommer est exclu** : la barre de navigation lit les noms `@egen/esm-*-app-page-<i>` et les README documentent des clés de config `@egen-civitas/…` | **Correctif additif** : table `aliases` dans l'import map (`{ "@egen-civitas/x": "@egen/x" }`). Framework : `importDynamic` la résout (branche `feature/multi-techno-utils`, 93 tests verts) ; Core : `serve-prod.mjs` l'émet (`EGEN_IMPORTMAP_ALIASES=false` pour désactiver). Effectif quand le Core embarque un Shell/Framework incluant cette évolution ; sans effet (ignoré) sur les versions antérieures. Hors périmètre : `egen develop` (import map de développement non alimentée) |
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
2. ✅ ~~Migration Carbon/SCSS (E1)~~ : réalisée ; resserrer maintenant le peer `esm-framework` (E4).
3. 🟠 **Vérifier puis corriger E2** (alignement `moduleName`) — peu coûteux, effet potentiellement visible sur les traductions.
4. 🟠 Prototyper Vue (puis Angular) pour passer de « contrat vérifié » à « compatibilité démontrée » (G9).
5. 🟠 Corriger G5 et G3, ajouter G4.
6. 🟢 Uniformiser (E8, E9, E7), nettoyer E5/E6.
