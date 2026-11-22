# 14 — Migration Carbon / SCSS du Core (écart E1) : réalisée

**Statut : ✅ réalisée sur `main`** (constaté le 2026-11-21, après la fusion de `feature/ajustement-reforme`). Ce document garde les mesures faites **avant** migration (qui ont servi à la cadrer) et le résultat constaté **après**.

## 1. Avant / après (✅ mesuré par script sur `main`)

| Mesure | Avant (28 apps) | Après |
| --- | --- | --- |
| Fichiers important `@carbon/react` | 44, dans 7 apps (`implementer-tools` 18, `offline-tools` 12, `login` 5, `help-menu` 3, `language` 2, `devtools` 2, `user-profile` 2) | **0** |
| Apps déclarant `@carbon/react` | 27 (dont 20 sans aucun import : dépendance obsolète) | **0** |
| Fichiers SCSS | 74 (42 référençant Carbon) | **0** |
| Fichiers CSS Modules | — | **74** (conversion un pour un) |
| Dépendance `sass` | 28 apps | **0** |
| Framework consommé | `esm-framework 4.1.0`, Shell 2.11.1, `egen` 2.3.0, `rspack-config` 1.2.0 | **`esm-framework 5.0.1`, Shell 3.0.6 (3.0.8 depuis le 2026-11-22), `egen` 3.0.0, `rspack-config` 2.0.0, `esm-styleguide` 5.2.4** |
| `node tools/sync-egen-deps.mjs --check` | 72 plages en retard (majeures) | **« Toutes les plages @egen-civitas/* sont à jour »** |

## 2. Garde-fou

`tools/check-no-carbon.mjs` (lancé par `yarn verify`, ou seul : `yarn verify:no-carbon`) parcourt `packages/` et **échoue** si réapparaît un fichier `.scss`/`.sass`, une mention de `@carbon/`, `carbon-components`, des classes `cds--`, un import `.scss`, ou une dépendance `sass`, `sass-loader`, `sass-embedded`, `@rsbuild/plugin-sass`. Il remplace le contrôle manuel que prévoyait le plan par lots rédigé avant la migration.

## 3. Conséquences pour les apps (internes et externes)

- Styles : `*.module.css` (CSS Modules, noms de classes préfixés par l'app par la config EGEN) ou Tailwind (`*.tw.css`) ; plus de règle SCSS dans `rspack-config` 2.x.
- Le Shell 3.x **ne partage plus** `@carbon/react` : une app externe qui l'embarquerait crée sa propre copie (poids, styles) ; à éviter.
- Composants d'interface : ceux de `@egen-civitas/esm-styleguide` 5.x (table de correspondance : `fw/docs/MIGRATION-CARBON.md`). Noms à connaître depuis la mesure : `Link` → `TextLink` (renommé dans le styleguide pour éviter un conflit avec le type `Link` d'`esm-api`).

## 4. Reste à faire lié à cette migration

- ✅ Le peer `@egen-civitas/esm-framework` a été resserré à `^5.0.1` dans les 28 apps (08, **E4** traité).
- Les exemples de ce dossier (10) utilisent `esm-framework ^5.0.1`.
