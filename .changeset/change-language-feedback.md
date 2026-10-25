---
'@egen/esm-primary-navigation-app': patch
---

Sélecteur de langue de la TopBar : le modal attend maintenant la requête de changement de langue, sort de l'état de chargement et affiche un message d'erreur en cas d'échec. Avant, une requête en échec laissait le bouton « Change » en chargement indéfiniment, sans aucun retour. Le modal ne plante plus si la session n'a pas d'utilisateur. Nouvelles clés de traduction `changeLanguageError` et `tryAgain` (en, fr).
