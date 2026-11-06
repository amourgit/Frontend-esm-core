# @egen/esm-primary-navigation-app

Rend la topbar principale de l'application EGEN : la barre de navigation
persistante affichée en haut de tous les espaces tenant authentifiés.

## Architecture — N niveaux, trois régions chacun

La TopBar est une **pile de niveaux** (`1` en haut, puis `2`, `3`…). Leur nombre n'est écrit nulle part : il se déduit de
ce qui est déclaré et de la config `topbar.levels` (voir « TopBar modulaire »). **Tous les niveaux ont le même
squelette** — aucun n'est un cas particulier :

```
┌ niveau N ───────────────────────────────────────────────────────────────┐
│ [calque d'arrière-plan : l<N>-background]                                │
│  l<N>-left          │  l<N>-center                    │  l<N>-right      │
└─────────────────────────────────────────────────────────────────────────┘
```

N'importe quelle app du monorepo (ou distante) peut y injecter des composants, dans **n'importe quelle région de
n'importe quel niveau**, via son propre `routes.json` (slot `topbar-l<N>-<région>-slot`), sans toucher à ce package ;
un composant ainsi injecté peut lui-même exposer ses propres slots d'extension. Rien dans le code ne dépend d'un numéro
de niveau (un test de non-régression, `no-hardcoded-levels.test.ts`, le garantit).

Placement d'usine des éléments globaux (déplaçable par la config `topbar.placement`, voir plus bas) :

| Niveau | Gauche            | Centre                                     | Droite                                                                 |
|--------|-------------------|--------------------------------------------|------------------------------------------------------------------------|
| 1      | logo + sélecteurs | —                                          | recherche · langue · apps · raccourcis · plein écran · thème · utilisateur · horloge |
| 2      | —                 | navigation déroulante ou fil d'Ariane      | —                                                                      |

## Autres points d'extension (hors régions)

| Slot                     | Rendu par                          | Alimenté aujourd'hui par                          |
|--------------------------|-------------------------------------|----------------------------------------------------|
| `app-menu-slot`          | Grille du panneau "Applications"    | `esm-offline-tools-app`                            |
| `quick-access-slot`      | Liste du panneau "Raccourcis"       | — (ouvert, libre)                                  |
| `notifications-nav-menu-slot` | Zone droite « Notifications » (rail droit, rendu par `esm-notifications-app`) | — (ouvert, libre) |
| `user-panel-slot`        | Panneau utilisateur (haut)          | Cette app (profil, langue), `esm-login-app`, `esm-offline-tools-app` |
| `user-panel-bottom-slot` | Panneau utilisateur (bas)           | `esm-login-app`                                    |
| `topbar-nav-start-slot`  | Juste avant la navigation           | — (ouvert, libre)                                  |
| `top-nav-breadcrumb-slot`| Fil d'Ariane par extensions (voir ci-dessous) | `breadcrumb-item`                        |

## Slots historiques (compatibilité)

Les anciens slots nommés restent honorés : chacun est rattaché à la région équivalente (tableau unique :
`src/intranet-topbar/kit/legacy-slots.ts`) et se comporte comme le slot officiel de cette région. Les nouvelles apps
utilisent les slots `topbar-l<N>-<région>-slot`.

| Slot historique            | Équivaut à               | Alimenté aujourd'hui par   |
|----------------------------|--------------------------|----------------------------|
| `top-nav-info-slot`        | `topbar-l1-center-slot`  | — (ouvert, libre)          |
| `top-nav-actions-slot`     | `topbar-l1-right-slot`   | extensions d'apps          |
| `top-nav-trailing-slot`    | `topbar-l1-right-slot`   | — (ouvert, libre)          |
| `top-nav-app-slot`         | `topbar-l2-left-slot`    | `esm-home-app` (contenu de barre d'outils **propre à l'app active**) |
| `top-nav-level2-end-slot`  | `topbar-l2-right-slot`   | `esm-ai-assistant-app` (contributions **globales**) |
| `top-nav-level2-start-slot`| `topbar-nav-start-slot`  | — (ouvert, libre)          |

