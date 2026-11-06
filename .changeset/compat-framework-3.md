---
'@egen/esm-home-app': patch
'@egen/esm-implementer-tools-app': patch
'@egen/esm-login-app': major
'@egen/esm-offline-tools-app': major
---

Compatibilité avec le framework 3.x (couche clinique retirée) : les apps n'utilisent plus d'API supprimées, et restent compatibles avec les versions 2.x actuellement publiées.

- `esm-home-app` : la vitrine de composants ne présente plus `NumericDataPoint`.
- `esm-implementer-tools-app` : suppression des éditeurs de valeur « concept », « type d'attribut de personne » et « type d'identifiant d'entité », liés aux types de configuration `Type.ConceptUuid`, `Type.PersonAttributeTypeUuid` et `Type.EntityIdentifierTypeUuid` (retirés du framework) ; ces valeurs s'éditent désormais comme n'importe quel texte.
- `esm-offline-tools-app` : app neutre : plus de colonnes sexe/âge ni de type de ressource propre à un métier. `fetchCurrentEntity` (retiré du framework) est remplacé par un utilitaire local `fetchEntity` qui interroge la ressource REST `${restBaseUrl}/entity` et renvoie un `OfflineEntity` (`id`, `name`, champs libres) ; la dépendance de types externe qui servait à cette app est retirée. L'ancien repli sur les entités `entity-registration` enregistrées hors-ligne n'est pas repris, aucune app de ce dépôt n'en produit (le contenu de ces éléments de synchronisation est lu sous la clé `entity`).
- `esm-login-app` : suppression du sélecteur de lieu de connexion (page `login/location`, extension `location-picker`, lien « changer de lieu » `location-changer`) et de la configuration `chooseLocation` ; le changement d'espace passe par le sélecteur d'espace de la navigation. Le texte « poweredBySubtext » ne mentionne plus de système de dossier médical.
