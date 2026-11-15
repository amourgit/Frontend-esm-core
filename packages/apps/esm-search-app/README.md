# esm-search-app

Recherche globale : le champ animé (GooeyInput) de la TopBar. L'app injecte son champ dans le slot neutre `topbar-slot`
(extension `search`, voir `src/routes.json`) ; la TopBar ne connaît ni le champ ni sa destination.

- **Placement** : `meta.topbar` = `{ level: main, rank: 10, region: right, order: 0 }`, `global: true`.
- **Configuration** : `search.path` — route vers laquelle on navigue à la soumission (`?q=<requête>` ajouté). Par défaut
  `${egenSpaBase}/search`.
- **État de la TopBar** reçu en props (tous facultatifs) : `searchOpen`, `setSearchOpen`, `closePanels`, `isMobile`, `isDesktop`.
  Sans TopBar, le champ gère lui-même son ouverture.
