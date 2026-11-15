---
'@egen/esm-primary-navigation-app': major
---

Le thème, le plein écran et l'horloge sortent de la TopBar : `@egen/esm-appearance-app` injecte la bascule clair/sombre et le plein écran, `@egen/esm-clock-app` l'horloge, tous par extensions du slot neutre `topbar-slot` (`meta.topbar` : niveau `main`, région droite, ordres 70, 60 et 100, comme avant).

Retirés de `esm-primary-navigation-app` : `ThemeToggleOption`, `FullscreenOption`, les éléments globaux `theme`, `fullscreen` et `clock` (et leurs clés de placement `topbar.placement`), et les styles de l'horloge. Les sons d'interface qui accompagnaient ces boutons disparaissent avec eux.