### Déclarer le contenu de barre d'outils d'une app

```json
{
  "extensions": [
    { "name": "mon-app-toolbar", "slot": "topbar-l2-left-slot", "component": "appToolbar", "order": 0 }
  ]
}
```

L'extension reçoit l'état de slot (`isActivePanel`, `togglePanel`, `hidePanel`). Elle doit être un
widget compact (hauteur 32 px, `rounded-lg`, survol `hover:bg-white/10`) ; voir
`esm-home-app/src/topbar/home-app-toolbar.extension.tsx` comme référence. Une app dont aucune
extension n'est déclarée n'affiche rien dans la zone app (le séparateur disparaît aussi).

### Fil d'Ariane par extensions

`top-nav-breadcrumb-slot` : entièrement invisible (hauteur 0) tant qu'aucune
extension n'y est assignée. Utiliser le composant générique `breadcrumb-item`
(fourni par cette app, aucun code à écrire) :

```json
{
  "extensions": [
    {
      "name": "ma-page-breadcrumb-racine",
      "slot": "top-nav-breadcrumb-slot",
      "component": "breadcrumbItem",
      "order": 0,
      "config": { "title": "Mon Application", "target": "${egenSpaBase}/mon-app" }
    },
    {
      "name": "ma-page-breadcrumb-actif",
      "slot": "top-nav-breadcrumb-slot",
      "component": "breadcrumbItem",
      "order": 1,
      "config": { "title": "Détail" }
    }
  ]
}
```

`target` omis → item non cliquable (page active). Le séparateur `›` entre
deux items et le style "actif" du dernier sont gérés automatiquement.

## Composants génériques réutilisables (enregistrés sans slot fixe)

Ces composants ne sont attachés à aucun slot par cette app — n'importe quelle
autre app les utilise depuis son propre `routes.json` en les pointant vers le
slot de son choix :

- **`link`** (`GenericLink`) — un lien simple, config `{ title, target }`.
- **`breadcrumb-item`** (`BreadcrumbItem`) — voir ci-dessus.

## Configuration de l'app

| Clé                  | Défaut                       | Description                                              |
|-----------------------|------------------------------|------------------------------------------------------------|
| `logo.src/alt/name/link` | —                          | Personnalisation du logo (voir `config-schema.ts`)        |
| `search.path`         | `${egenSpaBase}/search`      | Route ciblée par la barre de recherche (`?q=` en query)   |
| `externalRefLinks`    | `[]`                         | Liens externes affichés dans le panneau "Applications"    |

La barre de recherche navigue réellement vers `search.path` à la soumission
(Entrée ou icône) — pointez cette config vers votre propre app de résultats
de recherche si vous en développez une.

## TopBar modulaire (N niveaux)

La TopBar est une pile de **niveaux** numérotés (`1` en haut, `2`, `3`…). Chaque niveau a la même structure : trois **régions**
neutres `l<N>-left | l<N>-center | l<N>-right`. Elle ne connaît aucune app : tout ce qui s'y affiche vient d'**éléments
globaux** (`src/intranet-topbar/global/items.tsx`) ou d'**extensions** d'apps.

**Déclarer du contenu** : slot `topbar-l<N>-<région>-slot` dans le `routes.json` de n'importe quelle app
(ex. `topbar-l3-right-slot` = niveau 3, région droite). Visible quand l'app est active, ou toujours avec `meta.global: true`.
Slots historiques toujours honorés : voir « Slots historiques (compatibilité) » plus haut.

