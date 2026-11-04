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

## TopBar modulaire (N niveaux)

La TopBar est une pile de **niveaux** numérotés (`1` en haut, `2`, `3`…). Chaque niveau a la même structure : trois **régions**
neutres `l<N>-left | l<N>-center | l<N>-right`. Elle ne connaît aucune app : tout ce qui s'y affiche vient d'**éléments
globaux** (`src/intranet-topbar/global/items.tsx`) ou d'**extensions** d'apps.

**Déclarer du contenu** : slot `topbar-l<N>-<région>-slot` dans le `routes.json` de n'importe quelle app
(ex. `topbar-l3-right-slot` = niveau 3, région droite). Visible quand l'app est active, ou toujours avec `meta.global: true`.
Slots historiques honorés : `top-nav-info-slot` (l1-center), `top-nav-actions-slot` / `top-nav-trailing-slot` (l1-right),
`top-nav-app-slot` (l2-left), `top-nav-level2-end-slot` (l2-right).

**Nombre de niveaux** (règles uniques) :
1. = max(`topbar.levels.min`, plus haut niveau déclaré par du contenu visible, `levels.min` d'une app active), plafonné à
   `topbar.levels.max`. Un contenu au niveau 5 crée 5 niveaux, intermédiaires vides compris.
2. Un niveau ≥ 2 peut être désactivé (`topbar.levels.disabled`, ou `levels.hide` d'une app active). Le niveau 1 jamais.
3. Le contenu d'un niveau non rendu (désactivé, ou au-dessus du max) s'affiche sur le niveau rendu **inférieur le plus
   proche**, dans la **même région**. Rien n'est perdu en silence.

**Configuration du projet** (`config.json`, module `@egen-civitas/esm-primary-navigation-app`) :

```json
{ "topbar": { "levels": { "min": 1, "max": 1, "disabled": [] } } }
```

`min`/`max` = 1 → TopBar « à l'ancienne » à une seule rangée (la navigation passe au centre du niveau 1). Défaut : `min 2`, `max 8`.

**Personnaliser depuis une app montée** — store global `egen-topbar-layout` (aucune dépendance de code), valable tant que
l'app propriétaire est active. Règles de région : `hidden`, `only`, `hide`, `hideGlobal` (`id` d'élément ou `name`
d'extension), visant la région où le contenu est *déclaré*. Règles de niveaux : `min`, `hide`.

```ts
import { getGlobalStore } from '@egen-civitas/esm-framework';

const store = getGlobalStore('egen-topbar-layout', { claims: {} });
// Page « détail d'un collaborateur » : niveau 1 réduit à ses propres boutons (retour) + recherche
store.setState((s) => ({
  claims: {
    ...s.claims,
    '@egen-civitas/esm-annuaire-app': {
      regions: { 'l1-left': { hideGlobal: true }, 'l1-right': { only: ['search'] } },
      levels: { min: 3, hide: [2] },
    },
  },
}));
// Au démontage de la page : retirer la clé de l'app dans `claims`.
```

Éléments globaux : `brand`, `search`, `language`, `divider`, `apps`, `quick-access`, `fullscreen`, `theme`, `user`, `clock`,
`menu-panel` (niveau 1), `nav` (niveau 2). « Implementer tools » n'est plus dans la TopBar : option du rail droit (bas).
