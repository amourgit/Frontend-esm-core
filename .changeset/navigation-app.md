---
'@egen/esm-primary-navigation-app': major
---

La navigation sort de la TopBar : `@egen/esm-navigation-app` injecte le menu déroulant et le fil d'Ariane par une extension du slot neutre `topbar-slot` (`meta.topbar` : niveau `navigation`, rang 20, région centre, ordre 0, comme avant). Elle porte aussi la lecture de l'Espace actif et des entrées `topbar-nav-slot` (contrat inchangé), ainsi que les extensions `link` et `breadcrumb-item`.

Le fil d'Ariane ne contient plus aucune logique propre à une app : l'annuaire codé en dur (`/annuaire/<param>`, onglets, copie de `directoryData.ts`) disparaît. Une page publie désormais son propre contexte dans le store global `egen-breadcrumb-context` (contrat documenté dans le README de `esm-navigation-app`) ; `esm-annuaire-app` publie la fiche collaborateur.

Retirés de `esm-primary-navigation-app` : `BreadcrumbNav`, `DropdownNavigation`, `WorkspaceContext` et les hooks/utilitaires de navigation, les éléments globaux (`global/` : l'élément `nav`, son placement, `NavContext`), la config `topbar.placement` et les extensions `link` / `breadcrumb-item`. Les sons d'interface de la navigation disparaissent avec elle. La TopBar ne déclare plus aucune extension.
