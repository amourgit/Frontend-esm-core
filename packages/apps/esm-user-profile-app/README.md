# @egen/esm-user-profile-app

Profil utilisateur et **session**. Cette app injecte le menu utilisateur dans la TopBar, et porte la logique qui renvoie
vers la connexion un utilisateur sans session. La TopBar, elle, ne sait rien de tout cela : c'est un squelette neutre.

## Ce que l'app apporte

| Élément | Où | Rôle |
| --- | --- | --- |
| Extension `user-menu` | slot `topbar-l1-right-slot`, ordre 90, globale | Avatar (initiale du nom) qui ouvre un panneau |
| Extension `default-user-panel` | slot `user-panel-slot`, ordre 0 | Identité de la session, première ligne du panneau |
| Page `sessionGuard` | toutes les routes sauf `login`, `logout`, `change-password` | Renvoie vers la connexion l'utilisateur sans session |
| Page `rootRedirect` | racine du SPA (`/`) | Envoie l'utilisateur authentifié vers l'accueil |

Le panneau du menu affiche l'identité puis les extensions des slots **`user-panel-slot`** (haut) et
**`user-panel-bottom-slot`** (bas), que d'autres apps alimentent (déconnexion, langue, mode hors ligne…). Sans extension
dans ces slots, le menu n'est pas affiché.

## Garde de session

Logique reprise à l'identique de l'ancienne TopBar :

- utilisateur **authentifié** (session authentifiée *et* personne connue) : rien ;
- mode **multi-tenant** : rien, le garde du tenant redirige déjà (jamais deux navigations concurrentes) ;
- mode **single** ou **off** : redirection vers `session.loginRoute`, en conservant la page demandée (`referrer`) pour y
  revenir après la connexion.

La page `rootRedirect` ne fait **strictement rien** tant que la session n'est pas authentifiée : le garde décide seul du
renvoi vers la connexion.

Cette app ne rafraîchit ni ne surveille le token : la session vit dans le framework (`esm-api`) et cette app réagit à
son état.

## Configuration

Clé de config : `@egen-civitas/esm-user-profile-app`.

| Clé | Défaut | Rôle |
| --- | --- | --- |
| `session.loginRoute` | `/login` | Route de connexion (relative à la base du SPA) |
| `session.homeRoute` | `${egenSpaBase}/home` | Destination de l'utilisateur authentifié depuis la racine |

## Le menu dans la TopBar

La TopBar passe à toute extension un `state` (reçu comme props) : ouverture exclusive des panneaux (`isActivePanel`,
`togglePanel`), recherche ouverte (`searchOpen`), type d'écran (`isDesktop`). Le menu s'en sert pour s'ouvrir et se fermer
avec les autres panneaux, et pour s'effacer quand la recherche s'ouvre sur un écran tactile. Monté hors d'une TopBar
(props absentes), il gère lui-même son ouverture.

Son placement n'est pas figé : la place « entre le thème et l'horloge » vient de son `order` (90) dans `routes.json`,
partagé avec les éléments globaux de la région. Changer de slot ou d'ordre ne demande aucune modification de la TopBar.

## Styles

L'extension utilise des classes Tailwind : elles sont compilées par la feuille Tailwind commune du Core, injectée par la
TopBar (qui scanne toutes les apps). Cette app n'embarque donc pas son propre Tailwind.
