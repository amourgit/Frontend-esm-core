# PHASE 1 — Renommage du Namespace `@egen` → `@eigen`

> Durée estimée : 1-2 jours
> Branche : `eigen/phase-1-namespace`
> Objectif : Remplacer tous les identifiants `egen` dans les noms de packages, les imports, et les variables internes, SANS casser le système de build.

---

## ⚠️ AVERTISSEMENT CRITIQUE

Le renommage de namespace est une opération **à haut risque** si mal exécutée.

**La règle** : On procède **package par package**, en commençant par les feuilles (packages sans dépendants internes) et en remontant vers le shell.

**L'ordre correct de renommage** (du bas vers le haut) :

```
1. esm-utils           (aucune dépendance interne)
2. esm-error-handling  (aucune dépendance interne)
3. esm-globals         (aucune dépendance interne)
4. esm-state           (dépend de esm-globals)
5. esm-config          (dépend de esm-utils, esm-globals)
6. esm-navigation      (dépend de esm-globals)
7. esm-api             (dépend de esm-config, esm-navigation)
8. esm-data-api         (dépend de esm-api)
9. esm-extensions      (dépend de esm-config, esm-state)
10. esm-react-utils    (dépend de esm-extensions, esm-config)
11. esm-styleguide     (dépend de esm-react-utils)
12. esm-framework      (re-export de tout)
13. esm-app-shell      (dépend de esm-framework)
14. apps/*             (dépendent de esm-framework)
15. tooling/*          (dépendent de esm-app-shell)
```

---

## 1.1 Script de renommage automatisé des `package.json`

Ce script modifie uniquement les `package.json` (pas les imports TypeScript — cela vient après).

```bash
#!/bin/bash
# EIGEN-MIGRATION/scripts/rename-packages.sh

# Mapping des noms
declare -A RENAMES=(
  ["@egen/esm-core"]="@eigen/esm-core"
  ["@egen/esm-framework"]="@eigen/esm-framework"
  ["@egen/esm-api"]="@eigen/esm-api"
  ["@egen/esm-config"]="@eigen/esm-config"
  ["@egen/esm-context"]="@eigen/esm-context"
  ["@egen/esm-dynamic-loading"]="@eigen/esm-dynamic-loading"
  ["@egen/esm-data-api"]="@eigen/esm-data-api"
  ["@egen/esm-error-handling"]="@eigen/esm-error-handling"
  ["@egen/esm-expression-evaluator"]="@eigen/esm-expression-evaluator"
  ["@egen/esm-extensions"]="@eigen/esm-extensions"
  ["@egen/esm-feature-flags"]="@eigen/esm-feature-flags"
  ["@egen/esm-globals"]="@eigen/esm-globals"
  ["@egen/esm-navigation"]="@eigen/esm-navigation"
  ["@egen/esm-offline"]="@eigen/esm-offline"
  ["@egen/esm-react-utils"]="@eigen/esm-react-utils"
  ["@egen/esm-routes"]="@eigen/esm-routes"
  ["@egen/esm-state"]="@eigen/esm-state"
  ["@egen/esm-styleguide"]="@eigen/esm-styleguide"
  ["@egen/esm-translations"]="@eigen/esm-translations"
  ["@egen/esm-utils"]="@eigen/esm-utils"
  ["@egen/esm-app-shell"]="@eigen/esm-app-shell"
  ["@egen/esm-login-app"]="@eigen/esm-login-app"
  ["@egen/esm-primary-navigation-app"]="@eigen/esm-primary-navigation-app"
  ["@egen/esm-implementer-tools-app"]="@eigen/esm-admin-tools-app"
  ["@egen/esm-devtools-app"]="@eigen/esm-devtools-app"
  ["@egen/esm-help-menu-app"]="@eigen/esm-help-menu-app"
  ["@egen/esm-offline-tools-app"]="@eigen/esm-offline-tools-app"
  ["@egen/rspack-config"]="@eigen/rspack-config"
  ["@egen/webpack-config"]="@eigen/webpack-config"
  ["@egen/storybook"]="@eigen/storybook"
)

echo "Renommage des package.json..."
find . -name "package.json" -not -path "*/node_modules/*" | while read file; do
  for old in "${!RENAMES[@]}"; do
    new="${RENAMES[$old]}"
    if grep -q "$old" "$file"; then
      sed -i "s|$old|$new|g" "$file"
      echo "  ✓ $file : $old → $new"
    fi
  done
done

echo "✅ Renommage package.json terminé"
```

