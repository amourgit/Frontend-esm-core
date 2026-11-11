---
'@egen/esm-primary-navigation-app': major
'@egen/esm-sites-app': minor
---

Les sélecteurs d'Espace et de Site sortent de la TopBar : la nouvelle app `@egen/esm-spaces-sites-app` les injecte par extension (slot neutre `topbar-slot`, `meta.topbar`) et gère les Espaces (liste ouverte, en configuration) et un arbre de sites à profondeur illimitée (cascade de sélecteurs). Le contexte actif est partagé par le store global `egen-spaces-sites`.

`esm-primary-navigation-app` :

- suppression de `WorkspaceAndSiteSelectorsColumn`, de `SiteContext`, du store d'espace, des données en dur (4 Espaces, 4 sites, applications de l'intranet) et de l'élément global `context-selectors` (et de sa clé de placement) ;
- l'extension `workspace-selector-menu` (panneau latéral) devient `space-selector-menu` dans la nouvelle app ;
- `WorkspaceProvider` lit l'Espace actif dans le store partagé ; le fil d'Ariane affiche toute la chaîne de sites du registre (et non plus une liste en dur) ;
- le son de sélection et le callback `onShowNotification` disparaissent avec les sélecteurs (les confirmations passent par `showSnackbar`).

`esm-sites-app` : déclare ses 4 sites dans le registre partagé (slot de données `sites-registry-slot`, `meta.site`).
