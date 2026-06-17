# PHASE 2 — Déconnexion des Sources Externes

> Durée estimée : 1 jour
> Branche : `eigen/phase-2-disconnect`
> Objectif : Couper toutes les dépendances vers `dev3.egen.org`, `json.egen.org`, npm public `@egen/*`, et rendre le projet 100% autonome.

---

## 2.1 Couper le fallback `dev3.egen.org` dans la CLI

### Fichier : `packages/tooling/eigen/src/utils/importmap.ts`

C'est **LE fichier le plus important** de cette phase. Il contient la logique de fallback vers `dev3.egen.org`.

**Avant** :
```typescript
async function readImportmap(path: string, backend?: string, spaPath?: string) {
  if (path === 'importmap.json') {
    if (backend && spaPath) {
      try {
        return await fetchRemoteImportmap(`${backend}${spaPath}importmap.json`);
      } catch (e) {
        logWarn(`Could not read importmap from ${backend}... Falling back to dev3.egen.org`);
      }
    }
    // ← ICI : fallback dangereux vers Egen
    return fetchRemoteImportmap('https://dev3.egen.org/egen/spa/importmap.json');
  }
  return '{"imports":{}}';
}
```

**Après** :
```typescript
async function readImportmap(path: string, backend?: string, spaPath?: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return fetchRemoteImportmap(path);
  }
  
  // Si un backend EIGEN est spécifié, essayer de le contacter
  if (path === 'importmap.json' && backend && spaPath) {
    try {
      return await fetchRemoteImportmap(`${backend}${spaPath}importmap.json`);
    } catch (e) {
      logWarn(
        `Could not read importmap from ${backend}${spaPath}importmap.json. ` +
        `Using empty importmap. Run 'eigen assemble' to generate a local importmap.`
      );
    }
  }

  // Pas de fallback externe : importmap vide (les apps locales suffiront)
  return '{"imports":{}}';
}

async function readRoutes(path: string, backend?: string, spaPath?: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return fetchRemoteRoutes(path);
  }

  if (path === 'routes.registry.json' && backend && spaPath) {
    try {
      return await fetchRemoteRoutes(`${backend}${spaPath}routes.registry.json`);
    } catch (e) {
      logWarn(
        `Could not read routes registry from ${backend}${spaPath}routes.registry.json. ` +
        `Using local routes only.`
      );
    }
  }

  // Retourner un objet vide : seules les apps locales seront chargées
  return '{}';
}
```

### Fichier : `packages/shell/esm-app-shell/package.json`

Retirer les scripts qui font référence à `dev3.egen.org` :

```json
{
  "scripts": {
    // Supprimer ces scripts qui utilisent dev3.egen.org :
    // "watch:ref": "... EGEN_ESM_IMPORTMAP_URL=https://dev3.egen.org/egen/spa/importmap.json ..."
    // "build:production": "... EGEN_ESM_IMPORTMAP_URL=https://dev3.egen.org/egen/spa/importmap.json ..."
    
    // Remplacer par :
    "watch": "cross-env EGEN_CLEAN_BEFORE_BUILD=true NODE_ENV=development EGEN_OFFLINE=disable rspack serve --mode development",
    "build:production": "cross-env EGEN_OFFLINE=enable EGEN_CLEAN_BEFORE_BUILD=true NODE_ENV=production rspack --mode production",
    "build:development": "cross-env EGEN_OFFLINE=enable EGEN_CLEAN_BEFORE_BUILD=true NODE_ENV=development rspack --mode development",
    "build": "yarn run build:production && yarn run build:development"
  }
}
```

---

## 2.2 Créer des fichiers `importmap.json` et `routes.registry.json` locaux

Ces fichiers locaux remplaceront le fetch depuis `dev3.egen.org`.

### `packages/shell/esm-app-shell/src/importmap.json` (dev local)

```json
{
  "imports": {
    "@eigen/esm-login-app": "http://localhost:8081/main.js",
    "@eigen/esm-primary-navigation-app": "http://localhost:8082/main.js",
    "@eigen/esm-admin-tools-app": "http://localhost:8083/main.js",
    "@eigen/esm-devtools-app": "http://localhost:8084/main.js",
    "@eigen/esm-help-menu-app": "http://localhost:8085/main.js",
    "@eigen/esm-offline-tools-app": "http://localhost:8086/main.js"
  }
}
```

> **Note** : En mode monorepo, ces URLs seront servies par les dev servers individuels de chaque micro-app. En production, elles pointeront vers les fichiers statiques sur ton CDN/serveur.

### `packages/shell/esm-app-shell/src/routes.registry.json` (dev local)

```json
{
  "@eigen/esm-login-app": {
    "backendDependencies": { "eigen-api": ">=1.0.0" },
    "pages": [
      { "component": "root", "route": "login", "online": true, "offline": true },
      { "component": "root", "route": "logout", "online": true, "offline": true }
    ],
    "extensions": [
      { "name": "logout-button", "slot": "user-panel-bottom-slot", "component": "logoutButton" }
    ]
  },
  "@eigen/esm-primary-navigation-app": {
    "backendDependencies": { "eigen-api": ">=1.0.0" },
    "pages": [
      { "component": "root", "routeRegex": "^(?!(?:login|change-password)/?)", "online": true, "offline": true, "containerDomId": "eigen-top-nav-app-container" }
    ]
  }
}
```

---

## 2.3 Adapter la vérification des dépendances backend

### Fichier : `packages/framework/esm-api/src/egen-backend-dependencies.ts`

