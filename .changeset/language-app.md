---
'@egen/esm-primary-navigation-app': major
---

La langue sort de la TopBar : la nouvelle app `@egen/esm-language-app` injecte le bouton de langue (extension du slot neutre `topbar-slot`, `meta.topbar` : niveau `main`, région droite, ordre 10), le lien « Changer de langue » du menu utilisateur (`user-panel-slot`) et la fenêtre `change-language-modal`.

Retirés de `esm-primary-navigation-app` : `LanguageOption`, l'élément global `language` (et sa clé de placement), le dossier `components/change-language` (déplacé, historique git conservé), l'extension `change-language`, la modale `change-language-modal` et les traductions correspondantes (déplacées).
