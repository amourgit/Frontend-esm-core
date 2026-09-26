# @egen/esm-primary-navigation-app

Rend la topbar principale de l'application EGEN : la barre de navigation
persistante affichée en haut de tous les espaces tenant authentifiés.

## Architecture — deux niveaux

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NIVEAU 1 (Header, ~48px)                                                 │
│ [Hamburger·Logo·Recherche·Contexte] [slot info] [Actions·User·slot fin] │
├─────────────────────────────────────────────────────────────────────────┤
│ NIVEAU 2 (Fil d'Ariane, ~32px — invisible si vide)                       │
│ [top-nav-breadcrumb-slot]                                                │
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
| `notifications-nav-menu-slot` | Liste du panneau "Notifications" | — (ouvert, libre)                              |
| `user-panel-slot`        | Panneau utilisateur (haut)          | Cette app (profil, langue), `esm-login-app`, `esm-offline-tools-app` |
| `user-panel-bottom-slot` | Panneau utilisateur (bas)           | `esm-login-app`                                    |

⚠️ Ne pas confondre `app-menu-slot` (contenu du panneau applications) avec
`top-nav-trailing-slot` (bouton en toute fin de topbar) : ce sont deux
slots indépendants malgré la proximité de leurs noms d'origine.

## Points d'extension — Niveau 2 (fil d'Ariane)

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
