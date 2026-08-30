# Lien local vers `Frontend-esm-framework` — abandonné, retour au 100% npm publié

**Statut : le pont a été retiré.** `workspaces` ne contient de nouveau que
`packages/apps/*`. Deux mécanismes essayés, tous les deux abandonnés pour
des raisons concrètes et mesurées — voir ci-dessous. Ce document garde la
trace pour ne pas retomber dans les deux mêmes pièges.

## Essai 1 : `portal:` via `resolutions` — échec à l'installation

Résumé : `yarn install` plantait (`Assertion failed: Writing attempt
prevented to .../Frontend-esm-framework/... which is outside project
root`), parce qu'un paquet portal (`egen`) dépend d'un autre paquet portal
(`esm-app-shell`), tous deux physiquement dans un dossier **frère** de
Core — jamais atteignable par la résolution de modules Node, qui ne
remonte que vers les ancêtres.

## Essai 2 : `workspaces` avec chemin relatif — install réussie, runtime inutilisable

`yarn install` a fonctionné. Mais au lancement (`yarn start`) :

- **Le bypass ne marchait toujours pas** : les paquets `egen` et
  `esm-app-shell` exposent du code **compilé** (`dist/`), et ce `dist/`
  n'avait pas été reconstruit avec les derniers correctifs sources — donc
  aucun des correctifs n'était réellement exécuté, peu importe le
  mécanisme de liaison.
- **Lenteur et charge machine sévères** : 2+ minutes avant que home/login
  se chargent, PC à la peine, malgré un `[egen] Listening` rapide et
  `esm-devtools-app` qui se charge vite. Hypothèse la plus probable :
  devenus membres du workspace, les 11 apps de Core ne consomment plus
  seulement le `dist/` + `.d.ts` de chaque paquet du framework (petit,
  rapide) — TypeScript/rspack se sont remis à traverser une bonne partie
  des sources brutes des 35 paquets, en parallèle, pour chacune des 11
  apps. Non confirmé par un profiling détaillé (pas fait), mais cohérent
  avec tous les symptômes observés.

Le premier problème (dist périmé) rendait de toute façon impossible de
juger si le mécanisme de liaison marchait — mais le second (lenteur) est
resté visible en toile de fond, en apparence indépendant du problème de
build périmé, et suffisamment sévère pour être bloquant en soi.

**Conclusion : lier tout le framework en workspace/portal n'est pas
praticable ici pour un usage quotidien.** 35 paquets interdépendants, avec
build compilé requis pour 2 d'entre eux (`egen`, `esm-app-shell`) et un
risque de sur-scan TypeScript/bundler pour les 33 autres — le rapport
effort/risque ne justifie pas l'itération instantanée espérée.

## La bonne méthode : publier, puis consommer comme n'importe quel paquet

Ce que ce repo a déjà, tout construit pour ça (`changesets`) :

```bash
# Dans Frontend-esm-framework, après avoir vérifié les changements :
yarn install && yarn build          # dist/ à jour partout
yarn verify                          # lint + test + typecheck (optionnel mais recommandé)
yarn release                         # `changeset version` : lit .changeset/*.md,
                                      # bump les package.json concernés + CHANGELOG.md
git add -A && git commit -m "chore(release): version bump"
git push
yarn ci:publish                      # `changeset publish` : publie sur npm (auth requise)
```

Puis dans Core :

```bash
cd Frontend-esm-core
yarn up '@egen-civitas/*'            # ou simplement `yarn install` si les ranges
                                      # existants (1.x / ^1.0.x) couvrent déjà
                                      # la nouvelle version publiée
yarn start
```

Aucune modification de `package.json` normalement nécessaire côté Core :
les ranges déclarées (`1.x`, `^1.0.x`) couvrent déjà un bump patch/minor.

Un changeset décrivant les correctifs actuels (bypass auth, tenant
runtime-bridge) a été ajouté à `.changeset/` dans le framework — `yarn
release` doit le trouver directement.

## Si le besoin d'itération rapide revient

Ne pas relier tout le framework d'un coup. Si un jour un vrai besoin
d'itération immédiate se représente, envisager un périmètre beaucoup plus
étroit — un seul paquet à la fois, sans dépendance croisée vers un autre
paquet du framework, ET avec la cause de la lenteur TypeScript
identifiée et corrigée au préalable (pas juste supposée) — plutôt que de
relier les 35 d'un coup comme fait ici deux fois de suite.
