# @egen/esm-sites-app

Application **Sites** : choix d'un site/direction (carrousel, recherche, filtres) puis espace du site.
Tous les composants visuels viennent de la catégorie `sites` de `@egen-civitas/esm-styleguide` ; l'app ne
porte que les pages, les routes et les données (`src/data`, à remplacer par l'API).

## Routes

| Route | Contenu |
|---|---|
| `/sites` | Choix du site (carrousel, recherche, filtres) |
| `/sites/:siteId` | Redirige vers `applications` |
| `/sites/:siteId/applications` | Applications & outils |
| `/sites/:siteId/membres` | Membres & équipes |
| `/sites/:siteId/ressources` | Ressources documentaires |
| `/sites/:siteId/taches` | Tâches |
| `/sites/:siteId/activite` | Journal d'activité |
| `/sites/:siteId/parametres` | Paramètres |

Site inconnu → `/sites` ; onglet inconnu → `applications`. La route `sites` est exclue du `routeRegex`
de `esm-not-found-app`.

## Navigation de niveau 2 (TopBar)

Déclarée dans `src/routes.json` (slot `topbar-level2-nav`, espace `intranet`) : section **Sites** avec
« Tous les sites » (`sectionRoute`) et une entrée par direction. Les entrées par direction sont statiques
tant que la liste des sites est une donnée d'exemple ; elles devront être générées depuis l'API.

## Origine

Portée de `Civitas---GED` (`views/SitesPage`, `views/sites/*`, `ui/StaggerTestimonials`, `layout/TabbedViewLayout`).
`AlfrescoSitesPage`, `MySitesSection` et le sélecteur de site de la TopBar ne sont pas encore repris.
