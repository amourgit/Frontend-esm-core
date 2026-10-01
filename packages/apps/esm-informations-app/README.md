# @egen/esm-informations-app

Application **Informations** : News & Publications, Annonces & Flash Info et Agenda & Calendrier,
pour trois audiences — **interne**, **extranet** et **public**.

## Routes

| Route | Onglet |
|---|---|
| `/informations`, `/informations/news` | News & Publications |
| `/informations/annonces` | Annonces & Flash Info |
| `/informations/agenda` | Agenda & Calendrier |

Un onglet = une sous-route ; toute autre sous-route retombe sur News & Publications.
La route `informations` est exclue du `routeRegex` de `esm-not-found-app`.

## Audiences

Chaque contenu (article, annonce, événement) porte un champ `audience?: 'interne' | 'extranet' | 'public'`
(`interne` par défaut). Le sélecteur en tête de page filtre les trois onglets à la fois ; l'audience
présélectionnée se règle avec la clé de config `defaultAudience`.

## Origine

Portée depuis `Civitas---GED` (`InformationsPage`, `NewsFeedView`, `EventsSection`, `TabbedViewLayout`,
`AnimatedTabs`). `FilterBar` et `DocumentToolbar` vivent dans `@egen-civitas/esm-styleguide` (module
`filters`) ; `playXboxSound` vient aussi du styleguide.

## Données

Les contenus sont pour l'instant des données d'exemple (`src/data`, `src/news`, `src/announcements`) :
à brancher sur l'API quand le backend sera prêt.
