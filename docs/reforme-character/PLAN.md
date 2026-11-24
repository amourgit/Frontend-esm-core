# Réforme Character — état final

> **Statut : ACTUEL (état final) — mis à jour le 2026-11-23.** Ce document n'est plus un plan : il fige ce qui est fait.
> L'avancement vivant de la réforme du système de design est dans `docs/reforme-tokiforge/SUIVI.md` ; Character n'en fait pas partie, il est ici pour mémoire.

Référence : `docs/reforme-character.md`. Character est un **projet autonome** (dépôt `amourgit/egen-character-factory`),
CharacterStudio M3-org en est le socle initial remplaçable. Le Core ne contient plus ni éditeur de personnages, ni gestion
de modèles 3D, ni dépendance à M3-org (§22).

| Phase | Contenu | Statut |
|-------|---------|--------|
| CH0 | Inventaire ; étiquette `archive/character-factory-avant-reforme` (état exact du core avant retrait) | **FAIT** |
| CH1 | Préservation dans le projet : branche `main` de `egen-character-factory` (ancienne branche de travail `feature/reforme-character`, fusionnée par fast-forward puis supprimée le 2026-11-24), dossier `egen/` (couche EGEN, tests, config, patch des 12 fichiers adaptés vérifié octet pour octet) ; docs `docs/egen/` déjà identiques | **FAIT** |
| CH2 | Retrait du Core : package `esm-character-factory-app`, `docs/character-factory`, `docs/ajout-info.md`, exclusion `character-factory` du 404, `yarn.lock` | **FAIT** |
| CH3 | Framework : aucune référence au projet Character (vérifié) | **FAIT** (rien à supprimer) |
| CH4 | Point d'usage côté EGEN : application externe `@civitas/esm-character-app` (iframe), voir `docs/integration-apps/15` §6 quater | **FAIT** |

## État réel (à ne pas surévaluer)

- Aucun code Character n'est conservé dans le Core ; le Core ne connaît que l'enveloppe d'application externe.
- Une **image Docker est préparée** dans le dépôt Character, mais **jamais construite** (aucun Docker dans l'environnement précédent ; étapes rejouées à la main).
- L'**affichage dans un navigateur n'est pas vérifié** (WebGL).
- L'intégration passe par les contrats du projet (`BACKEND-CONTRATS.md`) et par le mécanisme d'application déclarée par configuration (`ajustement-reforme-configuration.md`, framework), pas par une application interne au Core.
