# Theme Studio — intégration de TweakCN (révision)

> **Cette révision remplace la décision A1 du PLAN (réécriture façon TweakCN en Carbon).**
> Le Studio est désormais l'**éditeur TweakCN d'origine** (UI/UX identiques), seulement débarrassé de ce qui en faisait une application autonome.

## Architecture

| Élément | Rôle |
|---|---|
| `src/tweakcn/` | Code TweakCN (fork `amourgit/Frontend-esm-tweakcn-fork`, Apache-2.0, voir `NOTICE.md`) : éditeur, composants `ui/`, store Zustand, presets, aperçus (Cards, Dashboard, Application, Marketing, Custom). |
| `src/studio/tweakcn-studio.tsx` | Racine `.tweakcn-root` + providers (react-query, thème, tooltips, toasts) + pont hôte. |
| `src/studio/apply.ts` | **« Appliquer »** : `applyTweakcn()` construit le JSON de thème EGEN (superposé au thème actif), puis `ThemeRuntimePort.apply()`. |
| `src/core/` | Adaptateur TweakCN ⇄ EGEN, port runtime (`esm-theme` aujourd'hui, `tokiforge` via `registerThemeRuntime`). |

## Isolation (aucune fuite vers / depuis le shell)

- **Thème et mode sombre** : appliqués sur `.tweakcn-root` (`lib/theme-root.ts`), jamais sur `<html>`.
- **Portails Radix** (dialogues, menus, infobulles) : rendus dans la racine (`lib/portal-container.tsx`) pour hériter du thème édité.
- **CSS** : `tweakcn.source.css` est compilé par `tools/theme-studio-build-css.mjs` (Tailwind v4, preflight inclus) puis **scopé** sous `.tweakcn-root`
  → `tweakcn.generated.tw.css` (commité). Les feuilles Tailwind globales du core (TopBar, login) ignorent `src/tweakcn/` (`@source not`).
- Régénérer après toute modification de classes Tailwind dans `src/tweakcn/` : `yarn workspace @egen/esm-theme-studio-app build:css`.

## Ce qui a été retiré / remplacé

Retiré : authentification (better-auth), base de données (drizzle), paiement (Polar), analytics (PostHog), onglet « Generate » (IA), communauté, partage, publication, MCP, en-tête et pages marketing.
Remplacé : `next/link|navigation|image|dynamic`, `nuqs`, `next-themes`, `posthog-js` → `src/tweakcn/shims/` ; sauvegarde des thèmes → `localStorage` (`actions/themes.ts`).
Compat. React 18 : `use(promise)` et `<Context value>` adaptés ; `lib/with-ref.ts` fait accepter `ref` aux composants écrits pour React 19.
Build : `rspack.config.js` active le runtime JSX automatique pour cette app uniquement ; `tsconfig` en `strict` ; `.eslintignore` local pour `src/tweakcn/`.

## Resynchroniser avec TweakCN

Reprendre les fichiers du fork dans `src/tweakcn/` en conservant les adaptations ci-dessus (diff ciblé), puis `build:css`, build et tests.
