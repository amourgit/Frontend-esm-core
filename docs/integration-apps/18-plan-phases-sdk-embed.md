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
| P5b | Recentrage du SDK (règle d'or) et extensions | F, C | 12 capacités (11 depuis le retrait de `ai-tools`, protocole 0.5), contributions de slots, rail, dialogues, config |
| P5c | Droits d'iframe négociés + `egen-config.json` | F, C | `sandbox`/`allow` demandés par l'app, approuvés par l'opérateur ; déclaration publiée par l'app |
| P5d | Toasts partagés | F, C | `egen.notify`, politique `exclusive`/`rate`, dédoublonnage par `id` |
| P6 | Migration des apps et compatibilité v1.1 | C, apps | tweakcn (pilote), Character, Penpot ; suppression des enveloppes |
| P7 | Sécurité, SSO, E2E navigateur, vérificateur | C, F | Playwright, `egen check-app`, revue de sécurité |
| P8 | Voie unique : retrait de l'ancien pipeline | F, C, apps | suppression `esm-nextjs-utils`, pont 1.1, enveloppes, docs |

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
- [x] P1.7 `manifest.ts` : validation du manifeste (servi par l'app sous le nom `egen-config.json`, décision du 2026-11-26) et calcul des grants effectifs (demandé ∩ approuvé).
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

## P5c — Droits d'iframe négociés (`sandbox`/`allow`) et `egen-config.json` (décision du 2026-11-26)

> Sans cette phase, la migration P6 casse les trois apps : elles ont besoin de `allow-downloads`, `allow-modals`, `allow-popups-to-escape-sandbox` et `allow="clipboard-read; clipboard-write; fullscreen"`, impossibles avec le sandbox par défaut de `esm-embed-host`. Les droits doivent être **négociés** (l'app demande, l'opérateur approuve) — jamais figés dans le code (doc 17 §7 bis).

**Framework**
- [x] P5c.1 Protocole : bloc `iframe` dans le manifeste (`iframe.sandbox[]`, `iframe.allow[]` — demande) et dans les grants approuvés (plafond) ; listes blanches strictes de jetons `sandbox` et `allow` ; `effectiveGrants` calcule l'intersection ; rejet explicite des jetons hors liste.
- [x] P5c.2 Hôte : `createEmbedHost` accepte les droits effectifs `iframe` et pose `sandbox` + `allow` sur l'iframe ; avertissement `allow-same-origin` + `allow-scripts` sur origine non Core (existant, à conserver).
- [x] P5c.3 Client : rien à exposer (droits invisibles pour l'app une fois accordés) ; documenter dans le README que les droits se demandent dans `egen-config.json`.
- [x] P5c.4 Testing : `createTestHost`/`egen-embed-check` valident la forme `iframe` (jetons connus, plafonds) ; tests des listes blanches.
- [x] P5c.5 Publié (changesets) ; tests Framework verts. — Fait le 2026-11-27 : Framework PR #160 (+ release #161) ; publié sur npm : `esm-embed-protocol` 0.5.0, `esm-embed-host` 0.5.0, `esm-embed-testing` 0.5.0, `esm-embed-client` 0.3.1. 165 tests (66/40/22/37), CI verte. `effectiveIframe` est un export distinct de `effectiveGrants` (même module de calcul, `iframe` n'étant pas une capacité).

**Core**
- [x] P5c.6 Outillage : `checkEmbedManifest`/`checkApproved` acceptent et valident `iframe` (mêmes listes blanches que le protocole — parité testée) ; le verrou fige la demande et le plafond.
- [x] P5c.7 `embed-apps.json` transporte `manifest.iframe` + `approved.iframe` ; `external-apps.status.json` journalise demandé vs approuvé ; `EmbedFrame` passe `effectiveIframe(manifest.iframe, approved.iframe)` à `createEmbedHost` (pages et vues d'extension) ; tests `root.test.tsx` (intersection, non-approuvé = socle seul). Parité des listes blanches outillage ↔ protocole 0.5.0 testée (`tools/embed-apps.test.mjs`).
- [x] P5c.8 `egen-config.json` : l'app publie son propre fichier de déclaration à la racine de son URL (manifeste + `config` publique + `iframe` demandé) ; `external:sync`/`serve-prod` le lisent comme source par défaut, la déclaration `embed` de `external-apps.json` restant le **second recours** et le lieu de l'approbation. Tests d'outils.
  - ℹ Fait : `external-apps.json` → `embed[]` accepte `url` (voie normale : `<url>/egen-config.json`), `manifest` (URL/chemin) ou `declaration` (second recours, figée dans le verrou, `manifestSource: "inline"`) — une seule source par entrée ; la `config` publique du manifeste est fusionnée avec `embed[].config` (l'opérateur prime). 65 tests d'outils.
- [x] P5c.9 Docs 12, 17, 18 ; push + bilan.

## P5d — Toasts partagés (2026-11-26)

Demande : les apps externes transmettent leurs toasts au Core en temps réel, et ne les affichent pas elles-mêmes (pas de doublon).
- [x] P5d.1 Protocole : `notificationPolicy` (`exclusive`, `rate`), validation, `createSlidingLimiter`, `id` de dédoublonnage, sous-titre ≤ 500 ; 50 tests.
- [x] P5d.2 Hôte : anti-spam `RATE_LIMITED` par grant, réponse `{ displayed }`, le fournisseur peut répondre `false` ; 38 tests dont bout en bout.
- [x] P5d.3 Client : `egen.notify(toast, local?)` (point d'entrée unique, repli local), `coreDisplaysNotifications`, `useEgenNotify` ; 23 tests.
- [x] P5d.4 Testing : hôte de test (dédoublonnage), 3 scénarios de conformité, vérificateur (rappel du modèle), simulateur.
- [x] P5d.5 Core : adaptateur `esm-embed-app` (attribution à l'app, dédoublonnage 5 s par app+id, `id` non transmis à l'affichage), validation de la politique dans l'outillage (`grants.notifications`) ; docs 17 §5 ter ; 44 tests app, 60 tests outils.
- [x] P5d.6 Poussé compatible avec `esm-embed-host` 0.3.0 publié (cast commenté sur le retour de `show`).
- [x] P5d.7 Après publication de la release Framework (PR #158) : `deps:egen`, retirer le cast de `providers.ts`, vérifier le bout en bout `{ displayed }`. — Fait : `deps:egen` ciblé (`--ignore` de tous les autres paquets @egen-civitas : seules les plages `esm-embed-host`/`esm-embed-protocol` passent à `^0.5.0`), cast retiré de `providers.ts` (le type `void | boolean` de l'hôte 0.5.0 l'accepte).

## P6 — Migration des apps et compatibilité
- [x] P6.1 **tweakcn (pilote)** : publier `egen-config.json` à la racine (route `theme-studio`, `placement.rail`, `navigation`, `iframe` demandé : allow-downloads/allow-modals/allow-popups-to-escape-sandbox + clipboard/fullscreen, `config` publique), adopter `esm-embed-client` (langue, événements, **notifications via `egen.notify`/`useEgenNotify` — jamais de doublon de toast**, extensions) ; thème, session et API : directement auprès de leurs sources (Keycloak, service de thèmes), pas par le SDK ; **supprimer** `integrations/egen/esm-tweakcn-app/` et son workflow de release tarball ; basculer `external-apps.json` sur `embed`. — Fait le 2026-11-28 (dépôt `Frontend-esm-tweakcn-fork`, PR #1 mergée, 290 tests) : `app/egen-config.json/route.ts` (déclaration validée par `validateManifest`, URL via `EGEN_PUBLIC_URL`, 503 explicite sinon), `components/egen/egen-integration.tsx` (client SDK : navigation partagée, langue ; `goto` limité aux chemins internes), toasts routés vers le Core par le point central `hooks/use-toast.ts` (un seul afficheur, repli local hors Core), `/api/egen/host-origins` (origines = `EGEN_FRAME_ANCESTORS`) ; `integrations/`, `egen-bridge.js`, `egen-nav-sync` et le workflow tarball supprimés ; `EGEN.md` réécrit. Côté Core, l'entrée `embed` existe déjà (`external-apps.json`) ; **reste** : la faire pointer vers l'URL de production.
- [ ] P6.2 Character Factory : `egen-config.json` + client (navigation `none`) ; suppression de `integrations/egen/esm-character-app/`.
- [ ] P6.3 Penpot : `egen-config.json` + client si le fork peut être modifié ; sinon injection du script v1.1 (`egen-bridge.js`) en attendant P8, sans toucher au dépôt Penpot amont (référence en lecture seule : fournir les fichiers à y ajouter côté opérateur).
- [x] P6.4 Dépréciation de `esm-nextjs-utils` (réexport + avertissement), changesets. — Sans objet : le paquet a été directement supprimé (P8.6, Framework #160) ; `npm deprecate` des versions publiées reste une action opérateur.
- [ ] P6.5 Mise à jour des docs 15 (scénario C3), 16, 11 ; push + bilan.

## P7 — Sécurité, SSO, navigateur réel, outillage
- [ ] P7.1 Playwright : poignée de main, thème, événements, navigation (clic, F5, retour, lien partagé), droits iframe effectifs sur les trois apps migrées.
- [ ] P7.2 `egen check-app` (écart G4) étendu aux apps embarquées (`egen-config.json`, SDK, `frame-ancestors`, droits iframe demandés).
- [x] P7.3 ~~Capacité `auth`~~ **supprimée** (règle d'or) ; remplacée par le guide d'obtention de l'identité, des droits et du thème auprès de leurs sources (doc 17 §9). À valider avec la configuration réelle du realm Keycloak (même domaine enregistrable pour le SSO en iframe).
- [ ] P7.4 Revue de sécurité (liste de contrôle §6 du doc 17, dont droits iframe négociés et notifications sans doublon), fuzzing léger des gardes, rapport.
- [ ] P7.5 Doc de clôture et retour d'expérience ; push + bilan.

## P8 — Voie unique : retrait de l'ancien pipeline

> Décision du 2026-11-26 : **une seule voie propre (SDK embed)**. L'ancien pipeline « enveloppe par app + pont 1.1 » est retiré une fois les trois apps migrées et vérifiées en production. Les kinds `hosted`/`remote` (vraies apps Module Federation) **ne sont pas** concernées : elles restent la voie pour les apps externes rendues dans le Core.

**Core**
- [x] P8.1 `external-apps.json` : retirer les entrées `apps` des trois enveloppes (`@civitas/esm-penpot-app`, `@civitas/esm-tweakcn-app`, `@civitas/esm-character-app`) ; ne garder que les entrées `embed`.
- [x] P8.2 `egen-config.json` du Core : retirer les clés des enveloppes (`penpotUrl`, `studioUrl`, `characterUrl`, `title`, `heightOffset`) ; la configuration publique vit dans `egen-config.json` de chaque app / `embed[].config`.
- [x] P8.3 `external-apps/` : purge des bundles d'enveloppes obsolètes (`yarn external:sync` régénère le verrou sans eux ; le dossier est ignoré par git, rien à purger dans le dépôt).
- ℹ Fait le 2026-11-27 : `external-apps.json` ne contient plus que trois entrées `embed` (manifestes `<URL>/egen-config.json`, plafond approuvé dont `iframe`) ; `egen-config.json` du Core vidé ; exemples et tests sans référence aux enveloppes. **Prérequis côté apps** : chaque app doit publier son `egen-config.json` (P6.1–P6.3) avant `yarn external:sync`.

**Dépôts d'apps**
- [ ] P8.4 Supprimer `integrations/egen/esm-*-app/` dans tweakcn, Character Factory et penpot (fork) ; workflows de release tarball (`egen-*-app.yml`) ; dépendances `esm-nextjs-utils`/`esm-integration-utils` devenues inutiles.
- [ ] P8.5 Chaque app sert `egen-config.json` à la racine de son URL déployée et `frame-ancestors` limité à l'origine du Shell.

**Framework**
- [x] P8.6 `esm-nextjs-utils` : supprimer le paquet (après la dépréciation P6.4) ; déplacer ou retirer `assets/egen-bridge.js` selon qu'une app déployée l'injecte encore. — Fait le 2026-11-27 (Framework #160) : paquet et `egen-bridge.js` supprimés. **Reste opérateur** : `npm deprecate` des versions déjà publiées ; une app qui injecte encore `egen-bridge.js` (Penpot, P6.3) doit adopter le client avant redéploiement.
- [x] P8.7 (fait le 2026-11-27, protocole 0.5.0 / hôte 0.5.0 : `SUPPORTED_PROTOCOLS = [2]`, pont 1.1 et option `legacy` retirés, option `sandbox` remplacée par `iframe`) `esm-embed-host` : retirer le pont 1.1 (`handleLegacy`, `legacySend`, options `legacy`) quand plus aucune app ne parle `{ egen: 1 }` ; `esm-embed-protocol` : retirer `SUPPORTED_PROTOCOLS` 1 et les types legacy.
- [x] P8.8 `esm-integration-utils` : **conservé** (apps Module Federation) — vérifier qu'aucun doc ne le présente comme voie iframe.

**Vérification finale**
- [ ] P8.9 E2E : les trois apps fonctionnent en `kind: embed` (page, rail, TopBar, navigation partagée, notifications) ; `external-apps.status.json` ne contient plus que `kind: embed` ; `yarn external:check` propre ; tests Framework + Core + outils verts.
- [ ] P8.10 (partiel — fait le 2026-11-27 : doc 15 §C3 et §6 bis/ter/quater en historique/legacy, exemple A10 générique ; 16 déjà bandeau ; **reste** : 05, 11, 12, 00 après P6/P8.4–P8.9) Documentation : docs 15 (C3), 16 passés en « historique/legacy » ; 05, 11, 12, 00 à jour ; suppression des références aux enveloppes ; push + bilan.
