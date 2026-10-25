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
| `top-nav-actions-slot`   | Zone droite, avant le séparateur    | `esm-implementer-tools-app`                        |
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
- **`nav-group`** (`NavGroup`) — un groupe accordéon qui crée son propre
  sous-slot pour des liens enfants.
- **`dashboard`** (`Dashboard`) — une extension "dashboard" standard EGEN.
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
