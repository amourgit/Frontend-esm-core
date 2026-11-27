# 18 — Plan de développement par phases : SDK d'intégration embarquée

Référence de conception : [17](17-sdk-embed-protocole-v2.md). Règle de conduite : **une phase terminée = tests verts + push sur `main` + bilan**, puis enchaînement immédiat sur la phase suivante. Dépôts : **F** = Frontend-esm-framework, **C** = Frontend-esm-core. Publication des paquets F par changesets (`release.yml`). Les pushs de travail se font sur `main`, `--no-verify` tant que les anciens tests ne sont pas réglés.

Suivi : cocher `[x]` dans ce fichier à la fin de chaque étape (mise à jour dans le même commit que le code).

| Phase | Objet | Dépôt | Livrable principal |
| --- | --- | --- | --- |
| P0 | Documentation et plan | C | docs 17 et 18, index |
| P1 | Protocole | F | `esm-embed-protocol` |
| P2 | Client SDK | F | `esm-embed-client` |
| P3 | Hôte | F | `esm-embed-host` |
| P4 | Test et simulateur | F | `esm-embed-testing` |
| P5 | Intégration Core (`kind: embed`) | C (+F) | `esm-embed-app`, outils `external-apps`, `serve-prod`, verrou |
| P5b | Recentrage du SDK (règle d'or) et extensions | F, C | 12 capacités, contributions de slots, rail, outils IA, dialogues, config |
| P6 | Migration des apps et compatibilité v1.1 | C, apps | tweakcn (pilote), Character, Penpot |
| P7 | Sécurité, SSO, E2E navigateur, vérificateur | C, F | Playwright, `egen check-app`, capacité `auth` (cadrage) |

---

## P0 — Documentation et plan (Core)
- [x] P0.1 Écrire le doc 17 (spécification, décisions, sécurité, manifeste).
- [x] P0.2 Écrire le doc 18 (ce plan).
- [x] P0.3 Ajouter 17 et 18 à l'index (`00-LISEZ-MOI.md`).
- [x] P0.4 Commit + push sur `main` du Core.

## P1 — Protocole `@egen-civitas/esm-embed-protocol` (Framework, zéro dépendance)
- [x] P1.1 Créer le paquet `packages/framework/esm-embed-protocol` (même squelette que `esm-integration-utils` : `package.json`, `tsconfig*.json`, `vitest.config.ts`, changeset `minor`).
- [x] P1.2 `constants.ts` : `EGEN_EMBED_PROTOCOL = 2`, versions supportées, limites par défaut (§3.1), codes d'erreur.
- [x] P1.3 `types.ts` : enveloppe de poignée de main (`hello`, `connect`, `port`), messages RPC (`req`, `res`, `sub`, `unsub`, `evt`, `ping`, `pong`, `bye`), `CapabilityId`, `Grant`, `EmbedManifest`.
- [x] P1.4 `guards.ts` : validateurs écrits à la main (sans bibliothèque) pour les enveloppes et messages RPC (rejet de tout champ inattendu de type invalide, taille).
- [x] P1.5 `negotiate.ts` : négociation de protocole et de versions de capacités (§4) → `{ granted, denied[] }`.
- [x] P1.6 `capabilities.ts` : catalogue (§5) : descripteurs, méthodes, événements, grant par défaut, validateurs d'arguments par méthode.
- [x] P1.7 `manifest.ts` : validation du manifeste `egen-app.json` et calcul des grants effectifs (demandé ∩ approuvé).
- [x] P1.8 `rpc.ts` : moteur RPC symétrique sur un `MessagePort` (table de dispatch fermée, délais, limites, abonnements, fermeture).
- [x] P1.9 Tests : gardes, négociation, manifeste, RPC sur **vrai `MessageChannel`** (appel, erreur, délai, abonnement, limite de débit, dispatch inconnu, tentative `constructor`/`__proto__`).
- [x] P1.10 README du paquet ; `yarn build` + `tsc` propres ; push + bilan.

## P2 — Client `@egen-civitas/esm-embed-client` (Framework)
- [x] P2.1 Squelette du paquet (dépend de `esm-embed-protocol`).
- [x] P2.2 `connect.ts` : `connectToEgen({ moduleName, capabilities, hostOrigins, timeoutMs })` : écoute `hello`, répond `connect`, reçoit `port`, vérifie source (`window.parent`) et origine, retourne le client.
- [x] P2.3 Mode dégradé : sans hôte v2 (délai dépassé) → client « autonome » (`client.connected === false`, capacités absentes ; appels rejetés `DENIED`, jamais d'exception synchrone).
- [x] P2.4 Proxys typés par capacité : `client.session.get()`, `client.theme.get()/on('change')`, `client.events.publish/subscribe`, `client.notifications.show`, `client.dialogs.confirm`, `client.api.fetch`, `client.navigation.*`, `client.flags`, `client.config`, `client.telemetry`, `client.lifecycle`, `client.aiTools`.
- [x] P2.5 Ponts utilitaires : synchronisation automatique du thème en variables CSS sur `:root` (option), titre et hauteur automatiques (reprise de `autoResize` du doc 16).
- [x] P2.6 Liaison React (sous-chemin `/react`, peer optionnel) : `EgenProvider`, `useEgen()`, `useEgenSession()`, `useEgenTheme()`, `useEgenEvent()`.
- [x] P2.7 Tests (`FakeShell` : vrai `MessageChannel` + fenêtres simulées, 16 tests) ; README ; build ; push + bilan.
- [x] P2.8 (ajout) Message `probe` au protocole (l'app peut charger après `load`) ; correction trouvée par les tests : table de rappels hôte → app prête avant l'ouverture du port.

## P3 — Hôte `@egen-civitas/esm-embed-host` (Framework)
- [x] P3.1 Squelette du paquet (dépend de `esm-embed-protocol`).
- [x] P3.2 `host.ts` : `createEmbedHost({ moduleName, src, manifest, grants, providers, sandbox, onTitle })` → `mount(container)`, `destroy()`, création de l'iframe sécurisée (reprise des règles `esm-nextjs-utils`).
- [x] P3.3 Poignée de main : `hello`, validation `connect` (source, origine, nonce, protocole), `port` + transfert, délai et repli 1.1.
- [x] P3.4 Application des grants : dispatch fermé construit **uniquement** avec les capacités accordées ; filtrage des champs de session, des sujets d'événements, des hôtes d'API.
- [x] P3.5 Capacités à lecture : `session` (filtrée), `tenant`, `locale`, `theme`, `config`, `flags` (noms sondables), `permissions` (sondes), `navigation` (reprend `navigation.ts` du doc 16 : chemins sûrs, paramètres sensibles, anti-boucle, plafond de débit), `lifecycle` (visibilité, focus, `canLeave`), `telemetry`. L'hôte définit les **interfaces** de fournisseurs (`HostProviders`) ; les **adaptateurs adossés aux services du Core** sont livrés en P5.5.
- [x] P3.6 Capacités à effets : `events` (espaces de noms par grant), `notifications`, `dialogs`, `api` (`createFetchApiProvider` : exécution côté Core, hôtes et en-têtes autorisés, taille, délai, sans cookies ni redirection vers l'externe), `ai-tools` (espaces de noms par grant, invocation hôte → app, désenregistrement à la fermeture). Branchement sur `esm-ai-tools` : P5.5.
- [x] P3.7 Compatibilité 1.1 : adaptateur qui traduit `ready/location/goto/title/resize/navigate` vers les fournisseurs (une app v1 reste fonctionnelle).
- [x] P3.8 Tests : grants (refus par défaut), usurpation d'origine/source, double `connect`, débit, fuite de `sessionId` impossible, `api` hors liste, événements hors espace de noms.
- [x] P3.9 README ; build ; push + bilan.
- [x] P3.10 (ajout) Refus `UNAVAILABLE` (capacité accordée sans fournisseur), `pickFields` partagé dans le protocole, réponse trop volumineuse signalée à l'appelant (`TOO_LARGE`) au lieu d'un délai ; 34 tests dont un bout en bout avec le vrai client (goto, report).

## P4 — `@egen-civitas/esm-embed-testing` (Framework)
- [x] P4.1 Simulateur d'hôte autonome (serveur Node + page HTML qui charge l'hôte réel sans bundler, par import map) : lance l'app dans une iframe, fournit des données de session/thème/événements configurables, journal des échanges.
- [x] P4.2 Suite de conformité : scénarios exécutables (poignée de main, négociation, refus, lecture session, événements, erreurs, dégradation) contre un client donné.
- [x] P4.3 Commande `egen-embed-sim` (bin) et documentation d'usage.
- [x] P4.4 Tests de la suite sur le client P2 ; build ; push + bilan.
- [x] P4.5 (ajout) `createTestHost` : hôte de test en mémoire pour les tests unitaires d'une app (vrai `HostConnection`, journal des appels, `emit.*`, `invokeTool`).
- ⚠ Limite connue : la page du simulateur est servie et son code chargé est vérifié côté serveur (15 tests) mais **son rendu et ses boutons n'ont pas été exécutés dans un navigateur réel** (aucun navigateur disponible dans l'environnement de développement) : couvert par P7.1.

## P5 — Intégration Core : `kind: embed` (Core + Framework)
- [x] P5.1 Lire et reprendre les points d'ancrage : `tools/external-apps.mjs`, `tools/sync-external-apps.mjs`, `tools/serve-prod.mjs`, `tools/runtime-config.mjs`, enregistrement des pages (Shell).
- [x] P5.2 Schéma `external-apps.json` : entrée `embed` (manifeste URL ou chemin, grants, limites) ; validation (manifeste valide, grants ⊆ demandé, https, route libre).
- [x] P5.3 Synchro : lecture du manifeste (URL https ou chemin local), validation, SHA-256 (source et figé), **plafond approuvé écrit dans le verrou** ; `external:check` détecte la dérive. *Décision : les grants **effectifs** ne sont pas calculés par les outils (sans dépendance) mais dans le navigateur par `effectiveGrants` du protocole : une seule implémentation (voir 17 §7).*
- [x] P5.4 `serve-prod` : revérifie le manifeste au démarrage (rejet en cas d'écart), synthétise les pages du registry pour l'app générique, expose la configuration d'instance.
- [x] P5.5a Adaptateurs de fournisseurs adossés aux services du Core : **tous livrés pour les 12 capacités** (langue, tenant, drapeaux, événements, notifications, dialogues, configuration publique, extensions, outils IA, télémétrie ; navigation et cycle de vie par l'hôte). Voir P5b pour le périmètre recentré.
- [x] P5.5 App générique `packages/apps/esm-embed-app` (`@egen/esm-embed-app`) : lit `<spa>/embed-apps.json`, retrouve l'entrée par la route (`coreSubpath`), calcule les grants effectifs (`effectiveGrants`), monte `esm-embed-host`, démonte proprement. Entrée de navigation déclarative `navEntry` (TopBar) ; `placement.rail` **non supporté** (le `railPanel` interne est lié à une section figée).
- [x] P5.6 Statut (`external-apps.status.json`) : `kind: embed`, grants effectifs, avertissements.
- [x] P5.7 Tests d'outils (`yarn test:tools`) et tests de l'app ; docs 12, 15 mises à jour ; push + bilan.
- [x] P5.8 (ajout) Tests d'outils : 12 nouveaux (`embed-apps.test.mjs`) ; suite `yarn test:tools` 54/54. Régression évitée : trois tests existants copient les outils par liste de fichiers, `embed-apps.mjs` y a été ajouté.
- [x] P5.9 Paquets publiés (protocole/hôte/testing 0.2.0, client 0.1.1, incluant `api.paths` deny-by-default) ; dépendances `@egen-civitas/*` du Core à jour hors `esm-theme` (figé) ; la CI `yarn verify` du Core (lint, types, tests, contrôles de routes) passe sur l'app.
- [x] P5.10 Tests : app 16 (entrées, fournisseurs, bus d'événements, page racine), outils 54 ; eslint propre.

## P5b — Recentrage du SDK (règle d'or) et extensions

Décision du 2026-11-26 : **le SDK ne transporte que ce dont le Core est lui-même la source** (doc 17 §2.0). Identité/session, droits, thème et appels API relayés sortent du SDK : l'app les obtient directement (Keycloak, backends, service de thèmes) ; cela supprime une classe entière de failles et lève les « écarts » précédents (`theme`, `api` absents) par la suppression plutôt que par un contournement. Les capacités que le Core doit fournir lui-même sont toutes servies ; l'architecture du Core n'a **pas** eu besoin d'évoluer.

**Framework**
- [x] P5b.1 Protocole : retrait de `session`, `permissions`, `theme`, `api` (+ `pickFields`, chemins d'API, champs de session) ; `REMOVED_CAPABILITIES` (rejet explicite avec la raison et la voie à suivre) ; 12 capacités.
- [x] P5b.2 Capacité `extensions` (`discover`/`contribute` par slot, motifs `annuaire-*`), contributions `extensions[]` du manifeste (validation : nom, slot, vue, `meta` ≤ 4 Ko, `iconUrl` même origine, 20 max), `allowedContributions`.
- [x] P5b.3 Client : retrait des façades, façade `extensions`, hooks `useEgenLocale`, `useEgenTenant`, `useEgenExtensions`.
- [x] P5b.4 Hôte : fournisseur `extensions`, retrait de `createFetchApiProvider` ; **pont 1.1 sans session**.
- [x] P5b.5 Testing : `createTestHost` (extensions), conformité (règle d'or), simulateur, `egen-embed-check` (contributions, vues, capacités retirées).
- [x] P5b.6 Publiés : protocole/hôte/testing 0.3.0, client 0.2.0 ; 120 tests Framework.

**Core**
- [x] P5b.7 Outillage : catalogue recentré, `REMOVED_CAPABILITIES`, validation des contributions, approbation par slot (`approved.extensions.contribute`), `embed[].config`, registry : page + une extension par contribution **approuvée** (`extensionView` / `railPanel` / `navEntry`, `meta.embed`), `embed-apps.json` (`contributions`, `config`) ; 59 tests d'outils.
- [x] P5b.8 `esm-embed-app` : vue d'extension (iframe dans un slot), panneau de rail (`SectionNavPanel` via la `meta` de sa propre extension), dialogue de confirmation natif, outils IA (`registerTool`/`removeTool`, id `embed.<module>.<outil>`), découverte d'extensions (filtrée par privilèges et drapeaux du Core, notification dédoublonnée), configuration partagée ; 40 tests, eslint propre.
- [x] P5b.9 `.gitignore` : `src/lib/` n'est plus ignoré (le motif `lib` masquait du code source) ; dépendances `@egen-civitas/*` mises à jour (`deps:egen`).
- [x] P5b.10 Docs 12, 17, 18 mises à jour.

## P5c — Toasts partagés (2026-11-26)

Demande : les apps externes transmettent leurs toasts au Core en temps réel, et ne les affichent pas elles-mêmes (pas de doublon).
- [x] P5c.1 Protocole : `notificationPolicy` (`exclusive`, `rate`), validation, `createSlidingLimiter`, `id` de dédoublonnage, sous-titre ≤ 500 ; 50 tests.
- [x] P5c.2 Hôte : anti-spam `RATE_LIMITED` par grant, réponse `{ displayed }`, le fournisseur peut répondre `false` ; 38 tests dont bout en bout.
- [x] P5c.3 Client : `egen.notify(toast, local?)` (point d'entrée unique, repli local), `coreDisplaysNotifications`, `useEgenNotify` ; 23 tests.
- [x] P5c.4 Testing : hôte de test (dédoublonnage), 3 scénarios de conformité, vérificateur (rappel du modèle), simulateur.
- [x] P5c.5 Core : adaptateur `esm-embed-app` (attribution à l'app, dédoublonnage 5 s par app+id, `id` non transmis à l'affichage), validation de la politique dans l'outillage (`grants.notifications`) ; docs 17 §5 ter ; 44 tests app, 60 tests outils.
- [x] P5c.6 Poussé compatible avec `esm-embed-host` 0.3.0 publié (cast commenté sur le retour de `show`).
- [ ] P5c.7 Après publication de la release Framework (PR #158) : `deps:egen`, retirer le cast de `providers.ts`, vérifier le bout en bout `{ displayed }`.

## P6 — Migration des apps et compatibilité
- [ ] P6.1 **tweakcn (pilote)** : ajouter `egen-app.json`, adopter `esm-embed-client` (langue, événements, notifications, extensions) ; thème, session et API : directement auprès de leurs sources (Keycloak, service de thèmes), pas par le SDK ; retirer le wrapper `esm-tweakcn-app` du Core au profit de l'entrée `embed`.
- [ ] P6.2 Character Factory : manifeste + client (navigation `none`).
- [ ] P6.3 Penpal : manifeste + injection du script v1.1 ou client selon le routage constaté (`hash` ou `history`), sans toucher au dépôt Penpal (référence en lecture seule : fournir les fichiers à y ajouter côté opérateur).
- [ ] P6.4 Dépréciation de `esm-nextjs-utils` (réexport + avertissement), changesets.
- [ ] P6.5 Mise à jour des docs 15 (scénario C3), 16, 11 ; push + bilan.

## P7 — Sécurité, SSO, navigateur réel, outillage
- [ ] P7.1 Playwright : poignée de main, thème, événements, navigation (clic, F5, retour, lien partagé) sur tweakcn.
- [ ] P7.2 `egen check-app` (écart G4) étendu aux apps embarquées (manifeste, SDK, `frame-ancestors`).
- [x] P7.3 ~~Capacité `auth`~~ **supprimée** (règle d'or) ; remplacée par le guide d'obtention de l'identité, des droits et du thème auprès de leurs sources (doc 17 §9). À valider avec la configuration réelle du realm Keycloak (même domaine enregistrable pour le SSO en iframe).
- [ ] P7.4 Revue de sécurité (liste de contrôle §6 du doc 17), fuzzing léger des gardes, rapport.
- [ ] P7.5 Doc de clôture et retour d'expérience ; push + bilan.
