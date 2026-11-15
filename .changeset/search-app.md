---
'@egen/esm-primary-navigation-app': major
---

La recherche sort de la TopBar : `@egen/esm-search-app` injecte le champ animé par une extension du slot neutre `topbar-slot` (`meta.topbar` : niveau `main`, région droite, ordre 0, comme avant). La config `search.path` déménage dans cette app.

Retirés de `esm-primary-navigation-app` : l'élément global `search` (et sa clé de placement `topbar.placement`), `GooeyInput` (déplacé dans l'app de recherche), la config `search.path`, le callback mort `onOpenGlobalSearch` et `GlobalCallbacks`. Le son d'interface qui accompagnait le champ disparaît avec lui.