Ce fichier vérifie que le backend a les modules requis. À adapter pour EIGEN.

**Avant** : Vérifiait `webservices.rest`, `webservices.fhir2`, etc.

**Après** : Vérifier les modules EIGEN :

```typescript
// Avant
export const restBaseUrl = '/ws/rest/v1';
export const fhirBaseUrl = '/ws/fhir2/R4';
export const sessionEndpoint = `${restBaseUrl}/session`;

// Après
export const restBaseUrl = '/api/v1';          // ← API EIGEN FastAPI
export const fhirBaseUrl = '/api/v1/fhir';     // ← Si tu exposes du FHIR
export const sessionEndpoint = `/api/v1/auth/session`;  // ← Ou Keycloak

// Et adapter la fonction de vérification des dépendances backend
// pour qu'elle teste tes propres endpoints EIGEN
```

> ⚠️ **IMPORTANT** : Cette adaptation est liée à la Phase 3 (API). La faire en même temps ou juste après.

---

## 2.4 Adapter la CLI `develop` pour pointer vers EIGEN

### Fichier : `packages/tooling/eigen/src/commands/develop.ts`

Changer les valeurs par défaut :

```typescript
// Avant
.option('backend', {
  default: 'https://dev3.egen.org',
  describe: 'The backend to proxy API requests to.',
})
.option('spa-path', {
  default: '/egen/spa/',
})
.option('api-url', {
  default: '/egen',
})

// Après
.option('backend', {
  default: 'http://localhost:8081',   // ← Ton backend FastAPI EIGEN
  describe: 'The EIGEN backend to proxy API requests to.',
})
.option('spa-path', {
  default: '/eigen/spa/',
})
.option('api-url', {
  default: '/eigen',
})
```

### Fichier : `packages/tooling/eigen/src/commands/start.ts`

Même chose pour les valeurs par défaut du serveur de prod.

---

## 2.5 Couper les dépendances npm `@egen/*` externe

Les packages `@egen/*` installés depuis npm (pas workspace) doivent être supprimés ou remplacés. Chercher dans tous les `package.json` :

```bash
grep -r '"@egen/' packages */package.json | grep -v "workspace:\*" | grep -v "node_modules"
```

Tout ce qui n'est pas `"workspace:*"` est une dépendance npm externe. Il faut :
1. Soit la remplacer par la version locale `"workspace:*"`
2. Soit la supprimer si elle n'est plus utilisée

---

## 2.6 Adapter le `browserslist` (optionnel mais propre)

Dans `packages/shell/esm-app-shell/package.json` :

```json
// Avant
"browserslist": [
  "extends browserslist-config-egen"
]

// Après : définir directement les cibles navigateur
"browserslist": [
  "last 2 Chrome versions",
  "last 2 Firefox versions",
  "last 2 Safari versions",
  "last 2 Edge versions"
]
```

Et désinstaller `browserslist-config-egen` :
```bash
yarn workspace @eigen/esm-app-shell remove browserslist-config-egen
```

---

## 2.7 Modifier le template HTML `index.ejs`

### Fichier : `packages/shell/esm-app-shell/src/index.ejs`

Chercher et remplacer toutes les références Egen dans le HTML généré :

```html
<!-- Avant -->
<title>Egen</title>
<link rel="manifest" href="./manifest.webmanifest">

<!-- Après -->
<title>EIGEN — Plateforme Éducative Nationale</title>
<link rel="manifest" href="./manifest.webmanifest">
```

Les métadonnées du `manifest.webmanifest` (PWA) :

Dans le fichier de config rspack/webpack du shell, chercher `webpack-pwa-manifest` et modifier :

```javascript
new WebpackPwaManifest({
  name: 'EIGEN — Plateforme Éducative Nationale',
  short_name: 'EIGEN',
  description: 'Plateforme de gestion éducative nationale',
  background_color: '#ffffff',
  theme_color: '#1a56db',    // Couleur EIGEN
  icons: [
    {
      src: path.resolve('src/assets/eigen-icon-512.png'),
      sizes: [96, 128, 192, 256, 384, 512]
    }
  ]
})
```

---

## 2.8 Vérification de l'isolation complète

```bash
# Test 1 : Lancer le dev server sans connexion internet
# (désactiver ta connexion réseau ou utiliser un firewall)
yarn run:shell
# → Le shell doit démarrer sans erreur réseau

# Test 2 : Vérifier que le build ne fetch rien d'externe
yarn build 2>&1 | grep -i "egen.org"
# → Doit retourner vide

# Test 3 : Vérifier les URLs dans le code compilé
grep -r "egen.org" packages/*/dist/ 2>/dev/null
# → Doit retourner vide
```

---

## ✅ Checklist Phase 2

- [ ] Fallback `dev3.egen.org` retiré de `importmap.ts`
- [ ] Fallback `dev3.egen.org` retiré de `readRoutes`
- [ ] Fichier `importmap.json` local créé pour le dev
- [ ] Fichier `routes.registry.json` local créé pour le dev
- [ ] Backend par défaut CLI changé vers EIGEN
- [ ] `spaPath` par défaut changé vers `/eigen/spa/`
- [ ] `apiUrl` par défaut changé vers `/eigen`
- [ ] Dépendances npm `@egen/*` externes supprimées
- [ ] `browserslist-config-egen` retiré
- [ ] `index.ejs` mis à jour (titre, meta)
- [ ] PWA manifest mis à jour (nom, icône, couleurs)
- [ ] Test isolation réseau réussi
- [ ] `yarn build` réussi sans fetch externe
