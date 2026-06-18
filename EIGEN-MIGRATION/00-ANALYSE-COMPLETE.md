# Analyse Complète — Frontend-esm-core → EIGEN/EGÉN

> Document de référence rédigé par l'équipe EIGEN.
> Base : `amourgit/Frontend-esm-core` (fork de `egen/egen-esm-core` v9.0.2)
> Objectif : Transformer ce projet en plateforme éducative nationale EIGEN, propriétaire, déconnectée de toute source Egen.

---

## 1. VUE D'ENSEMBLE ARCHITECTURALE

### 1.1 Qu'est-ce que ce projet ?

Ce projet est un **shell d'application SPA (Single Page Application) basé sur une architecture microfrontend**. Il fournit :

1. **Un shell central** (`esm-app-shell`) qui démarre et orchestre toutes les micro-applications
2. **Un framework partagé** (`esm-framework`) utilisé par toutes les micro-applications pour communiquer, naviguer, configurer, gérer l'état et accéder à l'API
3. **Des micro-applications prêtes** (login, navigation, outils d'administration, etc.)
4. **Une CLI** (`egen`) pour développer, builder et assembler le projet

### 1.2 Diagramme de l'architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR (Browser)                          │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    esm-app-shell (Shell SPA)                     │ │
│  │   - Bootstrap Single-SPA                                         │ │
│  │   - Charge importmap + routes.registry.json                      │ │
│  │   - Monte/Démonte les micro-apps selon la route active           │ │
│  │   - Expose esm-framework via Module Federation (Webpack/Rspack)  │ │
│  └────────────────────────┬────────────────────────────────────────┘ │
│                            │ partage (shared scope)                   │
│            ┌───────────────┼──────────────────────┐                  │
│            ▼               ▼                      ▼                  │
│  ┌──────────────┐ ┌──────────────────┐ ┌──────────────────────────┐ │
│  │ esm-login-app│ │esm-primary-nav   │ │ esm-implementer-tools    │ │
│  │              │ │-app              │ │ esm-devtools-app         │ │
│  │  React + SPA │ │  React + Carbon  │ │ esm-help-menu-app        │ │
│  └──────────────┘ └──────────────────┘ └──────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              @egen/esm-framework (Shared Library)             │ │
│  │  esm-api | esm-config | esm-extensions | esm-state              │ │
│  │  esm-navigation | esm-styleguide | esm-react-utils | ...        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Technologie clé : Single-SPA + Module Federation

Le projet utilise **Single-SPA v6** : c'est le cœur de toute l'architecture.

- Chaque micro-application expose un cycle de vie (`bootstrap`, `mount`, `unmount`)
- Le shell charge dynamiquement ces micro-apps selon les routes actives
- **Module Federation (Rspack/Webpack)** permet à toutes les micro-apps de partager les mêmes instances de React, i18next, etc. sans les dupliquer

---

## 2. INVENTAIRE TECHNIQUE COMPLET

### 2.1 Structure du Monorepo

```
Frontend-esm-core/
├── package.json              ← Racine Yarn 4 workspaces + Turborepo
├── turbo.json                ← Orchestration du build parallèle
├── packages/
│   ├── apps/                 ← 6 micro-applications
│   ├── framework/            ← 19 packages de framework partagé
│   ├── shell/                ← 1 app shell
│   └── tooling/              ← CLI + configs webpack/rspack
├── e2e/                      ← Tests end-to-end (Playwright)
└── tools/                    ← Scripts utilitaires
```

### 2.2 Gestionnaire de packages & Build

| Outil | Version | Rôle |
|-------|---------|------|
| **Yarn** | 4.10.3 | Gestionnaire de packages (workspaces) |
| **Turborepo** | ^2.5.2 | Orchestration builds parallèles, cache |
| **Rspack** | 1.7.9 | Bundler principal (Webpack-compatible, 10× plus rapide) |
| **Webpack** | - | Bundler alternatif (via config séparée) |
| **SWC** | 1.15.21 | Compilateur TypeScript (remplace Babel, ultra-rapide) |
| **TypeScript** | ^5.8.3 | Typage statique |
| **Vitest** | ^4.1.2 | Tests unitaires |
| **Playwright** | ^1.55.1 | Tests end-to-end |

### 2.3 Framework principal

| Librairie | Version | Rôle |
|-----------|---------|------|
| **React** | ^18.3.1 | UI Framework |
| **React DOM** | ^18.3.1 | Rendu DOM |
| **React Router DOM** | ^6.3.0 | Routage côté client |
| **Single-SPA** | ^6.0.3 | Orchestrateur microfrontend |
| **i18next** | ^25.5.3 | Internationalisation |
| **react-i18next** | ^16.0.0 | Hook React pour i18n |
| **SWR** | 2.2.5 | Fetching de données + cache |
| **RxJS** | ^6.5.3 | Streams réactifs (pour l'API) |
| **Dexie** | ^3.0.3 | IndexedDB (mode offline) |
| **Day.js** | ^1.11.13 | Gestion des dates |
| **Lodash-es** | ^4.17.21 | Utilitaires JS |

### 2.4 Design System

| Librairie | Version | Rôle |
|-----------|---------|------|
| **@carbon/react** | ^1.92.1 | Composants UI (IBM Carbon Design System) |
| **@carbon/charts** | ^1.27.0 | Graphiques Carbon |
| **SCSS** | - | Variables et thème |

### 2.5 Les 6 Micro-Applications

#### `esm-login-app` — Authentification
- **Rôle** : Page de login/logout, sélection de localisation, changement de mot de passe
- **Route** : `/login`, `/logout`, `/change-password`
- **Ce qu'il fait** : Appelle l'endpoint `/ws/rest/v1/session` d'Egen
- **Pour EIGEN** : → Adapter pour appeler ton API Keycloak (OIDC/OAuth2) via IAM-Local-Backend
- **Composants clés** : `login.component.tsx`, `logo.component.tsx`, `footer.component.tsx`

#### `esm-primary-navigation-app` — Navigation principale
- **Rôle** : Barre de navigation top + menu latéral, profil utilisateur, changement de langue
- **Route** : Toutes routes sauf login/change-password
- **Ce qu'il fait** : Charge les extensions dans les slots de navigation
- **Pour EIGEN** : → Adapter le logo, les couleurs, les routes, le menu éducatif
- **Composants clés** : `navbar.component.tsx`, `logo.component.tsx`, menu latéral

#### `esm-implementer-tools-app` — Outils d'administration
- **Rôle** : Panneau de configuration live, feature flags, éditeur d'UI, dépendances backend
- **Pour EIGEN** : → **GARDER** (très utile pour gérer les configs EIGEN en live)
- **Composants clés** : configuration, feature-flags, frontend-modules, ui-editor

#### `esm-devtools-app` — Outils développeur
- **Rôle** : Overrides d'importmap pour dev local
- **Pour EIGEN** : → **GARDER** tel quel, utile pour le dev

#### `esm-help-menu-app` — Menu d'aide
- **Rôle** : Liens d'aide dans la navbar
- **Pour EIGEN** : → Adapter les liens vers la documentation EIGEN

#### `esm-offline-tools-app` — Outils offline
- **Rôle** : Gestion du mode hors-ligne (service worker, cache)
- **Pour EIGEN** : → Évaluer si pertinent (écoles sans internet = OUI, très pertinent !)

### 2.6 Les 19 Packages du Framework

| Package | Rôle | Pour EIGEN |
|---------|------|-----------|
| `esm-api` | Client HTTP REST/FHIR, gestion session | Adapter vers API EIGEN (Keycloak + FastAPI) |
| `esm-config` | Système de configuration par micro-app | Garder tel quel |
| `esm-context` | Contexte d'exécution | Garder |
| `esm-dynamic-loading` | Chargement dynamique de code | Garder |
| `esm-data-api` | API EMR spécifiques (patients, visites) | Remplacer par API éducatives EIGEN |
| `esm-error-handling` | Gestion des erreurs globales | Garder |
| `esm-expression-evaluator` | Évaluateur d'expressions utilisateur | Garder |
| `esm-extensions` | Système d'extension slots | **GARDER ABSOLUMENT** |
| `esm-feature-flags` | Feature flags | Garder |
| `esm-framework` | Re-export de tout le framework | Renommer namespace |
| `esm-globals` | Types globaux, window properties | Adapter noms globaux |
| `esm-navigation` | Breadcrumbs, historique, navigation | Garder |
| `esm-offline` | Utilitaires offline | Garder |
| `esm-react-utils` | Hooks React utilitaires | Garder |
| `esm-routes` | Registre des routes | Garder |
| `esm-state` | State management global (Zustand) | Garder |
| `esm-styleguide` | Composants UI Carbon + thème | Adapter couleurs/logo EIGEN |
| `esm-translations` | Support internationalisation | Garder (ajouter FR) |
| `esm-utils` | Utilitaires divers | Garder |

### 2.7 La CLI (`egen` → futur `eigen`)

La CLI fournit ces commandes :
- `egen develop` → Démarre le serveur de dev (avec proxy vers backend)
- `egen build` → Build de production
- `egen start` → Démarre le shell assemblé
- `egen assemble` → Assemble les modules depuis npm/config

**Problème actuel** : La CLI fait des fallbacks vers `dev3.egen.org` si aucune config locale n'est trouvée. **C'est ce qu'il faut couper.**

### 2.8 Mécanisme d'Import Map + Routes Registry

```
importmap.json         ← Mappe chaque module npm vers son URL de CDN
routes.registry.json   ← Liste toutes les routes de toutes les apps
```

Au démarrage :
1. Le shell lit `importmap.json` → sait où charger chaque micro-app
2. Le shell lit `routes.registry.json` → sait quelle app gère quelle route
3. Single-SPA monte/démonte les apps selon l'URL active

**Si ces fichiers ne sont pas locaux, la CLI fetch `dev3.egen.org`.** → À couper.

---

## 3. DÉPENDANCES EXTERNES À COUPER

### 3.1 `dev3.egen.org` (serveur de dev Egen)
**Où** : `packages/tooling/egen/src/utils/importmap.ts`
**Fichiers concernés** : 24 occurrences
**Ce qu'il faut faire** : Remplacer par des fichiers locaux EIGEN ou serveur EIGEN

### 3.2 Schémas JSON `json.egen.org`
**Où** : Tous les `routes.json` de chaque app (6 fichiers)
**Ce qu'il faut faire** : Créer un schéma local EIGEN ou supprimer la référence `$schema`

### 3.3 Packages npm `@egen/*`
**Où** : Toutes les dépendances inter-packages
**Ce qu'il faut faire** : Renommer en `@eigen/*` dans tous les `package.json`

### 3.4 Scripts `publish` vers npm public
**Où** : `package.json` racine (scripts `ci:publish`, `ci:publish-next`)
**Ce qu'il faut faire** : Adapter vers votre registre privé ou supprimer

### 3.5 Variables globales `window.egenBase`, `window.spaBase`
**Où** : `packages/framework/esm-globals/src/public.ts` et shell
**Ce qu'il faut faire** : Renommer en `window.eigenBase`, `window.spaBase`

---

## 4. PLAN DE MIGRATION — ÉTAPES SÉQUENTIELLES

### PHASE 0 — Préparation (1 jour)
### PHASE 1 — Renommage namespace (1-2 jours)
### PHASE 2 — Déconnexion sources externes (1 jour)
### PHASE 3 — Adaptation API (2-3 jours)
### PHASE 4 — Refonte visuelle (2-3 jours)
### PHASE 5 — Métier éducatif (itératif, plusieurs semaines)

> Voir les fichiers `01-PHASE-*.md` pour le détail de chaque phase.

---

## 5. CE QU'IL NE FAUT SURTOUT PAS TOUCHER

⛔ **Ne jamais modifier sans comprendre** :

1. **`packages/shell/esm-app-shell/src/run.ts`** : C'est l'initialiseur principal. Une erreur ici casse tout.
2. **`packages/framework/esm-extensions/`** : Le système d'extension slots. C'est ce qui rend le projet modulaire. Ne pas casser.
3. **`packages/tooling/rspack-config/`** et **`webpack-config/`** : Les configs de build. Module Federation est configuré ici.
4. **`turbo.json`** : L'ordre de build des packages. Les dépendances `^build` sont critiques.
5. **`packages/framework/esm-framework/src/index.ts`** : Point d'entrée unique du framework. Si tu changes un export ici, toutes les micro-apps cassent.

✅ **Ce qui peut être modifié en toute sécurité** :

1. Tous les fichiers `.scss`, variables CSS
2. Composants React visuels (logo, footer, couleurs)
3. Textes, traductions dans `translations/*.json`
4. `routes.json` de chaque app
5. Config schemas (`config-schema.ts`)
6. Les noms de packages dans `package.json` (avec un script global)

---

## 6. CONSEILS CRITIQUES

### ✅ À FAIRE
- Travailler **branche par branche** (ne jamais tout modifier sur `main` d'un coup)
- Toujours `yarn build` et tester après chaque phase
- Faire un **grep global** avant chaque renommage pour ne rien rater
- Versionner le `yarn.lock` à chaque changement de dépendance
- Maintenir un **fichier de mapping** ancien-nom → nouveau-nom pour les recherches

### ❌ À ÉVITER
- Ne jamais faire un `find/replace` global de "egen" → "eigen" en une fois (tu casseras les imports npm qui n'existent pas encore)
- Ne jamais modifier les fichiers `dist/` directement
- Ne pas supprimer `husky` et `lint-staged` (ils protègent la qualité du code)
- Ne pas toucher à `single-spa` (c'est la fondation, ne pas le remplacer)
- Ne pas changer la version de Rspack sans tester (c'est critique pour Module Federation)
