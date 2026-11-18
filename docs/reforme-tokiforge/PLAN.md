# Réforme TokiForge — inventaire et plan par phases

Références : `refonte-systeme-design.md` (framework, 11-11) et `ajustement-reforme-configuration.md` (framework, 11-17, §3.4 et §12).

## 1. Ce qu'est TokiForge (vérifié)

- **Amont** : projet open source MIT `github.com/TokiForge/tokiforge` — **bibliothèque** : `@tokiforge/core` (`ThemeRuntime`, tokens → variables CSS,
  bascule de thème à l'exécution), adaptateurs React/Vue/Svelte/Angular, CLI `tokiforge`. Ce n'est **pas** un service déployable.
- **Ce que demande la réforme (§3.4)** : deux composantes distinctes.
  - le **runtime TokiForge**, intégré au framework ESM : applique les configurations dans les applications ;
  - le **service TokiForge**, indépendant, déployé par EGEN Kernel : gestion, validation, versionnement, distribution des configurations
    reçues de Penpot et de Tweakcn. **Il n'existe pas en amont : il est à construire.**
- Ni TokiForge, ni un fork, ni un dépôt portant ce nom n'existe aujourd'hui dans le core, le framework ou le compte GitHub.
  Il n'y a donc **rien à « nettoyer »** au sens de Tweakcn ; ce qui doit disparaître est l'ancien système de thèmes maison (§2).

## 2. L'ancien système à remplacer : `@egen-civitas/esm-theme` (framework, v1.1.0)

~1 700 lignes : `ThemeEngine`, aplatissement en variables CSS (`flatten`), injection (`inject`), chargement (`loader`), singleton, schéma zod, thème par défaut
`themes/theme.default.json`. API publique : `setupThemeEngine`, `getThemeEngine`, `getThemeState`, `reloadTheme`, `setThemeMode`, `toggleThemeMode`,
`applyAppThemeOverride`, `removeAppThemeOverride`, `applyGlobalThemeOverride`, `removeGlobalThemeOverride`, `flattenToCssVars`.

**Qui en dépend (mesuré)** :

| Dépôt | Où | Nature |
|---|---|---|
| framework | `esm-app-shell` (`run.ts`, `index.ejs`, `rspack.config.js`) | appelle `setupThemeEngine` (×2) et `applyAppThemeOverride` (×1) |
| framework | `esm-styleguide` (`_all/_carbon-bridge/_glass/_panel/_vars.scss`, `top-bar.component.tsx`) | variables CSS produites par le moteur |
| framework | `tooling/tailwind-preset` | variables CSS du moteur |
| core | 10 apps (`package.json`) | dépendance déclarée ; **aucune n'appelle l'API** (couplage faible) |
| core | `esm-appearance-app`, `esm-login-app`, `esm-settings-app` | composants liés à l'apparence |

Le couplage réel est donc concentré dans le **shell** et le **styleguide**, pas dans les apps du core.

## 3. Phases

Règle du document : **pas de cohabitation** de l'ancien système et de TokiForge, pas de synchronisation entre les deux. La bascule est donc une
seule opération : intégrer le runtime TokiForge puis supprimer `esm-theme` dans la même livraison.

| Phase | Contenu | Prérequis | Statut |
|-------|---------|-----------|--------|
| TF0 | Inventaire et plan (ce document) | — | fait |
| TF1 | Composants UI ESM en Tailwind/TSX avec variantes (suppression de Carbon, en cours dans le styleguide du framework) — ce sont eux qui consommeront les thèmes | — | en cours (framework) |
| TF2 | **Runtime** : intégrer `@tokiforge/core` dans le framework ; remplacer l'appel du shell (`setupThemeEngine`, surcharges d'app) ; migrer les variables CSS du styleguide et du preset Tailwind ; **supprimer `@egen-civitas/esm-theme`** et ses 10 déclarations dans le core | TF1 | à faire |
| TF3 | **Service** : projet autonome (gestion, validation, versionnement, distribution) ; récupère les thèmes de Tweakcn via `GET /api/v1/themes?updated_since` (`ETag`) ; image Docker et contrat de déploiement pour EGEN Kernel, comme Tweakcn | TF2 (format de configuration fixé) | à faire |
| TF4 | Penpot ↔ composants ESM (correspondance) | TF1, TF3 | hors périmètre actuel |

## 4. Décisions à prendre avant TF2/TF3
1. **Format de configuration** : le document veut qu'EGEN reste maître de son concept de thème (`refonte-systeme-design.md` §12). Le schéma EGEN (tokens
   structurés) sera-t-il le schéma d'entrée de TokiForge, ou adopte-t-on le format de tokens de `@tokiforge/core` ?
2. **Service TokiForge** : nouveau dépôt autonome qui dépend de `@tokiforge/core`, ou fork de `TokiForge/tokiforge` ? (le fork garderait runtime et CLI dans un même monorepo.)
3. **Moment de la bascule** : TF2 n'est lancée qu'une fois les composants TF1 suffisants, sinon le shell n'aurait plus de thème pendant la transition.
