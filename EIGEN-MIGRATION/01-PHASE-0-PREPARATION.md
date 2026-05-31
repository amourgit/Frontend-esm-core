# PHASE 0 — Préparation du terrain

> Durée estimée : 1 journée
> Objectif : Préparer l'environnement, comprendre ce qu'on a, créer les branches de travail

---

## 0.1 Branches Git à créer

```bash
# Depuis main, créer les branches de travail pour chaque phase
git checkout main
git pull origin main

git checkout -b eigen/phase-1-namespace
git checkout main

git checkout -b eigen/phase-2-disconnect
git checkout main

git checkout -b eigen/phase-3-api
git checkout main

git checkout -b eigen/phase-4-design
git checkout main

# Branche d'intégration progressive
git checkout -b eigen/integration
```

> **Règle d'or** : On merge dans `eigen/integration` uniquement quand une phase est terminée et testée. On ne merge pas dans `main` tant qu'on n'a pas un système fonctionnel de bout en bout.

---

## 0.2 Vérification de l'environnement

```bash
# Vérifier les prérequis
node --version   # doit être >= 20.11.0 (exigence du CLI)
yarn --version   # doit être 4.x
git --version

# Installer les dépendances
cd Frontend-esm-core
yarn install

# Vérifier que le build fonctionne AVANT de toucher quoi que ce soit
yarn build
```

> ⚠️ **IMPORTANT** : Si le build ne passe pas avant les modifications, c'est un problème existant à corriger AVANT de commencer la migration. Ne jamais démarrer la migration sur une base cassée.

---

## 0.3 Carte des occurrences "openmrs" à remplacer

Exécuter ces commandes pour cartographier tout ce qui sera touché :

```bash
# Toutes les occurrences dans les package.json
grep -r "openmrs" packages/*/*/package.json --include="package.json" -l

# Dans les fichiers source TypeScript/TSX
grep -rl "@openmrs/" packages --include="*.ts" --include="*.tsx" | wc -l

# URLs externes
grep -r "openmrs.org" packages --include="*.ts" --include="*.tsx" --include="*.json"

# Variables globales window.openmrs*
grep -r "window\.openmrs\|openmrsBase\|getOpenmrsSpaBase" packages --include="*.ts"

# Dans les scripts de la CLI
grep -r "dev3.openmrs.org" packages/tooling
```

---

## 0.4 Créer le fichier de mapping des noms

Créer `EIGEN-MIGRATION/name-mapping.json` :

