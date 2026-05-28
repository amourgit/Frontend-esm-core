# PHASE 5 — Intégration du Métier Éducatif EIGEN

> Durée estimée : Plusieurs semaines (itératif)
> Objectif : Créer les micro-applications éducatives EIGEN sur la base du framework migré.

---

## 5.1 Architecture cible des micro-applications EIGEN

```
packages/apps/
├── esm-login-app/                    ← Adapté (Phase 3-4)
├── esm-primary-navigation-app/       ← Adapté (Phase 1-4)
├── esm-admin-tools-app/              ← Adapté depuis implementer-tools
├── esm-devtools-app/                 ← Conservé
├── esm-help-menu-app/                ← Adapté
├── esm-offline-tools-app/            ← Conservé
│
│ ← NOUVELLES APPS ÉDUCATIVES EIGEN →
│
├── esm-tableau-de-bord-app/          ← Dashboard accueil personnalisé
├── esm-apprenants-app/               ← Gestion des apprenants (élèves)
├── esm-classes-app/                  ← Gestion des classes
├── esm-enseignants-app/              ← Gestion des enseignants
├── esm-notes-app/                    ← Saisie et consultation des notes
├── esm-absences-app/                 ← Gestion des absences
├── esm-bulletins-app/                ← Bulletins scolaires
├── esm-etablissements-app/           ← Gestion des établissements
├── esm-planning-app/                 ← Emplois du temps
├── esm-examens-app/                  ← Gestion des examens officiels
├── esm-bibliotheque-app/             ← Ressources pédagogiques
└── esm-parents-app/                  ← Espace parents
```

---

## 5.2 Créer une nouvelle micro-app EIGEN (template)

### Commande de création (à adapter depuis la CLI EIGEN)

```bash
# Créer une nouvelle micro-app à partir du template
mkdir -p packages/apps/esm-apprenants-app/src
cd packages/apps/esm-apprenants-app
```

### Structure type d'une micro-app EIGEN

```
esm-apprenants-app/
├── package.json
├── tsconfig.json
├── rspack.config.js
├── translations/
│   ├── fr.json          ← Français (principal)
│   └── en.json          ← Anglais (secondaire)
├── src/
│   ├── index.ts          ← Point d'entrée Single-SPA
│   ├── routes.json       ← Déclaration routes + extensions
│   ├── config-schema.ts  ← Schéma de config (zod/custom)
│   ├── constants.ts
│   ├── types.ts          ← Types TypeScript
│   ├── root.component.tsx
│   │
│   ├── liste/            ← Liste des apprenants
│   │   ├── liste-apprenants.component.tsx
│   │   ├── liste-apprenants.scss
│   │   └── liste-apprenants.resource.ts
│   │
│   ├── profil/           ← Profil d'un apprenant
│   │   ├── profil-apprenant.component.tsx
│   │   ├── profil-apprenant.scss
│   │   └── profil-apprenant.resource.ts
│   │
│   ├── inscription/      ← Formulaire d'inscription
│   │   ├── inscription.modal.tsx
│   │   └── inscription.resource.ts
│   │
│   └── widgets/          ← Widgets pour les extension slots
│       ├── mini-profil.extension.tsx
│       └── stats-apprenant.extension.tsx
```

---

## 5.3 `package.json` type d'une micro-app EIGEN

```json
{
  "name": "@eigen/esm-apprenants-app",
  "version": "1.0.0",
  "license": "PROPRIETARY",
  "main": "dist/main.js",
  "source": "src/index.ts",
  "scripts": {
    "start": "eigen develop",
    "build": "eigen build",
    "test": "cross-env TZ=UTC vitest run",
    "lint": "eslint src --ext ts,tsx"
  },
  "peerDependencies": {
    "@eigen/esm-framework": "*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@eigen/esm-framework": "workspace:*",
    "@eigen/rspack-config": "workspace:*",
    "cross-env": "^10.1.0",
    "eigen": "workspace:*",
    "vitest": "^4.1.2"
  }
}
```

---

## 5.4 `index.ts` type d'une micro-app EIGEN

