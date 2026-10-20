---
"@egen/esm-primary-navigation-app": patch
---

La TopBar ne plante plus quand le shell est livré avec un framework antérieur à 1.2 (sans `isNavEntryInWorkspace` / `getNavBehavior`) : elle applique alors la même règle de filtrage par espace et la logique de clic globale.
