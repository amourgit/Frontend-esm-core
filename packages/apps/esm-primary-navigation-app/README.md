# @egen/esm-primary-navigation-app

Rend la topbar principale de l'application EGEN : la barre de navigation
persistante affichée en haut de tous les espaces tenant authentifiés.

## Architecture — deux niveaux

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NIVEAU 1 (Header, ~48px)                                                 │
│ [Hamburger·Logo·Recherche·Contexte] [slot info] [Actions·User·slot fin] │
├─────────────────────────────────────────────────────────────────────────┤
│ NIVEAU 2 (barre d'outils de l'app, ~40px)                                │
│ [top-nav-app-slot] │ [navigation / fil d'Ariane] ........ [slot fin]     │
└─────────────────────────────────────────────────────────────────────────┘
```

Les deux niveaux sont extensibles : n'importe quelle autre app du monorepo
peut y injecter du contenu via son propre `routes.json`, sans toucher à ce
package.

## Points d'extension — Niveau 1 (barre principale)

| Slot                     | Rendu par                          | Alimenté aujourd'hui par                          |
|--------------------------|-------------------------------------|----------------------------------------------------|
| `top-nav-info-slot`      | Centre de la barre, texte discret   | —  (ouvert, libre)                                 |
| `top-nav-actions-slot`   | Zone droite (niveau 1)              | extensions d'apps (voir « TopBar modulaire »)      |
| `top-nav-trailing-slot`  | Zone droite, tout à la fin          | — (ouvert, libre)                                  |
| `app-menu-slot`          | Grille du panneau "Applications"    | `esm-offline-tools-app`                            |
| `quick-access-slot`      | Liste du panneau "Raccourcis"       | — (ouvert, libre)                                  |
| `notifications-nav-menu-slot` | Zone droite « Notifications » (rail droit, rendu par `esm-notifications-app`) | — (ouvert, libre) |
| `user-panel-slot`        | Panneau utilisateur (haut)          | Cette app (profil, langue), `esm-login-app`, `esm-offline-tools-app` |
| `user-panel-bottom-slot` | Panneau utilisateur (bas)           | `esm-login-app`                                    |

⚠️ Ne pas confondre `app-menu-slot` (contenu du panneau applications) avec
`top-nav-trailing-slot` (bouton en toute fin de topbar) : ce sont deux
slots indépendants malgré la proximité de leurs noms d'origine.

## Points d'extension — Niveau 2 (barre d'outils de l'application)

Le niveau 2 est une rangée compacte de widgets (design « barre d'outils d'IDE ») en trois zones :

```
┌──────────────┬──────────────────────────────────────────┬─────────────┐
│ ZONE APP     │ ZONE NAVIGATION                           │ ZONE FIN    │
│ top-nav-app- │ menu déroulant (accueil) ou fil d'Ariane  │ top-nav-    │
│ slot         │ + top-nav-level2-start-slot               │ level2-end- │
│ (app active) │ + top-nav-breadcrumb-slot                 │ slot        │
└──────────────┴──────────────────────────────────────────┴─────────────┘
```

| Slot                        | Zone       | Contenu |
|-----------------------------|------------|---------|
| `top-nav-app-slot`          | App        | Contenu de barre d'outils **propre à l'app active** (logo, nom, actions). N'affiche que les extensions de l'app dont une page est montée ; le code des apps inactives n'est pas chargé. Alimenté aujourd'hui par `esm-home-app`. |
| `top-nav-level2-start-slot` | Navigation | Historique, avant les options de navigation. |
| `top-nav-breadcrumb-slot`   | Navigation | Fil d'Ariane par extensions (voir ci-dessous). |
| `top-nav-level2-end-slot`   | Fin        | Contributions **globales** (assistant IA — `esm-ai-assistant-app`). |

### Déclarer le contenu de barre d'outils d'une app

```json
{
  "extensions": [
    { "name": "mon-app-toolbar", "slot": "top-nav-app-slot", "component": "appToolbar", "order": 0 }
  ]
}
```

L'extension reçoit l'état de slot (`isActivePanel`, `togglePanel`, `hidePanel`). Elle doit être un
widget compact (hauteur 32 px, `rounded-lg`, survol `hover:bg-white/10`) ; voir
`esm-home-app/src/topbar/home-app-toolbar.extension.tsx` comme référence. Une app dont aucune
extension n'est déclarée n'affiche rien dans la zone app (le séparateur disparaît aussi).

### Fil d'Ariane par extensions

`top-nav-breadcrumb-slot` : entièrement invisible (hauteur 0) tant qu'aucune
extension n'y est assignée. Utiliser le composant générique `breadcrumb-item`
(fourni par cette app, aucun code à écrire) :

```json
{
  "extensions": [
    {
      "name": "ma-page-breadcrumb-racine",
      "slot": "top-nav-breadcrumb-slot",
      "component": "breadcrumbItem",
      "order": 0,
      "config": { "title": "Mon Application", "target": "${egenSpaBase}/mon-app" }
    },
    {
      "name": "ma-page-breadcrumb-actif",
      "slot": "top-nav-breadcrumb-slot",
      "component": "breadcrumbItem",
      "order": 1,
      "config": { "title": "Détail" }
    }
  ]
}
```

`target` omis → item non cliquable (page active). Le séparateur `›` entre
deux items et le style "actif" du dernier sont gérés automatiquement.

## Composants génériques réutilisables (enregistrés sans slot fixe)

Ces composants ne sont attachés à aucun slot par cette app — n'importe quelle
autre app les utilise depuis son propre `routes.json` en les pointant vers le
slot de son choix :

- **`link`** (`GenericLink`) — un lien simple, config `{ title, target }`.
- **`breadcrumb-item`** (`BreadcrumbItem`) — voir ci-dessus.

## Configuration de l'app

| Clé                  | Défaut                       | Description                                              |
|-----------------------|------------------------------|------------------------------------------------------------|
| `logo.src/alt/name/link` | —                          | Personnalisation du logo (voir `config-schema.ts`)        |
| `search.path`         | `${egenSpaBase}/search`      | Route ciblée par la barre de recherche (`?q=` en query)   |
| `externalRefLinks`    | `[]`                         | Liens externes affichés dans le panneau "Applications"    |

La barre de recherche navigue réellement vers `search.path` à la soumission
(Entrée ou icône) — pointez cette config vers votre propre app de résultats
de recherche si vous en développez une.

## TopBar modulaire (niveaux 1 et 2)

La TopBar est une grille de **régions** neutres (`l1-left | l1-center | l1-right`, `l2-left | l2-center | l2-right`). Elle ne
connaît aucune app : tout ce qui s'y affiche vient d'**éléments globaux** (`src/intranet-topbar/global/items.tsx` : logo,
recherche, langue, thème, utilisateur, horloge, navigation…) ou d'**extensions** d'apps.

| Région      | Slot d'extension (`routes.json`) | Slots historiques honorés                       |
| ----------- | -------------------------------- | ----------------------------------------------- |
| `l1-left`   | `topbar-l1-left-slot`            | —                                               |
| `l1-center` | `topbar-l1-center-slot`          | `top-nav-info-slot`                             |
| `l1-right`  | `topbar-l1-right-slot`           | `top-nav-actions-slot`, `top-nav-trailing-slot` |
| `l2-left`   | `topbar-l2-left-slot`            | `top-nav-app-slot`                              |
| `l2-center` | `topbar-l2-center-slot`          | —                                               |
| `l2-right`  | `topbar-l2-right-slot`           | `top-nav-level2-end-slot`                       |

Une extension s'affiche quand son app est active, ou toujours avec `meta.global: true`.

### Personnaliser la TopBar depuis une app montée

Store global `egen-topbar-layout` (aucune dépendance de code). Règles par région : `hidden`, `only`, `hide`, `hideGlobal`
(`id` d'élément ou `name` d'extension). Elles ne s'appliquent que tant que l'app propriétaire est active.

```ts
import { getGlobalStore } from '@egen-civitas/esm-framework';

const store = getGlobalStore('egen-topbar-layout', { claims: {} });
// Page « détail d'un collaborateur » : niveau 1 réduit à ses propres boutons (retour) + recherche
store.setState((s) => ({
  claims: {
    ...s.claims,
    '@egen-civitas/esm-annuaire-app': { 'l1-left': { hideGlobal: true }, 'l1-right': { only: ['search'] } },
  },
}));
// Au démontage de la page : retirer la clé de l'app dans `claims`.
```

Éléments globaux : `brand`, `search`, `language`, `divider`, `apps`, `quick-access`, `fullscreen`, `theme`, `user`, `clock`,
`menu-panel` (niveau 1), `nav` (niveau 2). « Implementer tools » n'est plus dans la TopBar : c'est une option du rail droit (bas).