```typescript
// packages/apps/esm-apprenants-app/src/index.ts
import { defineConfigSchema, getAsyncLifecycle, getSyncLifecycle } from '@eigen/esm-framework';
import { configSchema } from './config-schema';
import listeApprenantsComponent from './liste/liste-apprenants.component';
import miniProfilExtension from './widgets/mini-profil.extension';

const moduleName = '@eigen/esm-apprenants-app';

const options = {
  featureName: 'apprenants',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Page principale
export const root = getSyncLifecycle(listeApprenantsComponent, options);

// Extensions réutilisables dans d'autres apps
export const miniProfilApprenant = getSyncLifecycle(miniProfilExtension, options);

// Modals
export const inscriptionModal = getAsyncLifecycle(
  () => import('./inscription/inscription.modal'),
  options
);
```

---

## 5.5 `routes.json` type d'une micro-app EIGEN

```json
{
  "backendDependencies": {
    "eigen-api": ">=1.0.0",
    "eigen-education-module": ">=1.0.0"
  },
  "pages": [
    {
      "component": "root",
      "route": "apprenants",
      "online": true,
      "offline": false,
      "requiredPrivilege": "eigen:apprenants:read"
    },
    {
      "component": "root",
      "route": "apprenants/:uuid",
      "online": true,
      "offline": false,
      "requiredPrivilege": "eigen:apprenants:read"
    }
  ],
  "extensions": [
    {
      "name": "mini-profil-apprenant",
      "slot": "apprenant-summary-slot",
      "component": "miniProfilApprenant",
      "online": true,
      "offline": false
    }
  ],
  "modals": [
    {
      "name": "inscription-apprenant-modal",
      "component": "inscriptionModal",
      "requiredPrivilege": "eigen:apprenants:write"
    }
  ]
}
```

---

## 5.6 Exemple complet : App Tableau de Bord

```tsx
// packages/apps/esm-tableau-de-bord-app/src/root.component.tsx

import React from 'react';
import { useSession } from '@eigen/esm-framework';
import { useHasRole, useHasPrivilege } from '@eigen/esm-api';
import styles from './root.scss';

/**
 * Dashboard adaptatif selon le rôle de l'utilisateur.
 *
 * SUPER_ADMIN / ADMIN_NATIONAL → Vue globale nationale (stats pays)
 * ADMIN_REGIONAL               → Vue régionale (stats région)
 * ADMIN_ETABLISSEMENT          → Vue établissement (stats école)
 * ENSEIGNANT                   → Vue enseignant (mes classes, mes cours)
 * CENSEUR                      → Vue discipline (absences, retards)
 * SECRETAIRE                   → Vue administrative (inscriptions)
 * PARENT                       → Vue enfant (notes, absences de son enfant)
 */
const TableauDeBord: React.FC = () => {
  const { session } = useSession();
  const isAdmin = useHasRole('SUPER_ADMIN', 'ADMIN_NATIONAL', 'ADMIN_REGIONAL');
  const isAdminEtablissement = useHasRole('ADMIN_ETABLISSEMENT');
  const isEnseignant = useHasRole('ENSEIGNANT');
  const isParent = useHasRole('PARENT');

  const userName = session?.user?.display || 'utilisateur';

  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <h1>Bonjour, {userName} 👋</h1>
        <p className={styles.subtitle}>
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </header>

      <div className={styles.widgetsGrid}>
        {/* Widgets selon le rôle - utilise ExtensionSlot pour la modularité */}
        {isAdmin && <ExtensionSlot name="dashboard-admin-slot" />}
        {isAdminEtablissement && <ExtensionSlot name="dashboard-directeur-slot" />}
        {isEnseignant && <ExtensionSlot name="dashboard-enseignant-slot" />}
        {isParent && <ExtensionSlot name="dashboard-parent-slot" />}
        
        {/* Toujours afficher */}
        <ExtensionSlot name="dashboard-common-slot" />
      </div>
    </div>
  );
};

export default TableauDeBord;
```

---

## 5.7 Système de navigation EIGEN

Adapter la navigation principale pour le domaine éducatif.

### Menu latéral par rôle

Le système d'extension slots permet de définir quel menu apparaît selon le rôle, sans if/else dans le code de navigation.

Dans chaque app, déclarer des extensions de type `nav-group` ou `link` :

