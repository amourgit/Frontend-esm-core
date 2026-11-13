# @egen/esm-primary-navigation-app

Rend la topbar principale de l'application EGEN : la barre de navigation
persistante affichée en haut de tous les espaces tenant authentifiés.

## Architecture — des niveaux déclarés par les apps, trois régions chacun

La TopBar est une **pile de niveaux** que les **apps déclarent**. La TopBar elle-même ne numérote ni ne nomme aucun
niveau : un niveau existe parce qu'une app y place un composant (avec le nom qu'elle choisit), et ses composants
s'assemblent avec ceux des autres apps qui déclarent le même nom. **Tous les niveaux ont le même squelette** — aucun
n'est un cas particulier :

```
┌ niveau (nom déclaré par les apps) ──────────────────────────────────────┐
│ [calque d'arrière-plan : background]                                     │
│  left               │  center                         │  right           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Un seul slot** : `topbar-slot`. Une app y attache son extension et DÉCLARE son placement dans `meta.topbar`
(`routes.json`), sans toucher à ce package :

```json
{
  "name": "ma-banniere",
  "slot": "topbar-slot",
  "component": "banner",
  "meta": {
    "global": true,
    "topbar": { "level": "promo", "rank": 40, "region": "center", "order": 10 }
  }
}
```

| Champ `meta.topbar` | Rôle |
|---------------------|------|
| `level`  | Nom du niveau (obligatoire ; minuscules, chiffres, tirets). Créé s'il n'existe pas ; s'il existe déjà (autre app), le composant s'y ajoute. |
| `rank`   | Position du niveau dans la pile (croissant). Facultatif : sans rang, le niveau se place sous les niveaux classés, par nom. Plusieurs rangs pour un même niveau : le plus petit gagne. |
| `region` | `left` · `center` · `right` · `background` (défaut `left`). |
| `order`  | Ordre dans la région (défaut : `order` de l'extension dans `routes.json`, sinon 0). |
| `before` / `after` | Position **par référence** : nom d'une autre extension du même niveau. Le composant se place juste avant / après elle, dans SA région (même si c'est une autre région que celle déclarée). Référence absente : `region` + `order` s'appliquent ; cycle : ignoré. |

Visible quand l'app est active, ou toujours avec `meta.global: true`. Une déclaration invalide (niveau absent ou mal
formé, région inconnue) n'affiche rien et avertit dans la console : jamais fatale. Un composant ainsi injecté peut
lui-même exposer ses propres slots d'extension. Rien dans le kit ne dépend d'un niveau précis (un test de
non-régression, `no-hardcoded-levels.test.ts`, le garantit).

Cette app déclare, pour ses éléments globaux, les niveaux `main` (rang 10) et `navigation` (rang 20) — voir
`src/intranet-topbar/global/placement.ts`. Placement d'usine (déplaçable par la config `topbar.placement`) :

| Niveau       | Gauche            | Centre                                | Droite                                                                 |
|--------------|-------------------|---------------------------------------|------------------------------------------------------------------------|
| `main`       | logo + Espace/Site (apps) | —                                     | recherche · langue · apps · raccourcis · plein écran · thème · utilisateur · horloge |
| `navigation` | identité de l'app active | navigation déroulante ou fil d'Ariane | contributions globales (ex. assistant IA)                         |

### Niveau éphémère (annonce, bandeau)

Une app qui veut une annonce limitée dans le temps ouvre un **niveau éphémère** (`openTopBarLevel`, voir
`kit/transient-store.ts`) : il se place sous la pile, avec début différé (`startsAt`), fin (`expiresAt` / `ttl`) et
animation. Il ne dépend d'aucun nom de niveau existant.

## Autres points d'extension (hors régions)

| Slot                     | Rendu par                          | Alimenté aujourd'hui par                          |
|--------------------------|-------------------------------------|----------------------------------------------------|
| `app-menu-slot`          | Grille du panneau "Applications"    | `esm-offline-tools-app`                            |
| `quick-access-slot`      | Liste du panneau "Raccourcis"       | — (ouvert, libre)                                  |
| `notifications-nav-menu-slot` | Zone droite « Notifications » (rail droit, rendu par `esm-notifications-app`) | — (ouvert, libre) |
| `user-panel-slot`        | Panneau utilisateur (haut)          | `esm-user-profile-app` (identité), cette app (langue), `esm-login-app`, `esm-offline-tools-app` |
| `user-panel-bottom-slot` | Panneau utilisateur (bas)           | `esm-login-app`                                    |
| `topbar-nav-start-slot`  | Juste avant la navigation           | — (ouvert, libre)                                  |
| `top-nav-breadcrumb-slot`| Fil d'Ariane par extensions (voir ci-dessous) | `breadcrumb-item`                        |

### Déclarer le contenu de barre d'outils d'une app

```json
{
  "extensions": [
    {
      "name": "mon-app-toolbar",
      "slot": "topbar-slot",
      "component": "appToolbar",
      "meta": { "topbar": { "level": "navigation", "rank": 20, "region": "left", "order": 0 } }
    }
  ]
}
```

L'extension reçoit l'état de slot (`isActivePanel`, `togglePanel`, `hidePanel`, `level`, `region`). Elle doit être un
widget compact (hauteur 32 px, `rounded-lg`, survol `hover:bg-white/10`) ; voir
`esm-home-app/src/topbar/home-app-toolbar.extension.tsx` comme référence.

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

## TopBar modulaire (niveaux déclarés par les apps)

La TopBar est une pile de **niveaux** que les apps déclarent (voir « Architecture »). Chaque niveau a la même structure :
trois **régions** neutres `left | center | right`. Elle ne connaît aucune app : tout ce qui s'y affiche vient d'**éléments
globaux** (`src/intranet-topbar/global/items.tsx`) ou d'**extensions** d'apps attachées au slot `topbar-slot`.

**Pile des niveaux** (règles uniques, `kit/levels.ts`) :
1. Ordre : d'abord les niveaux listés dans `topbar.levels.order` (dans cet ordre), puis les niveaux classés par `rank`
   croissant, puis ceux sans rang par nom.
2. Un niveau est masqué par `topbar.levels.hidden`, ou par `levels.hide` d'une app active. Le premier niveau de la pile
   n'est jamais masqué. `topbar.levels.keep` (ou `levels.keep` d'une app active) force le rendu d'un niveau même vide.
3. Au plus `topbar.levels.max` niveaux (défaut 8) sont rendus.
4. Le contenu d'un niveau non rendu (masqué, ou au-delà du max) s'affiche sur le niveau rendu **précédent** de la pile,
   dans la **même région**. Rien n'est perdu en silence.

**Placer un élément global où l'on veut** — `topbar.placement` (identifiant de l'élément → `"<niveau>:<région>"`). Le
placement d'usine est dans `src/intranet-topbar/global/placement.ts`, seul endroit où il est écrit. Un niveau inconnu est
créé :

```json
{ "topbar": { "placement": { "clock": "navigation:right", "nav": "main:center" } } }
```

Entrée inconnue ou valeur invalide : ignorée avec un avertissement console. Si le niveau visé n'est pas rendu, la règle 4
ci-dessus s'applique.

**Habillage d'une rangée** — le squelette est identique partout ; seule la « peau » CSS (`LevelSkin`) peut varier. L'hôte
(`SupremeIntranetTopBar`) la choisit d'après la **position** de la rangée dans la pile (`skinFor` : première rangée /
autres), jamais d'après son numéro.

**Personnaliser depuis une app montée** — store global `egen-topbar-layout` (aucune dépendance de code), valable tant que
l'app propriétaire est active. Règles de région : `hidden`, `only`, `hide`, `hideGlobal` (`id` d'élément ou `name`
d'extension), visant la région où le contenu est *déclaré*. Règles de niveaux : `keep`, `hide` (noms de niveaux), `background`.

```ts
import { getGlobalStore } from '@egen-civitas/esm-framework';

