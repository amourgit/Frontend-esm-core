# Parcours complet de la chaîne « système de design » — compréhension à valider

> **Statut : ACTUEL — validé par le propriétaire (2026-11-22).** Document de référence de la chaîne. L'avancement et les tâches restantes sont dans `SUIVI.md`.
> Il remplace l'ancien `PLAN.md` (supprimé). Sources : `ajustement-reforme-configuration.md` (framework, §3 à §12), les consignes données au fil de la conversation.

## 0. Les ordres que ce document applique

1. **Nettoyer d'abord**, coder ensuite : supprimer totalement ce qui n'est pas cohérent avec la cible, sans cohabitation des deux systèmes.
2. **Si je doute, je pose la question** ; je ne tranche pas en silence et je ne laisse aucun ordre sans réponse.
3. **Le frontend ne parle qu'au backend du Core.** C'est le backend qui parle aux systèmes de design. Le frontend ne communique jamais directement avec TokiForge, Tweakcn, Penpot ni aucune URL libre.
4. **Des contrats (formats, API) plutôt que des adaptations rigides** : chaque brique doit pouvoir être remplacée sans recoder les autres ; la chaîne doit être auditable à chaque étape.
5. **Le format de thème est celui de Tweakcn** (déjà déployé) ; il pourra s'enrichir (métadonnées, clés) plus tard, par évolution contrôlée.
6. **TokiForge est un projet local autonome**, non joignable par le framework (publié sur npm). C'est le Core déployé qui le joint.
7. **Un push sur `main` du framework publie sur npm automatiquement** : on ne pousse que du code sûr.
8. **Effets de verre / panneaux : supprimés.** Variables dérivées (échelles, nuances) : calculées, d'accord.
9. **On travaille sur `main`** (core et framework).

## 1. Qui fait quoi

| Acteur | Responsabilité | Ne fait pas |
|---|---|---|
| **Concepteur / administrateur** (humain) | Conçoit dans Penpot et Tweakcn ; valide et publie les versions ; fixe les règles de personnalisation | — |
| **EGEN Kernel** | Déploie et supervise Penpot, Tweakcn, TokiForge et leurs services d'intégration, chacun avec son état et son cycle de vie | Gérer les thèmes, interpréter les configurations |
| **Penpot** | Conception des interfaces et pages ; association des éléments conçus aux **vrais composants ESM** | Stocker/distribuer les thèmes ; exécuter les applications |
| **Tweakcn** (EGEN Theme Studio) | Création et personnalisation visuelle des thèmes (couleurs, polices, rayons, ombres) ; garde ses propres données | Distribuer ou appliquer les thèmes |
| **Système d'intégration CIVITAS** | Récupère les productions de Penpot/Tweakcn, les associe aux composants ESM, les transmet à TokiForge dans un format exploitable ; **enregistre avant d'annoncer** | Concevoir ; appliquer |
| **TokiForge — service** | Reçoit, **valide**, **versionne**, stocke, distingue brouillon/publié, garde l'historique, gère les **couches de thèmes** (général > organisation/tenant > application > utilisateur autorisé), distribue | Concevoir ; gérer l'identité des utilisateurs ; être appelé par un navigateur |
| **TokiForge — runtime** (dans le framework) | **Applique** la configuration reçue dans l'application (variables CSS, mode clair/sombre, surcharges) ; refuse toute valeur dangereuse | Appeler le réseau de lui-même ; connaître TokiForge |
| **Framework ESM — composants** | Composants Tailwind/TSX avec variantes ; **consomment uniquement les tokens** (variables CSS) ; chaque application peut étendre un composant précis avec des classes Tailwind | Contenir des valeurs de thème |
| **Core — backend** | Seul interlocuteur du frontend ; identifie le tenant et l'utilisateur **par la session** ; détient la clé TokiForge ; appelle TokiForge ; thème de repli | Faire confiance à une identité envoyée par le navigateur |
| **Core — frontend** (shell + apps) | Demande « son » thème au backend ; l'applique via le runtime ; accuse réception ; envoie les souhaits de personnalisation de l'utilisateur au backend | Parler à un autre système que le backend du Core |
| **Utilisateur final** | Peut personnaliser son thème dans le cadre des règles autorisées | — |
| **CI npm** (framework) | Publie automatiquement les paquets du framework sur `main` | — |

## 2. Parcours A — le thème, de la conception à l'écran

