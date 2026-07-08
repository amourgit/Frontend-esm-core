# Système de thème EIGEN — État des corrections

Généré le : 2026-07-08

---

## ✅ FAIT — Corrections appliquées

### 1. URL du fichier JSON — ROOT CAUSE du "rien ne change"
**Fichier** : `packages/shell/esm-app-shell/src/run.ts`

**Problème** :
```ts
// AVANT — cassé
new URL('./assets/themes/theme.default.json', import.meta.url).href
```
`import.meta.url` pointe vers le **bundle JS** dans rspack, pas le HTML.
La résolution donnait `/assets/themes/theme.default.json` alors que
CopyPlugin place le fichier à `/themes/theme.default.json` → **404 silencieux
→ fallback embarqué → le JSON n'était JAMAIS lu → aucun changement visible.**

**Correction** :
```ts
// APRÈS — correct
function resolveThemeUrl(filename: string): string {
  const publicPath = (window as any).egenPublicPath
    ?? (window as any).__webpack_public_path__ ?? '';
  const base = publicPath
    ? `${window.location.origin}/${publicPath.replace(/^\/|\/$/g, '')}/`
    : document.baseURI || `${window.location.origin}/`;
  return new URL(`themes/${filename}`, base).href;
}
```

---

## 🔴 RESTE À FAIRE — Priorité haute

### 2. SCSS : variables CSS codées en dur dans les composants
Plusieurs fichiers SCSS utilisent encore des valeurs directes (Carbon tokens, hex, px)
au lieu des CSS vars `var(--...)` générées par le moteur de thème.

**Fichiers concernés identifiés** :
- `esm-primary-navigation-app/src/components/navbar/navbar.scss`
  - `@include brand-02(background-color)` → `var(--panel-header-background)`
  - `@include brand-01(background-color)` → `var(--colors-primary-600)`
- `esm-login-app/src/login/login.scss` — certains tokens Carbon directs
- `esm-styleguide/src/components/_general.scss` — valeurs de layout fixes

**Action** : audit de chaque composant livré, remplacement systématique.

### 3. Validation stricte du schéma JSON bloque des valeurs CSS légitimes
**Fichier** : `packages/framework/esm-theme/src/flatten.ts`

`SAFE_CSS_VALUE_RE` = `^[a-zA-Z0-9 ,.#%()_+\-:/!'"]*$`

Bloque des valeurs CSS modernes légitimes :
- `color-mix(in srgb, var(--x) 10%, transparent)` — `in srgb` manque de support
- `backdrop-filter: blur(8px)` (ok ici mais regex à surveiller)
- Les `&` dans les polices web (ex: `Poppins & sans-serif`)
- Valeurs avec crochets : `env(safe-area-inset-top, 0px)`, `calc(var(--x) + [value])`

**Action** : élargir le regex ou remplacer par une liste d'exclusion.

### 4. `applyAppThemeOverride()` — non utilisé dans les apps
**Fichier** : `packages/framework/esm-theme/src/index.ts`

La fonction est exportée mais **aucune app ne l'appelle** pour appliquer
des surcharges de thème par tenant. Le système de surcharge est en place
mais non câblé.

**Action** : câbler dans `esm-tenant-routing-app` — après résolution tenant,
appeler `applyAppThemeOverride(tenantThemeUrl)` si le tenant a un thème custom.

### 5. `data-theme` — attribut non défini par défaut sur `<html>`
Le système `inject.ts` applique les vars sur `:root[data-theme="dark"]`
et `:root[data-theme="light"]` mais `<html>` n'a pas `data-theme` par défaut
au démarrage du shell.

**Action** : dans `run.ts`, ajouter `document.documentElement.setAttribute('data-theme', 'dark')`
avant l'initialisation du thème (ou lire une préférence système via `prefers-color-scheme`).

### 6. Pas de rechargement à chaud (HMR) du JSON de thème
Modifier le JSON et redémarrer le shell ne change rien parce que le fetch
est fait une seule fois au démarrage. Il faudrait un watcher en dev.

**Action** : en mode développement, utiliser un `setInterval` ou le websocket HMR
pour recharger le thème si le JSON change.

---

## Architecture du système (référence)

```
theme.default.json
  ↓ loader.ts (fetch + validateThemeJson)
  ↓ flatten.ts (JSON → { '--colors-primary-500': '#3b82f6' })
  ↓ inject.ts (applyThemeVars → style[data-theme="dark"] { --x: y })
  ↓ DOM <html data-theme="dark"> → CSS vars actives
  ↓ Composants SCSS → var(--colors-primary-500) → valeur du JSON
```

**Point d'entrée** : `run.ts` → `setupThemeEngine({ themeUrls, ... })`
**Clé de convention** : `colors.primary.500` → `--colors-primary-500`
(séparateur `.` → `-`, tirets conservés)