---

## 1.2 Renommage des imports TypeScript

Après les `package.json`, modifier les imports dans les fichiers `.ts` et `.tsx` :

```bash
#!/bin/bash
# EIGEN-MIGRATION/scripts/rename-imports.sh

echo "Renommage des imports TypeScript..."

# Remplacer @egen/ par @eigen/ dans tous les imports
find packages -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read file; do
  if grep -q "@egen/" "$file"; then
    sed -i "s|from '@egen/|from '@eigen/|g" "$file"
    sed -i 's|from "@egen/|from "@eigen/|g' "$file"
    sed -i "s|require('@egen/|require('@eigen/|g" "$file"
    sed -i 's|require("@egen/|require("@eigen/|g' "$file"
    echo "  ✓ $file"
  fi
done

echo "✅ Renommage imports terminé"
```

---

## 1.3 Renommage dans la racine package.json

Modifier manuellement le `package.json` racine :

```json
{
  "name": "@eigen/esm-core",
  "version": "1.0.0",
  "scripts": {
    "run:eigen": "eigen",
    "run:shell": "yarn workspace @eigen/esm-app-shell watch",
    "ci:publish-next": "yarn workspaces foreach --all --topological --exclude @eigen/esm-core --exclude @eigen/storybook npm publish --tolerate-republish --access public --tag next",
    "ci:publish": "yarn workspaces foreach --all --topological --exclude @eigen/esm-core --exclude @eigen/storybook npm publish --tolerate-republish --access public --tag latest",
    "build:apps": "turbo run build --filter='@eigen/*-app'",
    "start": "eigen develop"
  }
}
```

---

## 1.4 Renommage du CLI `egen` → `eigen`

Le package `packages/tooling/egen` doit être renommé :

```bash
# 1. Renommer le dossier
mv packages/tooling/egen packages/tooling/eigen

# 2. Modifier package.json du CLI
```

Dans `packages/tooling/eigen/package.json` :
```json
{
  "name": "eigen",
  "bin": {
    "eigen": "./dist/cli.js",
    "rspack": "./bin/rspack.cjs",
    "webpack": "./bin/webpack.cjs"
  }
}
```

Dans `packages/tooling/eigen/src/cli.ts`, changer la description :
```typescript
// Changer tous les textes "Egen" → "EIGEN"
// Changer le backend par défaut :
.option('backend', {
  default: 'https://dev.eigen.ga',   // ← Ton backend EIGEN
  describe: 'The backend to proxy API requests to.',
})
```

---

## 1.5 Renommage des variables globales `window.*`

Dans `packages/framework/esm-globals/src/public.ts` :

```typescript
// Avant
interface Window {
  egenBase: string;
  getEgenSpaBase(): string;
  initializeSpa(config: SpaConfig): void;
}

// Après
interface Window {
  eigenBase: string;          // ← Renommé
  egenBase: string;        // ← GARDER temporairement pour compatibilité
  getEigenSpaBase(): string;  // ← Renommé
  getEgenSpaBase(): string;// ← GARDER temporairement
  initializeSpa(config: SpaConfig): void;
}
```

> ⚠️ **Stratégie de compatibilité** : Garde les anciens noms en alias pendant la transition. Les supprimer seulement quand toutes les références sont mises à jour.

Dans `packages/shell/esm-app-shell/src/index.ts` :

