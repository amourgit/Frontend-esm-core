# esm-launcher-app

Lanceur d'applications de la TopBar : bouton en grille, panneau « verre d'eau » et séparateur vertical. L'app injecte ses
éléments dans le slot neutre `topbar-slot` (voir `src/routes.json`) ; la TopBar ne connaît ni le lanceur ni son contenu.

| Extension | Placement (`meta.topbar`) |
| --- | --- |
| `topbar-divider` | main · right · 20 |
| `app-launcher` | main · right · 30 |

- **Contenu du panneau** : extensions du slot `app-menu-slot` (chaque app y déclare sa tuile, comme `esm-offline-tools-app`),
  puis les liens externes de la configuration.
- **Configuration** : `externalRefLinks` — liste `{ title, redirect }` de liens externes affichés dans le panneau.
- **État de la TopBar** reçu en props (tous facultatifs) : `isActivePanel`, `togglePanel` (panneau `appMenu`, ouverture
  exclusive), `searchOpen`, `isDesktop`. Sans TopBar, le lanceur gère lui-même son ouverture.
- Le bouton disparaît tant qu'aucune tuile ni lien n'existe ; le badge reflète leur nombre (plafonné à `9+`).
