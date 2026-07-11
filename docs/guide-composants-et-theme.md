# Guide — Composants & Système de thème EGEN

> Document de référence exhaustif : comment coder une interface (composant) dans ce
> monorepo, en respectant à la fois les règles de Carbon Design System et celles du
> système de thème dynamique EGEN (`@egen/esm-theme`).
>
> À lire avant d'écrire le moindre `.tsx`/`.scss` dans ce projet. Complète
> `docs/theme-system-status.md` (qui documente l'historique des bugs corrigés) — ce
> fichier-ci documente **comment bien faire**, dès le départ.

---

## Sommaire

1. [Vue d'ensemble — deux systèmes complémentaires](#1-vue-densemble--deux-systèmes-complémentaires)
2. [Le système de thème EGEN en détail](#2-le-système-de-thème-egen-en-détail)
3. [Référence complète des tokens disponibles](#3-référence-complète-des-tokens-disponibles)
4. [Carbon Design System — rôle exact et règles d'usage](#4-carbon-design-system--rôle-exact-et-règles-dusage)
5. [RÈGLE D'OR — zéro couleur codée en dur](#5-règle-dor--zéro-couleur-codée-en-dur)
6. [Utiliser un composant Carbon directement dans une app](#6-utiliser-un-composant-carbon-directement-dans-une-app)
7. [Le package `esm-styleguide` — composants réutilisables](#7-le-package-esm-styleguide--composants-réutilisables)
8. [Créer un composant 100% custom dans une app](#8-créer-un-composant-100-custom-dans-une-app)
9. [Icônes — quel système utiliser, et quand](#9-icônes--quel-système-utiliser-et-quand)
10. [Mode clair/sombre et surcharges par tenant](#10-mode-clairsombre-et-surcharges-par-tenant)
11. [Checklist avant de committer un composant](#11-checklist-avant-de-committer-un-composant)
12. [Pièges déjà rencontrés — ne pas reproduire](#12-pièges-déjà-rencontrés--ne-pas-reproduire)
13. [Références des fichiers clés](#13-références-des-fichiers-clés)

---

## 1. Vue d'ensemble — deux systèmes complémentaires

Ce projet combine **deux systèmes qui ne font pas le même métier** :

| Système | Rôle | Fournit-il des composants ? |
|---|---|---|
| **`@egen/esm-theme`** | Source unique de vérité pour les **couleurs, espacements, ombres, typographie** — lues depuis `theme.default.json` (+ surcharges tenant), injectées en variables CSS, réactives au clair/sombre. | ❌ Non. Zéro `<Button>`, zéro `<Modal>`. Uniquement des variables CSS. |
| **Carbon Design System** (`@carbon/react`) | Fournit les **vrais composants d'interface** : `Button`, `Modal`, `Dropdown`, `DataTable`, `Header`... avec tout leur comportement (clavier, focus, ARIA, responsive). | ✅ Oui, c'est tout son rôle. |

**Ils ne se parlent pas nativement.** Carbon a son propre système de variables
(`--cds-*`), complètement indépendant du nôtre. Le pont qui les connecte est
`packages/framework/esm-styleguide/src/_carbon-bridge.scss` — voir [section 4](#4-carbon-design-system--rôle-exact-et-règles-dusage).

**La règle qui découle de tout le reste de ce document** : quel que soit le système
utilisé pour construire un composant (Carbon brut, composition dans `esm-styleguide`,
ou SCSS 100% custom dans une app), **la seule source de couleur autorisée est le
JSON de thème**, jamais une valeur hexadécimale figée dans le code.

---

## 2. Le système de thème EGEN en détail

### 2.1 D'où viennent les variables CSS

Fichier source : `packages/framework/esm-theme/src/themes/theme.default.json`
Moteur : `packages/framework/esm-theme/src/engine.ts` (classe `ThemeEngine`)

Au démarrage du shell (`packages/shell/esm-app-shell/src/run.ts`), le moteur :

1. Charge `theme.default.json` (+ une éventuelle surcharge tenant, fusionnée par-dessus).
2. **Aplati** (`flatten.ts`) chaque branche `{ light: {...}, dark: {...} }` en variables
   CSS **sans jamais inclure "light"/"dark" dans le nom** — c'est le sélecteur
   `[data-theme="dark"]` qui choisit le bon groupe au runtime, pas le nom de variable.
3. **Injecte** (`inject.ts`) le résultat dans deux blocs `<style>` : un `:root { ... }`
   pour les valeurs communes, et des blocs `[data-theme="light"] { ... }` /
   `[data-theme="dark"] { ... }` pour les valeurs qui diffèrent selon le mode.
4. Pose `data-theme="dark"` (ou `"light"`) sur `<html>`.

**Conséquence pratique** : une variable comme `var(--colors-surface-background)`
change automatiquement de valeur quand `data-theme` change sur `<html>` — sans
aucun re-render React, sans aucune logique JS dans le composant qui la consomme.
C'est un mécanisme purement CSS, volontairement.

### 2.2 Convention de nommage — comment un chemin JSON devient une variable CSS

Règle (voir `flatten.ts`) : chaque niveau de clé JSON devient un segment séparé par
`-`, converti en kebab-case.

```
colors.primary.500              →  --colors-primary-500
colors.surface.light.background →  --colors-surface-background   (light/dark absorbés)
colors.border.dark.ring         →  --colors-border-ring           (light/dark absorbés)
colors.onPrimary                →  --colors-on-primary
panel.dark.header.background    →  --panel-header-background      (light/dark absorbés)
typography.fontSize.xs.size     →  --typography-font-size-xs-size
typography.fontWeight.semibold  →  --typography-font-weight-semibold
borderRadius.lg                 →  --border-radius-lg
shadows.glow                    →  --shadows-glow
transitions.default             →  --transitions-default
```

**Piège fréquent** : `typography.fontSize.xs` n'est PAS une valeur directe, c'est un
objet `{ size, lineHeight }`. La variable est donc `--typography-font-size-xs-size`
(et `--typography-font-size-xs-line-height`), pas `--typography-font-size-xs`.
Toujours vérifier la structure réelle dans `theme.default.json` avant de deviner un
nom de variable.

### 2.3 Comment modifier une couleur globalement

Éditer `theme.default.json`, rien d'autre. Le changement se propage automatiquement
à :
- Tous les composants qui utilisent `var(--colors-*)` directement.
- Tous les composants Carbon, via le pont (`_carbon-bridge.scss`).
- Toute surcharge tenant qui n'écrase pas explicitement cette clé.

Ne jamais dupliquer une couleur ailleurs (fichier `_vars.scss`, composant isolé,
etc.) — voir [section 5](#5-règle-dor--zéro-couleur-codée-en-dur).

---

## 3. Référence complète des tokens disponibles

### 3.1 Couleurs — `--colors-*`

**Échelles complètes (50 à 950, 11 paliers)** : `primary`, `secondary`, `neutral`,
`error`, `success`, `warning`, `info`.

```scss
var(--colors-primary-50)   // le plus clair
var(--colors-primary-500)  // couleur de référence
var(--colors-primary-950)  // le plus foncé
// idem pour secondary, neutral, error, success, warning, info
```

**Surfaces** (résolues automatiquement selon `data-theme`) :

```scss
var(--colors-surface-background)          // fond de page
var(--colors-surface-foreground)          // texte principal
var(--colors-surface-card)                // fond de carte/panneau
var(--colors-surface-card-foreground)     // texte sur carte
var(--colors-surface-popover)             // fond de popover/dropdown
var(--colors-surface-popover-foreground)
var(--colors-surface-muted)               // fond atténué (zones secondaires)
var(--colors-surface-muted-foreground)    // texte atténué/secondaire
var(--colors-surface-accent)              // fond d'accent (survol, sélection)
var(--colors-surface-accent-foreground)
var(--colors-surface-sidebar)
var(--colors-surface-sidebar-foreground)
var(--colors-surface-header)              // fond de la topbar
var(--colors-surface-header-foreground)
var(--colors-surface-overlay)             // voile derrière une modale
var(--colors-surface-skeleton)            // fond des skeletons de chargement
var(--colors-surface-destructive)         // fond d'action destructive
var(--colors-surface-destructive-foreground)
var(--colors-surface-translucent)         // verre translucide (glassmorphism)
var(--colors-surface-translucent-border)
var(--colors-surface-translucent-hover)
```

**Bordures** :

```scss
var(--colors-border-default)
var(--colors-border-input)
var(--colors-border-ring)       // anneau de focus
var(--colors-border-focus)
var(--colors-border-divider)
var(--colors-border-translucent)
```

**Texte sur fond coloré** :

```scss
var(--colors-on-primary)    // ex: texte blanc sur un bouton --colors-primary-600
var(--colors-on-secondary)
```

### 3.2 Panels (surfaces "glass" avec flou) — `--panel-*`

Utilisés pour tout ce qui flotte au-dessus du contenu (topbar, dropdowns, cartes,
champs de saisie). Chaque famille expose 4 propriétés :

```scss
var(--panel-header-background)          var(--panel-header-backdrop-filter)
var(--panel-header-border)              var(--panel-header-box-shadow)

var(--panel-dropdown-background)        var(--panel-dropdown-backdrop-filter)
var(--panel-dropdown-border)            var(--panel-dropdown-box-shadow)

var(--panel-card-background)            var(--panel-card-backdrop-filter)
var(--panel-card-border)                var(--panel-card-box-shadow)

var(--panel-input-background)           var(--panel-input-backdrop-filter)
var(--panel-input-border)               var(--panel-input-box-shadow)
```

**Toujours utiliser `--panel-*` (pas `--colors-surface-*`) pour un élément qui
flotte au-dessus du contenu avec un effet de flou** (dropdown, popover, topbar,
modale custom). Voir aussi `_panel.scss` (mixins `panel-surface()`, décrits en
[section 7.2](#72-les-mixins-panelscss--le-raccourci-recommandé)).

### 3.3 Typographie — `--typography-*`

```scss
var(--typography-font-family-sans)      // pile de police par défaut
var(--typography-font-family-heading)
var(--typography-font-family-body)
var(--typography-font-family-serif)
var(--typography-font-family-mono)

var(--typography-font-size-xs-size)     var(--typography-font-size-xs-line-height)
var(--typography-font-size-sm-size)     var(--typography-font-size-sm-line-height)
var(--typography-font-size-base-size)   var(--typography-font-size-base-line-height)
var(--typography-font-size-lg-size)     …
var(--typography-font-size-xl-size)     …
var(--typography-font-size-2xl-size)    …
var(--typography-font-size-3xl-size)    …
var(--typography-font-size-4xl-size)    …

var(--typography-font-weight-light)      // 300
var(--typography-font-weight-normal)     // 400
var(--typography-font-weight-medium)     // 500
var(--typography-font-weight-semibold)   // 600
var(--typography-font-weight-bold)       // 700
var(--typography-font-weight-extrabold)  // 800
```

### 3.4 Ombres — `--shadows-*`

```scss
var(--shadows-none) var(--shadows-xs) var(--shadows-sm) var(--shadows-default)
var(--shadows-md)   var(--shadows-lg) var(--shadows-xl)  var(--shadows-2xl)
var(--shadows-inner)
var(--shadows-glass)     // ombre + liseré clair, pensée pour le glassmorphism
var(--shadows-glass-lg)
var(--shadows-colored)   // teintée de la couleur primaire
var(--shadows-primary)
var(--shadows-glow)      // halo lumineux (états actifs/focus marquants)
```

### 3.5 Rayons de bordure — `--border-radius-*`

```scss
var(--border-radius-none)  var(--border-radius-xs)   var(--border-radius-sm)
var(--border-radius-md)    var(--border-radius-lg)   var(--border-radius-xl)
var(--border-radius-2xl)   var(--border-radius-3xl)  var(--border-radius-4xl)
var(--border-radius-full)  // pilule / cercle parfait
```

### 3.6 Transitions — `--transitions-*`

```scss
var(--transitions-default)  // all 200ms — cas général
var(--transitions-fast)     // 100ms — micro-interactions
var(--transitions-slow)     // 350ms — grands déplacements
var(--transitions-colors)   // color/background-color/border-color uniquement
var(--transitions-opacity)
var(--transitions-transform)
var(--transitions-shadow)
var(--transitions-glass)    // background+backdrop-filter+border+shadow (panels)
var(--transitions-sidebar)  // width+transform (menu latéral)
var(--transitions-overlay)  // opacity+visibility (voiles de modale)
```

### 3.7 Brand historique (compat) — `--brand-01/02/03`

Trois variables de compatibilité avec l'ancien système de marque OpenMRS, **déjà
branchées sur l'échelle `--colors-primary-*`** (voir `_vars.scss`). À utiliser
uniquement si un composant hérité y fait déjà référence — pour du code neuf,
préférer directement `var(--colors-primary-600)` etc.

---

## 4. Carbon Design System — rôle exact et règles d'usage

### 4.1 Ce que Carbon fournit

Composants React (`@carbon/react`) : `Button`, `Modal`/`ComposedModal`, `Dropdown`,
`DataTable`, `Header` et tout l'UI Shell (`HeaderGlobalAction`, `Switcher`,
`SideNav`...), `Tile`, `ContentSwitcher`, `Tag`, `Notification`, `Accordion`,
formulaires (`TextInput`, `NumberInput`, `Checkbox`...), `Pagination`, etc.

Ce que ça apporte gratuitement : navigation clavier, piège de focus dans les
modales, rôles ARIA, gestion du responsive, animations d'ouverture/fermeture.
**Ne jamais réimplémenter ce comportement à la main** — utiliser le composant
Carbon correspondant.

### 4.2 Le pont Carbon ↔ EGEN

Fichier : `packages/framework/esm-styleguide/src/_carbon-bridge.scss`
(intégré dans `_all.scss`, juste après `@forward '@carbon/styles'`)

**Pourquoi il existe** : les composants Carbon consomment leurs couleurs via des
variables `var(--cds-xxx)` **sans aucun fallback**. Sans ce pont, `--cds-layer`
(et ~130 autres) ne sont définies nulle part → un `Modal` Carbon natif s'affiche
**strictement transparent** (`background-color` retombe sur sa valeur initiale CSS).

Le pont définit ces ~130 `--cds-*` en les redirigeant vers nos propres tokens :

```scss
:root {
  --cds-layer: var(--panel-card-background, #f4f4f4);
  --cds-background: var(--colors-surface-background, #ffffff);
  --cds-text-primary: var(--colors-surface-foreground, #161616);
  --cds-interactive: var(--colors-primary-500, #0f62fe);
  --cds-support-error: var(--colors-error-500, #da1e28);
  // … (voir le fichier complet pour la liste exhaustive)
}
```

**Conséquence pratique** : un composant Carbon utilisé "brut", sans aucune
personnalisation, **suit déjà automatiquement le thème EGEN**. C'est le
comportement par défaut, pas une exception à gérer.

### 4.3 Interdictions strictes liées à Carbon

**Ne JAMAIS utiliser le composant React `<Theme>` / `<GlobalTheme>` de Carbon**,
ni les classes `.cds--white` / `.cds--g10` / `.cds--g90` / `.cds--g100`, ni
`@include theme.theme(themes.$xxx)` dans du SCSS.

Pourquoi : ces mécanismes réinjectent un thème Carbon **statique**, localement,
qui écrase le pont dynamique pour tout le sous-arbre concerné — même bug que
celui corrigé dans `esm-implementer-tools-app` (un `<Theme theme="g90">` rendait
tout le panneau de gestion de modules indépendant du thème réel). Si un
composant Carbon a besoin d'un fond "plus sombre"/"plus clair" que son
environnement, utiliser `<Layer>` (le système d'imbrication de Carbon, lui
**correctement** branché au pont) plutôt que de forcer un thème.

```tsx
// INTERDIT
import { Theme } from '@carbon/react';
<Theme theme="g90"><MonContenu /></Theme>

// Si besoin d'un fond visuellement distinct dans une zone imbriquée :
import { Layer } from '@carbon/react';
<Layer><MonContenu /></Layer>
```

### 4.4 Étendre le pont si un token manque

Si un nouveau composant Carbon (ou une nouvelle variante) utilise un token
`--cds-*` non encore défini, deux façons de le détecter :

1. **Visuellement** : le composant affiche du transparent/du blanc figé au lieu
   de suivre le thème actif.
2. **En audit** : installer `@carbon/styles`/`@carbon/themes` dans un dossier
   temporaire, grep les fichiers `.scss` du composant concerné pour les `$xxx`
   correspondant à des tokens Carbon, comparer à la liste dans
   `_carbon-bridge.scss`.

Ajouter le token manquant en suivant exactement le même pattern que les autres :

```scss
--cds-nouveau-token: var(--colors-x-approprié, #valeur-de-repli-carbon);
```

Le fallback hexadécimal (valeur d'origine Carbon) sert uniquement de filet de
sécurité le temps que le moteur de thème hydrate — jamais la valeur réellement
utilisée en pratique.

---

## 5. RÈGLE D'OR — zéro couleur codée en dur

**Aucune couleur, dans aucun fichier `.scss`/`.tsx`/`.ts` de ce monorepo, ne doit
être une valeur hexadécimale/rgb/nommée utilisée directement comme valeur
finale.** Une seule exception structurelle : le **fallback** d'un `var(x, fallback)`.

### 5.1 Le pattern à utiliser systématiquement

```scss
/* CORRECT — la vraie valeur vient du thème, le hex n'est qu'un filet de sécurité */
.maCarte {
  background: var(--colors-surface-card, #ffffff);
  color: var(--colors-surface-foreground, #161616);
  border: 1px solid var(--colors-border-default, #e0e0e0);
}
```

```scss
/* INTERDIT — valeur figée, ne réagira jamais à un changement de thème */
.maCarte {
  background: #ffffff;
  color: #161616;
  border: 1px solid #e0e0e0;
}
```

### 5.2 États de survol / opacité — `color-mix()`

Pour un effet "ghost button" (fond semi-transparent au survol) ou toute
variation d'opacité d'une couleur du thème, utiliser `color-mix()` — jamais une
valeur `rgba()` figée :

```scss
/* CORRECT */
.bouton:hover {
  background: color-mix(in srgb, var(--colors-surface-foreground) 8%, transparent);
}

/* INTERDIT */
.bouton:hover {
  background: rgba(0, 0, 0, 0.08);
}
```

### 5.3 Sass `@use '@carbon/colors'` — interdit

Ne jamais importer et utiliser directement la palette statique de
`@carbon/colors` (`colors.$blue-70`, `colors.$gray-30`...) — ce sont des valeurs
Sass résolues à la compilation, totalement indépendantes du thème. Si un
équivalent visuel est nécessaire, utiliser le token EGEN le plus proche
(`var(--colors-primary-600)`, `var(--colors-error-500)`...) avec `color-mix()`
si une opacité est nécessaire.

### 5.4 Couleurs de marque figée — l'exception légitime

Certains éléments ont une couleur d'**identité de marque fixe**, indépendante
du thème par nature (ex. le sprite du logo dans
`esm-styleguide/src/logo/_logo.scss` : `--logo-red`, `--logo-purple`...). Un
logo ne doit pas changer de couleur parce qu'un tenant personnalise sa palette
primaire. Cette exception est **documentée explicitement** dans le fichier
concerné — si un doute existe sur si une couleur relève de la marque ou du
thème, elle relève du thème par défaut (c'est le cas par défaut, l'exception
doit être justifiée).

---

## 6. Utiliser un composant Carbon directement dans une app

Le cas le plus simple : besoin d'un bouton, d'un champ de saisie, d'une modale
standard, sans design spécifique. Import direct, aucune configuration
supplémentaire nécessaire — le pont s'occupe du thème.

```tsx
import React from 'react';
import { Button, TextInput, InlineNotification } from '@carbon/react';

const MonFormulaire: React.FC = () => (
  <div>
    <TextInput id="nom" labelText="Nom" placeholder="Votre nom" />
    <Button kind="primary">Valider</Button>
    <InlineNotification kind="success" title="Succès" subtitle="Enregistré." />
  </div>
);
```

**Règles** :
- Ne jamais passer de `style={{ backgroundColor: '#...' }}` inline sur un
  composant Carbon pour "corriger" sa couleur — si la couleur ne convient pas,
  c'est un token du thème (`theme.default.json`) ou du pont
  (`_carbon-bridge.scss`) qu'il faut ajuster, jamais le composant appelant.
- Si un espacement/rayon est nécessaire en plus des props Carbon, utiliser les
  tokens EGEN (`var(--border-radius-md)`) dans une classe SCSS Module dédiée,
  pas des valeurs magiques.
- Les icônes d'accompagnement viennent soit de `@carbon/react/icons`, soit du
  set EGEN — voir [section 9](#9-icônes--quel-système-utiliser-et-quand).

---

## 7. Le package `esm-styleguide` — composants réutilisables

### 7.1 Rôle exact

`packages/framework/esm-styleguide` est une **couche de style et de composition
au-dessus de Carbon**, pas un système de composants indépendant. Vérifiable
directement dans son `package.json` : il déclare `@carbon/react` comme
dépendance, et tous ses composants "de haut niveau" (`action-menu-button`,
`workspace2-close-prompt.modal.tsx`...) importent et composent des primitives
Carbon (`Button`, `ModalHeader`...).

**Quand ajouter un composant ici plutôt que dans une app** :
- Le composant est un assemblage réutilisable par **plusieurs apps**
  (ex. `EntityPhoto`, `Breadcrumbs`, le système de `workspaces`).
- Le composant fait partie du "vocabulaire visuel" partagé (spinners, toasts,
  snackbars, panels...).

**Quand NE PAS l'ajouter ici** : logique ou design spécifique à une seule app —
il reste dans `packages/apps/<app>/src/components/`.

### 7.2 Les mixins `_panel.scss` — le raccourci recommandé

Pour toute surface "flottante" (carte, dropdown, popover), `_panel.scss` fournit
des mixins qui appliquent directement les bons tokens `--panel-*` :

```scss
@use '@egen/esm-styleguide/src/panel' as panel;

.maCarteFlottante {
  @include panel.panel-surface('card');   // background + backdrop-filter + border + box-shadow
  @include panel.panel-size('md');        // padding + border-radius cohérents
}
```

Consulter `packages/framework/esm-styleguide/src/_panel.scss` pour la liste
complète des variantes (`'header'`, `'dropdown'`, `'card'`, `'input'`) et des
tailles disponibles.

### 7.3 Exemple concret — créer un nouveau composant styleguide

```tsx
// packages/framework/esm-styleguide/src/mon-composant/mon-badge.component.tsx
import React from 'react';
import { Tag } from '@carbon/react';
import styles from './mon-badge.module.scss';

interface MonBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error';
}

const MonBadge: React.FC<MonBadgeProps> = ({ label, variant = 'success' }) => (
  <Tag className={styles[variant]} type="high-contrast">
    {label}
  </Tag>
);

export default MonBadge;
```

```scss
/* mon-badge.module.scss — surcharge légère d'un composant Carbon, tokens EGEN uniquement */
.success {
  background: color-mix(in srgb, var(--colors-success-500) 15%, transparent) !important;
  color: var(--colors-success-700) !important;
}
.warning {
  background: color-mix(in srgb, var(--colors-warning-500) 15%, transparent) !important;
  color: var(--colors-warning-700) !important;
}
.error {
  background: color-mix(in srgb, var(--colors-error-500) 15%, transparent) !important;
  color: var(--colors-error-700) !important;
}
```

(Le `!important` est nécessaire ici car on surcharge une classe Carbon déjà
présente dans le DOM avec sa propre spécificité — pattern déjà utilisé dans tout
le styleguide, voir `_overrides.scss`.)

---

## 8. Créer un composant 100% custom dans une app

Cas d'un élément entièrement sur-mesure, sans équivalent Carbon direct (ex. les
boutons de la topbar de `esm-primary-navigation-app` : sélecteur d'espace,
bascule de thème...).

### 8.1 Structure de fichiers (convention du projet)

```
mon-composant/
  mon-composant.component.tsx
  mon-composant.scss
```

### 8.2 CSS Modules — import et usage

```tsx
import styles from './mon-composant.scss';
// ...
<div className={styles.wrapper}>
```

### 8.3 Exemple complet — un bouton d'action de topbar (patron réel du projet)

```tsx
// mon-bouton.component.tsx
import React from 'react';
import { HeaderGlobalAction } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import styles from './mon-bouton.scss';

const MonIcone: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MonBouton: React.FC = () => {
  const { t } = useTranslation();
  return (
    <HeaderGlobalAction aria-label={t('monAction', 'Mon action')} className={styles.actionButton}>
      <MonIcone />
    </HeaderGlobalAction>
  );
};

export default MonBouton;
```

```scss
/* mon-bouton.scss — 100% tokens EGEN, aucune valeur figée */
.actionButton {
  width: 36px !important;
  height: 36px !important;
  color: color-mix(in srgb, var(--colors-surface-foreground) 70%, transparent) !important;
  background: transparent !important;
  border-radius: var(--border-radius-md, 0.75rem) !important;
  transition: var(--transitions-default) !important;

  &:hover {
    background: color-mix(in srgb, var(--colors-surface-foreground) 8%, transparent) !important;
    color: var(--colors-surface-foreground) !important;
  }
}
```

**Pourquoi une icône SVG inline plutôt que Carbon ici** : `HeaderGlobalAction`
est un composant Carbon (comportement clavier/ARIA géré), mais son icône
interne est libre — soit une icône du set EGEN (`@egen/esm-framework`, voir
section suivante), soit un SVG inline simple quand aucune icône adaptée
n'existe. Le SVG inline utilise `currentColor` pour hériter automatiquement de
la couleur définie via `var(--colors-*)` sur l'élément parent — aucune couleur
n'est donc codée dans le SVG lui-même.

### 8.4 Dropdowns / popovers custom — toujours `--panel-*`

```scss
.dropdown {
  position: absolute;
  background: var(--panel-dropdown-background);
  backdrop-filter: var(--panel-dropdown-backdrop-filter);
  -webkit-backdrop-filter: var(--panel-dropdown-backdrop-filter);
  border: var(--panel-dropdown-border);
  box-shadow: var(--panel-dropdown-box-shadow);
  border-radius: var(--border-radius-lg, 1rem);
  z-index: var(--z-index-dropdown, 300);
}
```

Ne jamais utiliser `var(--colors-surface-card)` seul pour un dropdown — le
`backdrop-filter` et le `box-shadow` du panel font partie intégrante de
l'identité visuelle "glass" du projet.

---

## 9. Icônes — quel système utiliser, et quand

Trois sources coexistent, chacune avec un usage précis :

1. **`@carbon/react/icons`** — pour accompagner un composant Carbon standard
   (ex. `Launch`, `Add`, `TrashCan`), quand aucune icône EGEN équivalente
   n'existe. Ces icônes héritent de `currentColor`, donc du thème,
   automatiquement.
2. **Set EGEN** (`packages/framework/esm-styleguide/src/icons/icons.tsx`, réexporté
   via `@egen/esm-framework`) — icônes nommées maison (`SearchIcon`,
   `CloseIcon`, `UserAvatarIcon`, `SwitcherIcon`, `SettingsIcon`,
   `ChevronDownIcon`...). À privilégier dès qu'une icône EGEN correspond au
   besoin, pour la cohérence visuelle du projet.
3. **SVG inline** — uniquement quand ni Carbon ni le set EGEN ne couvrent le
   besoin. Toujours utiliser `stroke="currentColor"` / `fill="currentColor"`,
   jamais une couleur codée dans le `<path>`.

**Interdit** : importer une bibliothèque d'icônes tierce (`lucide-react`,
`react-icons`...) — non présente dans les dépendances du monorepo, casserait la
cohérence visuelle et le partage Module Federation.

---

## 10. Mode clair/sombre et surcharges par tenant

- Le mode actif est piloté par `data-theme` sur `<html>`, géré exclusivement par
  `@egen/esm-theme` (`toggleThemeMode()`, `setThemeMode()`, `getThemeState()`).
- **Ne jamais** manipuler `data-theme` à la main dans un composant, sauf le
  pattern documenté dans `docs/theme-system-status.md` §10 (routes publiques
  forçant un mode pour leur propre branding) — et dans ce cas, **toujours**
  restaurer via `getThemeState()?.mode ?? 'dark'` au démontage, jamais
  `removeAttribute()` ni un snapshot pris au montage (voir
  [section 12](#12-pièges-déjà-rencontrés--ne-pas-reproduire)).
- Une surcharge de thème par tenant fusionne par-dessus `theme.default.json` —
  aucune action nécessaire côté composant, le mécanisme est générique (n'importe
  quelle clé du JSON peut être surchargée, y compris de nouvelles clés).

---

## 11. Checklist avant de committer un composant

- [ ] Aucune couleur hex/rgb/nommée utilisée comme valeur finale (uniquement en
      fallback `var(x, fallback)`).
- [ ] Les surfaces flottantes utilisent `--panel-*` (ou les mixins
      `panel.scss`), pas `--colors-surface-*` seul.
- [ ] Les états de survol/opacité utilisent `color-mix()`, pas `rgba()` figé.
- [ ] Aucun `<Theme>`/`<GlobalTheme>` Carbon, aucune classe
      `.cds--white/g10/g90/g100`, aucun `@include theme.theme(...)` local.
- [ ] Aucun import direct de `@carbon/colors` (`colors.$xxx`).
- [ ] Les icônes utilisent `currentColor`/héritent du thème.
- [ ] Si un nouveau token Carbon (`--cds-xxx`) est nécessaire et absent du
      pont, il a été ajouté à `_carbon-bridge.scss` (pas défini localement).
- [ ] Le composant fonctionne visuellement identique en mode clair et sombre
      (bascule via le bouton thème de la topbar pour vérifier).

---

## 12. Pièges déjà rencontrés — ne pas reproduire

Historique complet dans `docs/theme-system-status.md`. Résumé des deux bugs
racine, pour mémoire :

1. **`data-theme` perdu après navigation** — une route "publique" (login, home
   marketing) force `data-theme="dark"` au montage, puis le retirait
   (`removeAttribute`) ou restaurait un **snapshot obsolète** au démontage. Le
   thème redevenait visuellement clair/transparent jusqu'à un refresh manuel.
   → Toujours restaurer via `getThemeState()?.mode ?? 'dark'`, jamais un
   snapshot ni un retrait pur.

2. **`--cds-*` jamais définis** — les composants Carbon natifs résolvent leurs
   couleurs via `var(--cds-xxx)` sans fallback. Sans le pont
   (`_carbon-bridge.scss`), ces variables sont strictement indéfinies →
   `background-color` retombe sur `transparent`. Un appel isolé à
   `<Theme theme="g90">` (React) ou `@include theme.theme($g90)` (SCSS) crée
   le même bug **localement**, en écrasant le pont pour son sous-arbre.
   → Ne jamais forcer un thème Carbon local ; toujours passer par le pont
   global.

---

## 13. Références des fichiers clés

| Fichier | Rôle |
|---|---|
| `packages/framework/esm-theme/src/themes/theme.default.json` | Source unique de vérité des tokens (à éditer pour changer une couleur globalement) |
| `packages/framework/esm-theme/src/engine.ts` | Moteur de thème (résolution du mode, application, souscription) |
| `packages/framework/esm-theme/src/flatten.ts` | Logique JSON → variables CSS (convention de nommage) |
| `packages/framework/esm-theme/src/inject.ts` | Injection des `<style>` dans le document |
| `packages/framework/esm-styleguide/src/_carbon-bridge.scss` | Pont dynamique Carbon ↔ EGEN (`--cds-*` → `--colors-*`/`--panel-*`) |
| `packages/framework/esm-styleguide/src/_panel.scss` | Mixins pour les surfaces "glass" (`panel-surface`, `panel-size`) |
| `packages/framework/esm-styleguide/src/_vars.scss` | Variables Sass historiques, toutes branchées dynamiquement |
| `packages/framework/esm-styleguide/src/icons/icons.tsx` | Set d'icônes nommées EGEN |
| `docs/theme-system-status.md` | Historique détaillé des bugs de thème corrigés |
| `docs/guide-composants-et-theme.md` | Ce document |