**Nombre de niveaux** (règles uniques) :
1. = max(`topbar.levels.min`, plus haut niveau déclaré par du contenu visible, `levels.min` d'une app active), plafonné à
   `topbar.levels.max`. Un contenu au niveau 5 crée 5 niveaux, intermédiaires vides compris.
2. Un niveau ≥ 2 peut être désactivé (`topbar.levels.disabled`, ou `levels.hide` d'une app active). Le niveau 1 jamais.
3. Le contenu d'un niveau non rendu (désactivé, ou au-dessus du max) s'affiche sur le niveau rendu **inférieur le plus
   proche**, dans la **même région**. Rien n'est perdu en silence.

**Configuration du projet** (`config.json`, module `@egen-civitas/esm-primary-navigation-app`) :

```json
{ "topbar": { "levels": { "min": 1, "max": 1, "disabled": [] } } }
```

`min`/`max` = 1 → TopBar « à l'ancienne » à une seule rangée (la navigation passe au centre du niveau 1). Défaut : `min 2`, `max 8`.

**Placer un élément global où l'on veut** — `topbar.placement` (identifiant de l'élément → région `l<N>-left|center|right`,
N ≥ 1). Le placement d'usine est dans `src/intranet-topbar/global/placement.ts`, seul endroit où il est écrit :

```json
{ "topbar": { "placement": { "clock": "l3-right", "nav": "l1-center" } } }
```

Entrée inconnue ou région invalide : ignorée avec un avertissement console. Si le niveau visé n'est pas rendu, la règle 3
ci-dessus s'applique (le contenu s'affiche sur le niveau rendu inférieur le plus proche).

**Habillage d'une rangée** — le squelette est identique partout ; seule la « peau » CSS (`LevelSkin`) peut varier. L'hôte
(`SupremeIntranetTopBar`) la choisit d'après la **position** de la rangée dans la pile (`skinFor` : première rangée /
autres), jamais d'après son numéro.

**Personnaliser depuis une app montée** — store global `egen-topbar-layout` (aucune dépendance de code), valable tant que
l'app propriétaire est active. Règles de région : `hidden`, `only`, `hide`, `hideGlobal` (`id` d'élément ou `name`
d'extension), visant la région où le contenu est *déclaré*. Règles de niveaux : `min`, `hide`.

```ts
import { getGlobalStore } from '@egen-civitas/esm-framework';

const store = getGlobalStore('egen-topbar-layout', { claims: {} });
// Page « détail d'un collaborateur » : niveau 1 réduit à ses propres boutons (retour) + recherche
store.setState((s) => ({
  claims: {
    ...s.claims,
    '@egen-civitas/esm-annuaire-app': {
      regions: { 'l1-left': { hideGlobal: true }, 'l1-right': { only: ['search'] } },
      levels: { min: 3, hide: [2] },
    },
  },
}));
// Au démontage de la page : retirer la clé de l'app dans `claims`.
```

Éléments globaux : `brand`, `search`, `language`, `divider`, `apps`, `quick-access`, `fullscreen`, `theme`, `user`, `clock`,
`menu-panel`, `nav` (placement d'usine : voir plus haut). « Implementer tools » n'est plus dans la TopBar : option du rail droit (bas).

### Hauteur de la TopBar et contenu des apps

Le shell mesure en direct le conteneur de la TopBar (`#egen-top-nav-app-container`, hauteur automatique) et publie
`--egen-navbar-height` (idem `--egen-footer-height` pour le footer). Le nombre de niveaux n'y change rien : la hauteur est
celle de ce qui est réellement rendu, quel que soit N. Le contenu des apps doit s'appuyer sur ces variables, jamais sur une
hauteur codée en dur :

```css
height: calc(100dvh - var(--egen-navbar-height, 0px) - var(--egen-footer-height, 0px));
```

`--egen-topbar-levels` indique en plus le nombre de rangées rendues.

### Fond des niveaux

Transparent par défaut. Deux façons de le surcharger, depuis n'importe quelle app :
- **valeur CSS** : `levels.background: { <niveau>: '<valeur de background>' }` dans le layout (store `egen-topbar-layout`) ;
- **composant** : extension dans le slot `topbar-l<N>-background-slot` (calque derrière le contenu du niveau N, sans capter la souris).

### Niveaux éphémères (bandeaux, défilants, notifications)

Une app ajoute un niveau **sans connaître le nombre de niveaux** : il se place après le dernier niveau numéroté (2 niveaux →
il devient le 3e) ; plusieurs s'empilent dans l'ordre d'ouverture. Entrée et sortie animées (hauteur + fondu, la hauteur du
contenu des apps suit car le shell mesure la TopBar en direct ; `prefers-reduced-motion` respecté). N'importe quelle app peut
en ouvrir un (annonces, notifications, alertes) : le contrat est le store global, sans dépendance de code.

