# Lien local vers `Frontend-esm-framework` en développement

**Statut : actif, validé par un `yarn install` réel.**

## Historique court — deux mécanismes essayés, un seul retenu

**Premier essai (échec empirique) : `portal:` via `resolutions`.** Chaque
package du framework était forcé, depuis la racine de Core, vers son
dossier local via `resolutions` (`"@egen-civitas/esm-api":
"portal:../Frontend-esm-framework/packages/framework/esm-api"`, etc.).
Séduisant sur le papier — aucune dépendance déclarée ne change, la
frontière workspace/dépendance externe reste nette — mais **`yarn install`
plante réellement** :

```
Error: Assertion failed: Writing attempt prevented to
.../Frontend-esm-framework/packages/tooling/egen/node_modules/@egen-civitas/esm-app-shell
which is outside project root: .../Frontend-esm-core
```

Cause structurelle, pas un chemin mal écrit : `@egen-civitas/egen` (portal)
dépend lui-même d'`@egen-civitas/esm-app-shell` (portal). Ces deux paquets
vivent physiquement dans `Frontend-esm-framework`, un dossier **frère** de
`Frontend-esm-core` — jamais un ancêtre. La résolution de modules Node.js
ne remonte que vers les dossiers ancêtres ; elle ne peut jamais traverser
vers un dossier frère. Pour que `egen` retrouve `esm-app-shell` par la
résolution Node normale, Yarn doit donc écrire un `node_modules` **à
l'intérieur du dossier framework lui-même** — ce que le linker
`node-modules` refuse explicitement de faire dès que la cible sort de la
racine du projet en cours d'installation (ici, Core). Le framework a 35
paquets qui se dépendent mutuellement de cette façon : le problème ne se
limite pas à `egen`, il aurait resurgi ailleurs dans le graphe.

**Ce qui a été retenu : ajouter les dossiers du framework comme membres du
workspace de Core**, exactement le mécanisme déjà utilisé (et documenté)
dans `docs/analyse-separation-framework.md` avant qu'il soit retiré pour
une raison différente (valider la consommation npm externe réelle — voir
plus bas). La différence avec `portal:` : les paquets ne sont plus des
dépendances externes redirigées, ils deviennent des membres du MÊME projet
Yarn que Core — la résolution de modules n'a alors plus jamais besoin de
sortir de la racine du projet, quel que soit le nombre de dépendances
croisées entre eux.

## Ce qui a été fait

```json
// Core/package.json
"workspaces": [
  "packages/apps/*",
  "../Frontend-esm-framework/packages/framework/*",
  "../Frontend-esm-framework/packages/shell/*",
  "../Frontend-esm-framework/packages/tooling/*"
],
"resolutions": {
  "@types/react": "18.3.25",
  "csstype": "3.2.3"
}
```

Les 46 paquets (11 apps de Core + 35 du framework) partagent alors une
seule installation. Yarn lie automatiquement toute dépendance
`@egen-civitas/X: "^1.0.0"`/`"1.x"` vers le membre du workspace du même nom
dès qu'il existe — **aucune modification des `dependencies` déclarées
n'était nécessaire** : le framework utilise déjà des ranges semver
classiques en interne (`^1.0.0`), jamais `workspace:*`, donc l'auto-liaison
fonctionne sans aucun autre changement.

## Le piège documenté à ne pas reproduire

`analyse-separation-framework.md` (section 2.2) décrit un bug apparu la
dernière fois que ce pont a été utilisé : des `peerDependencies` laissées
en `workspace:*` dans 6 apps de Core, invalide une fois un package publié
hors du lien workspace. **Vérifié avant ce changement : aucun
`workspace:*` ne traîne nulle part**, ni dans Core ni dans le framework.
Règle à garder en tête pendant que ce pont est actif : ne jamais écrire
`workspace:*` dans une `peerDependency`/`dependency` destinée à être
publiée — toujours une vraie range semver, même si Yarn accepterait
`workspace:*` sans broncher pendant que le pont est en place.

## Prérequis — disposition des dossiers

Les chemins `../Frontend-esm-framework/...` supposent les deux repos
clonés **côte à côte** :

```
un-dossier-parent/
├── Frontend-esm-core/        (ce repo)
└── Frontend-esm-framework/
```

Si ta disposition réelle est différente, ajuste les 3 entrées de
`workspaces` en conséquence.

## Activation

```bash
cd Frontend-esm-core && yarn install
```

C'est tout — un seul `yarn install`, à la racine de Core. Pas besoin de
lancer `yarn install` séparément dans le framework au préalable (Core gère
maintenant l'installation des deux ensemble), mais ça ne fait pas de mal si
tu veux garder le framework installable seul par ailleurs (ce n'est pas
son mode principal de test tant que ce pont est actif).

## Workflow au quotidien

Un changement de code dans le framework n'est visible dans Core qu'après
un **build** du package concerné — le workspace donne un lien vers le
dossier du package, pas vers ses sources compilées en direct (les paquets
sont consommés via leur `dist/`, comme n'importe quel paquet publié) :

```bash
cd Frontend-esm-framework/packages/framework/esm-api && yarn build
# → immédiatement visible dans Core au prochain rechargement de `yarn start`
```

Ou, pour tout reconstruire d'un coup : `cd Frontend-esm-core && yarn build`
reconstruira aussi les paquets du framework maintenant qu'ils font partie
du même workspace (Turborepo suit les 46 paquets). **Point de vigilance
non vérifié** : le `turbo.json` de Core n'a pas été pensé à l'origine pour
piloter le build de paquets framework — si `turbo run build`/`verify`
échoue ou se comporte bizarrement une fois le pont actif (pipeline manquant
pour un des scripts du framework, etc.), le repli sûr est de builder le
framework depuis son propre repo comme avant.

Pas de rechargement automatique à la sauvegarde (pas de `--watch`) — un
build reste nécessaire à chaque changement testé.

## Revenir à 100% npm publié

Retirer les 3 entrées ajoutées à `workspaces` (garder `packages/apps/*`),
puis `yarn install`. Les apps retrouvent alors la vraie version publiée de
chaque `@egen-civitas/*` selon la range déclarée (`1.x`/`^1.0.x`), sans
aucune autre modification.

## Ce que ce pont NE remplace PAS

La vraie preuve de « consommation externe » (mission d'origine, section 5
puis 9 de `analyse-separation-framework.md`) reste `npm pack` +
installation du tarball dans un projet jetable, une fois prêt à publier.
Ce pont sert uniquement à itérer vite pendant que les deux repos bougent
ensemble ; il ne garantit pas que l'`exports` map, les fichiers inclus dans
le paquet publié, etc. sont corrects — seul un vrai `npm pack` le prouve.
