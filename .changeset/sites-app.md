---
'@egen/esm-sites-app': minor
'@egen/esm-not-found-app': patch
---

Nouvelle app « Sites » (route `sites`) : choix d'un site (carrousel, recherche, filtres) puis espace du site en pages distinctes (`applications`, `membres`, `ressources`, `taches`, `activite`, `parametres`), construites avec les composants `sites` du styleguide. Sa navigation est injectée dans le niveau 2 de la TopBar (slot `topbar-level2-nav`, espace Intranet) : section « Sites » avec « Tous les sites » et une entrée par direction. La route `sites` est exclue du `routeRegex` de `esm-not-found-app`.
