# EGEN Theme Studio — Guide

## Utilisateurs
Ouvrir **Theme Studio** (navigation, ou Paramètres › Apparence › « Ouvrir le Theme Studio »).

| Niveau | Ce que vous voyez |
|--------|-------------------|
| **Simple** | Couleur principale/secondaire (l'échelle 50→950 est générée), fond/texte, rayon, polices |
| **Avancé** | + toutes les couleurs, surfaces, typographie, ombres, layout, effets, transitions, **composants** (état `default`) |
| **Expert** | + états (hover, focus, disabled…), panels, z-index, icônes… et l'éditeur **JSON** complet |

- **Clair/Sombre** : le sélecteur choisit le mode *édité* ; les deux sont éditables indépendamment.
- **Aperçu** : colonne de droite, variables CSS scopées (indépendantes du mode de l'application).
- **Appliquer** : applique le thème à tout l'environnement, à chaud (override global). **Aperçu sur toute l'application** le fait à chaque modification. **Rétablir l'environnement** retire l'override.
- **Import** : JSON EGEN (y compris généré par un service/IA), registry JSON TweakCN, ou CSS TweakCN/shadcn (`:root` + `.dark`). **Export** : JSON EGEN complet, ou CSS shadcn.
- **Bibliothèque** : enregistrer, ouvrir, dupliquer (stockage navigateur par défaut).

## Conventions de thème (source de vérité : JSON EGEN)
Tokens de composants : `components.<composant>.<variante>.<état>.<propriété>`.

```json
{ "components": { "button": {
    "base":    { "default": { "radius": "6px" } },
    "primary": { "default": { "background": { "light": "#4f46e5", "dark": "#818cf8" } },
                 "hover":   { "background": "#4338ca" } } } } }
```

Cascade (plus spécifique d'abord) : `variante/état` → `variante/default` → `base/état` → `base/default` → token global (repli du registre).
Le navigateur la résout seul grâce à `var(--components-button-primary-hover-radius, var(--…, repli))` : changer un thème ne demande **aucune modification des applications**.

## Développeurs
### Exposer un nouveau composant EGEN
1. Ajouter une entrée à `COMPONENTS` (`src/core/components.ts`) : id, variantes, états, propriétés (+ repli global).
2. L'éditeur le propose aussitôt (catalogue généré) ; la vitrine peut l'afficher via `componentStyle(id, variante, état)`.
3. Dans le composant EGEN, lire les tokens avec la même expression (`componentVar`) ou les variables `--components-*`.

### Architecture
```
src/core/   modèle pur, sans UI ni moteur : path, color, components, catalog, store, tweakcn-adapter,
            validation, import-export, library, runtime (port)
src/studio/ UI React (contrôles, navigation, barre d'actions, JSON, prévisualisation)
```
- **Un seul moteur** : le Studio passe par `ThemeRuntimePort`. Implémentation actuelle `esm-theme` ; `runtime: "tokiforge"` (config de l'app) sélectionne un adaptateur enregistré via `registerThemeRuntime()`. Tant que l'adaptateur TokiForge du framework n'est pas livré, repli automatique sur `esm-theme` (avertissement console).
- **TweakCN** n'existe qu'à la frontière (`tweakcn-adapter.ts`).
- **Sécurité** : toute valeur importée est validée (pas de `;`, `{}`, `/*`…) et nettoyée (`__proto__`) ; le moteur re-filtre à l'injection.

### Configuration (`@egen-civitas/esm-theme-studio-app`)
`runtime` (`esm-theme` | `tokiforge`), `applyPriority` (100), `requiredPrivilege` (vide = ouvert), `storageKey`.

### Tests
`yarn workspace @egen/esm-theme-studio-app test` — modèle, store, adaptateur, import/export, runtime, UI. Suivi : `node tools/theme-studio-tracking.mjs check`.

## Limites connues / suite
- Adaptateur **TokiForge** : à livrer côté framework (le contrat `ThemeRuntimePort` est prêt).
- Persistance serveur par tenant : implémenter `ThemeStorage` (interface prête).
- Les composants Carbon/EGEN existants doivent consommer `--components-*` pour refléter les personnalisations (lot « composants de base », avec TokiForge).
