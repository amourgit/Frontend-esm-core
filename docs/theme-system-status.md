# Système de thème EGEN/EGEN — État des corrections

Généré le : 2026-07-08
Mis à jour le : 2026-07-09 — audit complet + corrections `packages/framework/esm-theme` et environs

---

## ✅ FAIT — Corrections appliquées (session du 2026-07-09)

### 1. URL du fichier JSON — déjà corrigé (commit précédent)
`resolveThemeUrl()` dans `run.ts` résout correctement l'URL via `egenPublicPath` /
`document.baseURI` plutôt que `import.meta.url`. Toujours valide. Nettoyage
cosmétique d'une alternance dupliquée dans la regex (`^\/` apparaissait deux fois).

### 2. ROOT CAUSE réelle du "je change le JSON et rien ne change" : deux fichiers `theme.default.json`
**C'était le vrai bug**, distinct de celui déjà corrigé en (1).

Deux copies existaient et avaient **divergé silencieusement** :
- `packages/framework/esm-theme/src/themes/theme.default.json` (la copie "logique",
  celle qu'on édite naturellement en pensant travailler sur le système de thème)
- `packages/shell/esm-app-shell/src/assets/themes/theme.default.json` (copie
  indépendante, copiée en dur au build par `CopyRspackPlugin` depuis `src/assets`,
  **et c'est UNIQUEMENT celle-ci que le shell servait réellement** au runtime)

Preuve trouvée : `typography.fontSize.xs.size` valait `"12rem"` (192px !) dans la
copie « framework », `"0.75rem"` dans la copie « shell » réellement servie — la
modification faite sur le fichier "source" n'avait donc **jamais atteint le
navigateur**, quel que soit le nombre de redémarrages.

**Correction (source unique de vérité)** :
- Suppression pure et simple de `packages/shell/esm-app-shell/src/assets/themes/theme.default.json`.
- `rspack.config.js` : `CopyRspackPlugin` copie désormais directement
  `packages/framework/esm-theme/src/themes/` → `dist/themes/` (constante
  `themeSourceDir`).
- `devServer.static` sert ce même dossier en dev à `${egenPublicPath}/themes`
  → une modification sur disque est immédiatement visible (lecture fichier à
  chaque requête HTTP), sans rebuild, complétant le hot-reload par polling (§6).
- Correction du typo `12rem` → `0.75rem` trouvé dans la copie canonique.

**Il n'existe plus qu'un seul fichier JSON de thème dans tout le monorepo.**

### 3. Surcharge de thème par tenant — silencieusement sans effet
**Fichier** : `run.ts` (`registerTenantThemeApplier`) + `engine.ts`

`applyAppThemeOverride('tenant-xxx', schema)` injectait du CSS scopé au
sélecteur `[data-egen-app="tenant-xxx"]` — **mais aucun élément du DOM ne pose
jamais cet attribut**. La CSS générée était syntaxiquement correcte et bien
injectée dans le `<head>`, mais ne ciblait littéralement aucun élément :
surcharge tenant 100% invisible, sans la moindre erreur console.

**Correction** : nouveau mécanisme `applyGlobalOverride` / `removeGlobalOverride`
/ `getGlobalOverrides` dans `ThemeEngine`, exposé via
`applyGlobalThemeOverride` / `removeGlobalThemeOverride` au niveau package.
Il réutilise exactement la même mécanique de fusion par priorité que les
surcharges par app, mais injecte sur `targetSelector` (`:root`) au lieu d'un
sélecteur `[data-egen-app]` — donc actif immédiatement, sans configuration DOM
supplémentaire. `run.ts` a été mis à jour pour l'utiliser. Tests unitaires
ajoutés dans `engine.test.ts`.

`applyAppThemeOverride` reste disponible tel quel pour un cas différent : une
**app microfrontend spécifique** qui veut une surcharge locale à elle seule —
dans ce cas, c'est à cette app de poser `data-egen-app="<scope>"` sur son
conteneur racine (voir §4 plus bas, "reste à faire").

### 4. Regex de sécurité CSS trop stricte
**Fichier** : `flatten.ts` — `SAFE_CSS_VALUE_RE`

Élargie pour accepter `&`, `*`, `=`, `@`, `[`, `]`, `~`, `^` (couvre
`color-mix()`, `calc(... * ...)`, empilements de polices avec `&`,
`env(..., [..])`, etc.) — **sans réduire la sécurité** : aucun de ces
caractères ne permet de fermer une déclaration/bloc CSS ni d'ouvrir un
commentaire, l'invariant documenté dans le fichier reste garanti. Validé par
un test de caractères (chaînes valides vs. tentatives d'échappement).

### 5. `data-theme` par défaut — déjà résolu (commit précédent)
Script anti-FOUC dans `index.ejs` pose `data-theme` sur `<html>` avant le
chargement de la CSS (lit une préférence persistée sinon `dark` par défaut).
Toujours en place, rien à faire.

### 6. Hot-reload du JSON — déjà résolu (commit précédent), et renforcé ici
`ThemeEngine` supporte déjà `pollIntervalMs` (4000ms en dev via `run.ts`,
`NODE_ENV === 'development'`) : re-fetch périodique et ré-application si le
contenu a changé. Combiné à la correction du §2 (`devServer.static` servant le
fichier canonique directement depuis le disque), éditer le JSON en dev le
répercute maintenant réellement à l'écran en quelques secondes, sans rebuild
ni redémarrage.

### 7. Tokens `colors.onPrimary` / `colors.onSecondary` manquants
Plusieurs composants (`navbar.scss` de `esm-home-app`, `context-switcher.scss`
de `esm-primary-navigation-app`) codaient `color: #fff;` en dur faute de
token dédié pour « texte lisible sur fond primaire ». Ajout de
`colors.onPrimary` / `colors.onSecondary` dans `theme.default.json` et dans
le type `ThemeSchema`. Composants migrés vers
`var(--colors-on-primary, #fff)` (le `#fff` restant n'est qu'un *fallback*
CSS natif pour la fenêtre avant hydratation du moteur, pas une valeur figée).

### 8. Palette « brand » historique (OpenMRS) totalement déconnectée du thème
**Fichier** : `esm-styleguide/src/_vars.scss`

`--brand-01/02/03` étaient des couleurs teal OpenMRS **figées en dur**
(`#005d5d`, `#004144`, `#007d79`), consommées par ~20 composants actifs via
`@include brand-01/02/03(...)` (nav latérale offline-tools, workspaces,
boutons d'action, sélecteur de localisation, focus rings, `_overrides.scss`…).
Modifier `colors.primary.*` dans le JSON de thème n'avait **strictement aucun
effet** sur tous ces composants.

**Correction** : `--brand-01/02/03` pointent maintenant vers l'échelle
dynamique `--colors-primary-600/700/500` injectée par `@egen/esm-theme`,
l'ancienne valeur OpenMRS n'étant conservée que comme *fallback* `var(x, ...)`.
Effet immédiat sur les ~20 composants consommateurs, sans modifier chacun
individuellement.

### 9. Autres valeurs codées en dur corrigées au passage
- `_general.scss` (`.egen-app-error`) : `background: white` /
  `border-top: 5px solid $danger` → `var(--colors-surface-background, white)` /
  `var(--colors-error-500, $danger)` (fallback conservé : cette page peut
  s'afficher précisément quand le moteur de thème a lui-même échoué).
- `context-switcher.scss` : `font-size: 0.75rem` → `var(--typography-font-size-xs-size, 0.75rem)`.

---

### 10. Pont Carbon ↔ EGEN + migration exhaustive du hex codé en dur (session du 2026-07-10)

**Cause racine #2 diagnostiquée** — indépendante de tout ce qui précède,
expliquant les modales/boutons Carbon natifs *totalement transparents*
(pas juste "gris clair") :

Les composants Carbon (`Modal`, `Button`, `Dropdown`, `DataTable`, `Tile`,
`ContentSwitcher`...) résolvent leurs couleurs de surface/bordure via
`custom-property.get-var('layer')` etc. (voir
`@carbon/styles/scss/theme/_theme.scss`), qui compile en `var(--cds-layer)`
**sans aucun fallback**. Or `@include theme.theme(...)` — le mixin qui
définit réellement `--cds-*` sur `:root` — n'était appelé **nulle part**
dans le monorepo, à une exception : un appel isolé et scopé à `.darkTheme`
dans `esm-implementer-tools-app` (thème Carbon `g90` **statique**, sans
lien avec le JSON EGEN). Partout ailleurs, `--cds-layer` était donc
strictement indéfini → `background-color` retombe sur sa valeur initiale
CSS, `transparent`.

**Correctif** :
- Nouveau fichier `packages/framework/esm-styleguide/src/_carbon-bridge.scss` :
  définit ~90 variables `--cds-*` (familles layer/field/border/background/
  text/icon/interactive/focus/support/skeleton/button) sur `:root`, chacune
  redirigée vers son équivalent `var(--colors-*, --panel-*)` du thème EGEN.
  Intégré dans `_all.scss` juste après `@forward '@carbon/styles'`.
- `esm-implementer-tools-app/implementer-tools.styles.scss` : suppression de
  l'appel `@include theme.theme(themes.$g90)` scopé à `.darkTheme` (racine
  de toute l'app) — il gouverne désormais via le pont global comme le reste
  de l'application, au lieu d'un thème Carbon figé local qui écrasait tout.

**Migration exhaustive du hex codé en dur** (directive : plus aucune valeur
figée nulle part, uniquement des fallbacks `var(x, fallback)`) :
- `_vars.scss` : les ~25 variables restantes ($ui-01→05, $text-02/03,
  $color-gray-*, $color-blue-*, $carbon--red-50, $inverse-link, $support-02,
  $warning-background, $egen-background-grey, $danger, $interactive-01,
  $field-01, $grey-2, $labeldropdown, $brand-primary-10→100, + les 3
  variables dépréciées $brand-teal-01/$brand-01/$brand-02) migrées vers
  `var(--colors-*, fallback)`, même pattern que `--brand-01/02/03` (§8).
  Se propage automatiquement aux ~15 fichiers consommateurs sans les
  toucher un par un.
- `components/_colors.scss` (`--egen-color-*`) : système de couleurs
  parallèle orphelin (0 consommateur trouvé dans tout le monorepo),
  entièrement migré par cohérence plutôt que supprimé.
- Fichiers avec hex ponctuel corrigé un par un : `entity-photo.module.scss`,
  `workspaces2/workspace2.module.scss`, `_overrides.scss` (bordure RTL +
  onglets actif/activé + bouton notification tertiaire), 4 fichiers
  `esm-implementer-tools-app` (dont un `@use '@carbon/colors'` direct avec
  `rgba(colors.$blue-70/$green-70, ...)`, remplacé par
  `color-mix(in srgb, var(--colors-primary-600/--colors-success-600) X%,
  transparent)`), `esm-home-app` (pricing/testimonials/hero/cta/home,
  tous des `color: #fff` sur fond dégradé primaire → `var(--colors-on-primary,
  #fff)`), `esm-tenant-routing-app/suspended.scss`, `esm-login-app/footer.scss`,
  3 fichiers `esm-offline-tools-app`, et 2 boutons de topbar
  `esm-primary-navigation-app` (badges notifications/raccourcis).
- **Volontairement NON migré** : `esm-styleguide/logo/_logo.scss`
  (`--logo-red/orange/purple/green/black` etc.) — ce sont des couleurs
  d'**identité de marque figée** (variantes full-color/mono/grey/white du
  logo), pas des couleurs de surface de thème ; les rediriger vers
  `--colors-primary-*` changerait la couleur de la marque à chaque
  personnalisation de palette, ce qui n'est pas souhaitable.

Audit final : `grep -rE "#[0-9a-f]{3,8}" packages/{apps,shell,framework}
--include="*.scss"` ne remonte plus que des fallbacks `var(x, fallback)`
et le logo (exception documentée ci-dessus).

---

## 🟡 Reste à faire

Aucun fichier `.scss` connu dans `packages/apps`, `packages/shell` ou
`packages/framework` ne contient plus de couleur hex codée en dur hors
fallback `var(...)` (voir §10). Si une régression réapparaît, relancer
l'audit avec la commande ci-dessus.

`applyAppThemeOverride` (scope par app via `data-egen-app`) reste disponible
mais volontairement non utilisé par défaut par aucune app — c'est une
capacité opt-in du framework, pas un défaut bloquant (contrairement à la
surcharge tenant du §3, qui elle était réellement cassée).

**Point de vigilance pour la suite** : `_carbon-bridge.scss` couvre les
tokens `--cds-*` les plus consommés (layer/field/border/background/text/
icon/interactive/focus/support/skeleton/button), pas l'intégralité des
~150+ tokens du design system Carbon. Si un composant Carbon spécifique
affiche encore une couleur non branchée, vérifier d'abord si le token
`--cds-*` qu'il consomme est bien défini dans ce fichier — sinon l'ajouter
en suivant le même pattern (`var(--colors-x, fallback-carbon)`).

---

## Architecture du système (référence, mise à jour)

```
packages/framework/esm-theme/src/themes/theme.default.json   ← SOURCE UNIQUE
  ↓ (build: CopyRspackPlugin copie vers dist/themes/)
  ↓ (dev: devServer.static sert ce dossier directement, lu depuis le disque)
  ↓ loader.ts (fetch + validateThemeJson, zod)
  ↓ flatten.ts (JSON → { '--colors-primary-500': '#3b82f6' }, SAFE_CSS_VALUE_RE)
  ↓ inject.ts (applyThemeVars → style[data-theme="dark"] { --x: y })
  ↓ DOM <html data-theme="dark"> (posé anti-FOUC dans index.ejs) → CSS vars actives
  ↓ engine.ts : pollIntervalMs (dev) → re-fetch périodique → hot-reload
  ↓ engine.ts : applyGlobalOverride (tenant, priorité) → injecté sur :root
  ↓ engine.ts : applyAppOverride (app scope, opt-in) → injecté sur [data-egen-app="..."]
  ↓ Composants SCSS → var(--colors-primary-500) → valeur du JSON
```

**Point d'entrée** : `run.ts` → `setupThemeEngine({ themeUrls, pollIntervalMs, ... })`
**Clé de convention** : `colors.primary.500` → `--colors-primary-500`
(séparateur `.` → `-`, tirets conservés)
**Surcharge globale (tenant)** : `applyGlobalThemeOverride(schema, { id, priority })`
**Surcharge par app (opt-in)** : `data-egen-app="scope"` sur le conteneur +
`applyAppThemeOverride('scope', schema)`
