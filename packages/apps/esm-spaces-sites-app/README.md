# @egen/esm-spaces-sites-app

Les **Espaces** (intranet, extranet, public, personnel…) et les **sites** (un arbre à **profondeur illimitée**) : leurs
sélecteurs dans la TopBar, le contexte actif partagé avec les autres apps, et le registre des sites. La TopBar, elle, ne
connaît ni la liste des Espaces ni celle des sites : c'est un squelette neutre.

## Ce que l'app apporte

| Élément | Où | Rôle |
| --- | --- | --- |
| Extension `context-selectors` | slot `topbar-slot`, `meta.topbar` : niveau `main`, région `left`, `after: brand-logo` | Sélecteur d'Espace + cascade de sites |
| Extension `space-selector-menu` | slot `staggered-menu-slot` | Choix de l'Espace dans le panneau latéral (le sélecteur de la TopBar est masqué en mobile) |
| Store global `egen-spaces-sites` | framework | Espace actif, site actif, registre des sites : lisible par toute app |

Son placement n'est pas figé : le niveau, la région et la position viennent de `meta.topbar` (voir le README de la TopBar).

## Sites : arbre à profondeur illimitée

Les sites sont déclarés **à plat** : chacun référence son parent par `parentId`. Pas de structure imbriquée à maintenir,
pas de limite de profondeur ; plusieurs sources contribuent au même arbre. Chaque niveau du sélecteur est une liste : choisir
un site qui a des sous-sites ouvre la liste de ses enfants, et ainsi de suite. Le site actif est le plus profond choisi ;
choisir « tout » à un niveau remonte d'un cran. Un site peut être de n'importe quel niveau.

Les données incohérentes sont corrigées et signalées (`console.warn`), jamais fatales : doublon d'identifiant (le premier est
conservé), parent introuvable ou site parent de lui-même (le site devient une racine), boucle (elle est coupée).

### Deux sources, qui s'ajoutent

1. **Les apps** déclarent un site par extension du slot de **données** `sites-registry-slot` (composant qui ne rend rien),
   dans `meta.site` de leur `routes.json` :

   ```json
   {
     "name": "sites-registry-dsi",
     "slot": "sites-registry-slot",
     "component": "siteDeclaration",
     "meta": { "site": { "id": "dsi", "parentId": null, "name": "Direction des Systèmes d'Information", "shortName": "DSI" } }
   }
   ```

   Un site de plus, ou un sous-site, = une extension de plus. Aujourd'hui `@egen/esm-sites-app` déclare ainsi ses 4 directions.

2. **La configuration du déploiement** (`sites.items`) : même forme, à plat. Pour un même identifiant, la configuration
   complète et remplace la déclaration de l'app (le déploiement a le dernier mot).

Champs d'un site : `id`, `name` (obligatoires) ; `parentId`, `shortName`, `category` (regroupe les sites d'un même parent),
`description`, `order` (ordre parmi les frères, puis par nom).

## Contrat : le store `egen-spaces-sites`

Toute app le lit **sans dépendance de code** (`getGlobalStore('egen-spaces-sites')`) ; seule cette app l'écrit.

```ts
interface SpacesSitesState {
  spaces: Array<{ id: string; name: string; subtitle?: string }>;
  spaceId: string | null;            // l'Espace actif
  sites: Array<{ id: string; parentId?: string | null; name: string; shortName?: string; category?: string }>; // registre, à plat
  siteId: string | null;             // le site actif (n'importe quel niveau) ; null = tous les sites
}
```

La TopBar s'en sert pour filtrer sa navigation par Espace (`meta.workspaces` des entrées) et afficher la chaîne de sites
dans le fil d'Ariane.

## Configuration

Clé de config : `@egen-civitas/esm-spaces-sites-app`. Tout est modifiable à chaud (`useConfig` est réactif).

| Clé | Défaut | Rôle |
| --- | --- | --- |
| `spaces` | intranet, extranet, public, personnel | Liste **ouverte** des Espaces (`id`, `name`, `subtitle`) |
| `defaultSpaceId` | `intranet` | Espace actif au premier chargement (sinon le premier de la liste) |
| `sites.items` | `[]` | Sites du déploiement, à plat (`id`, `parentId`, `name`, `shortName`, `category`, `description`, `order`) |
| `sites.route` | `${egenSpaBase}/sites/{siteId}/applications` | Où mène le choix d'un site ; sert aussi à reconnaître le site actif depuis l'URL. Vide : pas de navigation |
| `sites.listRoute` | `${egenSpaBase}/sites` | Où mène « tous les sites » depuis le premier niveau. Vide : pas de navigation |
| `selectors.showSpaces` | `true` | Affiche le sélecteur d'Espace dans la TopBar |
| `selectors.showSites` | `true` | Affiche la cascade de sites (le registre reste publié pour les autres apps) |

Le site actif suit aussi l'URL : sur une route qui contient l'identifiant d'un site (à tout niveau), ce site devient actif.

## Organisation du code

```
src/
  index.ts · routes.json · config-schema.ts
  store/                 store partagé (Espace, site actif, registre) et ses actions
  spaces/                sélecteur d'Espace, panneau latéral, lecture de la config
  sites/                 arbre (pur), registre (config + apps), cascade, routes et suivi de l'URL
  context-selectors/     l'extension de la TopBar (assemble Espace + cascade) et ses styles
  test-utils/            mock du framework (vrai petit store réactif)
```
