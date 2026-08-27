# Lien local vers `Frontend-esm-framework` en développement

**Statut : actif.** Contrairement au pont temporaire décrit dans
`docs/analyse-separation-framework.md` (retiré depuis), celui-ci est
volontaire, documenté, et pensé pour être activé/désactivé sans douleur.

## Ce qui a été fait, et pourquoi ce n'est PAS la même chose que l'ancien pont

L'ancien pont (voir `analyse-separation-framework.md`, section 2.1) ajoutait
`../Frontend-esm-framework/packages/framework/*` directement dans
`workspaces` : les packages du framework devenaient des **membres du
workspace de Core**. C'est ce qui avait produit le bug de la section 2.2
(`workspace:*` qui traînait dans des `peerDependencies` — invalide une fois
publié) : la frontière entre "package du workspace" et "dépendance externe
versionnée" s'était brouillée.

Ce lien-ci est différent : **aucune déclaration de dépendance n'a changé**.
Chaque app garde exactement les mêmes ranges qu'avant
(`@egen-civitas/esm-api: "1.x"`, etc.) — l'app continue, sur le papier, de
dépendre de la vraie version publiée sur npm. Seul le fichier `package.json`
racine gagne un bloc `resolutions` qui dit à Yarn : « quand tu résous
`@egen-civitas/X`, peu importe la range demandée, prends ce dossier local
plutôt que le tarball npm » :

```json
"resolutions": {
  "@egen-civitas/esm-api": "portal:../Frontend-esm-framework/packages/framework/esm-api",
  ...
}
```

Les **35 packages** du framework (tout `packages/*/*/package.json` du repo
framework) sont couverts, pas seulement ceux actuellement importés — pour
que la prochaine dépendance ajoutée n'oblige pas à revenir modifier ce
fichier.

La conséquence pratique : `npm pack` + installation externe (section 9 de
la mission d'origine) reste la vraie preuve de "consommation externe" quand
tu veux publier — ce lien ne remplace pas cette étape, il sert uniquement à
itérer vite pendant que les deux repos bougent ensemble.

## Prérequis — disposition des dossiers

Les chemins `portal:` sont relatifs à `Frontend-esm-core/package.json`, et
supposent que les deux repos sont clonés **côte à côte** :

```
un-dossier-parent/
├── Frontend-esm-core/        (ce repo)
└── Frontend-esm-framework/
```

Si ta disposition réelle est différente, ajuste les chemins dans
`resolutions` en conséquence (recherche/remplace `../Frontend-esm-framework`
par le chemin correct).

## Activation

```bash
# 1. Une fois, dans Frontend-esm-framework : générer les dist/ que portal: va lire
#    (dist/ est gitignored — jamais committé, doit exister sur le disque)
cd Frontend-esm-framework && yarn install && yarn build

# 2. Dans Frontend-esm-core : matérialiser les liens portal:
cd Frontend-esm-core && yarn install
```

Après le `yarn install` de Core, chaque `node_modules/@egen-civitas/X` est
un lien vers le dossier réel dans `Frontend-esm-framework` (pas une copie).

## Workflow au quotidien

Un changement de code dans le framework n'est visible dans Core qu'**après
un rebuild du package concerné** — `portal:` donne un lien vers le dossier
du package, pas vers ses sources compilées en direct :

```bash
# Dans Frontend-esm-framework, après avoir modifié esm-api par exemple :
cd packages/framework/esm-api && yarn build
# → immédiatement visible dans Core au prochain rechargement, sans réinstall
```

Pas de rechargement automatique à la sauvegarde pour l'instant (pas de
`--watch`) — un `yarn build` reste nécessaire à chaque changement testé.
Si le rythme d'itération le justifie, on peut ajouter un mode watch
plus tard (`tsc --watch` / `swc --watch` par paquet, ou une orchestration
Turborepo) — pas fait ici pour rester scope sur ce qui a été demandé.

## Revenir à 100% npm publié

Supprimer les entrées `portal:` du bloc `resolutions` (garder `@types/react`
et `csstype`, qui n'ont rien à voir avec ce mécanisme), puis `yarn install`.
Aucune autre modification à faire — les ranges `1.x`/`^1.0.x` déclarées
partout ailleurs n'ont jamais changé.

## Non vérifié dans ce sandbox

`yarn install` échoue ici avec une erreur WASM
(`CompileError: WebAssembly.Module(): size ... > maximum function size`),
spécifique au binaire Yarn Berry dans ce container restreint (déjà
rencontré et documenté dans `analyse-separation-framework.md`, section 3)
— pas un problème du repo ni de ce changement. Les chemins `portal:`
ci-dessus sont dérivés directement des champs `name`/emplacement réels de
chaque `package.json` du framework (script généré, pas tapés à la main),
donc corrects par construction — mais le premier `yarn install` réel doit
être fait sur une machine sans cette limite pour confirmer.
