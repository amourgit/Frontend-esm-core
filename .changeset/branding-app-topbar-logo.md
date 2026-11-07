---
'@egen/esm-primary-navigation-app': major
---

La TopBar ne contient plus de logo : il est injecté par la nouvelle app `@egen/esm-branding-app` (extension `brand-logo` sur le slot neutre `topbar-l1-left-slot`, configurable et modifiable à chaud, sans toucher à la TopBar).

Changements dans `esm-primary-navigation-app` :

- suppression du composant `EgenLogo`, de `brand.ts` et des styles de logo ;
- l'élément global `brand` (logo + sélecteurs) est renommé `context-selectors` et ne porte plus que les sélecteurs d'espace et de site : la clé de placement `topbar.placement.brand` devient `topbar.placement.context-selectors` ;
- dans une région, les extensions sont rendues AVANT les éléments globaux (règle transitoire : ces éléments migrent vers des apps), ce qui garde le logo injecté à gauche des sélecteurs ;
- le son de clic du logo (`playXboxSound`) disparaît avec lui.
