# Montage d'une app : zones et rails

Une app ne monte du contenu que dans les emplacements du shell. Elle ne crée ni sidebar ni navbar propre, ne réserve pas de marge (`--egen-sidenav-width`) et n'attache rien à un slot de navigation d'une autre app.

| Emplacement | Comment l'app y monte du contenu |
| --- | --- |
| Zone principale | `pages[]` de `routes.json` (composant `root`, route `mon-app`) |
| Rail gauche → zone gauche | extension sur `shell-rail-left-slot` (`meta` = `ToolWindowMeta`) ; `meta.global: true` = visible quelle que soit l'app active |
| Rail gauche (groupe bas) → zone basse | extension sur `shell-rail-bottom-slot` |
| Rail droit → zone droite | extension sur `shell-rail-right-slot` |
| Rail droit (groupe bas) → zone basse | `shell-rail-bottom-slot` + `meta.rail: "right"` |

Règles :

- Chaque app ajoute ses options à côté de celles des autres : aucune extension d'une autre app n'est retirée ni remplacée.
- Les sous-options d'une option se chargent dans la zone du même côté que son rail (option du rail gauche → zone gauche, rail droit → zone droite).
- Rail gauche : déclarer les sous-options sur `topbar-level2-nav` (`NavEntryMeta`, `section` = identifiant de l'app) et afficher `<SectionNavPanel section="mon-app" />` comme composant de l'option. Un clic navigue vers la route et met à jour la zone principale.
- Les composants d'entrée de navigation ne rendent rien (`getSyncLifecycle(() => null, …)`) : seule leur `meta` est lue.
- `node tools/check-nav-routes.mjs` valide les routes et les `meta` des rails.

Exemples : `esm-annuaire-app` (option globale), `esm-offline-tools-app` (option liée à l'app), `esm-quick-access-app` (rail droit).