```jsonc
// routes.json de l'app : le composant du bandeau (reçoit ses props + levelId + close())
{ "name": "flash-info", "slot": "topbar-transient-slot", "component": "flashInfo" }
```

```ts
import { getGlobalStore } from '@egen-civitas/esm-framework';

const store = getGlobalStore('egen-topbar-transient', { levels: [] });
store.setState((s) => ({
  levels: [
    ...s.levels,
    {
      id: 'flash-1', extension: 'flash-info', props: { text: '…' }, background: '#7f1d1d',
      openedAt: Date.now(),
      startsAt: '2026-11-06T09:00:00+01:00',  // début programmé (facultatif) : invisible jusque-là
      expiresAt: '2026-11-06T17:00:00+01:00', // fin (facultatif) ; `null`/absent = illimitée
      closing: false,
    },
  ],
}));
// Fermer : closing: true sur l'entrée (ou close() depuis le composant) ; la sortie animée suit puis le niveau est retiré.
// Annuler un niveau programmé avant son début : closing: true — il est retiré sans jamais s'afficher.
```

Dans cette app : `openTopBarLevel({ extension, props, startsAt, ttl, expiresAt, background })` / `closeTopBarLevel(id)`
(`kit/transient-store.ts`).

**Fenêtre d'affichage.**
- Sans `startsAt` : affichage immédiat. Avec un `startsAt` futur : le niveau n'est pas rendu (aucune hauteur) et apparaît à
  l'heure dite avec l'animation d'entrée (un seul minuteur, armé sur le prochain début, réévalué au retour d'onglet).
- Fin : `expiresAt` (date/heure précise) et/ou `ttl` (ms, **compté à partir du début d'affichage**, pas de l'ouverture) ;
  si les deux sont donnés, la plus proche gagne. Illimitée par défaut.
- Un niveau dont la fin est déjà passée avant son affichage est retiré sans animation. Une fin ≤ au début programmé, ou une
  date invalide, n'ouvre rien (`openTopBarLevel` retourne `null`) ; une entrée invalide écrite directement dans le store est
  retirée avec un avertissement console.
- Les niveaux ne sont pas persistés : ils vivent le temps de la session (une annonce programmée doit être rouverte à chaque
  chargement par l'app qui la diffuse).

**Dates : ISO 8601 avec heure ET décalage.** `startsAt` / `expiresAt` acceptent un nombre (epoch ms), une `Date`, ou une chaîne
`AAAA-MM-JJTHH:MM[:SS[.mmm]]` suivie de `Z` ou `±HH:MM` (ex. `2026-11-06T09:00:00+01:00` pour Libreville). Une chaîne sans
décalage est ambiguë (heure de quel fuseau ?) et est **refusée par défaut**. Une date seule (sans heure), un séparateur espace
ou une date impossible (30 février, 24:00) sont toujours refusés. Configuration (`topbar.announcements`) :

| Clé | Défaut | Rôle |
| --- | --- | --- |
| `requireOffset` | `true` | `false` : une chaîne sans décalage est acceptée et lue dans `defaultOffset` |
| `defaultOffset` | `+01:00` | décalage appliqué aux chaînes sans décalage (`Z` ou `±HH:MM`), seulement si `requireOffset` est `false` |
