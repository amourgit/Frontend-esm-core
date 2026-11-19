# Réforme Tweakcn — plan par phases

Référence : `docs/architecture-declaration/ajustement-reforme.md` (§3.3, §12) — Tweakcn est un **service indépendant**,
déployé par EGEN Kernel, avec son propre état, ses données et son cycle de vie. Le core et le framework n'en contiennent
**aucun code**. Il ne reste dans le core que le document de vision, qui le cite comme produit de l'écosystème.

Règle de travail : à chaque phase → tests → validation → push, puis phase suivante. Branche : `feature/ajustement-reforme`.

## Partie A — Core (`Frontend-esm-core`)

| Phase | Contenu | Statut |
|-------|---------|--------|
| C1 | Suppression totale : `esm-theme-studio-app`, `docs/theme-studio`, `docs/integration-tweakcn.md`, `NOTICE-tweakcn.md`, outils `theme-studio-*`, règles eslint/prettier/gitignore/lint-staged, `@source not` Tailwind, regex 404, lien Paramètres › Apparence, entrées `yarn.lock` | fait |
| C2 | Aucune trace côté framework (vérifié : seul le document de vision le cite) | fait (rien à supprimer) |

## Partie B — Fork `amourgit/Frontend-esm-tweakcn-fork` (base : amont `jnsahaj/tweakcn`, Apache-2.0)

| Phase | Contenu | Critère de validation |
|-------|---------|-----------------------|
| F0 | Branche `feature/civitas-egen`, conservation de `LICENSE` Apache-2.0 + `NOTICE` d'attribution à l'amont | build amont inchangé |
| F1 | Retrait de la vitrine commerciale : `/` (accueil/marketing), `/pricing`, `/success`, `/community`, `/ai`, `/figma`, `/privacy-policy`, `/dashboard`, webhook Polar, `api/subscription`, dépendances paiement | `next build` vert, aucune route SaaS |
| F2 | Redirection de `/` vers `/editor/theme` ; **éditeur complet, thèmes prédéfinis, import/export, enregistrement conservés** | parcours éditeur OK |
| F3 | Décision auth/BDD à valider avec toi (voir « Points à trancher ») | décision écrite |
| F4 | Identité CIVITAS EGEN : nom, logos (`branding/` du core), palette, métadonnées, favicon, textes ; retrait des liens/analytics de l'amont | revue visuelle |
| F5 | Image Docker (`Dockerfile`, `docker-compose.yml`) : variables d'environnement documentées, healthcheck, publication d'une image versionnée | `docker build` + démarrage OK |
| F6 | Contrat de sortie vers TokiForge : lecture/export du thème (API `v1/themes` conservée) + notification « nouvelle version » **après** enregistrement | test d'intégration |
| F7 | Documentation de déploiement pour EGEN Kernel | doc relue |

## Points à trancher (F3)
Tweakcn amont utilise Better Auth + PostgreSQL (Drizzle). « Garder toutes ses dépendances » implique de garder la BDD pour
stocker les thèmes. Questions : garde-t-on la connexion (compte/OAuth) ou un mode mono-tenant derrière l'authentification
CIVITAS ? Les routes `oauth/*` servent l'amont à émettre des jetons : à conserver seulement si TokiForge doit s'authentifier ainsi.

## Ensuite
TokiForge : après les composants UI ESM (Tailwind/TSX, variantes) en cours dans le module style du framework.
