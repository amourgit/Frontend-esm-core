# Analyse — Séparation `Frontend-esm-framework` / `Frontend-esm-core`

**Date de l'analyse :** 12 août 2026
**Périmètre :** les deux dépôts `Frontend-esm-core` et `Frontend-esm-framework`, clonés et scannés intégralement (arborescence, `package.json`, lockfiles, historique git).
**Méthode :** lecture exhaustive des deux repos, comparaison des versions de dépendances, tentative réelle d'installation/build pour valider (pas seulement lire) l'état de la séparation, recherche de secrets commités, vérification de la disponibilité des noms npm avant publication.

---

## 1. État constaté au début de cette session

Le plus gros du travail de séparation était **déjà fait** (session précédente, commits `e2718e1`, `9c1e249` et suivants) :

- `packages/framework/*` a été entièrement supprimé de `Frontend-esm-core` (23 packages : `esm-ai-*`, `esm-api`, `esm-config`, `esm-tenant`, `esm-theme`, `esm-styleguide`, etc.) — il ne reste dans `packages/` que `apps/`.
- Ces mêmes packages existent bien, sous le scope `@egen-civitas`, dans `Frontend-esm-framework` (`packages/framework/*`, `packages/shell/esm-app-shell`, `packages/tooling/*`).
- Versions de `react`, `react-dom`, `typescript`, `turbo`, `@swc/core`, `eslint`, `webpack` **identiques** entre les deux dépôts — pas de dérive à corriger ici.
- Aucun secret (token npm, clé API, credentials) commité dans l'un ou l'autre dépôt. `.env.development` est bien un template committé volontairement (clé API vide, avertissement explicite dans les commentaires) — c'est correct tel quel.
- Recherche de doublons de code (dossiers `utils/`/`hooks/`/`providers/` locaux, collisions de noms de fichiers entre les deux repos) : **rien d'anormal**. Les seuls `hooks/` restants dans le Core (`esm-ai-assistant-app`, `esm-offline-tools-app`) contiennent du code spécifique à ces apps (`use-ai-chat`, `use-speech-recognition`, `offline-actions`) — pas des candidats framework.

## 2. Bugs trouvés et corrigés dans cette session

### 2.1 — Chemin absolu machine-spécifique dans `workspaces` (bloquant)

`package.json` (racine du Core) référençait le Framework via un chemin absolu :

```
/home/president/Github/National/EGEN/FRONTEND ALLs/Frontend-esm-framework/packages/framework/*
```

**Vérifié concrètement** (pas juste lu) : `yarn install` échoue immédiatement avec `Workspace not found (@egen-civitas/esm-api@workspace:*)` dès qu'on n'est pas sur exactement cette machine avec exactement cette arborescence — donc cassé pour toute CI, tout autre poste, et ce sandbox.

