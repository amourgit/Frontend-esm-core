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

## 🟡 Reste à faire / audit plus large (hors périmètre `esm-theme` strict)

Un grep exhaustif (`#[0-9a-f]{3,8}` hors `var(...)`) sur tout `packages/apps`,
`packages/shell`, `packages/framework` remonte encore ~20 fichiers `.scss`
avec des couleurs hex directes, notamment dans `esm-offline-tools-app`,
certaines pages marketing de `esm-home-app`, et des composants d'
`esm-styleguide` secondaires (`workspaces2`, `action-menu-button`,
`location-picker`). Ceux consommant `--brand-01/02/03` bénéficient déjà
indirectement de la correction du §8. Les autres n'ont pas été traités dans
cette session (priorité donnée à `esm-theme` lui-même et aux fichiers les
plus visibles/actifs) — à auditer fichier par fichier si un contrôle "zéro
hex en dur" strict est requis sur l'ensemble du monorepo.

`applyAppThemeOverride` (scope par app via `data-egen-app`) reste disponible
mais volontairement non utilisé par défaut par aucune app — c'est une
capacité opt-in du framework, pas un défaut bloquant (contrairement à la
surcharge tenant du §3, qui elle était réellement cassée).

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
