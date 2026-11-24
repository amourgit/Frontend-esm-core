# SUIVI — réforme du système de design (thèmes, TokiForge, Tweakcn, Penpot)

> **Seul document qui porte un statut.** Mettre à jour **à chaque étape terminée** (statut + preuve), pas à la fin. Une nouvelle session lit **ce fichier d'abord**, puis `PARCOURS-COMPLET.md` (référence validée).
> Dernière mise à jour : **2026-11-23**. Phase en cours : **P0 — documentation saine, terminée** (aucun code).

## 1. Reprendre ici

**Objectif.** Faire disparaître toute trace de l'ancien système de thème (`@egen-civitas/esm-theme`, `themeUrl`, `egenThemeUrls`, variables `--colors-*`…) des **documents**, puis du **code**, au profit de la chaîne validée : Tweakcn → TokiForge → **backend du Core** → navigateur (runtime).
**Ordre imposé par le propriétaire : nettoyer d'abord, coder ensuite.**

**État en une phrase.** Le nouveau système existe et est testé dans `egen-tokiforge`, mais **ni le framework ni le Core ne l'utilisent** : ils tournent encore sur l'ancien moteur. P0 est à moitié faite.

**Prochaine action exacte.** P0, P1.1 et P1.2 sont faites. **P0 et P1 sont terminées** (D13 tranchée : option A). **Prochaine étape : P2.1** (branche depuis `main` du framework, inventaire `git grep` refait : E8). P0 et P1 sont finis, D4 est répondue dans l'ordre du §4. Après chaque étape : commit, `git fetch` + intégrer `origin/main`, push, **mettre à jour ce fichier**.

**À ne PAS faire.**
- Pas de code de bascule (P2) avant la fin de P0 et P1, ni sans la réponse du propriétaire à **D4**.
- Pas de `.changeset/*.md` ni de changement de version sur `main` du framework sauf publication voulue : **un push sur `main` du framework publie sur npm** (`release.yml`, changesets). Une documentation seule ne publie rien.
- Ne jamais écrire le token GitHub dans un fichier, un commit ou un message (il est fourni par le propriétaire dans la conversation).
- **Ne pas modifier le dépôt `Civitas-EGEN-Kernel`** (lecture seule ; règle du Kernel : aucun changement sans accord du propriétaire).
- Ne pas décider en silence : toute ambiguïté se **pose au propriétaire** (§6).
- Aucun contact direct du navigateur avec TokiForge, Tweakcn, Penpot ou une URL libre : **le frontend ne parle qu'au backend du Core**.
- Ne pas fusionner de commit postérieur au 12/11/2025 du dépôt amont `TokiForge/tokiforge` (AGPL, `ANNEXES.md` A).

## 2. Règles de travail (ordres du propriétaire)

1. Nettoyer d'abord ; supprimer totalement l'incohérent ; **aucune cohabitation** ancien/nouveau ; **aucun document obsolète qui coexiste** : chaque document est à jour, supprimé, ou étiqueté (`ACTUEL` / `OBSOLÈTE → remplacé par …` / `VISION (non réalisé)`).
2. En cas de doute : **demander**. Ne jamais laisser un ordre sans réponse.
3. Environnement sain : dépôts propres (pas de fichier ni branche ni worktree orphelin), suivi à jour.
4. Travailler sur **`main`** (core et framework) ; pousser seulement du code **sûr**.
5. Le frontend ne parle qu'au backend du Core ; le backend parle à TokiForge.
6. Contrats avant outils ; briques remplaçables ; chaîne auditable.
7. Format de thème = **Tweakcn**, évolutif. Verre/panneaux **supprimés**. Échelles **calculées**. `success`/`warning`/`info` = constantes statiques.
8. TokiForge est un projet local autonome, non joignable par le framework (paquet npm).
9. **Plusieurs sessions poussent en parallèle sur `main` du core** : `git fetch` puis intégrer `origin/main` avant de commiter ; petits commits ; pousser vite.
10. Utiliser la date **système** (`date`), jamais une date estimée. Pour les textes accentués, préférer Python à `cut -c`/`head -c`.

