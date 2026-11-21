# 14 — Plan de migration Carbon / SCSS du Core (écart E1)

Mesures faites sur `main` (28 apps) par script, comparées à la table officielle du Framework (`fw/docs/MIGRATION-CARBON.md`) et aux exports de `esm-styleguide` 5.x. **Le HEAD du Framework n'a plus ni Carbon ni SCSS** ; le Core consomme encore `esm-framework 4.1.0` / Shell 2.11.1 / `rspack-config 1.2.0` (qui les fournissent). Tant que cette migration n'est pas faite, **ne pas relever les versions majeures** (08, E1).

## 1. Ampleur réelle (✅ mesurée)

| Mesure | Valeur |
| --- | --- |
| Fichiers important `@carbon/react` | **44**, dans **7 apps seulement** |
| Composants Carbon distincts utilisés | 50 + 9 noms d'icônes (`@carbon/react/icons`) |
| Apps déclarant `@carbon/react` dans `package.json` | 27 ; **20 d'entre elles n'importent plus rien** (dépendance obsolète) |
| Fichiers SCSS | **74**, dont 42 référencent Carbon (variables, `@use '@carbon/…'`) |
| Apps sans aucun Carbon ni SCSS | 6 (`annuaire`, `appearance`, `not-found`, `search`, `sites`, `tenant-routing`) |
| Tailwind déjà en place | 2 fichiers `*.tw.css`, 5 apps l'ont dans leur `package.json` |

Répartition (fichiers Carbon / fichiers SCSS) : `implementer-tools` 18/17 · `offline-tools` 12/16 · `login` 5/5 · `help-menu` 3/2 · `language` 2/2 · `devtools` 2/3 · `user-profile` 2/1. Les 21 autres apps : 0 import Carbon ; SCSS seul pour 15 d'entre elles (0 à 5 fichiers chacune).

## 2. Couverture par le styleguide 5.x

| Catégorie | Composants Carbon utilisés | Remplacement |
| --- | --- | --- |
| **A. Table officielle / même nom** (31) | `Button`, `Tile`, `Layer`, `InlineLoading`, `Loading`, `Link`, `TextInput`, `Toggle`, `Tag`, `Modal*` (Header/Body/Footer), `InlineNotification`, `StructuredList*`, `DataTable`, `Table*`, `TableContainer`, `Pagination`, `Accordion*`, `Checkbox`, `PasswordInput`, `Switch` | `Button` (`variant`), `Tile`, `Layer`, `InlineLoading`, `Spinner`, `Link`, `TextInput`, `Switch`, `Badge`, `ModalHeader/Body/Footer` ou `Dialog`, `NotificationBanner`/`Alert`, `Table*`, `Pagination`, `Accordion*`, `Checkbox`, `PasswordInput` |
| **B. Équivalent existant, hors table** (6) ✅ export vérifié | `Search`, `RadioButton`, `RadioButtonGroup`, `SkeletonText`, `DataTableSkeleton`, `SearchSkeleton` | `SearchInput`, `RadioGroup`, `Skeleton` |
| **C. Écart (pas d'équivalent identifié)** (9) | `Form`, `FilterableMultiSelect`, `NumberInput`, `ContentSwitcher`, `Switcher`, `SwitcherItem`, `SwitcherDivider`, `TableSelectAll`, `TableSelectRow` | à trancher : `Select`/`Combobox` (existent) pour la multi-sélection filtrée ; `<form>` natif ; `Tabs` pour `ContentSwitcher` ; `TableBatchActions` (existe) pour la sélection ; **`NumberInput` et `Switcher` à créer dans le styleguide** |
| **D. Grille** (4) | `Stack`, `Column`, `Row`, `FlexGrid` | classes Tailwind (`flex`, `grid`, `gap-*`) |
| **Icônes** (9) | `ArrowUpRight`, `Renew`, `Network_3`, `PendingFilled`, `WarningAltFilled`, `CheckmarkOutline`, `CheckmarkFilled`, `WarningFilled` + type `TileProps` | `lucide-react` ou icônes du styleguide |

Répartition mesurée des écarts C : `implementer-tools` (`FilterableMultiSelect` ×2, `NumberInput`, `ContentSwitcher`, `SwitcherItem`), `offline-tools` (`TableSelectAll`/`TableSelectRow` ×2, `SwitcherItem`), `user-profile` (`Switcher`, `SwitcherDivider`, `SwitcherItem`), `login` (`Form` ×2, `SwitcherItem` ×2), `language` (`SwitcherItem`), `devtools` (`Form`). Seuls `NumberInput` et `Switcher` supposent de **créer** un composant dans le styleguide ; le reste se remplace par des composants existants ou du HTML natif. Vérifier fichier par fichier avant d'estimer (certains `Form`/`SwitcherItem` peuvent être des noms locaux).

## 3. Plan par lots

Principe : **une app = un lot indépendant, livrable seule**, validé par `yarn verify` et un contrôle visuel. L'ordre suit le risque croissant.

| Lot | Contenu | Pourquoi |
| --- | --- | --- |
| **0 — Prérequis** | Vérifier E2 en exécution (alias déjà livrés) ; geler les versions du Framework ; figer l'état visuel (captures) | pas de régression silencieuse |
| **1 — Nettoyage** (20 apps) | retirer `@carbon/react` (dependencies/peerDependencies) des apps qui n'importent plus rien | risque nul ; réduit le partage Module Federation inutile |
| **2 — SCSS sans Carbon** (≤ 15 apps, 0–5 fichiers) | convertir en CSS Modules/Tailwind (`*.module.css` reste géré par la config) | prépare le retrait de la règle SCSS |
| **3 — Pilote** : `devtools` (2 fichiers, `Form` natif), puis `language`, `help-menu` ; `user-profile` seulement après création de `Switcher` | premiers remplacements A/B, validation de la méthode | petits périmètres, sans écart C bloquant |
| **4 — `login`** (5/5) | écran critique : tests renforcés | forte exposition |
| **5 — `offline-tools`** (12/16) | inclut une part des écarts C | |
| **6 — `implementer-tools`** (18/17) | le plus gros ; dépend de `NumberInput` (à créer dans le styleguide) ; `user-profile` dépend de `Switcher` | |
| **7 — Bascule** | `esm-framework` 5.x, Shell 3.x, `rspack-config` 2.x, `egen` 3.x ; retrait de `sass`, `@carbon/react`, `.scss` ; `yarn deps:egen` | à faire **une fois tout migré** |

Critères de sortie du lot 7 : `grep -r "@carbon" packages/apps` vide, `find -name '*.scss'` vide, `yarn verify` vert, build et démarrage de production OK avec les nouvelles majeures.

## 4. Points d'attention

- Le Shell 3.x **ne partage plus `@carbon/react`** : une app qui l'embarquerait encore créerait sa propre copie (poids et styles).
- Les apps **externes** (05) doivent suivre le même contrat : pas de dépendance à Carbon fournie par le Shell.
- `peerDependencies` du Core à `>=3.0.0` : à resserrer au moment de la bascule (08, E4), sinon le garde-fou `frameworkRange` reste neutralisé.
- Les écarts C sont un **besoin côté Framework** (nouveaux composants), à planifier avant le lot 6.
