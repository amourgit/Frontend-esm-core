---
"@egen/esm-home-app": minor
---

Accueil : toutes les sections reposent désormais sur le squelette `Section` du framework (en-tête avec options · trait fin · corps en grille responsive · pied). Nouvelles sections alimentées par des mocks issus des apps Informations et Annuaire : Annonces, Événements à venir, Annuaire (collaborateurs) et Nos sites ; l'Actualités reprend les 6 articles d'Informations. Calendrier d'équipe, Documents et Raccourcis migrés sur le même squelette (dates d'exemple relatives à aujourd'hui, grille des raccourcis réellement responsive). `HomeSection` est supprimé au profit de `Section`. Nécessite `@egen-civitas/esm-styleguide` >= 2.1.1 (première version exposant `Section` par son point d'entrée réel ; 2.1.0 la contenait sans l'exporter).
