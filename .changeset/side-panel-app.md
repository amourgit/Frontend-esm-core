---
'@egen/esm-primary-navigation-app': major
---

Le panneau latéral sort de la TopBar : `@egen/esm-side-panel-app` injecte le bouton et le `StaggeredMenuPanel` (contenu du slot `staggered-menu-slot`, inchangé) par une extension du slot neutre `topbar-slot` (`meta.topbar` : niveau `main`, région droite, ordre 110, comme avant).

Retirés de `esm-primary-navigation-app` : `TopBarMenuPanel` (déplacé, avec son test et ses styles), l'élément global `menu-panel` (et sa clé de placement `topbar.placement`). Il ne reste qu'un élément global : `nav`.
