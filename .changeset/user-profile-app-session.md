---
'@egen/esm-primary-navigation-app': major
---

La TopBar ne connaît plus la session ni le profil utilisateur : ils passent dans la nouvelle app `@egen/esm-user-profile-app`, qui injecte son menu par extension (slot neutre `topbar-l1-right-slot`, ordre 90, à la place historique) et porte le garde d'authentification et la redirection de la racine.

Changements dans `esm-primary-navigation-app` :

- le garde d'authentification (renvoi vers la connexion d'un utilisateur sans session) et la page de redirection racine (`redirect`) sont retirés ; la TopBar rend toujours sa pile de niveaux ;
- l'élément global `user` (et la clé de placement `topbar.placement.user`), le composant `UserMenuOption`, l'extension `default-user-panel` et les traductions `userMenu*` sont retirés (déplacés dans l'app dédiée) ;
- une région rend désormais ses éléments globaux ET ses extensions dans un seul ordre, trié par niveau puis par `order` (celui de l'élément, ou celui du `routes.json` de l'extension ; à `order` égal, l'extension passe avant). Cela remplace la règle transitoire « extensions avant éléments » ;
- chaque slot d'une région est enregistré par une instance cachée, pour que la configuration `extensionSlots` d'un déploiement (ajouts, retraits) soit toujours prise en compte ;
- test d'architecture : la TopBar ne doit contenir aucune logique de session.
