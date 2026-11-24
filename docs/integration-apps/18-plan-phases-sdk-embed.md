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
- [ ] P5.5a Adaptateurs de fournisseurs adossés aux services du Core : session/tenant/langue (`watchSession`, `watchTranslations`), thème (aligné sur le système de thème retenu par la réforme en cours — TokiForge / jetons ; le contrat `theme` `{ mode, tokens }` est indépendant du moteur), événements (bus du Core), notifications, dialogues, drapeaux, permissions, configuration, `esm-ai-tools`, télémétrie, `api` (`createFetchApiProvider` + en-têtes d'auth/tenant du Core).
- [ ] P5.5 ⏳ App générique `packages/apps/esm-embed-app` : une page par entrée `embed`, montage via `esm-embed-host`, placement rail/zone selon `placement`, route de préfixe.
- [x] P5.6 Statut (`external-apps.status.json`) : `kind: embed`, grants effectifs, avertissements.
- [ ] P5.7 Tests d'outils (`yarn test:tools`) et tests de l'app ; docs 12, 15 mises à jour ; push + bilan.
- [x] P5.8 (ajout) Tests d'outils : 12 nouveaux (`embed-apps.test.mjs`) ; suite `yarn test:tools` 54/54. Régression évitée : trois tests existants copient les outils par liste de fichiers, `embed-apps.mjs` y a été ajouté.
- ⏳ **Bloqué par la publication npm** : P5.5, P5.5a et P5.7 (app, adaptateurs, doc 15) importent `@egen-civitas/esm-embed-*`, non publiés tant que la PR de release du Framework (#152 « chore: release packages ») n'est pas fusionnée. Décision de publication laissée à l'équipe ; reprise immédiate ensuite.

## P6 — Migration des apps et compatibilité
- [ ] P6.1 **tweakcn (pilote)** : ajouter `egen-app.json`, adopter `esm-embed-client` (thème synchronisé, session, événements), retirer le wrapper `esm-tweakcn-app` du Core au profit de l'entrée `embed`.
- [ ] P6.2 Character Factory : manifeste + client (navigation `none`).
- [ ] P6.3 Penpal : manifeste + injection du script v1.1 ou client selon le routage constaté (`hash` ou `history`), sans toucher au dépôt Penpal (référence en lecture seule : fournir les fichiers à y ajouter côté opérateur).
- [ ] P6.4 Dépréciation de `esm-nextjs-utils` (réexport + avertissement), changesets.
- [ ] P6.5 Mise à jour des docs 15 (scénario C3), 16, 11 ; push + bilan.

## P7 — Sécurité, SSO, navigateur réel, outillage
- [ ] P7.1 Playwright : poignée de main, thème, événements, navigation (clic, F5, retour, lien partagé) sur tweakcn.
- [ ] P7.2 `egen check-app` (écart G4) étendu aux apps embarquées (manifeste, SDK, `frame-ancestors`).
- [ ] P7.3 Capacité `auth` (cadrage et interface côté front ; branchement IAM dépendant du backend).
- [ ] P7.4 Revue de sécurité (liste de contrôle §6 du doc 17), fuzzing léger des gardes, rapport.
- [ ] P7.5 Doc de clôture et retour d'expérience ; push + bilan.
