# PHASE 1 — Renommage du Namespace `@openmrs` → `@eigen`

> Durée estimée : 1-2 jours
> Branche : `eigen/phase-1-namespace`
> Objectif : Remplacer tous les identifiants `openmrs` dans les noms de packages, les imports, et les variables internes, SANS casser le système de build.

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
8. esm-emr-api         (dépend de esm-api)
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
  ["@openmrs/esm-core"]="@eigen/esm-core"
  ["@openmrs/esm-framework"]="@eigen/esm-framework"
  ["@openmrs/esm-api"]="@eigen/esm-api"
  ["@openmrs/esm-config"]="@eigen/esm-config"
  ["@openmrs/esm-context"]="@eigen/esm-context"
  ["@openmrs/esm-dynamic-loading"]="@eigen/esm-dynamic-loading"
  ["@openmrs/esm-emr-api"]="@eigen/esm-education-api"
  ["@openmrs/esm-error-handling"]="@eigen/esm-error-handling"
  ["@openmrs/esm-expression-evaluator"]="@eigen/esm-expression-evaluator"
  ["@openmrs/esm-extensions"]="@eigen/esm-extensions"
  ["@openmrs/esm-feature-flags"]="@eigen/esm-feature-flags"
  ["@openmrs/esm-globals"]="@eigen/esm-globals"
  ["@openmrs/esm-navigation"]="@eigen/esm-navigation"
  ["@openmrs/esm-offline"]="@eigen/esm-offline"
  ["@openmrs/esm-react-utils"]="@eigen/esm-react-utils"
  ["@openmrs/esm-routes"]="@eigen/esm-routes"
  ["@openmrs/esm-state"]="@eigen/esm-state"
  ["@openmrs/esm-styleguide"]="@eigen/esm-styleguide"
  ["@openmrs/esm-translations"]="@eigen/esm-translations"
  ["@openmrs/esm-utils"]="@eigen/esm-utils"
  ["@openmrs/esm-app-shell"]="@eigen/esm-app-shell"
  ["@openmrs/esm-login-app"]="@eigen/esm-login-app"
  ["@openmrs/esm-primary-navigation-app"]="@eigen/esm-primary-navigation-app"
  ["@openmrs/esm-implementer-tools-app"]="@eigen/esm-admin-tools-app"
  ["@openmrs/esm-devtools-app"]="@eigen/esm-devtools-app"
  ["@openmrs/esm-help-menu-app"]="@eigen/esm-help-menu-app"
  ["@openmrs/esm-offline-tools-app"]="@eigen/esm-offline-tools-app"
  ["@openmrs/rspack-config"]="@eigen/rspack-config"
  ["@openmrs/webpack-config"]="@eigen/webpack-config"
  ["@openmrs/storybook"]="@eigen/storybook"
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

# Remplacer @openmrs/ par @eigen/ dans tous les imports
find packages -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read file; do
  if grep -q "@openmrs/" "$file"; then
    sed -i "s|from '@openmrs/|from '@eigen/|g" "$file"
    sed -i 's|from "@openmrs/|from "@eigen/|g' "$file"
    sed -i "s|require('@openmrs/|require('@eigen/|g" "$file"
    sed -i 's|require("@openmrs/|require("@eigen/|g' "$file"
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

## 1.4 Renommage du CLI `openmrs` → `eigen`

Le package `packages/tooling/openmrs` doit être renommé :

```bash
# 1. Renommer le dossier
mv packages/tooling/openmrs packages/tooling/eigen

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
// Changer tous les textes "OpenMRS" → "EIGEN"
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
  openmrsBase: string;
  getOpenmrsSpaBase(): string;
  initializeSpa(config: SpaConfig): void;
}

// Après
interface Window {
  eigenBase: string;          // ← Renommé
  openmrsBase: string;        // ← GARDER temporairement pour compatibilité
  getEigenSpaBase(): string;  // ← Renommé
  getOpenmrsSpaBase(): string;// ← GARDER temporairement
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
Object.defineProperty(window, 'openmrsBase', {
  get() { return window.eigenBase; },
  configurable: false,
});
```

---

## 1.6 Renommage des constantes CSS `omrs-*` → `eigen-*`

Dans `packages/framework/esm-styleguide/src/components/_colors.scss` :

```scss
/* Avant */
:root {
  --omrs-color-bg-high-contrast: #ffffff;
  --omrs-color-brand-orange: #f26522;
}

/* Après */
:root {
  --eigen-color-bg-high-contrast: #ffffff;
  --eigen-color-brand-primary: #1a56db;   /* Couleur principale EIGEN */
  
  /* Alias de compatibilité pendant transition */
  --omrs-color-bg-high-contrast: var(--eigen-color-bg-high-contrast);
}
```

Chercher toutes les occurrences `--omrs-` dans le SCSS :
```bash
grep -r "\-\-omrs\-" packages --include="*.scss" | wc -l
# Probablement ~200 occurrences → script de remplacement
```

```bash
find packages -name "*.scss" | while read file; do
  sed -i 's/--omrs-/--eigen-/g' "$file"
  sed -i 's/omrs-color-/eigen-color-/g' "$file"
done
```

---

## 1.7 DOM IDs `omrs-*` → `eigen-*`

Chercher dans le HTML/TSX :

```bash
grep -r "omrs-" packages/apps --include="*.tsx" --include="*.ts" --include="*.scss"
```

Exemples à changer :
- `id="omrs-top-nav-app-container"` → `id="eigen-top-nav-app-container"`
- `className="omrs-icon"` → `className="eigen-icon"`

Dans `packages/shell/esm-app-shell/src/index.ejs` (template HTML) :
```html
<!-- Avant -->
<div id="omrs-top-nav-app-container"></div>

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
  "$schema": "https://json.openmrs.org/routes.schema.json",
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

Créer le schéma local `packages/framework/esm-routes/schema/eigen-routes.schema.json` (copier et adapter le schéma OpenMRS).

---

## 1.9 Vérification post-Phase 1

```bash
# Lancer le script de vérification
bash EIGEN-MIGRATION/check-migration.sh

# Tenter un build
yarn install   # Pour mettre à jour le lockfile
yarn build

# Vérifier qu'il ne reste plus d'@openmrs dans les sources
grep -r "@openmrs/" packages --include="*.ts" --include="*.tsx" | grep -v node_modules
```

---

## ✅ Checklist Phase 1

- [ ] Script `rename-packages.sh` exécuté et vérifié
- [ ] Script `rename-imports.sh` exécuté et vérifié
- [ ] `package.json` racine modifié
- [ ] Dossier `tooling/openmrs` renommé en `tooling/eigen`
- [ ] CLI renommée (`openmrs` → `eigen`)
- [ ] Variables globales `window.openmrsBase` aliasées
- [ ] CSS `--omrs-*` renommé en `--eigen-*`
- [ ] DOM IDs `omrs-*` renommés
- [ ] Schémas `routes.json` mis à jour
- [ ] `yarn install` sans erreur
- [ ] `yarn build` réussi
- [ ] Zéro occurrence `@openmrs/` dans les sources (hors `node_modules`)
