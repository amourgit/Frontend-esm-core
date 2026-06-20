# `@eigen/esm-theme` — Moteur de Thème Dynamique

Système de chargement de thèmes JSON par **priorité**, avec génération dynamique de variables CSS et **hot-reload** intégré. Conçu pour le framework EIGEN (Single-SPA, micro-frontends).

---

## Architecture

```
esm-theme/
├── src/
│   ├── types.ts        — Interfaces TypeScript (ThemeSchema, LoadedTheme, …)
│   ├── loader.ts       — Fetch parallèle + sélection par priorité
│   ├── flatten.ts      — JSON imbriqué → variables CSS à plat
│   ├── inject.ts       — Injection DOM via balise <style id="eigen-theme-vars">
│   ├── engine.ts       — Orchestrateur (ThemeEngine class)
│   ├── singleton.ts    — Instance globale + API fonctionnelle
│   ├── index.ts        — Exports publics
│   └── themes/
│       └── glass-morphism.default.json   — Thème glass par défaut (priority=1)
```

---

## Principe de fonctionnement

1. **Plusieurs fichiers JSON** de thème peuvent coexister (noms libres).
2. Chaque fichier déclare une clé `"priority": <nombre>`.
3. Le moteur charge **tous les fichiers en parallèle**, compare les priorités, et **applique uniquement le gagnant** (priorité la plus haute).
4. Le JSON gagnant est aplati récursivement :
   ```json
   { "glass": { "dark": { "card": { "background": "rgba(15,23,42,0.65)" } } } }
   ```
   devient :
   ```css
   --glass-dark-card-background: rgba(15,23,42,0.65);
   ```
5. Toutes les variables sont injectées dans une balise `<style id="eigen-theme-vars">` au début de `<head>`.

---

## Structure d'un fichier thème JSON

```json
{
  "priority": 10,
  "meta": {
    "name": "Mon thème personnalisé",
    "updatedAt": "2026-06-01T00:00:00Z"
  },
  "colors": {
    "primary": { "500": "#6366f1" }
  },
  "glass": {
    "dark": {
      "card": {
        "background": "rgba(15, 23, 42, 0.65)",
        "backdropFilter": "blur(20px) saturate(180%)",
        "border": "1px solid rgba(255, 255, 255, 0.08)",
        "boxShadow": "0 4px 20px rgba(0,0,0,0.40)"
      }
    }
  }
}
```

> **Règle** : le fichier avec `priority` le plus élevé prend la main. Le thème par défaut EIGEN a `priority: 1` — il suffit de mettre `priority: 10` dans un fichier custom pour le surcharger.

---

## Usage dans le shell (`esm-app-shell`)

Le moteur est initialisé automatiquement dans `run.ts`. Pour ajouter des thèmes custom :

```html
<!-- index.ejs — avant initializeSpa() -->
<script>
  window.eigenThemeUrls = [
    '/api/tenant/mon-tenant/theme.json',
    '/themes/override.json'
  ];
</script>
```

---

## API TypeScript

```ts
import { setupThemeEngine, getThemeEngine, reloadTheme } from '@eigen/esm-theme';

// Initialisation (shell uniquement)
await setupThemeEngine({
  themeUrls: ['/themes/custom.json'],
  pollIntervalMs: 5000,  // hot-reload toutes les 5s
  onApplied: (theme, cssVars) => console.log('Appliqué :', theme.schema.meta?.name),
});

// Depuis n'importe quelle app
const engine = getThemeEngine();
const state = engine.getState(); // { status, activeTheme, cssVarsCount, … }

// Abonnement réactif
const unsubscribe = engine.subscribe((state) => {
  console.log('Thème actif :', state.activeTheme?.schema.meta?.name);
});

// Rechargement manuel (après upload d'un fichier custom par exemple)
await reloadTheme();
```

---

## Usage SCSS dans les composants

```scss
@use '@eigen/esm-styleguide/src/glass' as glass;

.ma-card {
  @include glass.glass-card('dark');
  padding: 1.5rem;
}

.mon-modal {
  @include glass.glass-modal('dark');
}

.ma-sidebar {
  @include glass.glass-sidebar('dark');
}
```

Ou directement avec les variables CSS (fonctionne partout, même en CSS pur) :

```css
.mon-composant {
  background:      var(--glass-dark-card-background);
  backdrop-filter: var(--glass-dark-card-backdrop-filter);
  border:          var(--glass-dark-card-border);
  box-shadow:      var(--glass-dark-card-box-shadow);
  border-radius:   var(--border-radius-xl);
  transition:      var(--transition-glass);
}
```

---

## Variables CSS générées (exemples)

| Variable CSS | Valeur par défaut |
|---|---|
| `--glass-dark-card-background` | `rgba(15, 23, 42, 0.65)` |
| `--glass-dark-modal-backdrop-filter` | `blur(48px) saturate(220%)` |
| `--glass-dark-sidebar-box-shadow` | `2px 0 24px rgba(0,0,0,0.50)…` |
| `--glass-light-header-background` | `rgba(255, 255, 255, 0.78)` |
| `--colors-primary-500` | `#6366f1` |
| `--colors-primary-600` | `#4f46e5` |
| `--border-radius-xl` | `1.25rem` |
| `--transition-glass` | `background 200ms ease, backdrop-filter 200ms…` |
| `--shadow-glow` | `0 0 24px rgba(99,102,241,0.40)…` |
| `--layout-sidebar-width` | `260px` |
| `--z-modal` | `400` |

---

## Hot-reload en développement

En mode `development`, le moteur poll automatiquement les URLs de thème toutes les 4 secondes.
Si un fichier JSON change (ou si un fichier avec une priorité plus haute est ajouté), les variables CSS sont mises à jour **immédiatement** sans rechargement de page.

```
[eigen/esm-theme] 🔥 Changement de thème détecté — rechargement à chaud
[eigen/esm-theme] ✅ Thème appliqué : "Mon thème custom" (247 vars CSS)
```