**Corrigé** → chemin relatif :
```
../Frontend-esm-framework/packages/framework/*
```
**Hypothèse à confirmer de ton côté :** ce correctif suppose que `Frontend-esm-framework` est cloné en dossier frère de `Frontend-esm-core` (ce qui semble être le cas vu le chemin d'origine, `.../FRONTEND ALLs/Frontend-esm-framework/...`). Si ta disposition réelle est différente, ajuste ce chemin relatif en conséquence.

Ceci reste un lien de type « monorepo virtuel » pratique pour le développement local — **ce n'est pas encore** la consommation « comme un vrai package externe » que demande la mission (section 5). Voir section 4.

### 2.2 — `workspace:*` dans des `peerDependencies` (invalide pour un package publié)

`@egen-civitas/esm-tenant` et `@egen-civitas/esm-theme` traînaient en `workspace:*` dans les `peerDependencies` de 6 apps (probablement ajoutés après coup sans respecter la convention `1.x` déjà utilisée pour tous les autres peers) :

| Fichier | Clés corrigées |
|---|---|
| `esm-ai-assistant-app/package.json` | `esm-tenant` |
| `esm-home-app/package.json` | `esm-theme` |
| `esm-login-app/package.json` | `esm-tenant`, `esm-theme` |
| `esm-not-found-app/package.json` | `esm-theme` |
| `esm-primary-navigation-app/package.json` | `esm-tenant`, `esm-theme` |
| `esm-tenant-routing-app/package.json` | `esm-tenant`, `esm-theme` |

Une `peerDependency` en `workspace:*` n'a aucun sens pour un consommateur externe — `npm publish` produirait un package avec une contrainte de compatibilité invalide. Remplacé par `1.x`, cohérent avec le reste des peers déjà présents dans ces mêmes fichiers.

### 2.3 — Le nom npm `egen` est déjà pris (bloquant pour la publication)

Vérifié sur le registre réel : **`egen` existe déjà sur npm** (v0.4.1, package tiers sans rapport). `packages/tooling/egen` — ton CLI de dev (`egen develop`, `egen build`) — ne pourra pas être publié sous ce nom.

Les scopes `@egen-civitas/esm-*` sont en revanche tous disponibles (404 vérifié sur un échantillon : `esm-api`, `esm-framework`, `esm-tenant`).

**Décision à prendre côté produit, pas de correctif automatique appliqué** : renommer le package `egen` change l'UX de toute une chaîne de scripts (`"start": "egen develop"` dans 11 apps + le script racine `"run:egen": "egen"`). Deux options :
- Publier sous `@egen-civitas/egen` (ou un nom voisin) et mettre à jour tous les scripts en conséquence.
- Ne pas publier ce package sur le registre public et le garder consommé uniquement en lien local/monorepo — dans ce cas `"egen": "workspace:*"` en devDependency reste correct tel quel, il ne pose problème que s'il doit être installable hors du lien workspace.

## 3. Ce qui n'a pas pu être validé dans ce sandbox (limite d'environnement, pas un bug repo)

- `yarn install` sur le Framework échoue avec une erreur WASM (`CompileError: WebAssembly.Module(): size ... > maximum function size`) — spécifique au binaire Yarn Berry vendu dans ce container restreint, pas au code.
- En contournant avec `npm install` (1825 packages résolus sans erreur — bon signal sur la cohérence du graphe de dépendances), le build via `turbo run build` échoue à son tour : chaque script `build` réinvoque `yarn` via corepack, qui tente de télécharger le binaire exact depuis `repo.yarnpkg.com` — domaine non autorisé dans ce sandbox, avec en prime un certificat auto-signé sur le proxy réseau.
- **À valider de ton côté (ou en CI)** : `yarn install && yarn build && yarn test` dans `Frontend-esm-framework` après les corrections ci-dessus, puis la même chose dans `Frontend-esm-core` une fois le chemin relatif confirmé correct sur ta machine.

## 4. Prochaines étapes recommandées (dans l'ordre)

1. Confirmer/ajuster le chemin relatif `../Frontend-esm-framework` (section 2.1) sur ta machine, puis `yarn install` pour valider que le lien workspace fonctionne à nouveau.
2. Trancher sur le nom du package `egen` (section 2.3) avant toute tentative de publication.
3. Suivre le pipeline de la mission section 9 (`install → build → types → exports → lint → tests → npm pack → inspection → installation externe`) dans `Frontend-esm-framework`, en testant `npm pack` + installation du `.tgz` dans un projet jetable — c'est la vraie simulation de consommation externe demandée en section 5, que le simple lien `workspace:*` ne fournit pas.
4. Une fois publié sur npm (nécessite le token npm, non fourni dans cette session), remplacer les `workspace:*` restants dans les `dependencies`/`devDependencies` du Core par de vraies ranges semver (`^1.0.0`), pour que `Frontend-esm-core` devienne un consommateur externe réel du Framework, conformément au schéma de la section 12 de la mission.