Chaque étape : qui agit · quoi · format · frontière · **état aujourd'hui**.

**A1. Déclaration de l'application** *(hors TokiForge)* — ESM, §4 du document : identité, routes, menus, permissions. Une application peut exister avant que ses pages soient conçues. État : relève d'ESM, non traité ici.

**A2. Création du thème** — le concepteur, dans **Tweakcn**. Les données restent chez Tweakcn. *État : fait (Tweakcn déployé).*

**A3. Transmission à TokiForge** — du Tweakcn déployé vers le service TokiForge, **de serveur à serveur** : *tirage planifié* (`GET /api/v1/themes?updated_since`) ou *envoi* (`POST /v1/ingest/tweakcn`). Les données sont **enregistrées avant** toute annonce. Format : `{ light, dark }`, 44 clés par mode, tel que Tweakcn le produit. *État : construit et testé (faux Tweakcn). Non déployé par Kernel.*

**A4. Réception, validation, versionnement** — TokiForge. Grammaire stricte des valeurs (couleur, dimension, police…, aucune injection CSS), `schemaVersion`, **provenance** (source, identifiant d'origine, date, adaptateur). Une version est immuable, empreinte SHA-256, statut **brouillon**. Un thème invalide ou dangereux est refusé et ne remplace jamais une version existante. *État : fait, testé.*

**A5. Revue et publication** — un humain autorisé (portée `publish`). Une seule version publiée par thème ; l'ancienne est archivée ; retour arrière possible (nouvelle version). Contraste AA exigé en option. *État : API faite. **Aucune interface d'administration** n'existe (voir doute D6).*

**A6. Affectation** — TokiForge. Un thème est affecté à un périmètre : `global`, `tenant:<id>`, `app:<id>`. Deux modes (§8 du document) : **version épinglée** (l'application démarre avec un ensemble identifié et reproductible) ou **dernière version publiée** (évolution sans redéploiement). *État : fait, testé.*

**A7. Annonce d'une nouvelle version** — TokiForge émet `theme.published` (flux SSE, PostgreSQL `LISTEN/NOTIFY`) **vers le backend du Core uniquement**. Le backend relaie au navigateur un simple signal « recharge » (sans détail). *État : émission côté TokiForge faite ; **relais côté backend non fait**.*

**A8. Démarrage d'une page** — le **frontend** demande son thème **au backend du Core** (`GET /api/theme?app=…`). Le backend lit tenant et utilisateur **dans la session**, appelle TokiForge (`GET /v1/resolve?app&tenant&subject`) avec sa clé serveur, et renvoie le thème effectif. Précédence : affectation `app` > `tenant` > `global`, puis surcharges de l'utilisateur. Cache par `ETag`. *État : TokiForge fait ; backend de référence (harnais d'essai) fait ; **vrai backend du Core : non branché**.*

**A9. Application** — le **runtime** (framework) valide puis écrit le CSS (`:root`, `.dark`) ; les composants lisent les variables via les noms sémantiques Tailwind. Si la valeur est invalide, il refuse **avant** d'écrire et garde la version qui fonctionne (§8 : une configuration invalide ne remplace jamais une version fonctionnelle). *État : runtime construit et testé dans le dépôt TokiForge ; **le framework utilise toujours l'ancien moteur**.*

**A10. Accusé d'application** — le frontend dit au backend quelle empreinte il a réellement appliquée ; le backend le transmet à TokiForge (`POST /v1/applied`). Permet de savoir ce qui tourne réellement, par application et tenant. Un thème de repli n'est pas rapporté. *État : TokiForge et harnais faits.*

**A11. Personnalisation par l'utilisateur** — l'utilisateur exprime son souhait **au backend** (`PUT /api/me/theme`) ; le backend le transmet à TokiForge avec la portée `subject`. Garde-fous : clés autorisées, plafond, **aucune nouvelle régression de contraste AA**, grammaire de sécurité ; refiltrage à chaque résolution. Les refus sont relayés à l'utilisateur. Le navigateur n'a jamais la clé. *État : fait côté TokiForge et harnais.*

**A12. Traçabilité** — journal d'audit de TokiForge + provenance par version + accusés. *État : fait.*

**Dégradation maîtrisée (§12 : indépendance et continuité).** TokiForge injoignable : le backend sert le dernier thème connu, sinon un **thème de repli embarqué** (format Tweakcn) ; le Core démarre toujours. Une application développée en code doit pouvoir fonctionner sans TokiForge. *État : fait dans le harnais.*

## 3. Parcours B — interfaces et pages (Penpot)

Décrit par le document (§3.2, §5, §7) mais **non traité par ce que j'ai construit** :
1. Le concepteur crée les pages dans **Penpot**, en s'appuyant sur les composants **réellement disponibles** dans ESM (propriétés, variantes).
2. Le **système d'intégration CIVITAS** récupère la production, l'associe aux composants ESM et la transmet à TokiForge.
3. **TokiForge valide** la configuration contre le catalogue des composants ESM réellement disponibles ; versionne ; publie.
4. Une page est associée à une **route déclarée** de l'application (la route relève de la déclaration, le contenu visuel relève de Penpot/TokiForge).
5. Une configuration invalide ou incompatible ne remplace jamais une version fonctionnelle.

*État : **rien de construit** — ni catalogue de composants ESM, ni format de configuration d'interface, ni intégration Penpot. Je ne l'inventerai pas : voir doute D1.*

## 4. Les deux modes d'application (§8)

| Mode | Mécanisme prévu | État |
|---|---|---|
| **Au déploiement** : l'application démarre avec des versions identifiées de thèmes/interfaces, reproductibles | affectation avec **version épinglée** (`assignments.version`) | thèmes : fait ; interfaces : non |
| **Après la mise en service** : une nouvelle version publiée est prise en compte sans redéploiement | affectation « dernière publiée » + signal temps réel relayé par le backend + `ETag` | thèmes : TokiForge fait, **relais backend à faire** |

Les changements de **présentation seule** s'appliquent directement ; les changements de **structure** peuvent exiger un rechargement (déterminé par ESM, pas par TokiForge).

## 5. Qui parle à qui (frontières réseau)

| De → Vers | Autorisé ? | Comment c'est imposé |
|---|---|---|
| Navigateur → **backend du Core** | **oui, seul canal** | CSP `connect-src 'self'` côté Core *(à faire)* |
| Navigateur → TokiForge / Tweakcn / Penpot / URL libre | **non** | TokiForge refuse toute requête portant `Origin` ou `Sec-Fetch-Site` *(fait, testé, commité `4df594d`)* ; CORS vide ; **suppression de `window.egenThemeUrls`** *(à faire)* ; TokiForge non exposé hors réseau privé *(à faire côté déploiement)* |
| Backend du Core → TokiForge | oui, clé serveur (`read`, `subject`, `report`) | clé jamais renvoyée au navigateur (testé) |
| TokiForge → Tweakcn (pull) | oui, jeton `themes:read` | configuration du service |
| Tweakcn → TokiForge (push) | oui, portée `ingest` | serveur à serveur |
| Concepteur → Tweakcn / Penpot | oui (outils de conception, applications séparées, leur propre authentification) | hors applications ESM |
| Framework (paquet npm) → TokiForge | **non** (TokiForge n'est pas joignable) | le framework ne contient que le runtime et un thème de repli |

Polices : un thème qui référence une police hébergée par un tiers ferait parler le navigateur à ce tiers. *Doute D8.*

## 6. Ce qui est fait et ce qui ne l'est pas

| Élément | État | Où |
|---|---|---|
| Faille d'injection CSS corrigée (grammaire stricte, garde en profondeur) | fait, testé | `egen-tokiforge` `f131af5` |
| Contrat de thème (format Tweakcn), parité à l'octet avec le générateur de Tweakcn, projection DTCG sans perte | fait, testé | `egen-tokiforge` |
| Runtime navigateur + adaptateur React | fait, testé | `egen-tokiforge` (pas dans le framework) |
| Service TokiForge (réception, validation, versions, publication, couches, surcharges, DTCG, accusés, audit) | fait, testé (78 tests) | `egen-tokiforge` `b88101f` |
| Refus des requêtes de navigateur par TokiForge | fait, testé | `egen-tokiforge` `4df594d` |
| Backend de référence du Core + essai de bout en bout (276 tests) | fait — **harnais d'essai, pas de production** | `egen-tokiforge` |
| Relais des événements par le backend | **non fait** | — |
| Vrai backend du Core branché à TokiForge | **non fait** | — |
| Ancien moteur de thèmes retiré ; framework sur le nouveau runtime | **non fait** (chantier de bascule) | framework `main` |
| Documentation alignée sur la réforme | **non fait** (§7) | core, framework |
| Configurations d'interface, catalogue de composants, intégration Penpot | **non fait, non conçu** | — |
| `docker build` du service | non exécuté (pas de Docker dans mon environnement) | — |
| Déploiement par Kernel | non fait | — |

## 7. Nettoyage à faire AVANT tout nouveau code

Inventaire mesuré sur `main`.

**Framework `main`**
- Package **`packages/framework/esm-theme`** entier : moteur (`engine`, `loader`, `inject`, `flatten`, `deepMerge`, `schema`, `singleton`, `types`), `theme.default.json`, tests, README, CHANGELOG. 15 fichiers du dépôt référencent `@egen-civitas/esm-theme`.
- **Shell** `esm-app-shell` : `src/run.ts` (`themeUrls`, `window.egenThemeUrls`, `setupThemeEngine`, `applyAppThemeOverride`), `src/index.ejs`, `rspack.config.js`, `package.json`, instantané de test `bootstrap.test.ts.snap`.
- **Styleguide** `esm-styleguide` : `top-bar.component.tsx` et les **42 fichiers / 816 occurrences / 134 variables** de l'ancien contrat (`--colors-*`, `--typography-*`, `--border-radius-*`, `--transitions-*`, `--panel-*`…), dont le verre/translucide/panneaux (69 occurrences) à supprimer.
- **Preset Tailwind** `tailwind-preset` : le pont `--color-background: var(--colors-surface-background, …)` ; README et `package.json`.
- **Documentation qui décrit l'ancien système comme actuel** : `esm-theme/README.md`, `tailwind-preset/README.md`, `README.md`, `MIGRATION.md`, `docs/EGEN-FRAMEWORK-DEV.md`, `docs/PLAN-RETRAIT-CARBON-SCSS.md`, `docs/baseline-2026-11.md`, `docs/stockage.md`, `docs/refonte-systeme-design.md` (vision **sans statut**). Le document de réforme **n'est pas sur `main`**.

**Core `main`**
- **Applications qui appellent l'ancien moteur** : `esm-appearance-app` (`getThemeEngine`, `getThemeState`, `toggleThemeMode`), `esm-settings-app` (idem, section Apparence + son test), `esm-login-app` (`getThemeState` et attribut `data-theme`, alors que le nouveau runtime utilise la classe `.dark`).
- **Système de tenants** : `registerTenantThemeApplier` + `applyAppThemeOverride('tenant-<id>')`, configuration par tenant `themeUrl` et `themeOverride` (README du core).
- **Dépendance `@egen-civitas/esm-theme` déclarée par 10 apps** (`package.json`) et un commentaire de `footer.scss`.
- **Documentation** : `README.md` (thème par tenant `themeUrl: '/themes/<tenant>.json'`), `docs/guide-composants-et-theme.md`, `docs/analyse-esm-tenant.md`, `docs/analyse-separation-framework.md`, `docs/guide-agenda-egen-dayfront.md`, `docs/integration-apps/03` et `04`, `docs/multiplateforme/02` et `03`.

**TokiForge (`egen-tokiforge`)** — code hérité de l'amont **non utilisé** (analyseur de fichiers, exportateurs, gestionnaire de plugins, support IDE, comparaison Figma, CI/CD, etc.) à supprimer ou à justifier par un usage.

**Règle d'étiquetage des documents** (à appliquer à *chaque* document de thème) : en tête, un statut explicite — `ACTUEL`, `OBSOLÈTE → remplacé par …`, ou `VISION (non réalisé)` — avec le renvoi vers la réforme. Aucun document ne décrit plus l'ancien système comme actuel.

**Contrainte à signaler (doute D9)** : l'ancien moteur ne peut pas être supprimé *avant* que le runtime le remplace, sinon le shell ne démarre plus. La suppression et le remplacement se font donc **dans un seul changement** ; tout le reste du nettoyage (documents, statuts, README, dépendances inutiles, code hérité de TokiForge) se fait **avant**.

## 8. Corrections de mes documents précédents

- L'ancien `PLAN.md` (supprimé) affirmait que « aucune app du core n'appelle l'API » de l'ancien moteur : **faux** (§7, Core). Le couplage n'est pas « concentré dans le shell et le styleguide ».
- L'ancien `PLAN.md` annonçait une clé de lecture visible dans le navigateur : **abandonné**, le frontend ne parle qu'au backend.
- Les plans `reforme-tweakcn/PLAN.md` et `reforme-character/PLAN.md` sont des journaux figés à un état ancien (tâche P0.3b du suivi) ; ils ne font pas foi.

## 9. Mes doutes — réponses attendues (je ne décide pas à ta place)

- **D1. Périmètre.** Les configurations d'**interfaces et de pages** (Penpot, catalogue de composants ESM, association page ↔ route) font-elles partie du travail **actuel**, ou seulement les **thèmes** ?
- **D2. Statut / success-warning-info.** Tu as dit « supprimer les effets de verre, etc. ». Les couleurs d'état `success`, `warning`, `info` (utilisées par les notifications, alertes, toasts) sont-elles supprimées aussi ? Je propose de les **garder comme constantes statiques** du preset, hors du thème dynamique, en attendant l'évolution du format. Confirmer ou refuser.
- **D3. Backend du Core.** Existe-t-il déjà ? Où vit-il (dépôt, technologie) ? Mon backend de référence n'est qu'un harnais d'essai.
- **D4. Chemin du frontend.** Où le shell lit-il l'adresse du backend du Core (même origine `/api/theme`, ou configuration) ?
- **D5. Tenants.** Aujourd'hui chaque tenant a un `themeUrl` / `themeOverride`. Cible : ces thèmes deviennent des affectations `tenant:<id>` dans TokiForge, et le système de tenants ne porte plus aucune URL de thème. Confirmer.
- **D6. Qui publie ?** Qui revoit et publie une version de thème, et avec quel outil ? TokiForge n'a qu'une API, pas d'interface d'administration.
- **D7. Intégration Penpot.** Direction et déclencheur : export DTCG manuel par le concepteur, ou plugin/automatisation ? Qui l'exécute ?
- **D8. Polices.** Les polices d'un thème doivent-elles être auto-hébergées (le navigateur ne parle à aucun tiers) ?
- **D9. Atomicité.** Confirmer que « remplacement du moteur + suppression de l'ancien » se fait en **un seul changement**, le reste du nettoyage passant avant.
- **D10. Mobile.** Toujours sans réponse : besoin réel à court terme ou non ? (détermine la chaîne DTCG → Style Dictionary).
- **D11. Tokens de composants.** « Configurations spécifiques aux composants », breakpoints, espacements : dans le périmètre maintenant, ou plus tard (évolution de `schemaVersion`) ?

## 10. Ordre d'exécution proposé, après ta validation

1. **Documentation** : statut en tête de chaque document concerné ; copie du document de réforme sur `main` ; correction de mes erreurs. *(aucun code)*
2. **Nettoyage hors bascule** : code hérité inutile de TokiForge ; dépendances et commentaires obsolètes.
3. **Bascule** (un seul changement par dépôt, sur branche, validé avant `main` du framework) : runtime dans le framework, suppression de l'ancien moteur, migration des 816 occurrences, des apps, du système de tenants ; suppression de `window.egenThemeUrls`.
4. **Câblage du vrai backend du Core**, relais des événements, accusés.
5. Ensuite seulement : interfaces/pages, Penpot, mobile — selon D1, D7, D10.

## 11. Éléments découverts depuis la validation

- **Penpot dans le Core** : le fork `amourgit/penpot` (branche `egen`, `EGEN.md`, `docker/egen/`) intègre Penpot comme **application externe en iframe** pour les concepteurs (sous-domaine du même site, fonction opt-in `PENPOT_FRAME_ANCESTORS`, aucun code applicatif modifié ; `docs/integration-apps/15` §6 bis). C'est l'**outil de conception dans le Core**, indépendant du chemin des tokens : l'export des tokens de Penpot (JSON DTCG natif) vers TokiForge reste à définir (**D7**).
- **Configuration publique des apps** : `EGEN_CONFIG_FILE` / `configUrls` (`docs/integration-apps/15` A10) fournit une configuration **sans secret** : candidate pour dire au shell où se trouve le backend du Core (**D4**, ouverte).
- **EGEN Kernel** : ses contrats C1 à C6 décrivent des *control planes* (identité SPIFFE, mTLS, capacités, délégation, événements) et ses documents ne mentionnent **ni TokiForge, ni Tweakcn, ni Penpot**. Le §1 de ce document (« Kernel déploie les services de design », issu du document de réforme du framework) n'est donc **pas encore décrit côté Kernel** : **D12**.
