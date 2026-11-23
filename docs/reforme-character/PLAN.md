# Réforme Character — plan par phases

Référence : `docs/reforme-character.md`. Character est un **projet autonome** (dépôt `amourgit/egen-character-factory`),
CharacterStudio M3-org en est le socle initial remplaçable. Le Core ne contient plus ni éditeur de personnages, ni gestion
de modèles 3D, ni dépendance à M3-org (§22).

Règle de travail : à chaque phase → test → validation → push. Branche : `feature/ajustement-reforme`.

| Phase | Contenu | Statut |
|-------|---------|--------|
| CH0 | Inventaire ; étiquette `archive/character-factory-avant-reforme` (état exact du core avant retrait) | fait |
| CH1 | Préservation dans le projet : branche `feature/reforme-character` de `egen-character-factory`, dossier `egen/` (couche EGEN, tests, config, patch des 12 fichiers adaptés vérifié octet pour octet) ; docs `docs/egen/` déjà identiques | fait |
| CH2 | Retrait du Core : package `esm-character-factory-app` (117 Mo + pile web3/Solana/three-vrm), `docs/character-factory`, `docs/ajout-info.md` (brief d'intégration abandonné), exclusion `character-factory` du 404, `yarn.lock` | fait |
| CH3 | Framework : aucune référence au projet Character (vérifié) | fait (rien à supprimer) |
| CH4 | Point d'usage côté EGEN | fait : application externe `@civitas/esm-character-app` (iframe), voir doc 15 §6 quater |

## CH4 — comment EGEN utilise Character
Le document demande que le Core reste « préparé à collaborer avec des domaines externes autonomes » sans connaître la
fabrication des personnages. Aucun code Character n'est conservé. L'intégration future passera par les contrats
(`BACKEND-CONTRATS.md` du projet) et par le mécanisme d'application déclarée par configuration décrit dans
`ajustement-reforme-configuration.md` (framework), pas par une application interne au Core.