const store = getGlobalStore('egen-topbar-layout', { claims: {} });
// Page « détail d'un collaborateur » : le niveau `main` réduit à ses propres boutons (retour) + recherche
store.setState((s) => ({
  claims: {
    ...s.claims,
    '@egen-civitas/esm-annuaire-app': {
      regions: { 'main:left': { hideGlobal: true }, 'main:right': { only: ['search'] } },
      levels: { keep: ['promo'], hide: ['navigation'] },
    },
  },
}));
// Au démontage de la page : retirer la clé de l'app dans `claims`.
```

Éléments globaux : `search`, `divider`, `apps`, `quick-access`, `fullscreen`, `theme`, `clock`,
`menu-panel`, `nav` (placement d'usine : voir plus haut). « Implementer tools » n'est plus dans la TopBar : option du rail droit (bas).

**Espace et Site : jamais dans la TopBar.** Les sélecteurs, la liste des Espaces et l'arbre des sites viennent de
`@egen/esm-spaces-sites-app` (extension du slot `topbar-slot`). La TopBar ne fait que LIRE l'Espace actif et le registre des
sites dans le store global `egen-spaces-sites` (navigation filtrée par Espace, fil d'Ariane avec la chaîne de sites).

**Identité et session : jamais dans la TopBar.** Le menu utilisateur, le garde d'authentification et la redirection de la
racine viennent de `@egen/esm-user-profile-app`.

**Identité d'entreprise : jamais dans la TopBar.** Le logo (et le nom, le slogan) est injecté par l'app
`@egen/esm-branding-app` comme extension du slot neutre `topbar-slot` (`meta.topbar` : niveau `main`, région gauche). Une région rend ses éléments globaux et ses
extensions dans UN SEUL ordre, trié par `order` (celui de `meta.topbar`, de l'élément, ou à défaut celui du `routes.json` de
l'extension ; à `order` égal, l'extension passe avant), les références `before` / `after` s'appliquant ensuite. Les éléments globaux restants sont transitoires : ils migreront vers des apps dédiées.

### Hauteur de la TopBar et contenu des apps

Le shell mesure en direct le conteneur de la TopBar (`#egen-top-nav-app-container`, hauteur automatique) et publie
`--egen-navbar-height` (idem `--egen-footer-height` pour le footer). Le nombre de niveaux n'y change rien : la hauteur est
celle de ce qui est réellement rendu. Le contenu des apps doit s'appuyer sur ces variables, jamais sur une
hauteur codée en dur :

```css
height: calc(100dvh - var(--egen-navbar-height, 0px) - var(--egen-footer-height, 0px));
```

`--egen-topbar-levels` indique en plus le nombre de rangées rendues.

### Fond des niveaux

Transparent par défaut. Deux façons de le surcharger, depuis n'importe quelle app :
- **valeur CSS** : `levels.background: { <niveau>: '<valeur de background>' }` dans le layout (store `egen-topbar-layout`) ;
- **composant** : extension du slot `topbar-slot` avec `meta.topbar.region: "background"` (calque derrière le contenu du niveau, sans capter la souris).

### Niveaux éphémères (bandeaux, défilants, notifications)

Une app ajoute un niveau **sans connaître le nombre de niveaux** : il se place sous le dernier niveau de la pile ; plusieurs s'empilent dans l'ordre d'ouverture. Entrée et sortie animées (hauteur + fondu, la hauteur du
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
