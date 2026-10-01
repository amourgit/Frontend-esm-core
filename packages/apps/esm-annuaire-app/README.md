# @egen/esm-annuaire-app

Application **Annuaire** : annuaire des collaborateurs (cartes, liste, galerie « click-expand »),
organigramme, structures (sites) et fiche détaillée d'un collaborateur.

## Routes

| Route | Contenu |
|---|---|
| `/annuaire`, `/annuaire/contacts` | Annuaire des collaborateurs (onglet « directory ») |
| `/annuaire/organigramme` | Organigramme |
| `/annuaire/structures` | Structures / sites |
| `/annuaire/:collaborateurId[/:tab]` | Fiche collaborateur (`review`, `wishlist`, `purchase-history`, `loyalty`, `support`, `insight`, `activity`) |
| `/annuaire/:collaborateurId/details[/:tab]` | Idem |

Toute autre sous-route retombe sur l'annuaire. La route `annuaire` est exclue du `routeRegex`
de `esm-not-found-app`.

## Origine

Portée de `Civitas---GED` par copie intégrale puis adaptation à l'environnement :

| GED | esm-annuaire-app |
|---|---|
| `views/AnnuairePage.tsx` | `src/annuaire/annuaire.component.tsx` |
| `views/CollaborateurDetailPage.tsx` | `src/collaborateur/collaborateur-detail-page.component.tsx` |
| `directory/Employee{Card,ListView,DetailModal}.tsx` | `src/directory/employee-*.component.tsx` |
| `collaborateur/Collaborateur*.tsx` | `src/collaborateur/collaborateur-*.component.tsx` |
| `ui/ClickExpandGallery.tsx` | `src/components/ui/click-expand-gallery.component.tsx` |
| `data/directoryData.ts` | `src/data/directory-data.ts` |

Adaptations : `playXboxSound`, `PageBackground`, `FilterBar` / `useFilterSchema` / `matchesFilters`
viennent de `@egen-civitas/esm-framework` (styleguide) ; `TabbedViewLayout` et `AnimatedTabs` sont les
copies déjà adaptées de l'app Informations ; les callbacks `onShowNotification` / `onShowToast`
passent par `showToast` du framework (`src/utils/notify.ts`) ; le volet « right content » de GED
(`PageRightContent`) devient un `<aside>` local de la fiche collaborateur.

## Données

Les collaborateurs sont des données d'exemple (`src/data/directory-data.ts`) : `AnnuairePage` accepte
les props `employees` et `onRefresh` pour brancher l'API quand le backend sera prêt.
Le dictionnaire FR/EN de la page est interne au composant (copie GED).
