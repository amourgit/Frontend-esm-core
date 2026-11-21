# Référence d'intégration des applications EGEN

Documentation technique de référence : comment concevoir, construire, déclarer, déployer et faire charger une application par EGEN, qu'elle soit **interne au Core** (`packages/apps/*`) ou **externe** (dépôt indépendant).

Elle est volontairement **isolée** du reste de `docs/` : tout ce qui est écrit ici provient de la lecture du code, avec le chemin du fichier cité. Rien n'est supposé.

## Sommaire

| # | Document | Contenu |
| --- | --- | --- |
| 01 | [Architecture d'intégration](01-architecture.md) | Responsabilités Core / Shell / Framework / apps, démarrage, Single-SPA, Module Federation, import map, routes registry, chargement dynamique |
| 02 | [Déclarations `routes.json`](02-declarations-routes-json.md) | Spécification complète des contributions (pages, extensions, modales, workspaces, flags…) |
| 03 | [Paquets du Framework](03-packages-framework.md) | Rôle réel de chaque paquet, obligatoire ou non, conséquences de l'absence |
| 04 | [Applications internes au Core](04-apps-internes.md) | Structure, configuration, point d'entrée, cycle de vie, analyse des 28 apps |
| 05 | [Applications externes au Core](05-apps-externes.md) | Contrat d'intégration, découverte, enregistrement, scénarios dev/prod |
| 06 | [React, Vue, Angular](06-react-vue-angular.md) | Ce qui existe, ce qui manque, conditions de compatibilité |
| 07 | [Tolérances et incompatibilités](07-tolerances-incompatibilites.md) | Classification A–E justifiée |
| 08 | [Écarts et recommandations](08-ecarts-et-recommandations.md) | Lacunes réelles, importance, options |
| 09 | [Diagnostic et checklists](09-diagnostic-et-checklists.md) | Erreurs fréquentes, messages exacts, checklists de validation |
| 10 | [Exemples de projets](10-exemples.md) | React interne, React externe, Vue externe, Angular externe |
| 11 | [Comparatif interne / externe](11-comparatif-interne-externe.md) | Tableau de synthèse |
| 12 | [Apps externes en production](12-apps-externes-en-production.md) | Procédure `external:sync`, règles d'alignement, rechargement à chaud (✅ implémenté) |
| 13 | [Extension multi-technologies](13-extension-multi-technologies.md) | Socle commun, Vue, Angular, Next.js (✅ implémentés et testés) |
| 14 | [Migration Carbon / SCSS du Core](14-plan-migration-carbon.md) | Mesures avant migration, résultat constaté (✅ réalisée), garde-fou |
| 15 | [Scénarios d'intégration externe de bout en bout](15-scenarios-integration-externe.md) | Code source GitHub, paquet npm, app déjà déployée (distante, locale, autonome), registre central : acteurs, étapes, résultats, diagnostic |

## Légende des niveaux de preuve

| Marque | Sens |
| --- | --- |
| ✅ | **Vérifié** : le comportement a été lu dans le code source cité. |
| 🟡 | **Présent mais non exécuté** : le code existe et la logique est lue, mais aucun scénario réel n'a été joué (voir « Limites »). |
| ⛔ | **Absent** : recherché explicitement (grep sur les deux dépôts), introuvable. |
| 💡 | **Recommandation** : proposition fondée sur un constat, jamais présentée comme existante. |

## Version auditée (ancre de reproductibilité)

| Élément | Référence |
| --- | --- |
| Core | `Frontend-esm-core`, branche `main` après fusion de `feature/ajustement-reforme` (28 apps) |
| Framework | `Frontend-esm-framework`, commit `fe80ed2` (HEAD de `main` au moment de l'audit) |
| Versions **consommées par le Core** (`yarn.lock` de `main`, 2026-11-21) | `esm-framework 5.0.1`, `esm-app-shell 3.0.6`, `@egen-civitas/egen 3.0.0`, `rspack-config 2.0.0`, `esm-styleguide 5.2.4` |
| Versions du **HEAD du Framework** | `esm-framework 5.0.0`, `esm-app-shell 3.0.2`, `egen 3.0.0`, `rspack-config 2.0.0` |

> **Alignement Core ↔ Framework.** La migration Carbon/SCSS du Core a été **réalisée** pendant cet audit (0 import `@carbon`, 0 fichier `.scss`, 0 dépendance `sass`) et le Core consomme désormais les majeures 5 / 3 / 3 / 2 du Framework. L'audit a d'abord été mené sur les versions 4.x / 2.x (Core d'alors), puis **recalé** sur l'état actuel ; le code des paquets d'intégration audités (`rspack-config`, `egen`, `esm-dynamic-loading`, `esm-routes`, `esm-react-utils`, `esm-extensions`, `esm-globals`) est **identique** entre `fe80ed2` et le `main` actuel du Framework (`d3c4bb5`), à l'exception d'une montée de version du Shell. Les mentions de Carbon/SCSS qui subsistent dans ces documents sont historiques et signalées comme telles.

## Limites de l'audit (à lire)

- **Lecture statique du code.** Aucune application n'a été exécutée ni compilée pendant cet audit : l'installation complète du Core n'a pas pu aboutir dans l'environnement d'audit (réseau restreint). Les comportements sont donc établis par le code, pas par un test de bout en bout. C'est la raison d'être de la marque 🟡.
- **Aucune modification de code** n'a été faite pour cet audit (seul ce dossier de documentation a été ajouté).
- Les scénarios Vue et Angular (document 06) ne reposent sur **aucune implémentation existante** dans l'écosystème : le contrat est vérifié, les exemples sont construits à partir de lui et signalés comme non éprouvés.

## Méthode

1. Lecture du Core (`tools/`, 28 apps), du Shell (`packages/shell/esm-app-shell`), des paquets du Framework et de l'outillage (`packages/tooling/*`).
2. Remontée jusqu'à l'implémentation pour chaque mécanisme (fonction, fichier, ligne de configuration).
3. Statistiques calculées par script sur les 28 apps (cohérence `routes.json` ↔ exports, slots, clés utilisées).
4. Comparaison des versions publiées consommées par le Core avec le HEAD du Framework.

Dépôts cités : `core/` = Frontend-esm-core, `fw/` = Frontend-esm-framework (chemins relatifs à leur racine).
