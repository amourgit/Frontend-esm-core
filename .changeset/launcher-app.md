---
'@egen/esm-primary-navigation-app': major
---

Le lanceur d'applications sort de la TopBar : `@egen/esm-launcher-app` injecte le séparateur et le bouton « Applications » (panneau lu dans le slot `app-menu-slot`, inchangé) par des extensions du slot neutre `topbar-slot` (`meta.topbar` : niveau `main`, région droite, ordres 20 et 30, comme avant). La config `externalRefLinks` déménage dans cette app.

Retirés de `esm-primary-navigation-app` : `AppsMenuOption`, `TopBarOptionButton`, les éléments globaux `divider`, `apps` et `quick-access` (et leurs clés de placement `topbar.placement`), la config `externalRefLinks` et la clé de traduction `AppMenuTooltip`. Le panneau « Raccourcis » de la TopBar est supprimé (bouton mort : le slot `quick-access-slot` n'avait aucune extension ; l'app `esm-quick-access-app` passe par le rail droit).
