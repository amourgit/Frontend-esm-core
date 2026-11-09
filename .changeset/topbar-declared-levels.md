---
"@egen/esm-primary-navigation-app": minor
"@egen/esm-branding-app": minor
"@egen/esm-user-profile-app": minor
"@egen/esm-home-app": minor
"@egen/esm-ai-assistant-app": minor
---

TopBar : les niveaux sont DÉCLARÉS par les apps, plus rien n'est figé dans la TopBar. Un seul slot neutre, `topbar-slot`, remplace tous les slots `topbar-l<N>-<région>-slot` (ex. `topbar-l1-right-slot`, éradiqué) et les slots historiques `top-nav-*` ; chaque app y attache son composant et déclare son placement dans `meta.topbar` : `level` (nom choisi par l'app, créé s'il n'existe pas, partagé si une autre app le déclare aussi), `rank` (position du niveau dans la pile), `region` (`left` | `center` | `right` | `background`), `order`, et `before` / `after` (position par référence à une autre extension, même d'une autre région du niveau ; cycles et références absentes gérés sans erreur). Pile de niveaux : `topbar.levels.{order,hidden,keep,max}` (remplace `min` / `max` / `disabled` numériques) ; le contenu d'un niveau non rendu s'affiche sur le niveau précédent. `topbar.placement` prend `"<niveau>:<région>"` ; le layout des apps (`egen-topbar-layout`) vise `<niveau>:<région>` et des niveaux par nom. Niveaux éphémères (annonces, `startsAt` / `expiresAt` / `ttl`) inchangés et placés sous la pile. Les apps du core (branding, profil, accueil, assistant IA) migrent vers `topbar-slot` ; `esm-primary-navigation-app` déclare ses propres niveaux `main` et `navigation`. L'ancien nom de slot de navigation `topbar-level2-nav` n'est plus lu (utiliser `topbar-nav-slot`). Garde-fous : `no-hardcoded-levels.test.ts` et `tools/check-nav-routes.mjs` refusent tout slot figé sur un niveau ou toute déclaration `meta.topbar` invalide. README et NAVIGATION mis à jour.
