# Navigation de niveau 2 de la TopBar

La navigation de niveau 2 n'est **écrite nulle part dans la TopBar** : chaque app déclare ses
propres entrées dans son `routes.json` (slot `topbar-level2-nav`), et la TopBar les assemble en
arborescence. Sans déclaration, le niveau 2 est vide — il n'existe plus aucune maquette de repli.

Il n'y a plus de barre latérale globale : seuls la TopBar et le footer sont globaux. Une app qui
veut une navigation interne affiche sa propre barre latérale dans son contenu.

> Le **niveau 1** (choix de l'espace : Intranet, Extranet…) définit le contexte. Le niveau 2 en
> dépend : il n'affiche que les entrées déclarées pour l'espace actif.

## Déclarer ses entrées (dans l'app)

1. Exporter une extension qui ne rend rien (une seule fois, dans `src/index.ts`) :

   ```ts
   export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'mon-app-nav-entry' });
   ```

2. Ajouter une extension par lien dans `src/routes.json` :

   ```json
   {
     "name": "mon-app-nav-contacts",
     "slot": "topbar-level2-nav",
     "component": "navEntry",
     "online": true,
     "offline": false,
     "order": 510,
     "meta": {
       "workspaces": ["intranet"],
       "section": "annuaire",
       "sectionLabel": "Annuaire",
       "group": "collaborateurs",
       "groupLabel": "Collaborateurs",
       "label": "Tous les Contacts",
       "description": "Recherche par nom, poste, email et téléphone",
       "icon": "Contact",
       "route": "annuaire/contacts"
     }
   }
   ```

| Champ | Rôle |
|---|---|
| `workspaces` | Espaces où l'entrée apparaît (`["intranet"]`, `["intranet","extranet"]`). Absent, vide ou `["*"]` : tous les espaces. Peut différer d'une entrée à l'autre d'une même section. |
| `section` / `sectionLabel` | Bouton de niveau 2 (ex. *Annuaire*). Une app peut aussi contribuer à la section d'une autre app. |
| `group` / `groupLabel` | Colonne du méga-menu. **Facultatif** (voir « Formes d'un bouton »). |
| `sectionRoute` | Route du bouton de section lui-même, cliquable **en plus** de son menu. |
| `label`, `description` | Texte du lien. `labelKey` / `descriptionKey` : clés de traduction (le texte sert de repli). |
| `icon` | Nom d'icône lucide, résolu dans la liste blanche `data/navIcons.ts` (ajouter l'icône si besoin). |
| `route` | Route SPA sans base ; **doit exister dans un `pages[].route`** (ou en être une sous-route). |
| `order` | Ordre d'affichage (surchargeable par configuration). `privileges` et `featureFlag` sont aussi acceptés. |

## Formes d'un bouton de niveau 2

La forme découle des entrées déclarées pour l'espace actif, sans rien à configurer :

| Entrées de la section (dans l'espace) | Rendu |
|---|---|
| Une seule, **sans** `group` | Bouton direct : un lien, pas de menu. |
| Plusieurs, **sans** `group` | Menu à une seule colonne, sans titre. |
| Avec `group` | Menu à colonnes ; les entrées sans `group` forment une colonne sans titre, en tête. |
| + `sectionRoute` sur l'une d'elles | Le bouton de section est aussi un lien vers cette route. |

Les sections sont ordonnées par la première de leurs entrées (`order`). Une section qui n'a aucune
entrée visible dans l'espace actif n'apparaît pas.

## Espaces : exemples

```jsonc
// Visible uniquement en Intranet
"meta": { "workspaces": ["intranet"], "section": "informations", "label": "À la Une", "route": "informations/news" }

// Visible en Intranet et en Extranet
"meta": { "workspaces": ["intranet", "extranet"], "section": "annuaire", "label": "Contacts", "route": "annuaire/contacts" }

// Visible dans tous les espaces (omettre `workspaces`, ou ["*"])
"meta": { "section": "home", "label": "Accueil", "route": "home" }
```

## Surcharger la logique de clic (comportement d'app)

Par défaut, un clic applique la logique globale de la TopBar : son, fermeture du menu, navigation
vers la route. Une app peut la **remplacer** ou l'**enrichir** pour ses propres boutons, au
démarrage (`startupApp`), avec `registerNavBehavior` :

```ts
import { registerNavBehavior } from '@egen-civitas/esm-framework';

// Cible : une entrée (nom de l'extension dans routes.json) ou une section (`section`).
registerNavBehavior({ entry: 'annuaire-nav-contacts' }, {
  onSelect: ({ route, workspaceId, runDefault }) => {
    trackEvent('annuaire.contacts', { workspaceId });
    runDefault(); // garde la logique globale ; ne pas l'appeler la remplace
  },
});
```

- `{ entry }` : un lien de menu, ou un bouton direct (section à entrée unique).
- `{ section }` : le bouton d'une section à menu (sa navigation éventuelle vient de `sectionRoute`).
- Un seul comportement par cible ; le dernier enregistré l'emporte. `registerNavBehavior` renvoie
  une fonction qui le retire.
- Le comportement est lu **au clic** : un enregistrement tardif est pris en compte sans reconstruire la navigation.
- S'applique aussi aux sous-options du fil d'Ariane.

## Comment la TopBar les utilise

| Étape | Fichier |
|---|---|
| Lecture du slot (nom d'extension + `meta` validée) | `hooks/useSlotNavEntries.ts` |
| Filtrage par espace + arborescence | `utils/buildNavItemsFromSlot.ts` |
| Branchement des clics (comportements d'app ou logique globale) | `utils/navSelection.ts` |
| Option/sous-option active selon l'URL (route la plus précise) | `utils/resolveActiveNav.ts` |
| Fourniture au reste de la TopBar | `context/WorkspaceContext.tsx` (`currentWorkspace.navItems`) |

`data/workspaceMockData.ts` ne définit plus que les **espaces** (niveau 1) : aucune navigation.

## Garde-fous

- `yarn verify:nav` (inclus dans `yarn verify`) échoue si une entrée est incomplète
  (`section`, `label`, `route`), si `group`/`workspaces` sont mal formés, ou si `route` /
  `sectionRoute` pointent vers une route qu'aucune app ne déclare — c'est ce qui évite les liens morts.
- Tests unitaires : `buildNavItemsFromSlot`, `navSelection`, `resolveActiveNav`.

## Dépendance au framework

Cette fonctionnalité s'appuie sur `NavEntryMeta.workspaces` / `group` facultatif / `sectionRoute`,
`isNavEntryInWorkspace` et `registerNavBehavior`/`getNavBehavior`, fournis par
`@egen-civitas/esm-extensions` et `@egen-civitas/esm-framework` (version minor suivant 1.1.x).

## À gauche de la navigation : le contenu de l'app active

Le niveau 2 reçoit, juste à gauche des options de navigation, le contenu de barre d'outils de
l'**app active** (slot `top-nav-app-slot`) : identité (logo + nom), actions propres. Voir le
README pour le contrat du slot. Les options de navigation décrites ci-dessus restent inchangées.