**Dans `esm-apprenants-app/src/routes.json`** :
```json
{
  "extensions": [
    {
      "name": "nav-apprenants",
      "slot": "nav-menu-slot",
      "component": "linkComponent",
      "meta": {
        "title": "Apprenants",
        "icon": "User",
        "href": "/eigen/spa/apprenants",
        "requiredPrivilege": "eigen:apprenants:read"
      },
      "order": 10
    }
  ]
}
```

**Dans `esm-notes-app/src/routes.json`** :
```json
{
  "extensions": [
    {
      "name": "nav-notes",
      "slot": "nav-menu-slot",
      "component": "linkComponent",
      "meta": {
        "title": "Notes & Évaluations",
        "icon": "Education",
        "href": "/eigen/spa/notes",
        "requiredPrivilege": "eigen:notes:read"
      },
      "order": 20
    }
  ]
}
```

Résultat : chaque micro-app contribue à son propre lien dans le menu, sans modifier l'app de navigation.

---

## 5.8 Roadmap des apps éducatives

### Sprint 1 (Fondations — 2 semaines)
- [ ] `esm-tableau-de-bord-app` — Dashboard accueil adaptatif par rôle
- [ ] `esm-etablissements-app` — CRUD établissements (pour admins)

### Sprint 2 (Cœur pédagogique — 3 semaines)
- [ ] `esm-apprenants-app` — Liste, profil, inscription, transfer
- [ ] `esm-classes-app` — Gestion des classes, affectations
- [ ] `esm-enseignants-app` — Profils enseignants, affectations matières

### Sprint 3 (Évaluation — 3 semaines)
- [ ] `esm-notes-app` — Saisie notes (grille par classe), consultation
- [ ] `esm-bulletins-app` — Génération bulletins PDF, conseils de classe
- [ ] `esm-absences-app` — Pointage présence, justifications

### Sprint 4 (Organisation — 2 semaines)
- [ ] `esm-planning-app` — Emplois du temps (visuel grille)
- [ ] `esm-examens-app` — Organisation examens BEPC/BAC

### Sprint 5 (Portails — 2 semaines)
- [ ] `esm-parents-app` — Espace parent (consultation seule)
- [ ] `esm-bibliotheque-app` — Ressources pédagogiques numériques

---

## 5.9 Bonnes pratiques pour les nouvelles apps

### 1. Toujours utiliser les hooks du framework

```tsx
// ✅ BON : utiliser les hooks EIGEN
import { useConfig, useSession, useExtensionSlotMeta } from '@eigen/esm-framework';

// ❌ MAUVAIS : accéder directement au state global
import { sessionStore } from '../../some-internal-path';
```

### 2. Toujours vérifier les permissions avant d'afficher

```tsx
// ✅ BON
const canEdit = useHasPrivilege('eigen:notes:write');
return (
  <div>
    <NotesList />
    {canEdit && <Button onClick={openSaisie}>Saisir les notes</Button>}
  </div>
);

// ❌ MAUVAIS : cacher visuellement sans vérifier côté API
return (
  <div>
    <NotesList />
    <Button style={{ display: isReadOnly ? 'none' : 'block' }}>Saisir</Button>
  </div>
);
```

### 3. Toujours internationaliser

```tsx
// ✅ BON
const { t } = useTranslation();
<h1>{t('listeApprenants', 'Liste des apprenants')}</h1>

// ❌ MAUVAIS
<h1>Liste des apprenants</h1>
```

### 4. Toujours gérer le loading et les erreurs

```tsx
// ✅ BON
const { apprenants, isLoading, error } = useApprenants();
if (isLoading) return <InlineLoading description="Chargement..." />;
if (error) return <ErrorState error={error} headerTitle="Erreur" />;
return <ApprenantsList data={apprenants} />;

// ❌ MAUVAIS
const { apprenants } = useApprenants();
return <ApprenantsList data={apprenants} />;  // Crash si apprenants est undefined
```

### 5. Contribuer aux extension slots, ne pas hardcoder

```tsx
// ✅ BON : rendre extensible
<div className={styles.profilApprenant}>
  <ProfilHeader apprenant={apprenant} />
  <ExtensionSlot name="profil-apprenant-slot" state={{ apprenant }} />
</div>

// ❌ MAUVAIS : hardcoder tous les widgets
<div>
  <ProfilHeader />
  <NotesWidget />    ← Couplé, non extensible
  <AbsencesWidget /> ← Couplé, non extensible
</div>
```
