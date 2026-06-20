# PHASE 0 — Préparation du terrain

> Durée estimée : 1 journée
> Objectif : Préparer l'environnement, comprendre ce qu'on a, créer les branches de travail

---

## 0.1 Branches Git à créer

```bash
# Depuis main, créer les branches de travail pour chaque phase
git checkout main
git pull origin main

git checkout -b egen/phase-1-namespace
git checkout main

git checkout -b egen/phase-2-disconnect
git checkout main

git checkout -b egen/phase-3-api
git checkout main

git checkout -b egen/phase-4-design
git checkout main

# Branche d'intégration progressive
git checkout -b egen/integration
```

> **Règle d'or** : On merge dans `egen/integration` uniquement quand une phase est terminée et testée. On ne merge pas dans `main` tant qu'on n'a pas un système fonctionnel de bout en bout.

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

## 0.3 Carte des occurrences "egen" à remplacer

Exécuter ces commandes pour cartographier tout ce qui sera touché :

```bash
# Toutes les occurrences dans les package.json
grep -r "egen" packages/*/*/package.json --include="package.json" -l

# Dans les fichiers source TypeScript/TSX
grep -rl "@egen/" packages --include="*.ts" --include="*.tsx" | wc -l

# URLs externes
grep -r "egen.org" packages --include="*.ts" --include="*.tsx" --include="*.json"

# Variables globales window.egen*
grep -r "window\.egen\|egenBase\|getEgenSpaBase" packages --include="*.ts"

# Dans les scripts de la CLI
grep -r "dev3.egen.org" packages/tooling
```

---

## 0.4 Créer le fichier de mapping des noms

Créer `EGEN-MIGRATION/name-mapping.json` :

```json
{
  "packageNames": {
    "@egen/esm-core": "@egen/esm-core",
    "@egen/esm-framework": "@egen/esm-framework",
    "@egen/esm-api": "@egen/esm-api",
    "@egen/esm-config": "@egen/esm-config",
    "@egen/esm-context": "@egen/esm-context",
    "@egen/esm-dynamic-loading": "@egen/esm-dynamic-loading",
    "@egen/esm-data-api": "@egen/esm-data-api",
    "@egen/esm-error-handling": "@egen/esm-error-handling",
    "@egen/esm-expression-evaluator": "@egen/esm-expression-evaluator",
    "@egen/esm-extensions": "@egen/esm-extensions",
    "@egen/esm-feature-flags": "@egen/esm-feature-flags",
    "@egen/esm-globals": "@egen/esm-globals",
    "@egen/esm-navigation": "@egen/esm-navigation",
    "@egen/esm-offline": "@egen/esm-offline",
    "@egen/esm-react-utils": "@egen/esm-react-utils",
    "@egen/esm-routes": "@egen/esm-routes",
    "@egen/esm-state": "@egen/esm-state",
    "@egen/esm-styleguide": "@egen/esm-styleguide",
    "@egen/esm-translations": "@egen/esm-translations",
    "@egen/esm-utils": "@egen/esm-utils",
    "@egen/esm-app-shell": "@egen/esm-app-shell",
    "@egen/esm-login-app": "@egen/esm-login-app",
    "@egen/esm-primary-navigation-app": "@egen/esm-primary-navigation-app",
    "@egen/esm-implementer-tools-app": "@egen/esm-admin-tools-app",
    "@egen/esm-devtools-app": "@egen/esm-devtools-app",
    "@egen/esm-help-menu-app": "@egen/esm-help-menu-app",
    "@egen/esm-offline-tools-app": "@egen/esm-offline-tools-app",
    "@egen/rspack-config": "@egen/rspack-config",
    "@egen/webpack-config": "@egen/webpack-config",
    "@egen/storybook": "@egen/storybook"
  },
  "cliNames": {
    "egen": "egen"
  },
  "globalVariables": {
    "egenBase": "eigenBase",
    "getEgenSpaBase": "getEigenSpaBase",
    "window.egenBase": "window.eigenBase",
    "egen-logo": "egen-logo",
    "egen-top-nav": "egen-top-nav",
    "egen-color": "egen-color"
  },
  "urls": {
    "dev3.egen.org": "dev.egen.ga (ton serveur)",
    "json.egen.org": "schema.egen.ga (schéma local)",
    "github.com/egen": "github.com/amourgit"
  }
}
```

---

## 0.5 Script de vérification rapide (à utiliser après chaque phase)

Créer `EGEN-MIGRATION/check-migration.sh` :

```bash
#!/bin/bash
echo "=== Vérification migration EGEN ==="

echo -n "Occurrences '@egen/' restantes dans les sources : "
grep -r "@egen/" packages --include="*.ts" --include="*.tsx" --include="*.json" | grep -v "node_modules" | grep -v ".git" | wc -l

echo -n "Occurrences 'dev3.egen.org' restantes : "
grep -r "dev3.egen.org" packages --include="*.ts" | grep -v "node_modules" | wc -l

echo -n "Occurrences 'window.egenBase' restantes : "
grep -r "egenBase" packages --include="*.ts" --include="*.tsx" | grep -v "node_modules" | wc -l

echo -n "Occurrences 'Egen' dans les textes UI : "
grep -r "Egen" packages/apps --include="*.tsx" --include="*.ts" | grep -v "node_modules" | wc -l

echo "=== Fin de vérification ==="
```

```bash
chmod +x EGEN-MIGRATION/check-migration.sh
```

---

## 0.6 Environnement `.env` à créer

Copier `example.env` en `.env` et adapter :

```bash
cp example.env .env
```

Modifier `.env` :

```env
# Backend EGEN (IAM + Gestion scolaire)
E2E_BASE_URL=http://localhost:8081/egen
E2E_USER_ADMIN_USERNAME=admin
E2E_USER_ADMIN_PASSWORD=Admin123
E2E_LOGIN_DEFAULT_LOCATION_UUID=   # UUID d'un établissement scolaire dans ton backend

# URLs backend EGEN
EIGEN_API_BASE_URL=http://localhost:8081/api/v1
EIGEN_IAM_URL=http://localhost:8180/auth/realms/egen
EIGEN_SPA_PATH=/egen/spa
```

---

## ✅ Checklist Phase 0

- [ ] Environnement Node/Yarn vérifié
- [ ] `yarn install` réussi
- [ ] `yarn build` réussi (baseline fonctionnel)
- [ ] Branches Git créées
- [ ] Fichier `name-mapping.json` créé
- [ ] Script `check-migration.sh` créé
- [ ] `.env` configuré avec les URLs EGEN
- [ ] Cartographie des occurrences faite
