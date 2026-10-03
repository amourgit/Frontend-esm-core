# Navigation de niveau 2 de la TopBar

La navigation de niveau 2 (méga-menu) n'est **pas écrite dans la TopBar** : chaque app déclare
ses propres entrées dans son `routes.json`, et la TopBar les consolide. Il n'y a plus de barre
latérale globale : seuls la TopBar et le footer sont globaux. Une app qui veut une navigation
interne affiche sa propre barre latérale dans son contenu.

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
| `section` / `sectionLabel` | Entrée de niveau 2 (ex. *Annuaire*). Une app peut aussi contribuer à la section d'une autre app. |
| `group` / `groupLabel` | Colonne du méga-menu. |
| `label`, `description` | Texte du lien. `labelKey` / `descriptionKey` : clés de traduction (le texte sert de repli). |
| `icon` | Nom d'icône lucide, résolu dans la liste blanche `data/navIcons.ts` (ajouter l'icône si besoin). |
| `route` | Route SPA sans base ; **doit exister dans un `pages[].route`** (ou en être une sous-route). |
| `order` | Ordre d'affichage (surchargeable par configuration). `privileges` et `featureFlag` sont aussi acceptés. |

## Comment la TopBar les utilise

`useSlotNavEntries` lit le slot (`useExtensionSlotMeta`), `buildNavItemsFromSlot` fusionne :
une section déclarée par une app **remplace** les sous-menus de la maquette
(`data/workspaceMockData.ts`) ; une section sans app garde sa maquette ; une section inconnue de
la maquette est ajoutée à la fin.

## Garde-fous

- `yarn verify:nav` (inclus dans `yarn verify`) échoue si une entrée est incomplète ou pointe vers
  une route qu'aucune app ne déclare — c'est ce qui évite les liens morts.
- Migrer une section : déclarer ses entrées dans l'app, puis retirer ses `subMenus` de la maquette.
