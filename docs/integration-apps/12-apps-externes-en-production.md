# 12 — Apps externes en production : procédure et fonctionnement

**Statut : ✅ implémenté et testé** (tests automatiques `yarn test:tools` : 13/13, dont un test d'intégration réel de `serve-prod` ; essai réel de `egen assemble` 2.3.0 avec un tarball `file:` ; essai du mode distant et de la détection de dérive). Il comble l'écart **G1** et une partie de **G4/G5-prod** de [08](08-ecarts-et-recommandations.md). Les exécutions « navigateur + Shell complet » restent à faire (🟡).

## 1. Principe

Le Core récupère les bundles externes **au déploiement** (pas à chaque requête), les **valide**, fige le résultat dans un **verrou**, et `serve-prod` ne publie que ce que le verrou décrit et que la validation accepte.

```
external-apps.json ──► yarn external:sync ──► external-apps/            (ignoré par git)
 (déclaration)            │ egen assemble        ├─ <scope>-<nom>-<version>/…   bundles + routes.json
                          │ + fetch (remote)     ├─ remote/routes/<nom>.json    snapshots de routes
                          └─ validation          └─ external-apps.lock.json     verrou (SHA-256)
                                                          │
                       yarn start:prod ◄──────────────────┘   (lecture + validation à chaque démarrage / SIGHUP)
```

| Pièce | Fichier | Rôle |
| --- | --- | --- |
| Déclaration | `external-apps.json` (modèle : `external-apps.example.json`) | quelles apps, d'où |
| Récupération | `tools/sync-external-apps.mjs` | délègue à **`egen assemble`** (npm / `file:` / tarball `https:`) ; télécharge les apps distantes ; écrit le verrou |
| Validation / chargement | `tools/external-apps.mjs` | règles d'alignement, utilisé par la synchro **et** par `serve-prod` |
| Publication | `tools/serve-prod.mjs` | fusionne import map + registry, sert `<spa>/external/…`, `SIGHUP`, statut |
| Tests | `tools/external-apps.test.mjs` | `yarn test:tools` |

## 2. Deux sortes d'apps externes

| | **hosted** (hébergée par le Core) | **remote** (hébergée ailleurs) |
| --- | --- | --- |
| Déclaration | `"apps": { "<nom>": "<semver>" \| "file:<tgz>" \| "https://…tgz" }` | `"remote": [{ "name", "bundle", "routes", "version"? }]` |
| Récupération | `egen assemble` extrait `dist/` du paquet | `bundle` et `routes` téléchargés une fois |
| URL dans l'import map | `<spa>/external/<dir>/<fichier>` (servi par le Core, précompressé) | l'URL `bundle` telle quelle (**https obligatoire**) |
| Routes | `routes.json` du paquet | **snapshot figé** localement (pas de dépendance au partenaire au démarrage) |
| Intégrité | SHA-256 vérifié **à chaque démarrage** | SHA-256 mémorisé ; dérive détectée par `yarn external:check` (le navigateur charge le script lui-même : aucun contrôle à l'exécution côté Core) |
| Natif (Android/iOS) | ✅ embarquable | ⛔ non (voir 05 §4.4) |

## 2 bis. Troisième sorte : apps embarquées (`embed`, protocole v2)

> Spécification : [17](17-sdk-embed-protocole-v2.md) · plan : [18](18-plan-phases-sdk-embed.md). **Livré (phase P5) : outillage + app générique `packages/apps/esm-embed-app` (`@egen/esm-embed-app`).**

Une app embarquée est une application **autonome dans une iframe** (Next.js, Penpot, tweakcn…). Elle n'a **aucun bundle** et **aucun paquet « wrapper »** : on déclare son manifeste et ce que l'opérateur lui autorise.

```json
{
  "embed": [
    { "manifest": "https://studio.exemple.org/egen-app.json",
      "grants": { "notifications": {}, "events": { "publish": ["app.studio.*"] },
                  "extensions": { "contribute": ["topbar-nav-slot", "shell-rail-left-slot"] } },
      "limits": { "requestsPerSecond": 50 },
      "config": { "studioApi": "https://api.exemple.org" } }
  ]
}
```

| Étape | Ce qui se passe |
| --- | --- |
| `yarn external:sync` | Récupère le manifeste (URL https ou chemin local), le **valide**, l'écrit figé dans `external-apps/embed/manifests/`, inscrit dans le verrou : version, empreintes SHA-256 (figé et source), plafond approuvé, limites, `config` |
| `yarn external:check` | Détecte la **dérive** : le manifeste publié a changé depuis la synchronisation → code 1 |
| démarrage de `serve-prod` | Revérifie l'empreinte du manifeste figé, valide manifeste + plafond, refuse une **route déjà prise** (page du Core ou autre app embarquée) ou un nom déjà pris |
| registry | **Fusionne** une page par app et une extension par contribution **approuvée** (`extensionView`, `railPanel` ou `navEntry`, doc 17 §5 bis) dans le registry de l'app générique `@egen/esm-embed-app` ; publie `<spa>/embed-apps.json` (manifestes, plafonds, `config`, contributions ; `no-store`) |
| navigateur | L'app générique (`esm-embed-app`) retrouve l'entrée par la route, calcule les **grants effectifs** (`effectiveGrants` du protocole : demandé ∩ approuvé) et monte l'hôte `esm-embed-host` |

Règles : par défaut, seules les capacités d'état d'interface en lecture sont accordées (`tenant`, `locale`, `navigation`, `config`, `telemetry`, `lifecycle`) ; toute autre capacité exige **à la fois** une demande du manifeste et une approbation de l'opérateur. **Règle d'or** : identité/session, droits, thème et appels API ne font pas partie du SDK (l'app les obtient auprès de Keycloak, de ses backends, du service de thèmes) : les demander est une **erreur de validation explicite**. Ajouter un composant à un slot du Core exige l'approbation du slot (`extensions.contribute`) ; sans elle la contribution est écartée avec une réserve visible dans `external-apps.status.json`. Si l'app générique n'est pas compilée, les apps embarquées sont **rejetées** (statut visible) au lieu d'exposer des routes vides.

## 3. Règles d'alignement appliquées

**Refus** (l'app n'est jamais publiée, le reste du Core n'est pas affecté) :

| Règle | Pourquoi (preuve dans le Shell) |
| --- | --- |
| `containerDomId` inconnu | le Shell **ne démarre plus** (`finishRegisteringAllApps`) |
| `pages`/`extensions`/`workspaces`/`modals` non tableau | le registry **entier** serait ignoré (`isEgenRoutes`) |
| Nom identique à une app **interne** | une clé dupliquée **écrase** l'autre ; l'interne prime |
| SHA-256 du bundle ≠ verrou | fichier modifié après la synchronisation |
| Chemins du verrou non sûrs (`..`, séparateurs) | traversée de répertoire |
| Bundle distant en `http://` | contenu mixte bloqué (`EGEN_EXTERNAL_ALLOW_HTTP=true` pour un environnement de test) |
| Nom de paquet invalide, type d'entrée inconnu, verrou illisible | cohérence |

**Réserves** (publiée, mais signalée dans les journaux et le statut) : conteneur `var` (`slugify(name)`) ou `./start` absent du bundle · `routes.json` absent · `frameworkRange` absent · page sans `route`/`routeRegex` (ou avec `routes` au pluriel) · extension/modale incomplète · nom d'extension déjà déclaré par une autre app externe.

## 4. Procédure de déploiement

```bash
# 1. déclarer
cp external-apps.example.json external-apps.json     # puis éditer
# 2. construire le Core, récupérer les externes, précompresser
yarn build:prod
yarn external:sync          # --strict : échoue si une app est rejetée
node tools/precompress.mjs  # recompresse aussi external-apps/ (br)
# 3. servir
yarn start:prod
```

- Journal au démarrage : `[egen-prod] externes : @acme/esm-hello-app@1.0.0 [hosted] : ok`.
- **Mettre à jour une app externe sans redémarrer le Core** : modifier `external-apps.json`, relancer `yarn external:sync`, puis `kill -HUP <pid>` ✅ (rechargement à chaud, testé).
- **Contrôle périodique / CI** : `yarn external:check` (fichiers + dérive des bundles distants ; code ≠ 0 si problème).
- **Statut** : `GET <spa>/external-apps.status.json` → `{ apps:[{ name, kind, version, status, errors, warnings }] }` (`accepted` · `accepted-with-warnings` · `rejected`).
- **Strict** : `EGEN_EXTERNAL_STRICT=true` fait échouer `serve-prod` au démarrage si une app externe est rejetée (sinon : rejet journalisé, Core opérationnel).

Variables : `EGEN_EXTERNAL_DIR` (défaut `external-apps`), `EGEN_EXTERNAL_APPS` (défaut `external-apps.json`), `EGEN_EXTERNAL_STRICT`, `EGEN_EXTERNAL_ALLOW_HTTP`, `EGEN_BIN` (binaire `egen` alternatif)

Enchaînement complet entre le build et le démarrage : `yarn prepare:prod` (`tools/prepare-prod.mjs` : apps compilées → configuration runtime → `external:sync --strict` → `external:check` → précompression ; arrêt à la première erreur, code 1). Voir [15](15-scenarios-integration-externe.md), étape A7.

Configuration runtime des apps (`serve-prod`) : `EGEN_CONFIG_FILE` (fichier JSON `{ "<nom de l'app>": { … } }`, lu et validé au démarrage, servi à `<spa>/config.json`) et `EGEN_CONFIG_URLS` (fichiers supplémentaires). Détail et exemple : [15](15-scenarios-integration-externe.md), étape A10., `EGEN_IMPORTMAP_ALIASES` (`false` : n'émet pas la table d'alias des apps internes, voir 08 E2).

## 5. Ce que doit fournir l'équipe de l'app externe

Voir 05 §2–3 et le contrat de 01 §2. En pratique : un paquet npm (ou tarball) dont le dossier `dirname(browser)` contient le bundle **et** `routes.json` ; `"files": ["dist"]` ; build par `@egen-civitas/egen` (React) ou config équivalente (Vue/Angular, voir 06).

## 6. Limites connues

- Une seule version par app (une clé = une URL) ; mise à jour = nouvelle synchronisation.
- Pas de contrôle de la **forme des exports** : le contrôle du bundle est statique (présence du global et de `./start`). Il ne prouve pas que chaque `component` est exporté ; c'est le rôle d'un test de l'app (06, 09).
- Le garde-fou `frameworkRange` est évalué **dans le navigateur** par le Shell ; le Core ne le recalcule pas.
- Les apps **internes** sont lues depuis `dist/routes.json` (estampillé, `frameworkRange` actif) avec repli sur `src/routes.json` ; `EGEN_ROUTES_FROM_SRC=true` force la source (écart **G3** traité, voir 08).
- Les domaines tiers doivent autoriser le chargement (CSP du Core, `Cache-Control`/disponibilité côté partenaire) ; aucun repli si l'hôte distant est indisponible.