## 3. Dépôts, branches, états

| Dépôt | Branche | Dernier commit connu | État |
|---|---|---|---|
| `amourgit/Frontend-esm-core` | `main` | voir `git log` | Réformes Tweakcn et Character **déjà mergées** (`dc8c1de`). Autre session active (Carbon/SCSS, intégration d'apps externes, Penpot) |
| `amourgit/Frontend-esm-framework` | `main` (**publie sur npm**) | non modifié par cette réforme | Ancien moteur `esm-theme` **actif**. La branche `feature/ajustement-reforme` porte le document de réforme (`5f6d3cf`), **désormais copié sur `main`** (P0.9) |
| `amourgit/egen-tokiforge` (privé) | `main` (seule branche) | `a885b3e` | Nouveau système testé : 144 (noyau, après P1.1) + 6 (react) + 78 (service) + 17 (bout en bout). Code hérité de l'amont retiré (P1.1) ; `main` à jour (P1.2) |
| `amourgit/Frontend-esm-tweakcn-fork` | `main` (seule branche) | `c4d6943` | Phases F0–F7 faites + enveloppe d'app externe et navigation partagée. `main` porte l'état EGEN (option A, 2026-11-24). Déploiement réel : **non vérifié** |
| `amourgit/egen-character-factory` | `main` (seule branche) | `bf9b7d4` | Archive + enveloppe d'app externe + image Docker préparée (jamais construite). `main` porte l'état EGEN (option A, 2026-11-24) |
| `amourgit/penpot` (fork) | `egen` | — | Penpot intégré au Core comme **app externe en iframe** (`EGEN.md`, `docker/egen/`) ; réalisé par l'autre session. **Export de tokens vers TokiForge non défini (D7)** |
| `amourgit/Civitas-EGEN-Kernel` | `main` | — | **Lecture seule.** Contrats C1–C6 de *control planes* ; ne mentionne ni TokiForge, Tweakcn ni Penpot (D12) |

Étiquette de sécurité dans le core : `archive/character-factory-avant-reforme`.

## 4. Phases et étapes

Statuts : **FAIT** · **EN COURS** · **À FAIRE** · **BLOQUÉ (raison)**.

### P0 — Documentation saine (aucun code)

| Id | Étape | Statut | Cibles exactes (relevé du 2026-11-23) |
|---|---|---|---|
| P0.1 | Parcours complet validé par le propriétaire | **FAIT** | `PARCOURS-COMPLET.md` |
| P0.2 | Docs multiplateforme corrigées (apps retirées, mesures recalculées) | **FAIT** | commit `docs(multiplateforme)` |
| P0.3a | `docs/reforme-tokiforge/` : `README.md`, `SUIVI.md`, `ANNEXES.md` ; `PLAN.md` supprimé | **FAIT** | ce lot |
| P0.3b | `docs/reforme-tweakcn/PLAN.md` et `docs/reforme-character/PLAN.md` : les ramener à leur **état final** (Tweakcn : C1/C2 faites, fork F0–F7 faites, déploiement à confirmer ; Character : CH0–CH3 faites, aucun code conservé dans le core, image Docker préparée non construite) ou les supprimer si redondants avec `SUIVI.md` | **FAIT** (2026-11-23 : réécrits à l'état final, avec bandeau de statut) | les deux fichiers ; les phases y sont figées à un état ancien |
| P0.4 | README du core : encadrés de statut sur le thème par tenant | **FAIT** (2026-11-23) | `README.md` lignes 289-290, 293-294, 407-408, 596 |
| P0.5 | Supprimer `docs/guide-composants-et-theme.md` (Carbon + ancien thème, obsolète en totalité) et **rediriger** ses renvois vers `.github/copilot-instructions.md` (section Styling) | **FAIT** (2026-11-23) | `docs/guide-agenda-egen-dayfront.md` L129, L216, L976 ; `packages/apps/esm-footer-app/README.md` L45 (+ L48, L52 : mentions de l'ancien moteur) |
| P0.6 | Analyses datées : statut en tête + passages sur le thème | **FAIT** (2026-11-23) | `docs/analyse-esm-tenant.md` L47, 131, 579 ; `docs/analyse-separation-framework.md` L15, 43, 48-52 |
| P0.7 | `docs/guide-agenda-egen-dayfront.md` : bandeau « contrat de variables obsolète » + passages | **FAIT** (2026-11-23) | L218, 971, 973, 1213, 1692, 1726 |
| P0.8 | Statut du moteur de thème dans les tableaux d'intégration | **FAIT** (2026-11-23) | `docs/integration-apps/03-packages-framework.md` L74 ; `docs/integration-apps/04-apps-internes.md` L57 |
| P0.9 | **Framework `main`** : copier `docs/ajustement-reforme-configuration.md` depuis la branche `feature/ajustement-reforme` (statut `ACTUEL`) ; étiqueter les documents décrivant l'ancien système ; **sans changeset** | **FAIT** (2026-11-23, framework `5943fc4`, sans changeset) | `packages/framework/esm-theme/README.md` (17 mentions), `packages/tooling/tailwind-preset/README.md` (1), `README.md` (3), `MIGRATION.md` (3), `docs/EGEN-FRAMEWORK-DEV.md` (3), `docs/PLAN-RETRAIT-CARBON-SCSS.md` (1), `docs/baseline-2026-11.md` (2), `docs/stockage.md` (1), `docs/refonte-systeme-design.md` (vision **sans statut**) |
| P0.10 | Vérification finale par `git grep` (critère : §7) dans les deux dépôts ; compte rendu dans le journal | **FAIT** (2026-11-23, voir journal ; D14/D15 tranchées) | |

### P1 — Nettoyage hors bascule

| Id | Étape | Statut | Détail |
|---|---|---|---|
| P1.1 | `egen-tokiforge` : supprimer le code hérité de l'amont non utilisé | **FAIT** (2026-11-23, `egen-tokiforge` `a885b3e`) | `packages/core/src/` : `accessibility-utils`, `cicd-validator`, `color-utils`, `component-theming`, `figma-diff`, `ide-support`, `plugin-manager`, `responsive-tokens`, `theme-runtime` (+ test), `token-analytics`, `token-exporter`, `token-parser`, `token-registry`, `token-versioning`, `node.ts` ; retirer l'export `./node` et la dépendance `yaml` ; réduire `types.ts` à ce qui est utilisé ; **vérifier par `grep` qu'aucun code conservé ne les importe** ; adapter `NOTICE`/`CHANGELOG` ; critère : build, typecheck et tests verts |
| P1.2 | `egen-tokiforge` : `main` = état courant (fast-forward depuis `feature/reforme-tokiforge`), branche supprimée | **FAIT** (2026-11-23 : `main` = `a885b3e` par fast-forward ; branche `feature/reforme-tokiforge` supprimée) | après P1.1 |
| P1.3 | Aligner le README des forks Tweakcn et Character sur leur état réel | **FAIT** (README 2026-11-23 ; `main` des forks avancé 2026-11-24, D13) | dépend de **D13** |

### P2 — Bascule du framework et du Core (un seul changement par dépôt, sur branche)

Prérequis : P0 et P1 finis ; **D4 répondue** ; inventaire refait (`ANNEXES.md` B).

| Id | Étape | Statut |
|---|---|---|
| P2.1 | Branche depuis `main` du framework ; inventaire (`git grep`) | À FAIRE |
| P2.2 | Intégrer le runtime (code de `egen-tokiforge/packages/core`, attribution conservée) à la place du moteur de `esm-theme` | À FAIRE |
| P2.3 | Shell (`esm-app-shell/src/run.ts`, `index.ejs`, `rspack.config.js`) : remplacer `themeUrls` / `window.egenThemeUrls` / `setupThemeEngine` par **une seule source** : le backend du Core (D4) ; **supprimer** `window.egenThemeUrls` | À FAIRE |
| P2.4 | Migrer les 42 fichiers / 816 occurrences / 134 variables du styleguide (`ANNEXES.md` B) ; supprimer le verre/panneaux | À FAIRE |
| P2.5 | Preset Tailwind : retirer le pont vers l'ancien moteur ; déclarer les constantes (typographie, transitions, z-index, couleurs d'état) | À FAIRE |
| P2.6 | Supprimer l'ancien moteur (`esm-theme`), `theme.default.json`, tests et snapshot associés | À FAIRE |
| P2.7 | Core : `esm-appearance-app`, `esm-settings-app`, `esm-login-app` (`data-theme` → classe `.dark`), système de tenants (retirer `themeUrl`/`themeOverride`/`registerTenantThemeApplier`), 10 `package.json` | À FAIRE |
| P2.8 | Validation complète : build, types, tests, `publint`, `attw` ; `yarn verify` côté core | À FAIRE |
| P2.9 | Changeset (majeure d'`esm-theme` ou retrait du paquet : à décider) ; **push `main` = publication** : seulement après validation intégrale | À FAIRE |

### P3 — Chaîne Core réelle

| Id | Étape | Statut |
|---|---|---|
| P3.1 | Backend réel du Core appelle TokiForge (client typé : `egen-tokiforge/packages/reference-core`) | **BLOQUÉ (D3)** |
| P3.2 | Relais des événements TokiForge → navigateur (signal « recharge », sans détail) | À FAIRE |
| P3.3 | Accusés d'application | À FAIRE |
| P3.4 | CSP `connect-src 'self'` côté Core ; TokiForge hors réseau public | À FAIRE |

### P4 — Extensions (selon décisions)
Interfaces/pages et catalogue de composants (**D1**), import des tokens Penpot en DTCG (**D7**), mobile via Style Dictionary (**D10**), tokens de composants/breakpoints (**D11**), polices auto-hébergées (**D8**), interface d'administration (**D6**).

### P5 — Déploiement
Image du service (`docker build` **jamais exécuté**), compose, intégration par EGEN Kernel : mode et conformité **à clarifier (D12)**.

## 5. Journal (du plus récent au plus ancien)

- **2026-11-24** — **D13 : option A appliquée.** Fast-forward de `main` vérifié avant (main ancêtre de la branche, 0 commit de retard) : Tweakcn `a3b47b3` → `c4d6943` ; Character `aa5cc5b` → `bf9b7d4`. **Découverte avant le push** : `main.yml` de Character (hérité de l'amont) publiait sur GitHub Pages avec `cname: studio.m3org.com` à chaque push de `main` — domaine d'un tiers. Déploiement retiré, job de tests conservé ; vérifié : 37 tests du fork ✓, enveloppe 24 ✓ (avec `npm install`, voir E10). Aucun workflow de Tweakcn ne se déclenche sur `main` (tags et PR seulement). Renvois de branche corrigés (doc 15 du Core, deux plans, README et `DEPLOIEMENT.md` de Character, dont un `git checkout` qui aurait échoué), puis branches de travail supprimées. P1 entièrement terminée.
- **2026-11-23** — **P1.3 (README)**. Les deux forks avaient avancé depuis le suivi (autre session). Relevé par l'API GitHub et clonage : aucune PR ouverte ; `main` de chacun = amont. **Character** : le README était **celui de l'amont M3-org** → en-tête EGEN ajouté (statut, contenu de la branche, ce qui n'est pas vérifié : image jamais construite, affichage non vérifié), README amont conservé dessous ; **lien cassé** corrigé dans l'enveloppe (`docs/egen-deploiement.md` → `docs/egen/DEPLOIEMENT.md`). **Tweakcn** : README déjà aligné ; section « Intégration au Core EGEN » ajoutée (app externe en iframe, `EGEN.md`). Poussés sur les branches de travail (`4d11875`, `c4d6943`), documentation seule. `main` des forks **non touché** : en attente de D13.
- **2026-11-23** — **P1.1 et P1.2 faites** dans `egen-tokiforge`. Décision **D4** reçue : même origine `/api/theme`. **P1.1** : base mesurée avant toute suppression (noyau 182, react 6, service 78, bout en bout 17, build et typecheck verts) ; imports cartographiés par `grep` : le code conservé (`theme-styles`, `theme-styles-runtime`, `dtcg`, `default-theme-styles`) n'importe que `culori` ; aucun autre paquet n'importe un module hérité ; supprimés : 16 modules (`accessibility-utils`, `cicd-validator`, `color-utils`, `component-theming`, `figma-diff`, `ide-support`, `plugin-manager`, `responsive-tokens`, `theme-runtime` + test, `token-analytics`, `token-exporter`, `token-parser`, `token-registry`, `token-versioning`, `node`, `types`) et `themeStylesToDesignTokens` (pont vers eux, utilisé seulement par son test) ; export `./node` et dépendance `yaml` retirés. **Résultat depuis une installation propre (`--frozen-lockfile`)** : build 0, typecheck 0, noyau **144** (182 − 38 : 37 cas de `theme-runtime.test.ts` + 1 test des tokens plats, compté statiquement car l'ancien fichier ne s'exécute plus), react 6, bout en bout 17, service 78 (PostgreSQL 16 local). README du noyau et de react réécrits d'après l'API réelle (ils décrivaient l'API amont 1.1.2), `SECURITY.md` (dépendances), `NOTICE`, `CHANGELOG`. **P1.2** : `main` (`70ea8b2`) avancé à `a885b3e` par fast-forward, branche de travail supprimée. **Hors périmètre, non fait** : le reste de `SECURITY.md` (texte générique amont) et le script `lint` du noyau (`eslint` non déclaré en dépendance).
- **2026-11-23** — Réponses du propriétaire : **D14** nettoyer, **D15** autorisés, **E9** « supprimer seulement si la branche ne respecte pas la nouvelle architecture ». D14 : 4 `CHANGELOG.md` nettoyés (framework `33bca49`, sans changeset). **E9 — analyse** de `feat/design-system-tokiforge` (5 commits depuis `ad4ee68`, tête `0c7ef5415113fbf5af663e8298063bd23364ad39`) : (1) dépendance `@tokiforge/core ^2.4.0` **AGPL-3.0** dans le framework, ADR-001 « accepter l'AGPL » : contraire à `ANNEXES.md` A ; (2) préfixe `--egen-*` : contraire au contrat Tweakcn ; (3) `esm-theme` conservé comme moteur (sources, priorités, surcharges) : cohabitation exclue, la source unique est le backend du Core ; (4) verre et panneaux conservés : supprimés par décision ; (5) changeset *major* : publierait sur npm. Aucune PR ouverte ne la référence. **Non adaptable** (c'est le fondement, pas un détail) → **branche supprimée** ; rien de réutilisable tel quel (les scripts de migration ciblent le préfixe `--egen-`). Restauration possible depuis le SHA ci-dessus tant que GitHub le conserve. Les documents `docs/design-system/` n'ont jamais été sur `main`.
- **2026-11-23** — **P0.10 (vérification `git grep`, critère §7)**. Core : toutes les occurrences de `esm-theme|themeUrl|egenThemeUrls|applyAppThemeOverride|setupThemeEngine|theme.default` sont dans des documents ou sections étiquetés ou annotés en ligne (README, `integration-apps/03`, `04`, analyses, guide agenda, docs de réforme). Framework : idem pour les 9 documents ciblés ; **restent 3 `CHANGELOG.md`** (`esm-theme`, `esm-translations`/`esm-app-shell`/`tailwind-preset`), générés par changesets, historiques : **non modifiés → D14**. Core, 2ᵉ critère (`theme-studio|character-factory|tweakcn` hors `docs/reforme-*`) : 10 documents ; ceux de `integration-apps/15` à `18` décrivent l'intégration réelle des apps externes, pas un retrait → **D15**. Les autres (multiplateforme, architecture-declaration, guide agenda, SUIVI-MULTIPLATEFORME) n'ont pas été relus ligne à ligne dans cette étape.
- **2026-11-23** — P0.9 faite (framework `main`, `5943fc4`) : `docs/ajustement-reforme-configuration.md` copié depuis `feature/ajustement-reforme` (`5f6d3cf`) avec statut `ACTUEL`, contenu inchangé ; 9 documents étiquetés (`esm-theme/README.md`, `tailwind-preset/README.md`, `README.md`, `MIGRATION.md`, `EGEN-FRAMEWORK-DEV.md`, `PLAN-RETRAIT-CARBON-SCSS.md`, `baseline-2026-11.md`, `stockage.md` : OBSOLÈTE/datés ; `refonte-systeme-design.md` : VISION (non réalisé)). **Aucun changeset.** Vérifié avant push : toutes les versions de `main` sont déjà sur npm ; `origin/main` portait déjà 2 changesets d'une autre session (embed-protocol/client), non touchés.
- **2026-11-23** — P0.8 faite : `integration-apps/03` (L74) et `04` (L57) : `esm-theme` étiqueté ancien moteur OBSOLÈTE ; 10 apps du core qui le déclarent confirmées par `git grep` (appearance, annuaire, home, informations, login, not-found, primary-navigation, settings, sites, tenant-routing).
- **2026-11-23** — P0.7 faite : `guide-agenda-egen-dayfront.md` — bandeau « contrat de variables obsolète » en tête (avec le nouveau contrat d'après `ANNEXES.md` B) ; passages L218, 971, 973, 1213 et le `package.json` de l'annexe A.5 (L1692 et L1726) annoté une fois ; texte d'origine conservé.
- **2026-11-23** — P0.6 faite : statut en tête des deux analyses datées ; 3 passages de `analyse-esm-tenant.md` annotés (L47, L131, L579). `analyse-separation-framework.md` : les mentions de `esm-theme` sont couvertes par le statut en tête.
- **2026-11-23** — P0.5 faite : `docs/guide-composants-et-theme.md` supprimé ; 3 renvois de `guide-agenda-egen-dayfront.md` redirigés vers `.github/copilot-instructions.md` ; README du footer corrigé d'après le CSS réel (il lit encore `--typography-*` de l'ancien contrat). Preuve : `git grep guide-composants-et-theme` ne renvoie plus que des documents de suivi.
- **2026-11-23** — P0.3b faite : `reforme-tweakcn/PLAN.md` et `reforme-character/PLAN.md` réécrits à l'état final (bandeau `ACTUEL`, faits limités à ceux établis par ce suivi et le doc 15 ; D13 laissée ouverte).
- **2026-11-23** — P0.4 faite : README du core, 3 encadrés de statut (thème par tenant, `themeUrl`/`themeOverride`, checklist) + 2 marqueurs dans l'exemple de code. Preuve : `git grep -n "OBSOLÈTE" README.md`.
- **2026-11-23 08:56 UTC** — Suivi réécrit pour reprise par une nouvelle session. Lecture du fork Penpot (`EGEN.md`, `docker/egen/README.md`) et du Kernel (`00-etat-et-reprise`, `04-contrats-egen`, `11-ecosystemes-et-integrations`) : Penpot = app externe des concepteurs (indépendante du chemin des tokens) ; le Kernel ne décrit pas encore la pile de design (D12). Commit multiplateforme (dates corrigées au 22/11).
- **2026-11-22** — Le propriétaire valide `PARCOURS-COMPLET.md` et ordonne de commencer par le nettoyage. Erreur reconnue : le nouveau système avait été construit **avant** le nettoyage, contre l'ordre donné. Recalcul des mesures de `multiplateforme/02` (`target="_blank"` 14→10, presse-papiers 16→10, 2 apps sans test, 28 apps).
- **Avant** — `egen-tokiforge` : contrat de thème, runtime, correction d'une **injection CSS** (`f131af5`), service, couches, surcharges utilisateur, DTCG, accusés, backend de référence + essai de bout en bout, refus des requêtes de navigateur (`4df594d`). Réformes Tweakcn (fork F0–F7) et Character (archive + image) menées et mergées côté core.

## 6. Décisions et questions ouvertes

| Id | Sujet | Statut |
|---|---|---|
| D2 | `success`/`warning`/`info` | **Acceptée** : constantes statiques du preset |
| D5 | Thèmes de tenants | **Acceptée** : affectations `tenant:<id>` dans TokiForge ; plus d'URL de thème dans le système de tenants |
| D9 | Atomicité | **Acceptée** : remplacement du moteur + suppression de l'ancien en **un seul changement** ; le reste du nettoyage avant |
| — | Verre / panneaux ; échelles | **Supprimés** ; **calculées** (`color-mix`) |
| D4 | Où le shell lit l'adresse du backend du Core | **Tranchée (propriétaire, 2026-11-23) : même origine (`/api/theme`).** Le frontend ne parle qu'à son backend ; c'est le backend qui sait comment joindre TokiForge. Pas d'adresse de backend dans `EGEN_CONFIG_FILE`/`configUrls` pour le thème. **P2.3 n'est plus bloquée par D4** |
| D1 | Interfaces/pages Penpot et catalogue de composants ESM : périmètre actuel ou plus tard | OUVERTE |
| D3 | Le backend du Core existe-t-il (dépôt, technologie) ? | OUVERTE — bloque P3.1 |
| D6 | Qui revoit et publie une version de thème, avec quel outil | OUVERTE |
| D7 | Export des tokens Penpot (DTCG, natif) vers TokiForge : direction, déclencheur, exécutant | OUVERTE |
| D8 | Polices auto-hébergées | OUVERTE |
| D10 | Mobile : besoin à court terme | OUVERTE |
| D11 | Tokens de composants, breakpoints, espacements | OUVERTE |
| **D12** | Comment EGEN Kernel déploie/intègre TokiForge (et Tweakcn/Penpot) : lequel des trois modes d'intégration (Kernel `docs/11`), conformité C1–C6 ? Le Kernel ne décrit pas encore la pile de design | OUVERTE — conditionne P5 |
| D13 | `main` des forks Tweakcn et Character | **Tranchée (propriétaire, 2026-11-24) : option A** — `main` avancé par fast-forward à l'état EGEN, branches de travail supprimées. **Reste ouvert** : le déploiement réel de Tweakcn (non vérifiable depuis l'environnement de travail) |
| D14 | `CHANGELOG.md` du framework citant `esm-theme` | **Tranchée (propriétaire, 2026-11-23) : nettoyer.** Fait (framework `33bca49`) ; reste uniquement le titre du `CHANGELOG.md` du paquet `esm-theme`, supprimé avec le paquet en P2.6 |
| D15 | Critère §7 vs `integration-apps/15` à `18` (intégration réelle d'apps externes) | **Tranchée (propriétaire, 2026-11-23) : ces documents sont autorisés.** Ce sont des apps déployées ailleurs, avec leur architecture propre, simplement affichées dans le Core : pas de couplage avec le Core. Critère §7 amendé en conséquence |

## 7. Critères de fin (définition de « terminé »)

- **P0** : `git grep -i -E "esm-theme|themeUrl|egenThemeUrls|applyAppThemeOverride|setupThemeEngine|theme\.default" -- '*.md'` dans le core et le framework : chaque occurrence restante est dans un document **étiqueté** ou une section qui renvoie à la réforme. `git grep -i -E "theme-studio|character-factory|tweakcn" -- '*.md'` (hors `docs/reforme-*`) : uniquement des notes de retrait **ou** des documents d'intégration d'apps externes (`docs/integration-apps/15` à `18` : apps déployées ailleurs, non couplées au Core — D15). Aucun document ne décrit l'ancien système comme actuel sans statut.
- **`egen-tokiforge`** : `corepack enable && pnpm install --frozen-lockfile && pnpm -r build && pnpm -r typecheck && pnpm -r test` (le service a besoin d'un PostgreSQL : `TEST_DATABASE_URL`, `docs/SERVICE.md`).
- **Framework (P2)** : build, types, tests, `publint`, `attw` ; plus aucune occurrence de `esm-theme`/`egenThemeUrls` dans le code ; plus de `.scss` ni de `--colors-*` ; **pas de push sur `main` tant que tout n'est pas vert**.
- **Core (P2)** : `yarn verify`, tests des apps modifiées.
- **Chaîne (P3)** : l'essai de bout en bout de `reference-core` rejoué contre le vrai backend ; contrôles de mutation conservés (clé non exposée, identité par la session, repli).

## 8. Environnement et pièges

- `egen-tokiforge` : `pnpm@10.34.9` (`corepack enable`), Node ≥ 20.9. Framework et core : Yarn. Character : npm (`.npmrc` règle les peer dependencies).
- Aucune image Docker n'a jamais été construite (pas de Docker dans l'environnement précédent) : les étapes des Dockerfile ont été rejouées à la main.
- Autres suivis actifs dans le core : `docs/SUIVI-MULTIPLATEFORME.md`, `docs/integration-apps/`. Ne pas les dupliquer ; s'y référer.

## 9. Registre des écarts

| Id | Écart | Gravité | État |
|---|---|---|---|
| E1 | Nouveau système construit avant le nettoyage, contre l'ordre donné | haute | reconnu ; nettoyage en cours |
| E2 | Affirmation fausse « aucune app du core n'appelle l'ancien moteur » (ancien `PLAN.md`) : `esm-appearance-app`, `esm-settings-app`, `esm-login-app` et le système de tenants l'utilisent | haute | corrigée (`PARCOURS-COMPLET.md` §7) |
| E3 | Injection CSS possible via les valeurs de thème | haute | **corrigée** (`egen-tokiforge` `f131af5`, grammaire stricte, 42 thèmes Tweakcn en non-régression) |
| E4 | Docs multiplateforme décrivant des apps retirées comme présentes et des mesures périmées | moyenne | **corrigée** (P0.2) |
| E5 | Hypothèse « le Kernel déploie avec compose + `/health` » non confirmée par le Kernel | moyenne | ouverte (D12) |
| E6 | Document de réforme absent de `main` du framework | moyenne | **corrigée** (P0.9) |
| E7 | Dates estimées (« 20/11 ») dans des documents | basse | corrigée |
| E8 | Mesures 816/134/42 datées du 19/11 | basse | à refaire en P2.1 |
| E10 | `package-lock.json` de l'enveloppe `integrations/egen/esm-character-app` désynchronisé de son `package.json` (`npm ci` échoue : `@rspack/dev-server` 1.1.5 vs 2.2.2, `@module-federation/*`) ; son workflow `egen-character-app.yml` lancera `npm ci` | basse | **ouverte** — préexistant, non corrigé (hors périmètre) |
| E9 | Branche `feat/design-system-tokiforge` du framework (approche antérieure) | moyenne | **corrigée** : branche supprimée le 2026-11-23 (voir journal) |

## 10. Vérifié ici / non vérifié

**Vérifié par exécution ou lecture directe.**
- `egen-tokiforge` : tests du noyau, de react, du service (PostgreSQL réel) et de bout en bout ; parité à l'octet avec le générateur de Tweakcn sur 9 thèmes (hsl, oklch) ; 42 thèmes Tweakcn valides sans avertissement ; contrôles de mutation (verrou, ETag, portée, contraste, politique, identité par la session, fuite de clé, repli).
- Core : plus aucun `fetch(` direct dans `packages/apps/*/src` ; mesures de `multiplateforme/02` recalculées par `grep` ; JSON de `03` valide.
- Framework : `release.yml` lu (changesets) ; inventaire de l'ancien système (fichiers et occurrences).

**NON vérifié.**
- `docker build` / `docker compose` (jamais exécutés) ; déploiement par le Kernel ; état réel du fork Tweakcn déployé.
- Build, typecheck et tests du **framework** et des **apps du core** (jamais exécutés par cette réforme).
- Tout rendu visuel dans un navigateur ; la migration des 816 occurrences (non commencée).
- Format d'export des tokens Penpot vers TokiForge (non conçu).
