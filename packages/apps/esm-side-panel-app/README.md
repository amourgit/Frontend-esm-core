# esm-side-panel-app

Panneau latéral de la TopBar : petit bouton à l'extrême droite et panneau `StaggeredMenuPanel` qui s'ouvre à droite
(fermeture par son bouton, un clic à côté ou Échap). L'app l'injecte dans le slot neutre `topbar-slot` (extension
`side-panel`, voir `src/routes.json`) : main · right · 110.

- **Contenu** : entièrement fourni par les apps via le slot `staggered-menu-slot` (ex. `space-selector-menu` de
  `esm-spaces-sites-app`).
- **État de la TopBar** reçu en props (facultatifs) : `searchOpen`, `isDesktop` — sur écran tactile, le bouton cède la place
  à la recherche ouverte.
- Le panneau est monté dans `document.body` (portail) : le fond « verre » de la TopBar casserait son `position: fixed`.
