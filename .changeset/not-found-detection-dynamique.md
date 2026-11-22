---
'@egen/esm-not-found-app': patch
---

La page 404 ne s'appuie plus sur une liste de routes écrite en dur dans `routes.json` : elle compare les apps actives sur l'URL courante à celles actives sur une URL sonde (`checkActivityFunctions` de single-spa) et ne s'affiche que si aucune page n'est enregistrée pour la route. Corrige l'affichage de la 404 par-dessus toute app EXTERNE (ex. `@civitas/esm-penpot-app`), dont la route n'existe qu'à l'exécution. Le garde-fou `check-nav-routes` impose désormais que le `routeRegex` reste un fourre-tout.
