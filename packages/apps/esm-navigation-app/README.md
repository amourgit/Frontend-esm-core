# esm-navigation-app

Navigation de la TopBar : **menu déroulant** (accueil, ou « mode complet » à la demande) et **fil d'Ariane** contextuel.
L'app les injecte dans le slot neutre `topbar-slot` (extension `topbar-navigation`, voir `src/routes.json`) :
niveau `navigation` (rang 20) · centre · ordre 0. La TopBar ne connaît ni l'un ni l'autre, et cette app ne connaît **aucune
app métier**.

## Données lues (déclarées par les apps)

| Source | Rôle |
| --- | --- |
| slot `topbar-nav-slot` | Arbre de navigation : sections et entrées (`meta` validée par `isNavEntryMeta`, filtrée par Espace via `meta.workspaces`). **Contrat inchangé.** |
| slot `topbar-nav-start-slot` | Contenu juste avant la navigation. |
| slot `top-nav-breadcrumb-slot` | Maillons déclaratifs du fil (composant `breadcrumb-item`). |
| store `egen-spaces-sites` | Espace actif (filtre de l'arbre) et chaîne de sites du chemin. Lecture seule (`esm-spaces-sites-app`). |
| comportements `registerNavBehavior` | Une app peut surcharger la logique appliquée au clic d'un bouton de navigation. |
| store `egen-breadcrumb-context` | **Contexte publié par la page** (voir ci-dessous). |

## Contexte du fil d'Ariane publié par une page

Quand une page a un contexte qui n'est pas dans l'arbre de navigation (une fiche, un dossier…), **c'est la page qui le
publie**, pas la navigation qui le déduit de l'URL :

```ts
const store = getGlobalStore('egen-breadcrumb-context', { pathname: null, crumbs: [], entryTitle: null });
store.setState({
  pathname: location.pathname, // lie le contexte à CETTE page : ignoré s'il ne correspond plus (pas de maillon périmé)
  crumbs: [{ key: 'collab-42', label: 'Awa Ndong', imageUrl: avatarUrl, copyText: '42' }],
  entryTitle: 'Détails', // titre du dernier maillon si l'arbre n'a aucune entrée pour cette page
});
// au démontage : store.setState({ pathname: null, crumbs: [], entryTitle: null });
```

Les maillons s'insèrent entre la section et l'entrée, après les sites. Référence : `esm-annuaire-app`
(`src/collaborateur/breadcrumb-context.ts`).

## Extensions fournies

- `link` (`GenericLink`) — lien simple, config `{ title, target }`.
- `breadcrumb-item` (`BreadcrumbItem`) — maillon déclaratif pour `top-nav-breadcrumb-slot`.
