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
| Versions **consommées par le Core** (npm) | `esm-framework 4.1.0`, `esm-app-shell 2.11.1`, `@egen-civitas/egen 2.3.0`, `rspack-config 1.2.0` |
| Versions du **HEAD du Framework** | `esm-framework 5.0.0`, `esm-app-shell 3.0.2`, `egen 3.0.0`, `rspack-config 2.0.0` |

> **Écart important.** Le HEAD du Framework a retiré Carbon et SCSS (majeures 5.0.0 / 3.0.0 / 2.0.0). Le Core, lui, consomme encore les versions publiées antérieures (Carbon partagé par le Shell 2.11.1, règle SCSS dans `rspack-config` 1.2.0). Ce document décrit le **contrat commun** aux deux et signale chaque point où les versions divergent. Les versions publiées ont été téléchargées depuis npm et comparées au code source.

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
