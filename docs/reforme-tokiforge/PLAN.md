# Réforme TokiForge — inventaire et plan par phases

Références : `refonte-systeme-design.md` (framework, 11-11) et `ajustement-reforme-configuration.md` (framework, 11-17, §3.4 et §12).

## 1. Ce qu'est TokiForge (vérifié)

- **Amont** : projet open source MIT `github.com/TokiForge/tokiforge` — **bibliothèque** : `@tokiforge/core` (`ThemeRuntime`, tokens → variables CSS,
  bascule de thème à l'exécution), adaptateurs React/Vue/Svelte/Angular, CLI `tokiforge`. Ce n'est **pas** un service déployable.
- **Ce que demande la réforme (§3.4)** : deux composantes distinctes.
  - le **runtime TokiForge**, intégré au framework ESM : applique les configurations dans les applications ;
  - le **service TokiForge**, indépendant, déployé par EGEN Kernel : gestion, validation, versionnement, distribution des configurations
    reçues de Penpot et de Tweakcn. **Il n'existe pas en amont : il est à construire.**
- Ni TokiForge, ni un fork, ni un dépôt portant ce nom n'existe aujourd'hui dans le core, le framework ou le compte GitHub.
  Il n'y a donc **rien à « nettoyer »** au sens de Tweakcn ; ce qui doit disparaître est l'ancien système de thèmes maison (§2).

## 2. L'ancien système à remplacer : `@egen-civitas/esm-theme` (framework, v1.1.0)

~1 700 lignes : `ThemeEngine`, aplatissement en variables CSS (`flatten`), injection (`inject`), chargement (`loader`), singleton, schéma zod, thème par défaut
`themes/theme.default.json`. API publique : `setupThemeEngine`, `getThemeEngine`, `getThemeState`, `reloadTheme`, `setThemeMode`, `toggleThemeMode`,
`applyAppThemeOverride`, `removeAppThemeOverride`, `applyGlobalThemeOverride`, `removeGlobalThemeOverride`, `flattenToCssVars`.

**Qui en dépend (mesuré)** :

| Dépôt | Où | Nature |
|---|---|---|
| framework | `esm-app-shell` (`run.ts`, `index.ejs`, `rspack.config.js`) | appelle `setupThemeEngine` (×2) et `applyAppThemeOverride` (×1) |
| framework | `esm-styleguide` (`_all/_carbon-bridge/_glass/_panel/_vars.scss`, `top-bar.component.tsx`) | variables CSS produites par le moteur |
| framework | `tooling/tailwind-preset` | variables CSS du moteur |
| core | 10 apps (`package.json`) | dépendance déclarée ; **aucune n'appelle l'API** (couplage faible) |
| core | `esm-appearance-app`, `esm-login-app`, `esm-settings-app` | composants liés à l'apparence |

Le couplage réel est donc concentré dans le **shell** et le **styleguide**, pas dans les apps du core.

## 3. État d'avancement (mis à jour)

**Décisions prises** : (1) le format de thème est celui de **Tweakcn**, déjà déployé ; TokiForge l'adopte tel quel et il pourra s'enrichir ensuite (métadonnées, clés supplémentaires) ;
(2) le service est un projet autonome ; (3) les composants de base existants suffisent.

**Licence — point bloquant résolu** : `@tokiforge/core` est passé de MIT (≤ 1.1.2) à **AGPL-3.0** (≥ 1.2.0, 10/12/2025) ; le dépôt amont n'affiche plus de licence claire.
L'AGPL imposerait de publier le code de tout ce qui l'embarque, y compris par usage réseau. Le projet EGEN repose donc sur l'**état MIT** (commit `70ea8b2`, 12/11/2025), sans jamais fusionner les commits suivants.

| Phase | Contenu | Statut |
|-------|---------|--------|
| TF0 | Inventaire et plan | fait |
| TF1 | Composants UI ESM Tailwind/TSX | présents sur `main` du framework (Carbon/SCSS retirés) |
| TF2a | **Noyau + runtime** : dépôt `amourgit/egen-tokiforge` (branche `feature/reforme-tokiforge`) : contrat de thème = format Tweakcn, rendu CSS **identique à l'octet près** à celui du générateur de Tweakcn (9 thèmes, hsl et oklch), runtime navigateur (`.dark`, surcharges globales/par zone), adaptateur React | fait, testé (95 tests) |
| TF3 | **Service** (même dépôt, `packages/service`) : réception push + pull de Tweakcn, validation, versionnement, publication, retour arrière, affectations par application, distribution `ETag`/CSS, événements SSE, clés d'API, audit, Docker | fait, testé (47 tests d'intégration sur PostgreSQL réel) |
| TF2b | **Bascule du framework** : remplacer `@egen-civitas/esm-theme` par le runtime, migrer le contrat de variables, supprimer l'ancien moteur | **à faire — décisions requises (§4)** |
| TF4 | Penpot ↔ composants | hors périmètre actuel |

