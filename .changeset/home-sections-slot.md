---
"@egen/esm-home-app": minor
"@egen/esm-informations-app": minor
"@egen/esm-annuaire-app": minor
"@egen/esm-sites-app": minor
---

Accueil : les sections ne sont plus codées en dur dans la page. `esm-home-app` expose le slot d'extensions `home-sections` (`SectionSlot`, en-têtes de section collants) et chaque app y branche sa propre section depuis son `routes.json` : Informations (À la une, Actualités, Annonces, Événements à venir — order 10 à 40), Annuaire (50), Sites (60), et « Nous suivre » côté Accueil (90). Composants, données d'exemple et tests des sections déplacés dans l'app propriétaire. Nécessite `@egen-civitas/esm-styleguide` >= 2.2.0 (`SectionSlot`, `SectionCard`) via `esm-app-shell` >= 2.6.5.
