# EGEN Theme Studio — Plan d'exécution par phases

Référence : `docs/integration-tweakcn.md` (cahier des charges). Suivi : `docs/theme-studio/TRACKING.md`.

## Décisions d'architecture (ambiguïtés résolues)

| # | Ambiguïté | Décision |
|---|-----------|----------|
| A1 | « Fork TweakCN puis déplacer dans le core » | Fork GitHub créé : `amourgit/Frontend-esm-tweakcn-fork` (Apache-2.0, attribution conservée dans `NOTICE-tweakcn.md`). TweakCN est une app **Next.js/shadcn/Tailwind/DB/auth** : non embarquable telle quelle dans un shell micro-frontend (single-spa + Carbon). On **porte** son expérience (panneau de contrôles, preview, import CSS, color tools, undo/redo) dans une app EGEN native `@egen/esm-theme-studio-app`. Aucun code Next/Tailwind/drizzle/auth n'est repris. |
| A2 | Source de vérité du thème | Le **JSON de thème EGEN** (`ThemeSchema` de `@egen-civitas/esm-theme`). Le Studio édite ce JSON directement ; le modèle TweakCN n'existe qu'à la frontière (adaptateur d'import/export). |
| A3 | « Ne pas créer un nouveau Theme Engine » | Le Studio n'a **aucun moteur de tokens**. Il passe par un port `ThemeRuntimePort`. Implémentation actuelle : `esm-theme` (flatten + overrides globaux). Implémentation future : TokiForge (lot framework). Un seul moteur actif à la fois. |
| A4 | TokiForge « plus tard, dans le framework » | Le core ne dépend **pas** de TokiForge. Il définit le contrat (`ThemeRuntimePort`) + un sélecteur de runtime ; l'adaptateur TokiForge sera livré côté framework puis branché par config. |
| A5 | Composant → variante → état | Convention de tokens `components.<composant>.<variante>.<état>.<propriété>` (+ `base`/`default` comme repli). Cascade documentée et testée : état précis → `default` de la variante → `base` du composant → token global. Sans nouvelle plomberie : `flatten` génère `--components-button-primary-hover-background`. |
| A6 | Light/Dark | Les feuilles de composants peuvent être `string` (2 modes) ou `{ light, dark }` (reconnu par `flatten`). Surfaces/bordures/panels conservent leur structure `mode` existante. |
| A7 | Persistance | Interface `ThemeStorage` ; implémentation `localStorage` livrée ; backend (tenant) branchable sans toucher l'UI. |
| A8 | Application à chaud | Aperçu = variables CSS scopées sur le conteneur (indépendant du mode global). « Appliquer » = `applyGlobalThemeOverride` (priorité configurable), « Revenir » = `removeGlobalThemeOverride`. |
| A9 | Simple → Avancé → Expert | Chaque contrôle du catalogue porte un `level`. Expert ajoute un éditeur générique de **toutes** les feuilles JSON (aucune propriété EGEN n'est inaccessible). |
| A10 | Permissions | Privilège configurable (`config-schema`) ; vérification centralisée, désactivable en dev. |

| A11 | Qui applique le thème ? | **Le Studio produit** (thème EGEN valide, stockage, import/export). **TokiForge applique** (tokens runtime, scopes, cascade). **Les composants Carbon/EGEN consomment** (lot ultérieur). Le Studio ne remet le thème au moteur que par `ThemeRuntimePort` (« Appliquer » = délégation, pas une logique d'application propre). |
| A12 | Intégration au shell | Modèle `character-factory` : page `theme-studio/<segment>` (une route par page d'édition), option de **rail gauche** (`SectionNavPanel`), entrées `topbar-nav-slot` groupées, tuile `app-menu-slot`. Aucune sidebar propre. **La route doit être exclue du `routeRegex` de `esm-not-found-app`** (oubli de P10 à l'origine du 404) → garde-fou CI dans `tools/check-nav-routes.mjs`. |
| A13 | Pages TweakCN portées | Retenues : **éditeur** (Colors/Typography/Other → pages Couleurs, Typographie, Formes…), **thèmes enregistrés** (→ Mes thèmes), import/export. Écartées : accueil, tarifs, communauté, galerie publique, IA, Figma, tableau de bord, compte, **connexion/OAuth** (l'identité est gérée par le shell). |
| A14 | États | Services en singleton de session (changer de route ne perd rien), brouillon + niveau persistés (anti-rebond), reprise du brouillon, mode d'édition qui suit le mode de l'app, états d'écran : accès refusé, démarrage vide, brouillon restauré, erreur isolée (boundary), niveaux Simple/Avancé/Expert avec bascule guidée. |
| A15 | Composants UI | **Carbon/EGEN d'abord** : chrome du Studio et prévisualisation en vrais composants Carbon. La prévisualisation redéclare le pont `--cds-*` (généré depuis le framework) sur son conteneur pour suivre le thème ÉDITÉ. Pas de shadcn, pas de composant propre au Studio. |

## Phases

### P0 — Cadrage & fork
Analyse TweakCN, analyse `esm-theme`, ADR ci-dessus, fork, plan, suivi.
**Tests** : `tools/theme-studio-tracking.mjs check` valide le format du suivi.

### P1 — Squelette de l'app
`packages/apps/esm-theme-studio-app` (package, rspack, vitest, tsconfig, routes, i18n fr/en, page `theme-studio`, entrée de navigation).
**Tests** : `yarn verify:nav` ; test de rendu racine.

### P2 — Modèle de thème Studio (pur, sans UI)
Chemins (`getIn/setIn/unsetIn`), couleurs (hex/hsl/oklch, échelles 50→950, contraste), registre composants/variantes/états, résolution de cascade, helpers CSS var.
**Tests** : `path`, `color`, `components`.

### P3 — Catalogue de contrôles & niveaux
Catalogue Simple/Avancé/Expert (fondations, surfaces, layout, composants × variantes × états) généré depuis les registres + feuilles du thème.
**Tests** : `catalog`.

### P4 — Store d'édition
Brouillon, undo/redo (coalescence), mode light/dark, sélection (global/catégorie/composant/variante/état), overrides vs. base, dirty.
**Tests** : `store`.

### P5 — Adaptateur TweakCN
`ThemeStyles` ↔ EGEN, import CSS (`:root`/`.dark`), registry JSON TweakCN, export CSS shadcn, détection de format.
**Tests** : `tweakcn-adapter`, `import-export`.

### P6 — Import / Export / Validation / Bibliothèque
Validation (CSS-safe, couleurs, échelles), normalisation d'import (EGEN, TweakCN, CSS, thème généré), export JSON complet, bibliothèque (créer, dupliquer, supprimer, activer) via `ThemeStorage`.
**Tests** : `validation`, `library`.

### P7 — Pont runtime
`ThemeRuntimePort` + `EsmThemeRuntime` (aperçu scopé, apply/revert global) + sélecteur TokiForge.
**Tests** : `runtime`.

### P8 — UI de l'éditeur
Contrôles (couleur, longueur, texte, police, ombre), navigation par niveaux, panneaux, barre d'actions, éditeur expert.
**Tests** : composants (React Testing Library).

### P9 — Prévisualisation / vitrine du Design System
Showcase : boutons × variantes × états, champs, cartes, tableaux, menus, badges, notifications, dialogues, navigation, typographie. Alimenté par le registre de composants.
**Tests** : rendu + variables CSS.

### P10 — Intégration native & clôture
Route + navigation, permissions, lien depuis Paramètres › Apparence, README, guide utilisateur, vérification complète (`verify`).
**Tests** : `verify`, tests d'intégration.

## Règles de travail multi-développeurs
- Une phase = un verrou dans `TRACKING.md` (`node tools/theme-studio-tracking.mjs claim P4 <nom>`).
- Une phase n'est cochée qu'avec ses tests verts (`complete P4`).
- Commit + push sur `feat/theme-studio` à chaque validation de phase.

### P11 — Alignement shell : routes, rail, TopBar, 404, états
`pages.ts` (source unique des pages), `routes.json` (rail, menu Applications, entrées TopBar groupées), exclusion du 404 + garde-fou CI, routage page↔URL, services singleton, brouillon/préférences persistés, mode synchronisé.
**Tests** : `pages.test` (cohérence routes.json↔pages), `check-nav-routes` (404), `services.test`, `draft.test`, `use-routed-page.test`.

### P12 — Pages d'édition en Carbon/EGEN
Pages Essentiels, Couleurs, Typographie, Formes, Mise en page, Effets, Composants, Mes thèmes, Autres tokens, JSON ; barre d'actions ; contrôles Carbon ; UX deux colonnes (contrôles | aperçu) de TweakCN. Sans accueil ni login.
**Tests** : `studio-app.test` (niveaux, pages, undo/redo, bibliothèque, import, erreur isolée).

### P13 — Prévisualisation avec composants Carbon réels
Pont `--cds-*` scopé (`tools/theme-studio-sync-bridge.mjs` → `carbon-bridge.generated.ts`), onglets Composants/Formulaires/Données/Typographie/Couleurs.
**Tests** : `carbon-scope.test`, rendu Carbon réel dans `studio-app.test`.

### P14 — Frontières, documentation, clôture
Guide : responsabilités Studio/TokiForge/composants, inventaire TweakCN, états, procédure d'ajout d'une route.