## 3bis. Constat du 19/11 : ce qui est réellement branché aujourd'hui

Vérifié dans le code (framework `main` et core `main`) :

- Le shell (`esm-app-shell/src/run.ts`) construit sa liste de thèmes à partir de **deux sources** : `theme.default.json` (livré avec le shell, **ancien schéma**) et, en option,
  `window.egenThemeUrls[]` (URLs de thèmes au même ancien schéma). `esm-theme` les télécharge, les valide (zod), les fusionne par priorité et injecte des variables CSS.
  Le README du core décrit de même un `themeUrl: '/themes/<tenant>.json'` par tenant.
- **Aucun appel à TokiForge n'existe** dans le core ni dans le framework ; TokiForge n'est cité que dans les documents.
- Conséquence : la chaîne **Tweakcn → TokiForge (service, fait) → Core** n'est pas branchée. Le dernier maillon manque : un runtime dans le shell qui lit le thème effectif auprès de
  TokiForge (`GET /v1/resolve?app=…`) et l'applique. C'est l'objet de TF2b.

**Architecture cible (précisée par le propriétaire du projet)** : TokiForge est un projet local autonome, **non joignable par le framework** (bibliothèque publiée sur npm). C'est le **Core déployé**
qui joint TokiForge, par configuration (URL du service). Le framework ne contient que le **runtime** (du code, sans appel réseau câblé) et des composants qui **consomment uniquement les tokens**
(variables CSS), tout en laissant chaque application étendre un composant précis avec des classes Tailwind.

**Publication** : un push sur `main` du framework publie automatiquement ses paquets sur npm (CI). Le runtime sera donc intégré **dans** le framework, en remplacement de `@egen-civitas/esm-theme`
(code MIT issu de `egen-tokiforge`, attribution conservée), plutôt que d'ajouter un paquet séparé. Toute livraison sur `main` du framework devant être sûre, elle n'est poussée qu'après validation complète.

## 3ter. Avancement du 20/11 (dépôt `amourgit/egen-tokiforge`, branche `feature/reforme-tokiforge`)

Architecture validée : **Penpot** (conception) · **Tweakcn** (édition de thème) · **TokiForge** (cycle de vie, versions, couches, surcharges, distribution) ; le **backend du Core** appelle TokiForge avec une clé serveur,
le navigateur ne parle qu'au Core. Détail : `docs/ARCHITECTURE.md` du dépôt TokiForge.

