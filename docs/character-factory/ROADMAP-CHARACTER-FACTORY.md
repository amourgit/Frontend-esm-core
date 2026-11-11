# EGEN Character Factory — Feuille de route détaillée (CharacterStudio d'abord)

> Document de référence pour les développeurs. Source de la vision : `docs/ajout-info.md`.
> Périmètre : **l'application CharacterStudio intégrée au Core** (`packages/apps/esm-character-factory-app`) et les **contrats** dont elle a besoin côté backend. Le backend lui-même, les moteurs externes (Ara, comportement universel…) et les intégrations Blender automatisées sont **hors périmètre** de cette feuille de route.

## 0. Comment lire ce document

| Marque | Sens |
|---|---|
| **[E]** | Existe dans CharacterStudio (preuve : fichier cité). |
| **[A]** | Existe partiellement : à adapter. |
| **[N]** | N'existe pas : à développer. |
| **v1** | Indispensable au premier objectif. |
| **v2** | Ultérieur : à prévoir (point d'extension), pas à coder maintenant. |

Règles de lecture :
1. **Aucune fonctionnalité souhaitée n'est présentée comme existante.** Si ce n'est pas marqué [E], ce n'est pas disponible.
2. Une phase n'est « terminée » que si **tous ses critères d'acceptation** sont vérifiés (règle 5 du projet).
3. Un développeur travaille **dans une seule phase à la fois**, dans les modules listés pour cette phase. Tout besoin hors liste = demande de décision, pas initiative.

---

## 1. Vocabulaire normatif

| Terme | Définition | Ne pas confondre avec |
|---|---|---|
| **Ressource** | Un élément 3D indépendant : personnage, vêtement, accessoire, animation, expression, texture, environnement (+ `part` : élément modulaire issu d'un manifeste CharacterStudio, dont le manifeste ne précise pas s'il s'agit d'un vêtement ou d'un accessoire). A un id, une version, des fichiers, des métadonnées, une compatibilité, un statut. | Un « trait » de CharacterStudio (lié à un manifeste de personnage). |
| **Composition** | Un assemblage enregistré : un personnage de base + des éléments + des réglages d'apparence. **Référence** les ressources (id + version), ne les copie pas. | Un export VRM/GLB fusionné. |
| **Variante** | Une composition dérivée d'une autre (`variantOf`). Indépendante après création. | Une version. |
| **Version** | État daté et immuable (une fois publiée) d'une ressource ou d'une composition. | Une variante. |
| **Profil de présentation** | Paramètres d'usage d'une composition dans un contexte (login, tableau de bord, EGEN AI…) : cadrage, fond, état initial, capacités autorisées. | La composition elle-même. |
| **Instance runtime** | Un personnage affiché et animé dans une page, avec son état courant. | La composition (statique). |
| **Instruction** | Ordre envoyé à une instance runtime (« affiche telle expression »). Décidé côté backend, exécuté côté frontend. | Un événement UI. |

**Invariants (à ne jamais violer)**
1. Une composition référence des ressources par `(id, version)`. Jamais de copie de fichiers 3D.
2. Une version publiée est immuable. Toute modification crée une nouvelle version.
3. Modifier une composition ne modifie jamais une autre composition.
4. Le **backend décide**, le **frontend exécute** (rendu, animation). Aucune logique de décision métier dans le rendu 3D.
5. Une instance runtime est dérivée d'une composition + un profil ; elle ne la modifie pas.

---

## 2. Constat vérifié de CharacterStudio (existant réel)

Preuves tirées du code (`src/studio/library/`, `src/studio/pages/`).

| Capacité | Existant | Limite constatée |
|---|---|---|
| Personnage / traits | **[E]** Pilotage par manifeste : `manifestDataManager`, `characterManager.loadTrait/removeTrait/getTraits/loadRandomTraits` | Les traits appartiennent à **un manifeste de personnage**. Il n'existe pas de bibliothèque globale de ressources. |
| Vêtements / accessoires | **[E]** Ce sont des traits (groupes) à modèles VRM/GLB. Fusion géométrie et culling à l'export (`merge-geometry`, `cull-mesh`) | Pas de « vêtement » autonome utilisable sur plusieurs personnages hors du manifeste. |
| Couleurs / textures | **[E]** `setTraitColor`, `loadCustomTexture`, `OverlayTextureManager` (décalcomanies) | — |
| Morphologie | **[E]** Traits blendshape (`loadBlendShapeTrait`) | — |
| Restrictions | **[E]** `ManifestRestrictions` : exclusions trait↔trait déclarées dans le manifeste | **Aucune** vérification squelette / rig / point d'attache / matériau. |
| Animations | **[A]** `AnimationManager` + `loadMixamoAnimation` : FBX Mixamo retargeté vers l'humanoïde VRM (`VRMRigMapMixamo`) ; lecture, pause, vitesse, clip suivant/précédent, fondu | Les animations sont déjà des fichiers indépendants, mais liées à la liste du manifeste. **Humanoïde VRM uniquement.** Superposition de couches : à confirmer (spike P11). |
| Expressions / émotions | **[E]** `EmotionManager` sur `vrm.expressionManager` | Pas de catalogue ni de contraintes par personnage. |
| Regard | **[A]** `LookAtManager` suit **la souris** | Pas de cible arbitraire (utilisateur, point, caméra) pilotable par programme. |
| Clignement | **[E]** `BlinkManager` | — |
| Synchro labiale | **[A]** `LipSync` : analyse spectrale d'un micro ou d'un fichier audio | Pas piloté par visèmes ou texte fournis de l'extérieur. |
| Sauvegarde | **[A]** `Storage.js`, `storeCurrentAvatar/loadStoredAvatar` (navigateur, un seul avatar), `getAvatarSelection` (sélection JSON) | Pas de composition nommée, versionnée, multiple, ni partagée. |
| Import | **[A]** `FileDropComponent`, `loadCustomTrait/loadCustomTexture` | Aucune validation, aucun rapport, aucune organisation. |
| Export | **[E]** `downloadVRM/downloadGLB` (`VRMExporter`, atlas, KTX2), `ZipManager`, export par lot, générateurs LoRA / sprites / miniatures | L'export produit un personnage **fusionné**, pas une composition par référence. |
| Optimisation | **[E]** Vue Optimizer (`loadOptimizerManifest`) | — |
| Backend | **[N]** Aucun. Les manifestes des personnages sont hébergés sur **`m3-org.github.io/loot-assets`** (dépendance externe) | Rapatriement ou hébergement EGEN à décider (D2). |
| Accès / droits | **[N]** Seul existe le verrouillage NFT / wallet | Aucune notion d'organisation, de tenant, de droit. |
| Personnages non humanoïdes | **[N]** | Pipeline animation et rig = humanoïde VRM. |
| Environnements | **[A]** `showEnvironmentModels` (à vérifier) | Pas de ressource « environnement » gérée. |

**Points à vérifier avant la phase concernée** (non confirmables dans l'environnement de travail : les manifestes de personnages sont distants)
- Schéma exact d'un manifeste de personnage (champs de traits, collections, restrictions) → P7.
- Possibilité de superposer des couches d'animation dans `AnimationManager` → P11 (spike).
- Comportement réel de `showEnvironmentModels` → P8.

---

## 3. Écarts entre la vision et l'existant

| Vision (`ajout-info.md`) | Écart |
|---|---|
| Ressources indépendantes, organisées, réutilisables | Pas de bibliothèque, pas de modèle de ressource → **P7, P8** |
| Vérifier la compatibilité (squelette, rig, attaches, matériaux) | Seulement des exclusions déclarées → **P9** |
| Compositions enregistrées, variantes sans duplication, versions | Un seul avatar local ; export fusionné → **P7, P10, P14** |
| Réutilisation dans plusieurs apps EGEN | Application monolithique → **P12** |
| Exploitation dynamique (états, regard, expressions, parole) | Briques isolées, aucune orchestration → **P11, P12** |
| Importer et vérifier de nouvelles ressources | Dépôt de fichier sans contrôle → **P13** |
| Droits, organisations, tenants | Inexistant → **P14** |

---

## 4. Modèle de domaine (contrats frontend ↔ backend)

Ce sont des **contrats fonctionnels**, indépendants de toute technologie de transport ou de stockage. Ils sont implémentés en P7 sous forme de types et de ports.

```
Resource {
  id, kind: character|garment|accessory|animation|expression|texture|environment
  name, description, tags[], collections[]
  version, status: draft|validated|published|deprecated
  files[]: { role: original|optimized|preview, uri, format, sizeBytes, hash }
  compatibility: { skeleton, slots[], attachmentPoints[], materials, constraints[] }
  source: { origin: legacy-manifest|import|library, license?, author? }
  scope: { tenantId?, organizationId? }
}

Composition {
  id, name, version, status, variantOf?
  base:  { resourceId, version }
  items: [ { slot, resourceId, version, overrides: { color?, texture?, blendshapes? } } ]
  appearance: { blendshapes, colors }
  defaultState?: StateSet
}

PresentationProfile {
  id, composition: { id, version | "latest-published" }
  context: "login" | "dashboard" | "ai" | string
  camera, framing, background, size
  initialState: StateSet, allowedCapabilities[]
}

StateSet (couches indépendantes) {
  body:       { animationId?, loop?, weight? }
  expression: { id?, intensity? }
  emotion:    { id?, intensity? }
  gaze:       { target: user|camera|point|mouse|none, point? }
  blink:      { enabled }
  lipsync:    { enabled, source?: audio|visemes }
  macro?:     "idle"|"listening"|"speaking"|string   // se résout en couches via le profil
}

Instruction {
  id, instanceId, type: setState|playAnimation|setExpression|setGaze|setLipSync|swapItem|reset
  params, issuedAt, ttl?
}
InstructionReport { instructionId, status: applied|rejected|failed, reason? }
```

Règles :
- Le **frontend vérifie** chaque instruction contre `allowedCapabilities` et la compatibilité, puis **rapporte** (`InstructionReport`). Il ne décide pas.
- `"latest-published"` est autorisé dans un profil, **jamais** dans une composition (épinglage obligatoire).

---

## 5. Architecture de code cible (frontend)

À valider par un court ADR en fin de P7 (D4).

```
src/
  studio/        Code hérité CharacterStudio. Modifications minimales, toujours marquées `// EGEN:`.
  domain/        Types et invariants purs. AUCUN import de react, three ou du Core.
  ports/         Interfaces : ResourceRepository, CompositionRepository, ProfileRepository,
                 PermissionPort, RuntimeChannel.
  adapters/
    legacy-manifest/   manifeste CharacterStudio → Ressources (lecture seule)
    browser-storage/   persistance locale (temporaire, jusqu'au backend)
    http/              (v2) clients du backend EGEN
  services/      Cas d'usage : ResourceService, CompositionService, CompatibilityService
  runtime/       Moteur d'états, CommandBus, CharacterPlayer. Dépend de three, pas de React.
                 Accède à CharacterStudio UNIQUEMENT via runtime/engine-adapter (façade).
  features/      UI React : library/, composer/, states/, import/, governance/
  integration/   Liaison au shell EGEN : routes, rail, i18n, thème, config
```

Règles de dépendance : `domain` ← `ports` ← `services` ← `features` ; `runtime` ← `domain`. Jamais l'inverse. `features` ne touche jamais `studio/` directement : il passe par `runtime/engine-adapter` (couche anti-corruption), ce qui permet de faire évoluer ou de remplacer le moteur.

---

## 6. Phases

Phases 1 à 4 sont **terminées** (audit, compatibilité, fork, intégration au Core).

### Phase 5 — Identité EGEN et intégration au shell · *en cours*

**Objectif** : l'application est indiscernable d'une application EGEN native.
**Terminé** : zone principale, rail gauche, sous-options, grille d'apps, TopBar, branding du titre, i18n du Core.

| ID | Fonctionnalité | Côté | Existant | À faire | Prio |
|---|---|---|---|---|---|
| F5.1 | Thème EGEN sur l'UI héritée | FE | **[E]** CSS modules hérités | **[A]** Mapper les couleurs vers `--colors-*` / `--panel-*` via une feuille `integration/theme.scss`, sans réécrire les sources héritées | v1 |
| F5.2 | Visuels d'accueil EGEN | FE | **[E]** images CharacterStudio | **[N]** Nouveaux visuels | v1 |
| F5.3 | Panneaux hérités bornés à la zone | FE | **[A]** `100vw/100vh` hérités | **Fait** : `vh/vw` convertis en `cqh/cqw` au build, hauteur de zone mesurée, `style.css` rattaché à `.character-factory-stage` | v1 |

**Acceptation** : aucune couleur codée en dur ajoutée ; rendu sans débordement à 3 largeurs (mobile, portable, large) ; aucun libellé « CharacterStudio » visible.
**Modules** : `integration/`, CSS héritées (changements de variables uniquement).

### Phase 6 — Stabilisation et cycle de vie · *en cours*

**Objectif** : les fonctions d'origine fonctionnent, et l'application se monte et se démonte proprement dans le shell.

| ID | Fonctionnalité | Côté | Statut |
|---|---|---|---|
| F6.1 | Cycle de vie : boucle de rendu, écouteurs, contexte WebGL, audio libérés au démontage | FE | **Fait** (`sceneInitializer.dispose`, `LookAtManager.dispose`, `AudioProvider`) |
| F6.2 | Cohérence vue ↔ scène : changer de vue depuis le shell nettoie la scène comme les boutons « Retour » d'origine | FE | **Fait** (`route-sync`) |
| F6.3 | Matrice de non-régression des fonctions d'origine (création, chargement, morphologie, vêtements, textures, couleurs, aperçu, export VRM/GLB, lot) | FE | **Matrice écrite** (`MATRICE-NON-REGRESSION.md`, 23 lignes) ; validation navigateur à faire |
| F6.4 | Indépendance des assets externes : inventaire `loot-assets`, réglage `assetBaseUrl` effectif | FE | **Fait** (`ASSETS-EXTERNES.md`) ; rapatriement des personnages = décision D2 |
| F6.5 | États de chargement et d'erreur homogènes (échec réseau d'un manifeste, WebGL indisponible) | FE | **Fait** (WebGL, chargement du moteur, erreur de rendu) ; échec d'un manifeste distant : R22 à valider |

**Acceptation** : quitter et revenir 10 fois → un seul contexte WebGL actif, aucun avatar résiduel, aucune musique résiduelle, mémoire stable ; chaque ligne de la matrice F6.3 validée ; message clair si WebGL est indisponible.

### Phase 7 — Socle domaine : ressources, compositions, profils

**Objectif** : poser le modèle sans UI nouvelle. C'est la phase clé : toutes les suivantes en dépendent.

| ID | Fonctionnalité | Côté | Existant | À faire | Prio |
|---|---|---|---|---|---|
| F7.1 | Types et validateurs de `Resource`, `Composition`, `PresentationProfile`, `StateSet`, `Instruction` | FE | **[N]** | **Fait** — `src/domain/` (validation manuelle, aucune dépendance ajoutée) | v1 |
| F7.2 | Ports (`ResourceRepository`, `CompositionRepository`, `ProfileRepository`, `PermissionPort`, `RuntimeChannel`) | FE | **[N]** | **Fait** — `src/ports/index.ts` | v1 |
| F7.3 | Adaptateur manifeste historique → ressources | FE | **[A]** `manifestDataManager` | **Fait** — `src/adapters/legacy-manifest` ; testé sur manifeste **synthétique** (à confirmer sur un manifeste réel) | v1 |
| F7.4 | Persistance locale temporaire des compositions et profils | FE | **[A]** `Storage.js` (un seul avatar) | **Écrit, non validé en navigateur** — `src/adapters/browser-storage` (IndexedDB) ; dépôts mémoire testés | v1 |
| F7.5 | Résolution composition → liste d'assets à charger | FE | **[N]** | **Fait** — `CompositionService.resolve()` | v1 |
| F7.6 | Contrats backend documentés (liste des opérations attendues) | BE | **[N]** | **Fait** — `BACKEND-CONTRATS.md` | v1 |
| F7.7 | ADR de l'architecture de code (§5) | — | — | **Rédigé** — `ADR-001-ARCHITECTURE-CODE.md`, **en attente de validation** (D4) | v1 |

**Acceptation** : tests purs (sans three ni React) ; aller-retour composition → sauvegarde → relecture identique ; aucune copie de fichier 3D dans une composition ; un manifeste réel est converti sans perte.
**Hors périmètre** : toute UI, tout appel réseau.

### Phase 8 — Bibliothèque de ressources (scénario 1)

| ID | Fonctionnalité | Côté | Existant | À faire | Prio |
|---|---|---|---|---|---|
| F8.1 | Catalogue par type (personnages, vêtements, accessoires, animations, expressions, textures) | FE | **[N]** | `features/library` | v1 |
| F8.2 | Recherche, filtres, tri, collections, tags | FE (+BE pour grands volumes) | **[N]** | Filtrage local d'abord | v1 |
| F8.3 | Fiche ressource (métadonnées, fichiers, version, statut, compatibilité résumée) | FE | **[N]** | Panneau de détail | v1 |
| F8.4 | Aperçu isolé d'une ressource | FE | **[A]** moteur de scène | Un **renderer partagé** (contrainte : limite de contextes WebGL du navigateur) | v1 |
| F8.5 | Miniatures | FE | **[E]** `thumbnailsGenerator` | Branchement | v1 |
| F8.6 | Option « Bibliothèque » dans le rail | FE | — | `routes.json` + `route-sync` | v1 |
| F8.7 | Ressources « environnement » | FE | **[A]** à vérifier | À cadrer | v2 |

**Backend attendu** : lister, rechercher, lire une ressource, servir les fichiers et aperçus.
**Acceptation** : parcourir, filtrer et prévisualiser 100 ressources sans créer plus d'un contexte WebGL ; les ressources du manifeste historique y apparaissent.

### Phase 9 — Compatibilité

| ID | Fonctionnalité | Côté | Existant | À faire | Prio |
|---|---|---|---|---|---|
| F9.1 | Descripteur de compatibilité : os humanoïdes présents, slots, points d'attache, matériaux, contraintes | FE (calcul local) / BE (stockage) | **[A]** `ManifestRestrictions` (exclusions seulement) | Calcul à l'indexation | v1 |
| F9.2 | Moteur de règles : **compatible / adaptation requise / incompatible**, avec raisons | FE | **[N]** | `CompatibilityService` | v1 |
| F9.3 | Indicateurs dans la bibliothèque et le composeur | FE | **[N]** | Badges + explication | v1 |
| F9.4 | Adaptations réalisables (retargeting animation vers VRM, échelle, recoloration) | FE | **[E]** retargeting Mixamo | Exposer comme « adaptation proposée » | v1 |
| F9.5 | Compatibilité animation ↔ personnage | FE | **[A]** | Basée sur l'humanoïde | v1 |
| F9.6 | Auto-rigging, retopologie, personnages non humanoïdes | — | **[N]** | Point d'extension seulement | v2 |

**Acceptation** : pour un jeu d'essai connu, chaque verdict (compatible / adaptation / incompatible) est correct et explique pourquoi.

### Phase 10 — Composition et personnalisation (scénarios 2 et 3)

| ID | Fonctionnalité | Côté | Existant | À faire | Prio |
|---|---|---|---|---|---|
| F10.1 | Composeur : personnage → tenue → accessoires → couleurs / morphologie | FE | **[E]** `Appearance` (flux historique) | Reconstruire sur le modèle `Composition` via `engine-adapter` | v1 |
| F10.2 | Visualisation temps réel | FE | **[E]** | Conserver | v1 |
| F10.3 | Enregistrer une composition (références épinglées) | FE + BE | **[N]** | `CompositionService.save` | v1 |
| F10.4 | Rouvrir et modifier une composition | FE + BE | **[N]** | Chargement par résolution | v1 |
| F10.5 | Variantes : dupliquer = copier les **références** (`variantOf`), jamais les fichiers | FE + BE | **[N]** | Action « Créer une variante » | v1 |
| F10.6 | Comparer 2 à 3 variantes | FE | **[N]** | Instantanés / rendu alterné (un seul renderer) | v1 |
| F10.7 | Brouillon et versions nommées d'une composition | FE + BE | **[N]** | Historique simple | v1 |
| F10.8 | Le flux historique (Créer → Apparence → Enregistrer) reste utilisable | FE | **[E]** | Non-régression | v1 |

**Acceptation** : scénario 3 déroulé de bout en bout : 3 variantes issues des mêmes ressources, modifiées indépendamment, **sans aucun fichier 3D dupliqué** (vérifié sur les données stockées).

### Phase 11 — Animations, expressions et états (scénario 5, partie frontend)

| ID | Fonctionnalité | Côté | Existant | À faire | Prio |
|---|---|---|---|---|---|
| F11.0 | **Spike** : `AnimationManager` supporte-t-il des couches simultanées ? | FE | **[A]** | Prototype + décision écrite | v1 |
| F11.1 | Catalogue animations / expressions + aperçu | FE | **[A]** | Dans la bibliothèque | v1 |
| F11.2 | Modèle d'états par couches (corps, expression, émotion, regard, clignement, synchro labiale) | FE | **[N]** briques isolées **[E]** | `runtime/` : `StateEngine` | v1 |
| F11.3 | Règles de conflits (priorité, exclusivité, masques ; ex. synchro labiale vs expression de bouche) | FE | **[N]** | Table de règles testée | v1 |
| F11.4 | États macro (repos / écoute / parole) définis par profil et résolus en couches | FE | **[N]** | Mapping dans le profil | v1 |
| F11.5 | Regard sur cible (utilisateur, caméra, point) | FE | **[A]** `LookAtManager` = souris | Généraliser | v1 |
| F11.6 | Synchro labiale pilotée par audio | FE | **[E]** `LipSync` | Brancher sur le `StateEngine` | v1 |
| F11.7 | Synchro labiale par visèmes / texte fournis par le backend | FE + BE | **[N]** | — | v2 |
| F11.8 | Testeur d'états (combiner, vérifier les interactions) | FE | **[N]** | Panneau dans la zone droite | v1 |
| F11.9 | Changements à chaud (vêtement, couleur, animation) sans recharger le personnage | FE | **[A]** `loadTrait` remplace un trait | Valider et couvrir par des tests | v1 |

**Acceptation** : « parler + expression + regard sur l'utilisateur » en simultané sans conflit ; passage repos → écoute → parole → repos sans recréer le personnage ; la règle de conflit de chaque paire de couches est testée.

### Phase 12 — Exécution et Player embarquable (scénarios 4 et 5)

| ID | Fonctionnalité | Côté | Existant | À faire | Prio |
|---|---|---|---|---|---|
| F12.1 | `CharacterPlayer` : charge composition + profil et s'affiche dans un conteneur, **sans l'éditeur** | FE | **[N]** | `runtime/player` | v1 |
| F12.2 | Profils de présentation (cadrage, fond, taille, état initial, capacités) | FE + BE | **[N]** | Éditeur de profils | v1 |
| F12.3 | `CommandBus` : applique les instructions, valide les capacités, renvoie les `InstructionReport` | FE | **[N]** | `runtime/command-bus` | v1 |
| F12.4 | Transport abstrait `RuntimeChannel` ; adaptateur local pour les tests | FE | **[N]** | Port + adaptateur local | v1 |
| F12.5 | Plusieurs instances sur une page (budget GPU : renderer partagé) | FE | **[N]** | Gestionnaire d'instances | v1 |
| F12.6 | Mécanisme de réutilisation par les autres apps EGEN (login, tableau de bord, EGEN AI) | FE | **[N]** | À étudier dans le Core (D1) | v1 |
| F12.7 | Page « Exécuter une composition » (tester avant publication) | FE | **[N]** | Dans Character Factory | v1 |
| F12.8 | Canal temps réel réseau vers le backend | BE | **[N]** | Implémentation côté backend | v2 |

**Acceptation** : une même composition, avec deux profils différents, s'affiche dans deux contextes sans reconstruction ; un jeu d'instructions simulé (`setExpression`, `playAnimation`, `setGaze`) est exécuté, et une instruction non autorisée est rejetée avec un `InstructionReport` explicite.

### Phase 13 — Import et traitement (scénario 1)

| ID | Fonctionnalité | Côté | Existant | À faire | Prio |
|---|---|---|---|---|---|
| F13.1 | Assistant d'import (VRM / GLB ; FBX d'animation ; textures) | FE | **[A]** `FileDropComponent` | `features/import` | v1 |
| F13.2 | Contrôles locaux : format, taille, os humanoïdes, matériaux, nombre de triangles | FE | **[A]** `getBoneTriangleCount` | Contrôles avant envoi | v1 |
| F13.3 | Rapport d'erreurs et avertissements | FE | **[N]** | Vue de rapport | v1 |
| F13.4 | Aperçu avant validation | FE | **[A]** | Aperçu isolé (F8.4) | v1 |
| F13.5 | Métadonnées (nom, type, étiquettes, source, licence) | FE | **[N]** | Formulaire | v1 |
| F13.6 | Envoi vers `ResourceRepository` | FE + BE | **[N]** | Adaptateur local d'abord | v1 |
| F13.7 | Étude des formats, conversions, contraintes (dont Blender Studio) | FE + BE | **[N]** | **Spike** documenté | v1 |
| F13.8 | Conversion automatique, optimisation serveur | BE | **[N]** | — | v2 |

**Acceptation** : un VRM valide est importé, prévisualisé et retrouvé dans la bibliothèque ; un fichier invalide produit un rapport clair, sans plantage.

### Phase 14 — Versions, publication et accès (scénario 6)

| ID | Fonctionnalité | Côté | Existant | À faire | Prio |
|---|---|---|---|---|---|
| F14.1 | Statuts : brouillon / validé / publié / déprécié | FE + BE | **[N]** | UI de statut | v1 |
| F14.2 | Avant de modifier une ressource : liste des compositions qui en dépendent | FE + BE | **[N]** | Vue d'impact | v1 |
| F14.3 | Épinglage de version et mise à jour contrôlée | FE + BE | **[N]** | Action « Mettre à jour » explicite | v1 |
| F14.4 | Export autorisé d'une composition (description + fichiers permis) | FE + BE | **[A]** export VRM/GLB | Export par composition | v1 |
| F14.5 | Capacités selon utilisateur / organisation / tenant du Core | FE + BE | **[N]** | `PermissionPort` branché sur le Core | v1 |
| F14.6 | Journal d'activité consultable | FE + BE | **[N]** | Vue en lecture | v2 |

**Acceptation** : modifier une ressource utilisée ne change **aucune** composition existante tant qu'aucune mise à jour n'est demandée ; un utilisateur sans droit ne voit ni n'active l'action interdite.

### Phase 15 — Extension et clôture

| ID | Fonctionnalité | Prio |
|---|---|---|
| F15.1 | Isoler la blockchain (NFT-lock, wallet, mint) derrière un réglage de configuration, désactivée par défaut | v1 |
| F15.2 | Documenter les points d'extension (types de personnages non humanoïdes, sources de modèles, moteurs de génération) | v1 |
| F15.3 | Budget de performance : poids des assets, KTX2, mémoire, temps de chargement | v1 |
| F15.4 | Tests de bout en bout et build complet du Core | v1 |
| F15.5 | Documentation développeur finale | v1 |

**Acceptation** : build du Core complet vert ; suite de non-régression F6.3 verte ; blockchain désactivée sans effet visible ni régression.

---

## 7. Répartition frontend / backend

| Capacité | Frontend | Backend (contrat attendu) |
|---|---|---|
| Ressources | Explorer, aperçu, filtrer, fiche | Enregistrer, versionner, classer, servir les fichiers (originaux et optimisés) |
| Import | Assistant, contrôles locaux, rapport | Réception, vérification, conversions, avertissements |
| Compatibilité | Calcul et affichage | Conservation des descripteurs, contrôle des éléments compatibles |
| Compositions | Composer, comparer, enregistrer, rouvrir | Conserver, versionner, gérer les variantes et les relations avec les ressources |
| Profils | Éditer, appliquer | Conserver, mettre à disposition des apps |
| Exécution | Rendre, animer, valider les capacités, rapporter | Interpréter les demandes de l'agent IA, **décider**, contrôler, transmettre les instructions |
| Accès | Masquer et désactiver selon les droits | Autoriser, filtrer par organisation / tenant |

Principe : **décision et orchestration = backend ; rendu et exécution graphique = frontend.**

---

## 8. Scénarios → fonctionnalités

| Scénario | Phases et fonctionnalités principales |
|---|---|
| 1. Bibliothèque de ressources | P7 (F7.3), P8 (F8.1–F8.5), P9 (F9.1–F9.3), P13 (F13.1–F13.6) |
| 2. Personnage personnalisé | P10 (F10.1–F10.4), P9 |
| 3. Variantes | P10 (F10.5–F10.7) |
| 4. Plusieurs applications EGEN | P12 (F12.1, F12.2, F12.6) |
| 5. Agent IA interactif | P11, P12 (F12.3, F12.4) |
| 6. Évolution dans le temps | P14 (F14.1–F14.3), P7 (invariant 2) |

---

## 9. Décisions à valider

| ID | Question | Recommandation | Bloque |
|---|---|---|---|
| D1 | Le Player vit-il dans l'app Character Factory ou dans un package partagé ? | Dans l'app d'abord (`runtime/`), API stable, extraction ensuite | P12 |
| D2 | Les assets et manifestes `loot-assets` : hébergés par EGEN ou conservés en externe ? | Les rapatrier (dépendance externe, disponibilité, licences) | P6, P8 |
| D3 | Formats pris en charge en v1 | VRM (humanoïde) + GLB en export ; FBX Mixamo pour les animations | P13 |
| D4 | Architecture de code (§5) | Valider par ADR en fin de P7 | P7 |
| D5 | Persistance avant le backend | IndexedDB (API du navigateur, aucune dépendance) | P7 |

---

## 10. Règles de contribution

**À faire**
- Une phase à la fois ; les modules listés uniquement.
- Marquer toute modification de code hérité par `// EGEN:` et la garder minimale.
- Écrire le test avant de déclarer une fonctionnalité terminée.
- Passer par `ports/` pour tout accès aux données, par `runtime/engine-adapter` pour tout accès au moteur.

**À ne pas faire**
- Ne pas ajouter de dépendance sans besoin identifié et validé.
- Ne pas copier de fichier 3D dans une composition.
- Ne pas mettre de logique de décision métier dans le rendu 3D.
- Ne pas importer `studio/` depuis `features/` ou `domain/`.
- Ne pas coder de moteur de comportement universel ni d'intégration Ara / Blender (hors périmètre).
- Ne pas modifier le Core pour contourner une difficulté de l'app (hors enregistrement documenté, ex. `routeRegex` de `esm-not-found-app`).

---

## 11. Suivi

| Phase | Statut |
|---|---|
| 1 à 4 | Terminées |
| 5 Identité et shell | En cours |
| 6 Stabilisation et cycle de vie | Code terminé (F6.1, F6.2, F6.4, F6.5) ; validation navigateur de la matrice F6.3 à faire |
| 7 Socle domaine | Code et docs terminés ; à valider : IndexedDB en navigateur, manifeste réel, ADR (D4) |
| 8 à 15 | À faire |

Correspondance avec la feuille de route initiale : ancienne P5 → P5 ; ancienne P6 → P6 ; ancienne P7 (extensibilité) → P7 (ports) et P15 ; ancienne P8 (validation) → P15.
