# Réforme Tweakcn — état final

> **Statut : ACTUEL (état final, côté core) — mis à jour le 2026-11-23.** Ce document n'est plus un plan : il fige ce qui est fait.
> L'avancement vivant de la chaîne « système de design » est dans `docs/reforme-tokiforge/SUIVI.md` (seul document de statut).

Référence : `docs/architecture-declaration/ajustement-reforme.md` (§3.3, §12). Tweakcn est un **service indépendant**, déployé par EGEN Kernel,
avec son propre état, ses données et son cycle de vie. Le core et le framework n'en contiennent **aucun code** : il ne reste dans le core que
le document de vision, qui le cite comme produit de l'écosystème, et l'**enveloppe d'application externe** décrite dans `docs/integration-apps/15` (§6 ter).

## Partie A — Core (`Frontend-esm-core`) : terminée

| Phase | Contenu | Statut |
|-------|---------|--------|
| C1 | Suppression totale de l'ancienne app interne et de ses accessoires (`esm-theme-studio-app`, `docs/theme-studio`, `docs/integration-tweakcn.md`, `NOTICE-tweakcn.md`, outils `theme-studio-*`, règles eslint/prettier/gitignore/lint-staged, `@source not` Tailwind, regex 404, lien Paramètres › Apparence, entrées `yarn.lock`) | **FAIT** (mergé) |
| C2 | Aucune trace de Tweakcn côté framework | **FAIT** (rien à supprimer) |

## Partie B — Fork `amourgit/Frontend-esm-tweakcn-fork` (base : amont `jnsahaj/tweakcn`, Apache-2.0)

Branche `main` (ancienne branche de travail `feature/civitas-egen`, fusionnée par fast-forward puis supprimée le 2026-11-24). Les phases F0 à F7 (licence et attribution, retrait de la vitrine commerciale, redirection vers l'éditeur, décision auth/BDD,
identité CIVITAS EGEN, image Docker, contrat de sortie vers TokiForge, documentation de déploiement) sont **faites selon `SUIVI.md` §3** ;
leur détail et leurs critères de validation sont dans le dépôt du fork, qui en est la source de vérité.

**Non confirmé** (décision **D13** du suivi) : l'état de `main` du fork et le **déploiement réel**. Tant que D13 n'est pas répondue, ne rien affirmer d'autre ici.

## Côté Core : l'application externe

`@civitas/esm-tweakcn-app` (route `theme-studio`, iframe) : voir `docs/integration-apps/15-scenarios-integration-externe.md` §6 ter et `16-navigation-partagee-apps-externes.md`.
L'affichage dans un navigateur n'y est **pas vérifié**.

## Suite

La distribution des thèmes (TokiForge) n'est plus décrite ici : voir `docs/reforme-tokiforge/` (`SUIVI.md`, `PARCOURS-COMPLET.md`).