Livré et testé (276 tests dont 17 de bout en bout Tweakcn → TokiForge → Core → navigateur) :
- faille d'**injection CSS** découverte et corrigée (grammaire stricte des valeurs, garde en profondeur) ;
- `schemaVersion`, métadonnées, provenance par version ; couches app > tenant > global ; **surcharges par utilisateur** (portée réservée au backend du Core, liste blanche, plafond, garde-fou de contraste, refiltrage à la résolution) ;
- projection **DTCG** sans perte (Penpot, Style Dictionary) ; accusés « thème réellement appliqué » ; backend de référence du Core (harnais d'essai) ;
- image Docker du service (étapes rejouées à la main ; `docker build` non exécuté).

À faire, dans l'ordre : (1) modèle canonique à trois niveaux (primitives → sémantiques → composants) et clés d'extension (verre/panneaux, success/warning/info) ; (2) bascule du framework (TF2b, §4) avec runtime intégré à `esm-theme` ;
(3) câblage du vrai backend du Core ; (4) import DTCG depuis Penpot et sorties mobile via Style Dictionary (si le besoin mobile est confirmé).

## 4. TF2b — mesure du chantier (framework, `main`)

Sur `main` (Carbon/SCSS déjà retirés), le preset Tailwind v4 relie déjà les noms sémantiques shadcn (`bg-background`, `text-foreground`, `border-border`…) à l'ancien moteur par
un unique pont (`--color-background: var(--colors-surface-background, …)`). L'ancien contrat reste consommé **directement** à **816 occurrences, 134 variables, 42 fichiers**
(hors `esm-theme`). Classement par rapport au format Tweakcn :

| Classe | Occurrences | Traitement proposé |
|---|---|---|
| A — équivalent direct ou dérivé (`surface-foreground`→`foreground`, `border-default`→`border`, `on-primary`→`primary-foreground`, `border-radius-*`→dérivés de `--radius`, `shadows-*`→ombres Tweakcn…) | 424 (51 %) | remplacement par règles |
| B — `error-*` → `destructive` (+ nuances dérivées) | 36 (4 %) | règle |
| C — échelles `primary-50…950`, `neutral-50…950` | 117 (14 %) | dérivées par `color-mix` depuis les clés du thème |
| E — constantes : typographie, transitions, animations, z-index | 131 (16 %) | sorties du thème dynamique, déclarées une fois dans le preset Tailwind |
| D — **absents de Tweakcn** : verre/translucide/panneaux (69), `success`/`warning`/`info` (27) | 96 (11 %) | **décision de conception** |
| F — divers (`surface-overlay`, `skeleton`, `secondary-*`) | 12 (1 %) | cas par cas |

À cela s'ajoutent 13 classes Tailwind à échelle (`bg-primary-500`…) dans 4 fichiers, et l'appel du shell (`setupThemeEngine`, `applyAppThemeOverride`).

**Situation des branches** : `main` du framework a **12 commits d'avance** (dont la suppression de Carbon/SCSS) sur `feature/ajustement-reforme`, qui n'a que le document de réforme.
La bascule doit partir de `main`, dans une branche dédiée, et non de l'ancien styleguide.

**Publication** : les paquets du framework sont publiés sur npm (`@egen-civitas/*`, changesets). Le framework ne pourra consommer `@egen-civitas/tokiforge-core` qu'une fois ce paquet publié par ta CI.

### Décisions requises
1. **Verre / translucide / panneaux (69 occ.)** : (a) clés d'extension dans le contrat (valeurs par défaut fournies par TokiForge, non éditables dans Tweakcn) — *recommandé, cohérent avec « le format s'enrichira »* ; (b) supprimer l'effet ; (c) le rendre statique.
2. **`success` / `warning` / `info` (27 occ.)** : clés d'extension (`success`, `success-foreground`…), avec défauts — *recommandé*.
3. **Échelle `neutral` (≈ 80 occ.)** : dérivée de `background`/`foreground` par `color-mix` — *recommandé*.
4. **Base de travail** : `main` du core et du framework (confirmé). Travail préparé sur une branche, poussé sur `main` du framework seulement une fois validé (push = publication npm).
5. **Emplacement du runtime** : intégré au framework en remplacement d'`esm-theme` (recommandé, aucun nouveau paquet à publier).