```json
{
  "packageNames": {
    "@openmrs/esm-core": "@eigen/esm-core",
    "@openmrs/esm-framework": "@eigen/esm-framework",
    "@openmrs/esm-api": "@eigen/esm-api",
    "@openmrs/esm-config": "@eigen/esm-config",
    "@openmrs/esm-context": "@eigen/esm-context",
    "@openmrs/esm-dynamic-loading": "@eigen/esm-dynamic-loading",
    "@openmrs/esm-emr-api": "@eigen/esm-education-api",
    "@openmrs/esm-error-handling": "@eigen/esm-error-handling",
    "@openmrs/esm-expression-evaluator": "@eigen/esm-expression-evaluator",
    "@openmrs/esm-extensions": "@eigen/esm-extensions",
    "@openmrs/esm-feature-flags": "@eigen/esm-feature-flags",
    "@openmrs/esm-globals": "@eigen/esm-globals",
    "@openmrs/esm-navigation": "@eigen/esm-navigation",
    "@openmrs/esm-offline": "@eigen/esm-offline",
    "@openmrs/esm-react-utils": "@eigen/esm-react-utils",
    "@openmrs/esm-routes": "@eigen/esm-routes",
    "@openmrs/esm-state": "@eigen/esm-state",
    "@openmrs/esm-styleguide": "@eigen/esm-styleguide",
    "@openmrs/esm-translations": "@eigen/esm-translations",
    "@openmrs/esm-utils": "@eigen/esm-utils",
    "@openmrs/esm-app-shell": "@eigen/esm-app-shell",
    "@openmrs/esm-login-app": "@eigen/esm-login-app",
    "@openmrs/esm-primary-navigation-app": "@eigen/esm-primary-navigation-app",
    "@openmrs/esm-implementer-tools-app": "@eigen/esm-admin-tools-app",
    "@openmrs/esm-devtools-app": "@eigen/esm-devtools-app",
    "@openmrs/esm-help-menu-app": "@eigen/esm-help-menu-app",
    "@openmrs/esm-offline-tools-app": "@eigen/esm-offline-tools-app",
    "@openmrs/rspack-config": "@eigen/rspack-config",
    "@openmrs/webpack-config": "@eigen/webpack-config",
    "@openmrs/storybook": "@eigen/storybook"
  },
  "cliNames": {
    "openmrs": "eigen"
  },
  "globalVariables": {
    "openmrsBase": "eigenBase",
    "getOpenmrsSpaBase": "getEigenSpaBase",
    "window.openmrsBase": "window.eigenBase",
    "omrs-logo": "eigen-logo",
    "omrs-top-nav": "eigen-top-nav",
    "omrs-color": "eigen-color"
  },
  "urls": {
    "dev3.openmrs.org": "dev.eigen.ga (ton serveur)",
    "json.openmrs.org": "schema.eigen.ga (schéma local)",
    "github.com/openmrs": "github.com/amourgit"
  }
}
```

---

## 0.5 Script de vérification rapide (à utiliser après chaque phase)

Créer `EIGEN-MIGRATION/check-migration.sh` :

```bash
#!/bin/bash
echo "=== Vérification migration EIGEN ==="

echo -n "Occurrences '@openmrs/' restantes dans les sources : "
grep -r "@openmrs/" packages --include="*.ts" --include="*.tsx" --include="*.json" | grep -v "node_modules" | grep -v ".git" | wc -l

echo -n "Occurrences 'dev3.openmrs.org' restantes : "
grep -r "dev3.openmrs.org" packages --include="*.ts" | grep -v "node_modules" | wc -l

echo -n "Occurrences 'window.openmrsBase' restantes : "
grep -r "openmrsBase" packages --include="*.ts" --include="*.tsx" | grep -v "node_modules" | wc -l

echo -n "Occurrences 'OpenMRS' dans les textes UI : "
grep -r "OpenMRS" packages/apps --include="*.tsx" --include="*.ts" | grep -v "node_modules" | wc -l

echo "=== Fin de vérification ==="
```

```bash
chmod +x EIGEN-MIGRATION/check-migration.sh
```

---

## 0.6 Environnement `.env` à créer

Copier `example.env` en `.env` et adapter :

```bash
cp example.env .env
```

Modifier `.env` :

```env
# Backend EIGEN (IAM + Gestion scolaire)
E2E_BASE_URL=http://localhost:8080/eigen
E2E_USER_ADMIN_USERNAME=admin
E2E_USER_ADMIN_PASSWORD=Admin123
E2E_LOGIN_DEFAULT_LOCATION_UUID=   # UUID d'un établissement scolaire dans ton backend

# URLs backend EIGEN
EIGEN_API_BASE_URL=http://localhost:8080/api/v1
EIGEN_IAM_URL=http://localhost:8180/auth/realms/eigen
EIGEN_SPA_PATH=/eigen/spa
```

---

## ✅ Checklist Phase 0

- [ ] Environnement Node/Yarn vérifié
- [ ] `yarn install` réussi
- [ ] `yarn build` réussi (baseline fonctionnel)
- [ ] Branches Git créées
- [ ] Fichier `name-mapping.json` créé
- [ ] Script `check-migration.sh` créé
- [ ] `.env` configuré avec les URLs EIGEN
- [ ] Cartographie des occurrences faite
