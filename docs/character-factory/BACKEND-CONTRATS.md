# Contrats attendus du backend EGEN (F7.6)

Document **fonctionnel** dérivé des ports de `src/ports/index.ts`. Il dit **ce dont le frontend a besoin**, pas comment le backend le réalise (aucune technologie, aucun protocole imposé). Le backend n'est pas dans le périmètre « CharacterStudio d'abord » : tant qu'il n'existe pas, des adaptateurs locaux (`src/adapters/memory`, `browser-storage`) tiennent ce rôle.

Principe : **le backend décide et orchestre ; le frontend affiche et exécute.**

| Besoin | Port | Opérations attendues | Règles que le backend doit garantir |
|---|---|---|---|
| Catalogue de ressources | `ResourceRepository` | lister (filtres : type, texte, étiquettes, collection) ; lire une ressource (version précise ou la plus récente non dépréciée) ; lister les versions | Les fichiers (original, optimisé, aperçu) sont servis ; les ressources `published` sont immuables |
| Compositions | `CompositionRepository` | lister ; lire (version précise ou la plus haute) ; lister les versions ; enregistrer `(id, version)` ; supprimer un brouillon | Refuser la modification d'une version non brouillon ; refuser toute référence à une ressource inexistante ; ne jamais stocker de fichier 3D dans une composition |
| Profils de présentation | `ProfileRepository` | lister ; lire ; enregistrer ; supprimer | `latest-published` n'est valide que dans un profil, jamais dans une composition |
| Droits | `PermissionPort` | `can(action, sujet)` selon utilisateur / organisation / tenant | Filtrer les ressources visibles par organisation / tenant |
| Exécution | `RuntimeChannel` | pousser des `Instruction` vers une instance ; recevoir des `InstructionReport` | Le backend **décide** de l'instruction ; le frontend vérifie qu'elle est autorisée par le profil (`allowedCapabilities`) et renvoie un rapport |

## Formats d'échange

Les structures `Resource`, `Composition`, `PresentationProfile`, `StateSet`, `Instruction`, `InstructionReport` sont décrites dans `src/domain/types.ts` et `ROADMAP-CHARACTER-FACTORY.md` §4. Les valeurs de `kind`, `status`, `role` et les types d'instructions sont des **listes fermées** (`RESOURCE_KINDS`, `PUBLICATION_STATUSES`, `FILE_ROLES`, `INSTRUCTION_TYPES`).

## Codes d'erreur métier (`DomainError`)

`INVALID`, `NOT_FOUND`, `IMMUTABLE_VERSION`, `MISSING_REFERENCE`, `ALREADY_EXISTS` : le backend devrait les reprendre à l'identique pour que le frontend les traite de la même façon quel que soit l'adaptateur.

## Hors périmètre de ce document

Conversion et optimisation de fichiers, pipeline Blender, canal temps réel réseau, moteur de décision de l'agent IA (voir `ajout-info.md`).