```typescript
// Ajouter un alias pour la compatibilité
Object.defineProperty(window, 'eigenBase', {
  value: config.apiUrl,
  writable: false,
  configurable: false,
});

// Alias de compatibilité (déprécié)
Object.defineProperty(window, 'egenBase', {
  get() { return window.eigenBase; },
  configurable: false,
});
```

---

## 1.6 Renommage des constantes CSS `egen-*` → `eigen-*`

Dans `packages/framework/esm-styleguide/src/components/_colors.scss` :

```scss
/* Avant */
:root {
  --egen-color-bg-high-contrast: #ffffff;
  --egen-color-brand-orange: #f26522;
}

/* Après */
:root {
  --eigen-color-bg-high-contrast: #ffffff;
  --eigen-color-brand-primary: #1a56db;   /* Couleur principale EIGEN */
  
  /* Alias de compatibilité pendant transition */
  --egen-color-bg-high-contrast: var(--eigen-color-bg-high-contrast);
}
```

Chercher toutes les occurrences `--egen-` dans le SCSS :
```bash
grep -r "\-\-egen\-" packages --include="*.scss" | wc -l
# Probablement ~200 occurrences → script de remplacement
```

```bash
find packages -name "*.scss" | while read file; do
  sed -i 's/--egen-/--eigen-/g' "$file"
  sed -i 's/egen-color-/eigen-color-/g' "$file"
done
```

---

## 1.7 DOM IDs `egen-*` → `eigen-*`

Chercher dans le HTML/TSX :

```bash
grep -r "egen-" packages/apps --include="*.tsx" --include="*.ts" --include="*.scss"
```

Exemples à changer :
- `id="egen-top-nav-app-container"` → `id="eigen-top-nav-app-container"`
- `className="egen-icon"` → `className="eigen-icon"`

Dans `packages/shell/esm-app-shell/src/index.ejs` (template HTML) :
```html
<!-- Avant -->
<div id="egen-top-nav-app-container"></div>

<!-- Après -->
<div id="eigen-top-nav-app-container"></div>
```

Et dans `packages/apps/esm-primary-navigation-app/src/routes.json` :
```json
{
  "pages": [
    {
      "containerDomId": "eigen-top-nav-app-container"
    }
  ]
}
```

---

## 1.8 Schémas JSON `routes.json`

Dans chaque `src/routes.json` des 6 apps, remplacer :

```json
// Avant
{
  "$schema": "https://json.egen.org/routes.schema.json",
  "backendDependencies": {
    "webservices.rest": ">=2.2.0"
  }
}

// Après
{
  "$schema": "../../schema/eigen-routes.schema.json",
  "backendDependencies": {
    "eigen-api": ">=1.0.0"
  }
}
```

Créer le schéma local `packages/framework/esm-routes/schema/eigen-routes.schema.json` (copier et adapter le schéma Egen).

---

## 1.9 Vérification post-Phase 1

```bash
# Lancer le script de vérification
bash EIGEN-MIGRATION/check-migration.sh

# Tenter un build
yarn install   # Pour mettre à jour le lockfile
yarn build

# Vérifier qu'il ne reste plus d'@egen dans les sources
grep -r "@egen/" packages --include="*.ts" --include="*.tsx" | grep -v node_modules
```

---

## ✅ Checklist Phase 1

- [ ] Script `rename-packages.sh` exécuté et vérifié
- [ ] Script `rename-imports.sh` exécuté et vérifié
- [ ] `package.json` racine modifié
- [ ] Dossier `tooling/egen` renommé en `tooling/eigen`
- [ ] CLI renommée (`egen` → `eigen`)
- [ ] Variables globales `window.egenBase` aliasées
- [ ] CSS `--egen-*` renommé en `--eigen-*`
- [ ] DOM IDs `egen-*` renommés
- [ ] Schémas `routes.json` mis à jour
- [ ] `yarn install` sans erreur
- [ ] `yarn build` réussi
- [ ] Zéro occurrence `@egen/` dans les sources (hors `node_modules`)
