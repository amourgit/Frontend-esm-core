# Référence — Synchro Core ⇄ CIVITAS TV (et déploiement prod)

Dépôts jumeaux :

| Rôle | Dépôt |
|---|---|
| **Core** (source de l'infra commune) | `github.com/amourgit/Frontend-esm-core` |
| **Projet métier** (clone du core + `packages/libs/*` + `esm-remote-app`) | `github.com/amourgit/civitas-tv-frontend` |
| Framework (egen CLI, rspack, app-shell) | `github.com/amourgit/Frontend-esm-framework` |

---

## 1. Pourquoi on a fait ça (contexte)

- `yarn start` = `egen develop` = **1 dev-server rspack par app** (18 apps ⇒ 2 à 4 Go de RAM). Parfait en dev, impossible en 512 Mo.
- `yarn start:prod` = **un seul serveur Node statique** (~60 Mo) qui sert les `dist/` déjà compilés.
- Résultat : dev inchangé, prod légère.

| | Dev | Production |
|---|---|---|
| Build | — | `corepack yarn build:prod` |
| Démarrage | `corepack yarn start` | `corepack yarn start:prod` |
| RAM | ~2–4 Go | ~60–100 Mo |
| Hot reload | oui | non (rebuild + redeploy) |

---

## 2. Ce qui est installé dans CHAQUE dépôt

| Fichier | Rôle |
|---|---|
| `tools/serve-prod.mjs` | Serveur de prod (zéro dépendance) : import map + routes générés au démarrage depuis `packages/apps/*`, sert l'app-shell, branding, `dist/` des apps (brotli si présent), proxy API optionnel, `/healthz` |
| `tools/precompress.mjs` | Précompresse en `.br` (JS/CSS/JSON/WASM/SVG/HTML) les `dist/` après build |
| `tools/sync-shared.sh` | Outil de synchro ciblée entre dépôts |
| `tools/shared-paths.txt` | **Liste officielle** des chemins partagés (voir §4) |

Scripts `package.json` ajoutés :

```json
"build:prod":  "turbo run build --filter=\"@egen/*-app\" --concurrency=2 && node tools/precompress.mjs",
"start:prod":  "node --max-old-space-size=256 tools/serve-prod.mjs",
"sync:shared": "bash tools/sync-shared.sh"
```

`--concurrency=2` : évite que 10 compilations rspack tournent en parallèle sur Render (sinon build tué par OOM sans message d'erreur).

---

## 3. Configuration Render (les deux projets)

| Réglage | Valeur |
|---|---|
| Build Command | `corepack yarn install --immutable --inline-builds && corepack yarn build:prod` |
| Start Command | `corepack yarn start:prod` |
| Health Check Path | `/healthz` |

Variables d'environnement lues par `serve-prod.mjs` (process.env prioritaire sur `.env.production` puis `.env`) :

| Variable | Défaut | Usage |
|---|---|---|
| `PORT` | 8080 (Render fournit le sien) | Port d'écoute |
| `HOST` | `0.0.0.0` | |
| `EGEN_SPA_PATH` | `/egen-civitas/spa` | Chemin de la SPA |
| `EGEN_API_URL` | `/egen-civitas` | Préfixe API |
| `EGEN_BACKEND` | — | URL du backend ; si défini, `EGEN_API_URL/*` est proxifié |
| `EGEN_BRAND_DIR` | — | Dossier de branding (relatif à la racine), ex. `branding/shell` |
| `EGEN_OFFLINE` | `false` | Mode offline du shell |
| `EGEN_DEV_NO_AUTH` | — | **mettre `false` en prod** |
| `EGEN_TENANT_MODE / _ID / _PERSIST / _RESOLUTION_ORDER / _PATH_PREFIX / _JWT_CLAIM / _ROOT_DOMAIN` | — | Injectées sur `window` au runtime |

Si un build d'app échoue ou manque : le serveur affiche `SKIP <app>: bundle absent` et démarre avec les autres. Si **aucune** app n'est compilée, il quitte avec une erreur.

---

## 4. CE QUI EST PARTAGÉ / CE QUI NE L'EST PAS

### Partagé (synchronisé à l'identique) — `tools/shared-paths.txt`

```
tools/serve-prod.mjs
tools/precompress.mjs
tools/sync-egen-deps.mjs
tools/sync-shared.sh
turbo.json
.yarnrc.yml
.npmrc
.editorconfig
prettier.config.js
.eslintrc
.eslintignore
.github
```

Règle : une **correction d'infra** (serveur de prod, config turbo/yarn/lint, CI) se fait **dans le core**, puis se propage aux projets métier.

### NON partagé (diverge légitimement — ne jamais écraser)

| Élément | Pourquoi |
|---|---|
| `package.json` | Workspaces différents (`packages/libs/*` côté TV), scripts propres |
| `yarn.lock` | Dépend du `package.json` |
| `packages/apps/*` | Apps métier ≠ apps du core (ex. `esm-remote-app` côté TV) |
| `packages/libs/*` | Propre au projet métier |
| `branding/`, `docs/`, `e2e/` | Identité et docs du projet |
| `.env.development`, `example.env` | Valeurs propres au projet |
| `.changeset/` | Historique de versions propre à chaque dépôt |

> Pour ajouter un fichier à la synchro : l'ajouter à `tools/shared-paths.txt` (dans le core), commit, puis `paths` côté projet métier.

---

## 5. Commandes de synchro

`<remote>` = nom du dépôt distant déclaré (`core` côté TV, `tv` côté core).

| Commande | Effet |
|---|---|
| `bash tools/sync-shared.sh setup <remote> <url>` | Déclare l'autre dépôt (une fois par clone) et fait un fetch |
| `bash tools/sync-shared.sh list <remote>` | Commits de `<remote>/main` absents d'ici qui touchent les chemins partagés |
| `bash tools/sync-shared.sh diff <remote>` | Écart actuel (stat) sur les chemins partagés |
| `bash tools/sync-shared.sh paths <remote>` | Aligne les chemins partagés sur `<remote>/main` (checkout fichier par fichier, **non committé**) |
| `bash tools/sync-shared.sh pick <remote> <sha…>` | `git cherry-pick -x` de commits précis |

Équivalent via yarn : `yarn sync:shared <commande> <remote>`.

### Mise en place (une seule fois par clone)

```bash
# côté civitas-tv-frontend (déjà fait sur le clone utilisé ici)
bash tools/sync-shared.sh setup core https://github.com/amourgit/Frontend-esm-core.git

# côté core, pour l'autre sens
bash tools/sync-shared.sh setup tv https://github.com/amourgit/civitas-tv-frontend.git
```

> Les remotes ne sont **pas versionnés** par git : à refaire sur chaque nouveau clone.

---

## 6. Scénarios types

### A. Le core a reçu une correction d'infra (cas le plus fréquent)

Dans le **projet métier** :

```bash
bash tools/sync-shared.sh list core      # voir ce qui est nouveau
bash tools/sync-shared.sh diff core      # mesurer l'écart
bash tools/sync-shared.sh paths core     # aligner les fichiers partagés
git diff                                 # relire
git add -A && git commit -m "chore(sync): aligner tools/ sur core@<sha>"
git push
```

**Préférer `paths` à `pick`** : un commit du core mélange souvent infra *et* code d'apps ; `pick` appliquerait aussi la partie apps (conflits ou régressions). `paths` ne touche que la liste blanche.

### B. Reprendre UN commit précis

Seulement si le commit ne touche **que** des chemins partagés (vérifier avec `git show --stat <sha>`) :

```bash
bash tools/sync-shared.sh list core
bash tools/sync-shared.sh pick core <sha>
```

`-x` ajoute `(cherry picked from commit …)` : traçabilité de l'origine.

### C. Une amélioration d'infra faite côté projet métier

La refaire **dans le core d'abord**, puis la redescendre. Sinon le prochain `paths core` l'écrase. Dans le core :

```bash
bash tools/sync-shared.sh setup tv https://github.com/amourgit/civitas-tv-frontend.git
bash tools/sync-shared.sh paths tv      # ramène les fichiers partagés depuis le TV
git diff && git commit -am "chore(sync): reprendre l'infra de tv" && git push
```

### D. Nouveau projet métier jumeau

Procédure complète, pas à pas : **§7**.

---

## 7. Créer un NOUVEAU projet à partir du core (procédure complète)

Objectif : un nouveau dépôt métier (ex. `civitas-xxx-frontend`) qui démarre avec la prod légère déjà prête **et** reste synchronisable avec le core.

### 7.1 Méthode recommandée : cloner le core (historique conservé, remote `core` automatique)

**Étape 1 — Créer le dépôt vide sur GitHub**
`github.com/amourgit/civitas-xxx-frontend` — sans README, sans .gitignore, sans licence (dépôt totalement vide).

**Étape 2 — Cloner le core sous le nouveau nom et re-pointer les remotes**

```bash
git clone https://github.com/amourgit/Frontend-esm-core.git civitas-xxx-frontend
cd civitas-xxx-frontend
git remote rename origin core                                        # le core devient le remote "core"
git remote add origin https://github.com/amourgit/civitas-xxx-frontend.git
git push -u origin main
git remote -v                                                        # core = Frontend-esm-core, origin = nouveau dépôt
```

Résultat : `bash tools/sync-shared.sh list core` fonctionne immédiatement (aucun `setup` nécessaire).

**Étape 3 — Vérifier que les outils de prod sont bien là (hérités du core)**

```bash
ls tools/serve-prod.mjs tools/precompress.mjs tools/sync-shared.sh tools/shared-paths.txt
grep -n "build:prod\|start:prod\|sync:shared" package.json    # 3 scripts attendus
```

Si un script manque, le rajouter (§2).

**Étape 4 — Personnaliser le projet (ce qui NE se synchronise PAS, cf. §4)**

| À faire | Où |
|---|---|
| Renommer le package racine (`"name"`) | `package.json` (garder les apps en `@egen/*-app`, le filtre de `build:prod` en dépend) |
| Remplacer logos et identité | `branding/` (+ `EGEN_BRAND_DIR` si besoin) |
| Adapter les valeurs de dev | `.env.development`, `example.env` |
| Réécrire README et docs du projet | `README.md`, `docs/` |
| Repartir d'un historique de versions propre | supprimer les `.changeset/*.md` (garder `.changeset/config.json`) |
| Retirer les apps du core inutiles, ajouter les apps métier | `packages/apps/<app>` |
| Ajouter des libs métier (optionnel) | créer `packages/libs/*` **et** ajouter `"packages/libs/*"` à `workspaces` dans `package.json` |

Règle d'une app (sinon `serve-prod` l'ignore) : son `package.json` doit avoir un `name` (`@egen/esm-xxx-app`) et un champ `browser` (ou `module`/`main`) vers le bundle compilé (ex. `dist/egen-esm-xxx-app.js`) ; ses routes sont dans `src/routes.json`.

**Étape 5 — Tester en local AVANT de déployer**

```bash
corepack yarn install
corepack yarn build:prod                       # compile les apps + .br
PORT=8080 corepack yarn start:prod &           # lancer le serveur
B=http://localhost:8080/egen-civitas/spa
curl -s http://localhost:8080/healthz          # -> ok
curl -s $B/importmap.json                      # toutes les apps listées
curl -s $B/routes.registry.json                # routes de chaque app
curl -sI -H "Accept-Encoding: br" $B/apps/<dossier-app>/<bundle>.js | grep -i content-encoding   # -> br
```

Au démarrage, la console doit afficher `N applications : …` et la RAM (`RSS`) : quelques dizaines de Mo.

**Étape 6 — Créer le service Render**

1. New → **Web Service** → connecter `civitas-xxx-frontend`, branche `main`.
2. Runtime **Node**.
3. Build Command : `corepack yarn install --immutable --inline-builds && corepack yarn build:prod`
4. Start Command : `corepack yarn start:prod`
5. Advanced → **Health Check Path** : `/healthz`
6. Variables d'environnement : voir le tableau du §3 (au minimum `EGEN_DEV_NO_AUTH=false`, `EGEN_BACKEND`, `EGEN_BRAND_DIR`, `EGEN_TENANT_*` selon le projet).
7. Déployer. Si le build s'arrête sans erreur : §9 (mémoire du build).

**Étape 7 — Déclarer le nouveau projet côté core (pour la synchro inverse)**

Dans le clone du **core** :

```bash
bash tools/sync-shared.sh setup civitas-xxx https://github.com/amourgit/civitas-xxx-frontend.git
```

**Étape 8 — Documenter**

Ajouter le nouveau dépôt au tableau de l'en-tête de ce guide (dans le core, puis `docs/SYNC-CORE-TV.md` des projets) et rappeler la règle : *infra corrigée dans le core d'abord, puis redescendue*.

### 7.2 Méthode alternative : projet vierge (sans cloner le core)

À utiliser seulement si le projet n'a **aucun** lien d'historique avec le core.

```bash
# dans le nouveau dépôt, depuis un clone du core à côté (../Frontend-esm-core)
mkdir -p tools
cp ../Frontend-esm-core/tools/{serve-prod.mjs,precompress.mjs,sync-shared.sh,shared-paths.txt,sync-egen-deps.mjs} tools/
cp ../Frontend-esm-core/{turbo.json,.yarnrc.yml,.npmrc,.editorconfig,prettier.config.js,.eslintrc,.eslintignore} .
cp -r ../Frontend-esm-core/.github .
```

Puis :
1. Ajouter les 3 scripts du §2 dans `package.json` (+ `deps:egen` et `start` si le projet utilise le CLI egen).
2. S'assurer que les workspaces contiennent `packages/apps/*` et que les apps suivent la règle de l'étape 4.
3. `bash tools/sync-shared.sh setup core https://github.com/amourgit/Frontend-esm-core.git`.
4. Reprendre les étapes 5 à 8 de la méthode 7.1.

> Les `list` et `pick` (cherry-pick) fonctionnent mal sans historique commun : avec cette méthode, utiliser **`paths`** et **`diff`** uniquement.

### 7.3 Checklist de validation d'un nouveau projet

- [ ] `git remote -v` : `origin` = nouveau dépôt, `core` = Frontend-esm-core
- [ ] 3 scripts présents : `build:prod`, `start:prod`, `sync:shared`
- [ ] `yarn build:prod` OK en local (aucune app en `SKIP`)
- [ ] `/healthz`, `importmap.json`, `routes.registry.json` répondent
- [ ] Service Render créé avec les commandes du §3 et le health check `/healthz`
- [ ] `EGEN_DEV_NO_AUTH=false` en production
- [ ] Nouveau dépôt déclaré côté core (étape 7)
- [ ] Guide mis à jour (étape 8)

---

## 8. Mises à jour système (rspack, Carbon, app-shell…)

Elles viennent du framework **`@egen-civitas/*`**. Elles se font **dans chaque dépôt**, pas par la synchro :

```bash
corepack yarn deps:egen     # = node tools/sync-egen-deps.mjs && yarn up -R '@egen-civitas/*'
```

Ensuite : `yarn verify`, `yarn build:prod`, commit du `package.json` et `yarn.lock` **dans le dépôt concerné**.

`tools/sync-egen-deps.mjs` est partagé : une évolution du script se synchronise (§5), mais les versions résolues restent propres à chaque dépôt.

---

## 9. Dépannage

| Symptôme | Cause / solution |
|---|---|
| Build Render s'arrête après des lignes `cache miss, executing …`, sans erreur | Build tué par manque de mémoire. Vérifier l'onglet **Events** du service. Baisser à `--concurrency=1` ou ajouter `NODE_OPTIONS=--max-old-space-size=450` en variable de build |
| `Out of memory (used over 512Mi)` au démarrage | Le start tourne encore en `yarn start` (dev). Utiliser `yarn start:prod` |
| `SKIP <app>: bundle absent` au démarrage | L'app n'a pas été compilée : relire les logs de build |
| `git push` rejeté (non-fast-forward) | Le dépôt distant a avancé : `git fetch origin main && git rebase FETCH_HEAD`, puis repousser |
| `list` ne montre rien | Pas de nouveau commit sur les chemins partagés : normal |
| `paths` n'a rien changé | Les fichiers sont déjà identiques |
| `remote ... n'existe pas` | Refaire `setup` (les remotes ne sont pas dans git) |
| Page blanche / 404 sur `/` | Vérifier `EGEN_SPA_PATH` : la SPA est servie sous ce préfixe, `/` redirige vers `<SPA_PATH>/` |

---

## 10. Sécurité

- Ne **jamais** coller un token GitHub (`github_pat_…`) dans un chat ou un fichier versionné. En cas d'exposition : **révoquer et régénérer** dans GitHub → Settings → Developer settings.
- Utiliser un token **fine-grained**, limité aux dépôts concernés, avec le seul droit *Contents: Read and write*.
- En production : `EGEN_DEV_NO_AUTH=false`.

---

## 11. Aide-mémoire (une page)

```bash
# --- Prod ---
corepack yarn build:prod          # build des apps + précompression brotli
corepack yarn start:prod          # serveur statique (~60 Mo)
# --- Dev ---
corepack yarn start               # dev-servers rspack (lourd)
# --- Synchro (depuis le projet métier) ---
yarn sync:shared list  core       # nouveautés d'infra du core ?
yarn sync:shared diff  core       # écart ?
yarn sync:shared paths core       # aligner (puis git diff, commit, push)
yarn sync:shared pick  core <sha> # un commit précis (100 % infra uniquement)
# --- Nouveau projet (cf. §7) ---
git clone <core> <nom> && cd <nom> && git remote rename origin core && git remote add origin <url-nouveau> && git push -u origin main
# --- Dépendances framework (dans chaque dépôt) ---
corepack yarn deps:egen
```
