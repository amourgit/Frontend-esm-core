# Programme « Core multiplateforme » — documentation de référence

> **Objet** : rendre les applications de `Frontend-esm-core` exécutables, en plus du Web, dans une **application
> native Android / iOS** (WebView dans un Host Capacitor), sans régression Web et en s'appuyant sur le contrat
> multiplateforme déjà livré par `Frontend-esm-framework`.
>
> **Statut** : plan rédigé le **2026-11-15**, aucune phase démarrée. Aucun code du core n'a été modifié par la rédaction
> de ces documents.
>
> **Dépôts concernés** : ce dépôt (core) pour tout le travail décrit ici ; `Frontend-esm-framework` (déjà prêt, demandes
> ponctuelles `FW-REQ-*`) ; le backend (`BE-REQ-*`) ; `egen-distributions` et `egen-mobile` (n'existent pas encore,
> `HOST-REQ-*`).

## Comment lire cette documentation

Les documents sont numérotés dans l'ordre de lecture. Chacun répond à **une** question.

| # | Document | Question à laquelle il répond | Lecteur principal |
| --- | --- | --- | --- |
| 01 | [Cadrage](01-CADRAGE.md) | Pourquoi, jusqu'où, avec quelles règles, qui fait quoi ? | Tous |
| 02 | [État des lieux](02-ETAT-DES-LIEUX.md) | Où en est exactement le core aujourd'hui (faits vérifiés, preuves) ? | Développeurs, revue |
| 03 | [Classification des apps](03-CLASSIFICATION-APPS.md) | Pour chacune des 26 apps : native, web seulement, dev seulement ? Que changer ? | Développeurs |
| 04 | [Plan par phases](04-PLAN-PHASES.md) | Que faire, dans quel ordre, avec quels critères de réussite ? | Tous (document pivot) |
| 05 | [Session et login natifs](05-CONTRAT-SESSION-LOGIN.md) | Comment l'utilisateur se connecte et reste connecté sans cookie ? | Login, backend, Host |
| 06 | [Guide du développeur](06-GUIDE-DEVELOPPEUR.md) | Comment écrire du code qui tourne sur les trois cibles ? | Développeurs, relecteurs |
| 07 | [Tests et CI](07-TESTS-ET-CI.md) | Comment prouver que ça marche, à chaque niveau ? | Développeurs, CI |
| 08 | [Décisions et risques](08-DECISIONS-ET-RISQUES.md) | Qu'est-il décidé, qu'est-il à valider, que peut-il mal tourner ? | Responsables |
| — | [Suivi](../SUIVI-MULTIPLATEFORME.md) | Où en est-on, quelle est la prochaine tâche, comment reprendre ? | Tous (mis à jour à chaque tâche) |

Le fichier de suivi est volontairement placé à côté de `docs/SUIVI-REFORME-TOPBAR.md`, qui suit la même convention.

## Les trois idées à retenir

1. **Le framework est prêt, le core ne l'utilise pas encore.** Le framework fournit le contrat de plateforme (`platforms`,
   `requiredCapabilities`, `getPlatform()`, session par jeton, écran d'incompatibilité…). Le core n'en déclare rien :
   aucune des 26 apps ne dit sur quelles cibles elle tourne, et le login suppose un cookie de session.
2. **Le blocage principal n'est pas technique mais contractuel** : l'authentification native demande au backend deux
   endpoints (jeton et rafraîchissement) qui n'existent pas encore dans un contrat écrit. Voir
   [05](05-CONTRAT-SESSION-LOGIN.md) et la décision `D-06`.
3. **Une grande partie du travail est de la discipline, pas de l'invention** : déclarer les plateformes, remplacer des
   images distantes par des ressources embarquées, remplacer des `window.location.href = …` par `navigate()`. Ce sont
   des changements petits, nombreux, et vérifiables un par un.

## Vue d'ensemble des phases

| Phase | Intitulé | Taille | Dépend de | Sortie en une phrase |
| --- | --- | --- | --- | --- |
| P0 | Fondations et alignement | S | — | Dépendances à jour, politiques de versions écrites, baseline mesurée |
| P1 | Contrat de plateforme des apps | M | P0 | Les 26 apps déclarent leurs plateformes, un outil le vérifie en CI |
| P2 | Règles de code et garde-fous | M | P1 | Le code interdit est refusé automatiquement par le lint |
| P3 | Banc de test natif simulé | L | P1 | Un artefact natif du core est construit et testé en CI avec un faux Host |
| P4 | Session et login natifs | L | P3, **contrat backend** | Connexion, rafraîchissement et déconnexion sans cookie |
| P5 | Ressources distantes et CSP | M | P3 | Aucune ressource externe chargée à l'exécution en natif |
| P6 | Adaptation des apps (vagues) | XL | P2, P4, P5 | Les 13 apps « à adapter » fonctionnent en natif |
| P7 | Expérience mobile | L | P6 | Interface utilisable sur téléphone (tactile, zones sûres, petits écrans) |
| P8 | Livraison vers les distributions | M | P6 | Le core publie ce dont `egen-distributions` a besoin, vérifié |
| P9 | Validation sur appareil | L | P8, `egen-mobile` | Parcours validés sur vrais Android et iOS |
| P10 | Évolutions optionnelles | — | P9 | Voix, caméra, fichiers, notifications, hors ligne natif |

Les tailles sont relatives (S ≈ 1–2 jours, M ≈ 3–5, L ≈ 6–10, XL ≈ 12–20, pour un développeur qui connaît le code). Elles
sont indicatives : voir [04](04-PLAN-PHASES.md) pour le détail et les hypothèses.

## Règles de maintenance de cette documentation

- Une tâche terminée met à jour **le suivi** (`docs/SUIVI-MULTIPLATEFORME.md`) dans la **même PR** que le code.
- Une décision qui change se corrige dans [08](08-DECISIONS-ET-RISQUES.md) **et** là où elle est utilisée (la liste
  des usages est donnée pour chaque décision).
- Les faits de [02](02-ETAT-DES-LIEUX.md) sont datés et vérifiables par les commandes qui y figurent ; si le code change,
  on ne réécrit pas l'état des lieux, on ajoute une ligne datée en fin de document.
- Toute information de ces documents est soit un **fait vérifié** (avec sa preuve), soit une **décision** (avec son
  identifiant `D-xx`), soit une **hypothèse** (avec son identifiant `H-xx` dans [01](01-CADRAGE.md)). Il n'y a pas
  d'autre catégorie.
