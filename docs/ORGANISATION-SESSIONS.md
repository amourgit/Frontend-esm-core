# Organisation du travail — chantiers parallèles

> Relevé du 2026-11-26, établi à partir de l'historique de `main` des dépôts `Frontend-esm-core` et `Frontend-esm-framework` (commits depuis le 22/11, classés par chemins touchés) et des documents de suivi. **À relire et corriger par le propriétaire** : l'attribution à des « sessions » est déduite des chemins et des messages, l'identité Git ne les distingue pas (`noreply@anthropic.com` est commune ; `claude@anthropic.com` ne correspond qu'à la session terminée de retrait de Carbon, 17–21/11).

## 1. Chantiers actifs

| Chantier | Périmètre (chemins) | Document de suivi | Paquets publiés concernés |
|---|---|---|---|
| **Design / thème** | `framework/esm-theme`, `esm-styleguide`, `tooling/tailwind-preset`, apps du Core qui lisent le thème ; `docs/reforme-tokiforge/` | `docs/reforme-tokiforge/SUIVI.md` | `esm-theme`, `esm-styleguide`, `tailwind-preset` |
| **Embarqué** (protocole v2, apps externes) | `framework/esm-embed-{protocol,host,client,testing}`, `apps/esm-embed-app`, `docs/integration-apps/15-18` | `docs/integration-apps/18-*.md` (plan par phases) | `esm-embed-*` |
| **IA** | `framework/esm-ai-*` (retirés le 2026-11 : nouvelle architecture à venir), `docs/integration-ai-*.md` | `docs/integration-ai-interaction-agent.md` | `esm-ai-tools`, `esm-ai-channel`, `esm-ai-extensions`, `esm-ai-framework` |
| Retouches d'interface | `esm-app-shell`, topbar, footer | — (messages de commit) | `esm-app-shell` |

## 2. Incohérences déjà observées (faits)

1. **Branche partielle fusionnée** : la branche de bascule du thème (P2.2–P2.3 seulement) a été fusionnée (PR #153) puis publiée : `esm-theme` 2.0.0 et le shell 3.1.x sont sortis avant le styleguide migré → thème incohérent côté Core.
2. **Une seule PR de release pour tous** : elle publie ensemble les changesets des trois chantiers (ex. PR #156 : styleguide 6, preset 3, ai-tools 3, `esm-embed-*` 0.3 d'un coup).
3. **Même fichier, deux sessions** : la capacité `theme` de `esm-embed-client` a été supprimée par le chantier embarqué pendant que le chantier design la modifiait → conflit de rebase.
4. **Fichiers non versionnés** : `esm-embed-app/src/lib/` était ignoré par `.gitignore` (corrigé `d2b5334`) : le dépôt ne passait plus ses propres tests sur un clone propre.
5. **Versions épinglées à la main** (`resolutions` d'`esm-theme` à `^1.1.0` le 24/11) pour contenir (1), puis relevées.
6. **Hook `pre-push` du Core** qui lance toute la vérification et échoue sur des tests à délai court sous charge : contourné à plusieurs reprises.

## 3. Règles proposées

1. **Une branche par chantier** (`chantier/design`, `chantier/embarque`, `chantier/ia`), **jamais fusionnée tant que le chantier n'est pas complet et validé** (PR en brouillon). Une étape intermédiaire va sur la branche du chantier, pas sur `main`.
2. **Changesets nommés par chantier** : `design-*.md`, `embarque-*.md`, `ia-*.md`. La PR de release n'est fusionnée **qu'après confirmation de chaque chantier concerné** (liste ci-dessous) ; une seule personne la fusionne.
3. **Zones de propriété** : le tableau du §1 fait foi. Modifier un fichier hors de sa zone → l'écrire dans le suivi du chantier propriétaire **avant** de pousser.
4. **Avant de commencer** : `git fetch` ; lire `git log origin/main --since="2 days"` et le suivi des autres chantiers. **Avant de pousser** : rebase sur `origin/main`, build et tests des paquets touchés **et de leurs dépendants**.
5. **Le Core ne suit le framework qu'après publication complète** : `yarn deps:egen`, puis `yarn verify` ; pas de `resolutions` épinglées à la main sans entrée dans le suivi.
6. **Contournement d'un hook** (`HUSKY=0`) : seulement pour de la documentation, et consigné dans le suivi.
7. **Messages de commit préfixés par le chantier** (`[design]`, `[embarqué]`, `[ia]`) pour que l'historique reste lisible.

## 4. Avant de fusionner une PR de release

- [ ] Chaque chantier présent dans la PR a confirmé « prêt » dans son suivi.
- [ ] `main` est vert (build, tests, `publint`, `attw`, pack/installation isolée).
- [ ] Les paquets dépendants entre eux sont publiés ensemble (ex. thème ↔ styleguide ↔ preset).
- [ ] Le Core a une branche prête à consommer les nouvelles versions.
