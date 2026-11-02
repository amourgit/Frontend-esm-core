---
'@egen/esm-home-app': patch
'@egen/esm-implementer-tools-app': patch
'@egen/esm-offline-tools-app': patch
---

Compatibilité avec le framework 3.x (couche clinique retirée) : les apps n'utilisent plus d'API supprimées, et restent compatibles avec les versions 2.x actuellement publiées.

- `esm-home-app` : la vitrine de composants ne présente plus `NumericDataPoint`.
- `esm-implementer-tools-app` : suppression des éditeurs de valeur « concept », « type d'attribut de personne » et « type d'identifiant patient », liés aux types de configuration `Type.ConceptUuid`, `Type.PersonAttributeTypeUuid` et `Type.EntityIdentifierTypeUuid` (retirés du framework) ; ces valeurs s'éditent désormais comme n'importe quel texte.
- `esm-offline-tools-app` : `fetchCurrentEntity` (retiré du framework) est remplacé par un utilitaire local `fetchEntity` (même ressource, `/ws/fhir2/R4/Entity`) ; l'ancien repli sur les entités `entity-registration` enregistrées hors-ligne n'est pas repris, aucune app de ce dépôt n'en produit. `@types/fhir` est déclaré explicitement, le core ne le recevant plus via `esm-globals`.
