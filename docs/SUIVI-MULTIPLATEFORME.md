# Suivi — Core multiplateforme (apps exécutables sur Web, Android et iOS)

> **Point de reprise (2026-11-17)** : documentation **publiée** (`docs/multiplateforme/`, 8 documents + ce suivi). **Aucun code du core n'a été modifié.**
> État du dépôt au moment de l'arrêt : `main` du core au commit `552feb9` (+ le commit de documentation) ; framework `main` propre et publié
> (`esm-framework 4.1.0`, `esm-app-shell 2.11.1`, `esm-platform 1.3.1`, `esm-routes 1.3.0`, `rspack-config 1.2.0`, `egen 2.3.0`, 35 paquets conformes à npm).
> **Où on s'est arrêté exactement** : en vérifiant l'audit contre `main` (qui a avancé de 4 apps depuis le commit audité `6138348`) ; la session a été saturée **avant** d'avoir
> corrigé les tableaux de `02` et `03`. Des **bandeaux d'avertissement** (« à réviser ») ont été posés en tête de `02` et `03` avec tous les écarts déjà relevés.
> L'installation des dépendances du core (`yarn install --immutable`) a été lancée mais **non terminée** (fetch 2169 paquets en 1 min 21, étape de liaison > 3 min) : **rien n'est mesuré** (ni build, ni tests, ni `verify`).
> **PROCHAINE TÂCHE : R0 — Ré-audit sur `main` actuel, puis T0.1 (vérifier si déjà fait par le commit `63dd2ef`).** Détail en §3 (ligne R0).
> Mettre à jour ce fichier à CHAQUE tâche terminée (état, PR, commit, décisions, pièges) **dans la même PR que le code**.

Documentation de référence : [index](multiplateforme/README.md) · [01 cadrage](multiplateforme/01-CADRAGE.md) · [02 état des lieux](multiplateforme/02-ETAT-DES-LIEUX.md) ·
[03 classification](multiplateforme/03-CLASSIFICATION-APPS.md) · [04 plan](multiplateforme/04-PLAN-PHASES.md) · [05 session et login](multiplateforme/05-CONTRAT-SESSION-LOGIN.md) ·
[06 guide](multiplateforme/06-GUIDE-DEVELOPPEUR.md) · [07 tests et CI](multiplateforme/07-TESTS-ET-CI.md) · [08 décisions et risques](multiplateforme/08-DECISIONS-ET-RISQUES.md).

## 1. Philosophie (ne pas la remettre en cause)

- **Quatre briques, un seul métier chacune** : le framework fournit le moteur et les contrats ; **le core** (ce dépôt) contient les apps ; `egen-distributions`
  compose les produits ; `egen-mobile` est le Host natif. Le core ne connaît ni Capacitor, ni la composition des produits.
- **Le Web ne change pas** (P-1) : comportement observable identique (un lien qui ouvrait un onglet en ouvre un ; voir `D-21`).
- **Aucun jeton dans le WebView** (P-2) ; **aucune ressource distante** (P-4) ; **aucune navigation hors du SPA par le code applicatif** (P-5) ;
  **jamais de chemin absolu à la racine** (P-6) ; **déclarer, ne pas deviner** (P-3) ; **échouer explicitement** (P-10).
- **« Fait » = fusionné dans `main` avec la CI verte** (P-9), `version` de l'app incrémentée si son comportement publié change, suivi à jour.
- Règles de codage du dépôt : `.github/copilot-instructions.md` (voir T0.5 : sa description de structure est périmée) et le [guide](multiplateforme/06-GUIDE-DEVELOPPEUR.md).

## 2. Fait (sur `main`)

| # | Tâche | Résultat | Preuve |
| --- | --- | --- | --- |
| D0 | Documentation du programme | 8 documents dans `docs/multiplateforme/` + ce suivi ; état des lieux daté ; 26 apps classées ; 66 tâches définies avec critères d'acceptation ; section « Multiplateforme » ajoutée au `README.md` racine | Commit « docs(multiplateforme) » |

## 2 bis. Mise à jour du 2026-11-21 (après fusion de `feature/ajustement-reforme`)

`main` compte désormais **28 apps** (retrait de `esm-theme-studio-app` et `esm-character-factory-app`, toutes deux de catégorie **C** = web uniquement). Chiffres **recalculés** par les commandes de [02](multiplateforme/02-ETAT-DES-LIEUX.md) §13 (les tableaux de 02 et 03 restent à régénérer : R0.2–R0.4) :

