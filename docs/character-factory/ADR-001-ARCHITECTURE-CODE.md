# ADR-001 — Architecture de code du frontend Character Factory (F7.7)

**Statut** : proposé — **en attente de validation** (décision D4). Les choix D1 à D5 ci-dessous reprennent les recommandations de la feuille de route ; ils sont appliqués par défaut tant qu'ils ne sont pas contredits.

## Contexte
CharacterStudio est un éditeur monolithique : le moteur 3D, l'interface et les données (manifestes) sont couplés. La vision EGEN (`ajout-info.md`) demande des ressources réutilisables, des compositions par référence, une exécution embarquable dans d'autres apps, et un backend qui décide.

## Décision
Séparer en couches avec dépendances à sens unique :

```
domain  <-  ports  <-  services  <-  features (UI React)
                 ^                         |
            adapters (memory, legacy-manifest, browser-storage, http)
runtime (three, sans React)  ->  domain ;  accède à CharacterStudio uniquement via runtime/engine-adapter
studio/ (code hérité) : modifications minimales marquées `// EGEN:`
```

- `domain` : types et invariants purs.
- `ports` : interfaces (ce dont on a besoin).
- `services` : cas d'usage qui appliquent les invariants.
- `adapters` : implémentations interchangeables (local aujourd'hui, backend demain).
- Les règles sont **appliquées par un test** (`tests/unit/architecture.test.js`).

## Décisions associées (par défaut)
| ID | Décision |
|---|---|
| D1 | Le Player vit dans l'app (`runtime/`), avec une API stable ; extraction en package partagé ultérieure |
| D2 | Les assets `loot-assets` sont à rapatrier chez EGEN (voir `ASSETS-EXTERNES.md`) |
| D3 | v1 : VRM humanoïde ; export GLB ; FBX Mixamo pour les animations |
| D4 | Cette architecture |
| D5 | Persistance locale IndexedDB tant que le backend n'existe pas |

## Conséquences
- (+) Le backend se branche en remplaçant des adaptateurs, sans toucher aux services ni à l'UI.
- (+) Les invariants (références épinglées, versions immuables) sont testés indépendamment du moteur 3D.
- (−) Un peu plus de fichiers qu'une application monolithique ; la discipline de dépendance repose sur le test d'architecture.
- (−) L'adaptateur IndexedDB n'est pas couvert par les tests automatiques (jsdom sans IndexedDB) : validation en navigateur requise.

## Limites connues (à ne pas masquer)
- Le schéma de manifeste est celui lu par `CharacterManifestData.js` ; l'adaptateur est testé sur un manifeste **synthétique**, pas sur un manifeste réel.
- `traitRestrictions` n'est pas interprété (phase 9). Le type `part` existe car le manifeste historique ne distingue pas vêtement / accessoire.