| Mesure | Avant (30 apps) | Maintenant (28 apps) |
| --- | --- | --- |
| Apps | 30 | **28** |
| Classification attendue | A 9 / B 14 / C 4 / D 3 | **A 9 / B 14 / C 2 / D 3** (C = `offline-tools`, `tenant-routing`) ; **23 natives** (inchangé : les 2 apps retirées étaient web seules) |
| `<a target="_blank">` bruts (hors tests) | 14 | **10** |
| `window.location.href =` (hors tests) | — | 4 |
| `window.open`, `<iframe>`/`<video>`/`new Audio`, `document.cookie`, `indexedDB` | présents (theme-studio / character-factory) | **0** |
| Ressources distantes (unsplash 102, picsum 16, 21st.dev 6, spline 1) | 125 | **125** (inchangé : portées par d'autres apps) ; polices Google : 0 |
| Apps utilisant `localStorage` | — | 5 (`ai-assistant`, `annuaire`, `home`, `implementer-tools`, `login`) |
| `navigator.clipboard` | 16 (lignes) | 10 |
| `platforms` dans les `routes.json` ; `getPlatform`/`isNativePlatform` | 0 ; 0 | 0 ; 0 |

**R0.5 ✅** : `node tools/sync-egen-deps.mjs --check` → *Toutes les plages @egen-civitas/* sont à jour. yarn.lock à jour.* Le Core consomme `esm-framework ^5.0.1`, Shell `^3.0.6`, `egen ^3.0.0`, `rspack-config ^2.0.0`, `esm-styleguide ^5.2.4` : la migration **Carbon/SCSS est faite** (0 import `@carbon`, 0 `.scss`, 74 `*.module.css`, garde-fou `yarn verify:no-carbon`). **T0.1 est donc fait** pour les dépendances ; reste **T0.2** : le peer `@egen-civitas/esm-framework` vaut encore `>=3.0.0` dans les 28 apps (garde-fou `frameworkRange` neutralisé, voir [integration-apps/08](integration-apps/08-ecarts-et-recommandations.md) E4).

**Nouveau, hors programme multiplateforme mais à connaître** : apps externes en production (`yarn external:sync`), table d'alias d'import map (écart E2), paquets Vue/Angular/Next.js du Framework (branche `feature/multi-techno-utils`). Référence : [integration-apps](integration-apps/00-LISEZ-MOI.md).

## 3. Reste — tâches par phase

États : **À faire** · **En cours** (branche) · **Fait** (PR #, commit) · **Bloqué** (raison). Tailles : S ≈ 1–2 j, M ≈ 3–5 j, L ≈ 6–10 j.

### R0 — Ré-audit et mise à jour de la documentation (**À FAIRE EN PREMIER**)

| ID | Tâche | Taille | État | Notes |
| --- | --- | --- | --- | --- |
| R0.1 | Installer et **mesurer** `main` : `yarn install --immutable`, `yarn build`, `yarn test`, `yarn verify` ; consigner durées, nombre de tests, **échecs préexistants** (suivi TopBar §6 : « échecs anciens, hooks ignorés ») | S | À faire | Voir §8 (séquence 0). Sert de base à T0.4 |
| R0.2 | **(chiffres recalculés le 2026-11-21, voir §2 bis ; tableaux à régénérer)** Relancer les commandes de [02](multiplateforme/02-ETAT-DES-LIEUX.md) §13 sur `main` et **corriger les tableaux de 02** (30 apps, ressources distantes = 125, apps de la TopBar, stockage, navigation), puis retirer le bandeau | M | À faire | Bandeau = liste des écarts déjà connus |
| R0.3 | **Régénérer la classification** (03) : 30 apps, A 9 / B 14 / C 4 / D 3, 23 natives ; fiches `launcher`, `navigation`, `search`, `side-panel`, `primary-navigation` (→ A) ; erratum `quick-access` ; matrice §3 | M | À faire | `esm-navigation-app` : souris (glisser), presse-papiers |
| R0.4 | Propager les nouveaux totaux dans `01`, `04` (vague 4 = `navigation` + `launcher` au lieu de `primary-navigation` ; ExternalLink : `launcher` remplace `primary-navigation`), `07` (E-20 : 23 apps), `08` (R-07 : la réforme TopBar est **terminée**), ce suivi (66 → recompter) | S | À faire | |
| R0.5 | Vérifier le commit `63dd2ef` : `node tools/sync-egen-deps.mjs --check` ; si OK, **T0.1 est fait** (marquer Fait avec le commit) ; sinon le terminer | S | À faire | Le peer `esm-framework` vaut encore `>=3.0.0` (T0.2) |

### P0 — Fondations et alignement

| ID | Tâche | Taille | Dépend de | État | PR / commit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T0.1 | Aligner les dépendances `@egen-civitas/*` (planchers du plan) + test de fumée Web | M | R0 | À faire (**peut-être déjà fait par `63dd2ef`**) | | Une seule note `.changeset` pour toutes les apps ; vérifier d'abord (R0.5) |
| T0.2 | Peer `esm-framework` → `^4.1.0` dans les 26 apps (`D-17`) | S | T0.1 | À faire | | Vérifier `frameworkRange` dans `dist/routes.json` |
| T0.3 | Politique de version + `tools/check-version-bump.mjs` (`D-02`, `D-19`) | S | — | À faire | | Informatif d'abord |
| T0.4 | `docs/multiplateforme/BASELINE.md` (durées, poids, tests) | S | T0.1 | À faire | | Mesure à commit fixé |
| T0.5 | Documentation d'instruction à jour (`copilot-instructions`, bandeaux `analyse-*`) | S | — | À faire | | `.github` est partagé avec les jumeaux (R-10) ; le lien du `README.md` est déjà fait (D0) |

### P1 — Contrat de plateforme des apps

| ID | Tâche | Taille | Dépend de | État | PR / commit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T1.1 | `tools/platform-matrix.json` (26 apps, `nativePending` pour 19) | S | P0 | À faire | | Copie du bloc de [03](multiplateforme/03-CLASSIFICATION-APPS.md) §3 |
| T1.2 | `tools/check-platforms.mjs` (`PLAT-001` à `PLAT-007`) | M | T1.1 | À faire | | Schéma `@egen-civitas/esm-routes/routes.schema.json` |
| T1.3 | `tools/list-apps.mjs` | S | T1.1 | À faire | | `--production` exclut la catégorie D |
| T1.4 | `platforms` et `requiredCapabilities` dans les 26 `routes.json` | S | T1.2 | À faire | | Tout `["web"]` ; `session` requis pour le login |
| T1.5 | `verify:platforms` dans `yarn verify` + tests de l'outil | S | T1.2 | À faire | | |
| T1.6 | `scaffold-app.py` : `--category` obligatoire, `platforms`, peer | S | T1.1 | À faire | | |

### P2 — Règles de code et garde-fous

| ID | Tâche | Taille | Dépend de | État | PR / commit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T2.1 | ESLint natif en cascade (`packages/apps/.eslintrc.cjs`, N-01 à N-10, dosage par `nativePending`) | M | P1 | À faire | | Non partagé avec les jumeaux (`D-11`) |
| T2.2 | `tools/check-remote-assets.mjs` (`ASSET-001`) + liste d'hôtes autorisés | S | P1 | À faire | | ≥ 100 constats attendus au départ |
| T2.3 | Tests des garde-fous (`eslint-native-rules.test.mjs`, `check-remote-assets.test.mjs`) | S | T2.1, T2.2 | À faire | | |
| T2.4 | Modèle de PR (section multiplateforme) | S | — | À faire | | Fichier partagé : PR « à synchroniser » |
| T2.5 | `ExternalLink` de référence (`esm-footer-app`) + `tools/check-shared-copies.mjs` | M | P1 | À faire | | Web inchangé ; `FW-REQ-7` |

### P3 — Banc de test natif simulé

| ID | Tâche | Taille | Dépend de | État | PR / commit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T3.1 | `tools/build-native-preview.mjs` (`--candidates` / `--strict`) | M | P1 | À faire | | `egen build --platform android` |
| T3.2 | Squelette `e2e-native/` + scripts + `EGEN_E2E_CHROMIUM` | M | T3.1 | À faire | | |
| T3.3 | Scénarios E-01, E-03, E-04, E-06, E-07, E-20, E-90 + mécanisme `test.fail` | L | T3.2 | À faire | | E-02 et E-05 écrits avec leur statut initial |
| T3.4 | Job CI `e2e-native` | S | T3.3 | À faire | | ≤ 20 min |
| T3.5 | `tools/inventory-dist.mjs` (copie) + baseline native | S | T3.1 | À faire | | `D-07` (copie assumée) |

### P4 — Session et login natifs (**bloquée par `BE-REQ-1`**)

| ID | Tâche | Taille | Dépend de | État | PR / commit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T4.0 | Porte d'entrée : contrat backend validé (Q1–Q8, `D-06` → Décidée) | S | `BE-REQ-1` | **Bloqué** | | En attente du backend |
| T4.1 | `auth/` : interface `AuthStrategy` + stratégie cookie (déplacement à l'identique) | M | P3 | À faire | | Les 5 tests d'origine sans modification |
| T4.2 | Stratégie jeton (`setTokens`, schéma `zod`) | M | T4.0, T4.1 | À faire | | |
| T4.3 | Brancher dans `login.component.tsx` + erreurs + traductions + `ExternalLink` du pied de page | M | T4.2 | À faire | | `error.message` brut à ne plus afficher en natif |
| T4.4 | Déconnexion et expiration | M | T4.2 | À faire | | `clear` même hors ligne |
| T4.5 | Changement de mot de passe (`Bearer`) | S | T4.0 | À faire | | Q7 |
| T4.6 | Garde de session sous `/app/` (`esm-user-profile-app`) | S | P3 | À faire | | RC-5 |
| T4.7 | Scénarios E-10 à E-19 | L | T4.3, T4.4 | À faire | | |
| T4.8 | Passage en natif de `login` et `user-profile` (matrice + `routes.json`) | S | T4.7 | À faire | | Même PR que la fin de T4.7 |
| T4.9 | README du login (flux, erreurs, données stockées) | S | T4.8 | À faire | | |

### P5 — Ressources distantes et CSP

| ID | Tâche | Taille | Dépend de | État | PR / commit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T5.1 | Politique d'assets en vigueur (`D-08`) | S | P3 | À faire | | Déjà rédigée dans [06](multiplateforme/06-GUIDE-DEVELOPPEUR.md) §4 |
| T5.2 | Témoin positif : un asset local d'app servi sous `/app/apps/<dir>/` | S | P3 | À faire | | Si KO, **s'arrêter** (R-04) |
| T5.3 | Avatar à initiales (annuaire, navigation principale) | S | T5.1 | À faire | | Copie locale (`D-07`) |
| T5.4 | Remplacement des images (porté par les vagues de P6) | — | — | Porté par P6 | | |
| T5.5 | Contrôles en erreur (`ASSET-001`, N-09) et retrait des `test.fail` de E-02 | S | Fin de P6 | À faire | | |
| T5.6 | Conception des images protégées (§4.4 du guide) | S | `BE-REQ-3` | À faire | | Sans code |
| T5.7 | Ouvrir `FW-REQ-2` | S | — | À faire | | |

### P6 — Adaptation des apps de catégorie B (cinq vagues)

| ID | Tâche | Taille | Dépend de | État | PR / commit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T6.1.1 | `esm-appearance-app` : plein écran masqué en natif | S | P2, P3 | À faire | | E-24 |
| T6.1.2 | `esm-footer-app` : liens → `ExternalLink` | S | T2.5 | À faire | | E-21, E-92 |
| T6.1.3 | `esm-help-menu-app` : liens + 3 tests | S | T2.5 | À faire | | |
| T6.1.4 | `esm-language-app` : `reload()` (`D-15`) | S | P3 | À faire | | E-27 |
| T6.1.5 | `esm-not-found-app` : retour accueil natif, illustrations locales, Web conservé (`X-01`) | S | T5.2 | À faire | | E-03, E-02 |
| T6.1.6 | `esm-sites-app` : 4 images | S | T5.1 | À faire | | |
| T6.2.1 | `esm-home-app` : vitrine non montée + lien | S | T2.5 | À faire | | E-25 |
| T6.2.2 | `esm-annuaire-app` : `mailto:`, ≈ 38 images, presse-papiers | M | T5.3 | À faire | | E-22 |
| T6.3.1 | `esm-informations-app` : ≈ 40 images, `publicBaseUrl` (`D-16`) | L | T5.1, V-6 | À faire | | E-23 |
| T6.4.1 | `esm-primary-navigation-app` : lien, avatars, son, presse-papiers | M | T5.3, R-07 | À faire | | Coordination TopBar |
| T6.5.1 | `esm-ai-assistant-app` : voix désactivée, lien, canal WebSocket | M | T2.5 | À faire | | E-05, E-26 |
| T6.5.2 | `FW-REQ-6` si E-05 confirme le blocage | S | E-05 | À faire | | Sinon assistant déclaré web seulement |

### P7 — Expérience mobile

| ID | Tâche | Taille | Dépend de | État | PR / commit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T7.1 | Profil d'usage et seuils validés | S | Vague 4 | À faire | | [07](multiplateforme/07-TESTS-ET-CI.md) §5 |
| T7.2 | Audit automatisé (E-30, E-32, E-33) + rapport | M | T7.1 | À faire | | |
| T7.3 | Corrections barre supérieure et rails | L | T7.2, `FW-REQ-1` | À faire | | Sous-tâches issues du rapport |
| T7.4 | Corrections des autres apps | M | T7.2 | À faire | | |
| T7.5 | Clavier virtuel et orientation (conception ; test en P9) | S | T7.3 | À faire | | P9-12, P9-13 |
| T7.6 | Accessibilité de base (E-34) | M | T7.2 | À faire | | `@axe-core/playwright` |
| T7.7 | Mesure de démarrage et règle de non-régression | S | T7.4 | À faire | | `D-10` |

### P8 — Livraison vers les distributions

| ID | Tâche | Taille | Dépend de | État | PR / commit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T8.1 | `tools/check-pack.mjs` (`PACK-001` à `PACK-005`) | M | P6 | À faire | | |
| T8.2 | `LIVRAISON-DISTRIBUTIONS.md` | S | T8.1 | À faire | | `DIST-REQ-1` |
| T8.3 | Décision de partage avec les jumeaux (`D-11`) | S | T8.1 | À faire | | |
| T8.4 | Publication à blanc | S | T8.1 | À faire | | |
| T8.5 | `NOTES-DE-VERSION.md` | S | T8.4 | À faire | | |

### P9 — Validation sur appareil

| ID | Tâche | Taille | Dépend de | État | PR / commit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T9.1 | Matrice d'appareils et versions minimales (V-7) | S | P8 | À faire | | Décision produit |
| T9.2 | Exécution des parcours P9-01 à P9-20 | L | `HOST-REQ-*`, `egen-mobile` | À faire | | |
| T9.3 | Procès-verbaux et traitement des écarts | M | T9.2 | À faire | | `docs/multiplateforme/pv/` |
| T9.4 | Trancher `D-15`, H-07 et autres décisions d'appareil | S | T9.2 | À faire | | |

## 4. Procédure type d'une tâche (à suivre pour chaque ligne du §3)

1. **Lire** le point de reprise, la fiche de la tâche dans [04](multiplateforme/04-PLAN-PHASES.md) et, pour une app, sa fiche dans [03](multiplateforme/03-CLASSIFICATION-APPS.md) §6.
2. **Réserver** : passer la ligne à « En cours (branche `feat/mp-<id>-<mot-clé>`) » **dans un commit sur `main`** (évite le travail en double).
3. **Coder** en respectant le [guide](multiplateforme/06-GUIDE-DEVELOPPEUR.md) ; écrire les **tests d'abord** pour le comportement Web (non-régression nommée `Web :`).
4. **Vérifier en local** : `yarn lint`, `yarn test`, `yarn verify`, et selon la phase `yarn verify:platforms`, `yarn build:native-preview && yarn e2e:native`.
5. **Versionner** : incrémenter `version` de l'app modifiée ; note `.changeset/<nom>.md` (`D-19`).
6. **PR** titrée `feat(multiplateforme): T<id> <résumé>` (types admis : `feat`, `fix`, `chore`, `docs`, `test`) ; cases du modèle de PR cochées.
7. **Attendre la CI verte**, fusionner, puis **mettre à jour ce fichier** (état « Fait », PR, commit, décisions, pièges) — dans la même PR que le code si possible.
8. **Enchaîner** sur la tâche suivante de la phase sans attendre.

Si la tâche est **bloquée** par une dépendance externe : passer la ligne à « Bloqué (raison) », ne **jamais** contourner (principe P-10), et passer à une tâche non dépendante.

## 5. Pièges déjà rencontrés (à ne pas refaire)

- **`ConfigurableLink` n'est pas un lien externe.** En Web, `navigate({ to: 'https://…' })` fait `window.location.assign` : le SPA est quitté dans le **même onglet**. Pour remplacer
  `<a target="_blank">`, utiliser `ExternalLink` (Web inchangé, natif via `navigate`). Voir `D-21` et T2.5.
- **`createMockPlatform` n'est pas exporté par le paquet réel** `@egen-civitas/esm-framework` ; il vient de `@egen-civitas/esm-framework/mock`. Et `isNativePlatform` y est la **vraie** fonction : simuler le natif par `window.egenTarget = 'android'`.
- **Un mock partiel d'`@egen-civitas/esm-framework` sans `isNativePlatform`** fait passer un test natif « à tort » (R-18).
- **La publication des apps dépend du champ `version`** (`npm publish --tolerate-republish` ignore une version déjà publiée) : sans incrément, rien n'est publié. `.changeset/` n'est pas consommé par un outil (24 notes anciennes).
- **`frameworkRange` ne vient que du peer `@egen-civitas/esm-framework`** (pas des autres peers) ; il doit valoir `^4.1.0` dans les 26 apps.
- **`npm view` peut rester en cache** : pour vérifier une publication, lire `https://registry.npmjs.org/<paquet>` (`dist-tags.latest`).
- **`img-src` de la CSP native n'autorise pas l'origine de l'API** et un jeton `Bearer` ne peut pas authentifier un `<img>` : images protégées par `egenFetch` + `blob:`.
- **`connect-src` couvre probablement `https:` mais pas `wss:`** : le canal WebSocket de l'assistant est à vérifier en CSP réelle (E-05).
- **Le framework filtre par app seulement** : une partie web seulement d'une app se neutralise à l'exécution et se charge paresseusement.
- **`login.component.tsx:264` affiche `error.message` brut** : en natif, tout message passe par la table d'erreurs de [05](multiplateforme/05-CONTRAT-SESSION-LOGIN.md) §5.
- **`.github/copilot-instructions.md` décrit une structure disparue** (framework, shell et outillage ne sont plus dans ce dépôt) : ne pas s'y fier pour l'arborescence.
- **La réforme TopBar est terminée** (T1→T12, `docs/SUIVI-REFORME-TOPBAR.md`) : la TopBar est un squelette neutre, ses éléments sont des apps (`launcher`, `navigation`, `search`, `side-panel`…) qui injectent une extension dans `topbar-slot` avec `meta.topbar`. Lire ce suivi avant d'ajouter un élément à la TopBar.
- **Les échecs de tests/typecheck anciens existent** (suivi TopBar §6, hooks ignorés par `--no-verify`) : mesurer la baseline (R0.1) avant d'accuser une régression ; comparer à `main`.
- **Un poste sans accès au CDN de Playwright** : `EGEN_E2E_CHROMIUM` avec un Chromium obtenu par `@sparticuz/chromium`.
- **Fichiers partagés avec les jumeaux** (`tools/shared-paths.txt` : `.github`, `.eslintrc`, `turbo.json`, `tools/serve-prod.mjs`…) : toute modification est une PR dédiée « à synchroniser » (R-10).

## 6. Dettes et décisions en attente

**Décisions à valider** (détail et responsables dans [08](multiplateforme/08-DECISIONS-ET-RISQUES.md) §5) :

| # | À valider | Avant |
| --- | --- | --- |
| V-1 | Périmètre natif (19 apps) | P1 |
| V-2 | `check-version-bump` bloquant | Fin de P1 |
| V-3 | **Contrat d'authentification (`D-06`, `BE-REQ-1`)** | **Début de P4** |
| V-4 | Tenant natif fixé au build (`D-09`) | P3 |
| V-5 | Budget de taille chiffré (`D-10`) | Fin de P3 |
| V-6 | Nom et origine de `publicBaseUrl` (`D-16`) | Vague 3 |
| V-7 | Versions minimales Android/iOS | P9 |
| V-9 | `D-15` (rechargement) | Fin de P9 |
| V-10 | `e2e-native` vérification requise | Après 3 passages verts |

**Demandes externes** :

| ID | Objet | État |
| --- | --- | --- |
| FW-REQ-1 | Zones sûres (`viewport-fit=cover`) | À ouvrir (haute) |
| FW-REQ-7 | Composant `ExternalLink` | À ouvrir (haute) |
| FW-REQ-2, 3, 6 | CSP `img-src` / exclusion des `.map` / `wss:` | À ouvrir (moyenne) |
| FW-REQ-4, 5 | Filtre fin / image authentifiée | À ouvrir (basse) |
| BE-REQ-1 | Contrat d'authentification | **À demander** (bloque P4) |
| BE-REQ-2, 3 | CORS / fichiers protégés | À demander |
| HOST-REQ-1 à 4 | Service sous `/app`, capacités, rafraîchissement, jetons | `egen-mobile` n'existe pas |
| DIST-REQ-1 | Consommation de `list-apps` | `egen-distributions` n'existe pas |

**Dettes connues** : 3 apps sans test (`character-factory`, `help-menu`, `tenant-routing`) ; `esm-quick-access-app` : **elle existe toujours** (seul un bouton mort de la TopBar a été supprimé) ; défaut Web possible du 404 (F-24) ;
`.changeset/` : 24 notes anciennes non consommées ; données de démonstration embarquées (F-18, H-05).

**Compteurs à relever en fin de phase** : nombre de tests par niveau ; liste des `test.fail` restants ; nombre d'avertissements N-0x ; nombre de constats `ASSET-001` ; apps `nativePending` restantes (19 au départ).

## 7. Prompt de reprise (à coller au début de la prochaine session)

> Tu reprends le programme « Core multiplateforme » du dépôt `Frontend-esm-core` (framework : `Frontend-esm-framework`, **on ne modifie pas le framework** ici : on ouvre des `FW-REQ-*`).
> Lis, dans cet ordre : `docs/SUIVI-MULTIPLATEFORME.md` (point de reprise, **puis §8 Principes de test**), `docs/multiplateforme/README.md`, `04-PLAN-PHASES.md` (fiche de la tâche), `06-GUIDE-DEVELOPPEUR.md`,
> et la fiche de l'app dans `03-CLASSIFICATION-APPS.md`. Règles non négociables : le Web ne change pas ; aucun jeton dans le WebView ; aucune ressource distante en natif ;
> « fait » = fusionné avec CI verte ; incrémenter `version` de l'app modifiée (publication manuelle) ; mettre à jour le suivi dans la même PR.
> Procédure : réserver la tâche dans le suivi, coder avec tests Web + natif, `yarn verify`, PR `feat(multiplateforme): T<id> …`, attendre la CI, fusionner, mettre à jour le suivi, enchaîner.
> Le jeton GitHub ne doit **jamais** être écrit dans un fichier ni dans un commit ; il se transmet à la session et se révoque ensuite.
> Commandes : `yarn install`, `yarn build`, `yarn verify`, `node tools/check-platforms.mjs`, `yarn build:native-preview`, `yarn e2e:native` (poste sans CDN : `EGEN_E2E_CHROMIUM`).
> Si une dépendance externe manque (backend, Host, distributions), marque la tâche « Bloquée », ne contourne pas, et passe à la suivante.

## 8. Principes de test et mode opératoire

Ce § est la **référence pratique** pour continuer sans rien redécouvrir : les tests sont exécutés **en local par l'agent qui développe**, avant chaque PR. Les niveaux et le catalogue complet des scénarios sont dans [07](multiplateforme/07-TESTS-ET-CI.md) ; les règles de codage dans [06](multiplateforme/06-GUIDE-DEVELOPPEUR.md) §8.

### 8.1 Principes (à appliquer à chaque tâche)

1. **Un test = une promesse observable**, formulée du point de vue de l'utilisateur ou du contrat (« le clic sur l'e-mail ouvre la messagerie »), jamais du point de vue de l'implémentation.
2. **Rouge puis vert** : écrire le test, **le voir échouer pour le bon motif** (message d'échec lu), puis écrire le correctif, puis le voir passer. Un test jamais vu rouge ne prouve rien.
3. **Deux tests au minimum par changement de comportement** : un **`Web :`** (non-régression : le Web ne change pas) et un **`Natif :`** (le nouveau comportement). Le titre porte le préfixe pour qu'on puisse les filtrer : `yarn workspace @egen/<app> test -t "Web :"`.
4. **Simuler le natif** par `window.egenTarget = 'android'` (nettoyer dans `afterEach` avec `delete window.egenTarget`) ; capacités par `createMockPlatform` importé de `@egen-civitas/esm-framework/mock` (**pas** du paquet réel). Un mock partiel d'`@egen-civitas/esm-framework` doit inclure `isNativePlatform`.
5. **Aucun réseau réel, aucune attente fixe** (`waitForTimeout` interdit) : on attend un état observable (`waitFor`, `findBy…`, `expect.poll`).
6. **Défaut connu ⇒ `test.fail(true, '<F-xx> → <T…>')`** avec référence de tâche ; quand le défaut est corrigé le test devient rouge et **oblige** à retirer l'annotation (§8.3).
7. **Un test instable est un bogue** : on le diagnostique ; on ne relance jamais « jusqu'à ce que ça passe ».
8. **Terminé** = test écrit, vu rouge, vu vert, **lint et typecheck de l'app verts**, CI verte, suivi mis à jour.

### 8.2 Comment formuler un test (modèle « Étant donné / Quand / Alors »)

```ts
describe('ExternalLink', () => {
  afterEach(() => { delete (window as any).egenTarget; vi.clearAllMocks(); });

  // Étant donné le Web, quand on rend un lien externe, alors il garde un nouvel onglet sécurisé
  it('Web : le lien garde target="_blank" et rel="noopener noreferrer"', () => {
    render(<ExternalLink to="https://exemple.ga">Docs</ExternalLink>);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // Étant donné le natif, quand on clique, alors l'URL part vers le Host et la page ne change pas
  it('Natif : le clic appelle navigate avec l’URL et ne navigue pas dans le WebView', async () => {
    (window as any).egenTarget = 'android';
    render(<ExternalLink to="https://exemple.ga">Docs</ExternalLink>);
    await userEvent.click(screen.getByRole('link', { name: 'Docs' }));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith({ to: 'https://exemple.ga' });
  });
});
```

Règles de formulation : titre en **français**, au présent, **sujet + comportement** ; préfixe `Web :` ou `Natif :` ; une seule idée par `it` ; l'assertion principale porte sur **ce que voit l'utilisateur ou ce que reçoit le Host**, pas sur un détail interne. Pour un scénario de banc natif : identifiant du catalogue en tête (`E-22 …`).

Contrôle de non-stockage d'un secret : `const setItem = vi.spyOn(Storage.prototype, 'setItem'); … expect(setItem.mock.calls.flat().join(' ')).not.toContain('SECRET')`.

### 8.3 Comment avancer dans la liste des tests à faire

1. La liste des tests à écrire = **catalogue de [07](multiplateforme/07-TESTS-ET-CI.md) §4.3** (E-01 … E-94) + les tests unitaires exigés par chaque fiche d'app ([03](multiplateforme/03-CLASSIFICATION-APPS.md) §6, « Tests à ajouter »).
2. Prendre la **tâche** du §3 (pas un test isolé) ; ses tests sont listés dans sa fiche de [04](multiplateforme/04-PLAN-PHASES.md).
3. Écrire d'abord les tests (rouges), puis le code (verts). Pour un défaut déjà connu au catalogue : le test existe déjà avec `test.fail` ; **le retirer** dans la PR qui corrige.
4. Après la PR : relever les **compteurs** (§6) dans ce fichier : nombre de tests par niveau, `test.fail` restants, avertissements N-0x, constats `ASSET-001`, apps `nativePending`.
5. Si un test révèle un défaut **nouveau** : ouvrir un constat `F-xx` daté dans [02](multiplateforme/02-ETAT-DES-LIEUX.md), ne pas élargir la PR.

### 8.4 Séquences de commandes (à la racine du dépôt `Frontend-esm-core`)

**Séquence 0 — préliminaire (une fois par poste)** :

```bash
corepack enable                      # Yarn 4.10.3 (champ packageManager)
yarn install --immutable             # long (>5 min sur un poste neuf) ; ne doit rien modifier de yarn.lock
yarn build                           # turbo : construit toutes les apps (long)
cp example.env .env                  # seulement si on lance des serveurs avec .env (valeurs d'exemple, ne jamais viser un serveur externe)
```

Résultat attendu : `yarn install --immutable` sort avec le code 0 ; `yarn build` construit chaque app dans `packages/apps/<app>/dist/` (fichier `egen-<nom>.js`).

**Séquence A — fumée Web de production locale** (test de non-régression de référence) :

```bash
yarn build:prod                                       # construit les apps + précompresse
# (processus long : le laisser tourner pendant les vérifications suivantes)
PORT=8080 yarn start:prod                             # défauts : PORT=8080, EGEN_SPA_PATH=/egen-civitas/spa, EGEN_API_URL=/egen-civitas
#   avec un backend local : EGEN_BACKEND=http://localhost:8081 PORT=8080 yarn start:prod
# vérifications (autre commande, pendant que le serveur tourne)
curl -s http://localhost:8080/egen-civitas/spa/importmap.json | python3 -c "import sys,json;print(len(json.load(sys.stdin)['imports']))"   # au moins une entrée par app
curl -s http://localhost:8080/egen-civitas/spa/routes.registry.json | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"          # une entrée par app
# navigateur : http://localhost:8080/egen-civitas/spa/   → la page de connexion s'affiche
```

Variables de `serve-prod` : `PORT`, `HOST`, `EGEN_SPA_PATH`, `EGEN_API_URL`, `EGEN_BACKEND`, `EGEN_BRAND_DIR`, `EGEN_OFFLINE`, `EGEN_TENANT_*`, `EGEN_DEV_NO_AUTH`.

**Séquence B — développer une app (rechargement à chaud)** :

```bash
# processus long : l'URL du serveur est affichée par la commande (ne pas supposer le port)
yarn start --sources packages/apps/esm-login-app
# tests de la même app en continu (autre commande)
yarn workspace @egen/esm-login-app test:watch
```

**Séquence C — vérifier UNE app** :

```bash
yarn workspace @egen/<app> test                       # tests unitaires (Vitest, TZ=UTC)
yarn workspace @egen/<app> test -t "Web :"            # seulement les non-régressions Web
yarn workspace @egen/<app> test -t "Natif :"          # seulement les tests natifs
yarn workspace @egen/<app> lint                       # ESLint (src, ts/tsx)
yarn workspace @egen/<app> typescript                 # tsc
```

**Séquence D — vérification globale** : `yarn verify` (= `check-nav-routes` puis `turbo run lint test typescript`). **Comparer à `BASELINE.md`** : il peut exister des échecs préexistants (suivi TopBar §6) ; seuls les échecs **nouveaux** comptent.

**Séquence E — dépendances** : `yarn deps:egen:check` (compare les plages `@egen-civitas/*` à npm) ; `yarn deps:egen` pour les aligner. Vérifier une publication : `https://registry.npmjs.org/<paquet>` (le cache de `npm view` peut mentir).

**Séquence F — e2e Web existant (Docker, backend réel)** : `yarn test-e2e`.

**Séquence G — outils et banc natif (n'existent qu'après les phases indiquées)** :

```bash
node tools/check-platforms.mjs            # après T1.2
node tools/list-apps.mjs --platform android --production --names   # après T1.3
yarn lint                                 # règles natives N-01…N-10, après T2.1
node tools/check-remote-assets.mjs        # après T2.2
node tools/check-shared-copies.mjs        # après T2.5
yarn build:native-preview                 # après T3.1 (artefact natif d'essai)
yarn e2e:native                           # après T3.3 (banc Playwright + faux Host)
yarn e2e:native --grep "E-1[0-9]"         # un sous-ensemble de scénarios
EGEN_E2E_CHROMIUM=/chemin/chromium yarn e2e:native   # poste sans accès au CDN de Playwright (Chromium via @sparticuz/chromium)
```

### 8.5 Dépannage rapide

| Symptôme | Cause probable | Action |
| --- | --- | --- |
| `yarn install --immutable` échoue | `yarn.lock` non à jour après un changement de `package.json` | Lancer `yarn install` (sans `--immutable`) **dans une PR dédiée** et committer `yarn.lock` |
| `yarn start:prod` : page blanche | Les apps ne sont pas construites | Séquence A : `yarn build:prod` d'abord |
| 404 sur `/egen-civitas/spa/…` | Mauvais `EGEN_SPA_PATH` | Utiliser le chemin par défaut ou aligner l'URL |
| Un test passe sans `window.egenTarget` | Mock partiel sans `isNativePlatform` | §8.1 point 4 |
| `yarn verify` rouge sur un fichier non touché | Échec préexistant | Comparer à `BASELINE.md` (R0.1) |
| Publication d'une app ignorée | `version` inchangée | Incrémenter `version` (D-19) |
