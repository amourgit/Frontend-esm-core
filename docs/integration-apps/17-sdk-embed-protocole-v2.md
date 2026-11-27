# 17 — SDK d'intégration embarquée et protocole v2

> **Statut : implémenté (✅) — protocole, client, hôte, testing publiés ; app générique et outillage dans le Core. Plan et reste à faire : [18](18-plan-phases-sdk-embed.md).**
> **Décisions du 2026-11-26 (actées)** :
> - **Voie unique.** Le SDK embed (protocole v2) est LA voie d'intégration des apps externes en iframe. L'ancien pipeline « enveloppe par app + pont 1.1 » est en cours de retrait (phases de nettoyage : doc 18, P8).
> - **`egen-config.json` publié par l'app.** L'app externe sert son propre fichier de déclaration à la racine de son URL (`https://<app>/egen-config.json`) : manifeste + configuration publique. La déclaration `embed` dans `external-apps.json` du Core reste le **second recours** (app qui n'a pas publié son fichier) et le lieu de l'**approbation** des droits.
> - **Droits de l'iframe négociés.** Les attributs `sandbox` et `allow` de l'iframe ne sont plus figés : l'app les **demande** dans `egen-config.json`, l'opérateur les **approuve** dans `external-apps.json` ; les droits effectifs sont l'intersection, validée par liste blanche stricte (§7 bis).
> - **Notifications : un seul point d'entrée.** `egen.notify(toast, local)` — le Core affiche par défaut et seul ; l'app ne rend son propre composant de toasts que si le Core ne s'en charge pas (§5).
> **Origine** : audit du 2026-11-23 sur l'intégration des apps externes (Penpal, tweakcn, Character Factory) et décision de passer à un niveau industriel.

## 1. Constat qui motive la réforme

| Mode d'intégration | Parité avec une app interne |
| --- | --- |
| Module Federation (React, Vue, Angular : docs 05, 13) | Quasi totale : config, session, flags, i18n, slots, extensions via `esm-integration-utils` et les adaptateurs |
| Iframe + pont `postMessage` (Next.js, Penpot, tweakcn, Character : docs 15, 16) | **Faible** : session filtrée, langue, navigation (1.1), hauteur, titre. Rien d'autre |

Problèmes structurels du pont v1/1.1 :
1. **Pas de catalogue de capacités** : chaque besoin (thème, événements, notifications, permissions, API) obligerait à étendre le protocole et à republier la chaîne Framework → Shell → Core → wrapper → app (doc 16 §8).
2. **Un paquet « wrapper » par app iframe** (projet, CI, tag, tarball) alors que son contenu est de la configuration.
3. **Aucune gouvernance** : pas de permissions par app, pas de moindre privilège.
4. **Aucun test en vrai navigateur** ni simulateur d'hôte pour développer l'app seule.

## 2. Décision d'architecture

**SDK distinct, protocole d'abord.** Le contrat est un protocole versionné, spécifié et testé ; le SDK n'en est qu'un client. Le mode Module Federation n'est pas touché (parité déjà quasi totale).

Limites assumées (aucun SDK ne les lève) : une app iframe ne partage ni le contexte React, ni les stores en mémoire, ni les styles du Core ; elle ne rend pas dans un `ExtensionSlot` du Core ; tout est **asynchrone**. La parité passe par des **services** (§5) et par la **déclaration** pour le visuel (rails, zones, slots : manifeste §7).

### 2.0 Règle d'or : le SDK ne transporte que ce dont le Core est lui-même la source

Le Core affiche une interface et rend des services d'interface ; il n'est **ni** la source de l'identité, **ni** des droits, **ni** du thème. Faire transiter ces éléments par le Core créerait une classe entière de failles (jeton ou session relayés, droits périmés, thème détourné) pour rien : les apps peuvent les obtenir **directement** auprès de leur source.

| Élément | Source réelle | Dans le SDK ? | Comment l'app l'obtient |
| --- | --- | --- | --- |
| Identité, session, jeton | Keycloak (le backend du Core y récupère le jeton) | **Non** (capacités `session`, `auth` retirées) | OIDC auprès de Keycloak (voir §9) |
| Droits, rôles, privilèges | Jeton Keycloak + backends | **Non** (`permissions` retirée) | Claims du jeton, vérifiés par **son** backend |
| Thème | Source de thèmes décentralisée | **Non** (`theme` retirée) | Directement auprès du service de thèmes |
| Appels API authentifiés | Backends, avec le jeton de l'app | **Non** (`api` retirée) | `fetch` avec **son** jeton Keycloak ; le Core ne relaie pas |
| Langue, tenant, drapeaux, config de l'app | État d'interface et configuration du **Core** | Oui | Capacités `locale`, `tenant`, `flags`, `config` |
| Événements, notifications, dialogues, navigation, cycle de vie | Interface du **Core** | Oui | Capacités du même nom |
| Extensions (contribuer / découvrir) | Système d'extensions du **Core** | Oui | Capacité `extensions` + `extensions[]` du manifeste |
| Outils IA | Canal IA du **Core** | Oui | Capacité `ai-tools` |

Une demande de capacité retirée est **rejetée avec la raison et la voie à suivre** (`REMOVED_CAPABILITIES`), jamais ignorée en silence. `tenant` reste informatif et non autoritatif : le backend valide le tenant comme pour le Core (modèle « capture seule »).

### 2.1 Choix de la couche RPC (justifié)

Une bibliothèque RPC générique (Comlink) a été écartée : elle résout les appels par **chemin de propriétés arbitraire** (`get`/`set`/`apply`/`construct`) sur l'objet exposé, ce qui permet à un pair non fiable d'atteindre `constructor.constructor` et donc d'exécuter du code dans l'hôte. C'est incompatible avec un hôte qui accueille des apps tierces. Le protocole v2 réutilise les primitives standard (`MessageChannel`, clonage structuré) et un RPC minimal (~200 lignes) à **table de dispatch fermée** : `Map<capacité, Map<méthode, fonction>>`, aucune résolution dynamique de chemin.

## 3. Transport et poignée de main

Deux phases, la première sur `window.postMessage`, la seconde sur un `MessagePort` dédié.

```
Hôte (Shell)                                   App (iframe)
   │◀─ {egen:2, kind:'probe'} ── (facultatif : l'app a chargé après l'événement `load` de l'iframe)
   │── {egen:2, kind:'hello', nonce, protocols:[2,1], hostVersion} ─▶
   │◀─ {egen:2, kind:'connect', nonce, protocol:2, sdk, requested:[{id,version}]} ──
   │   (hôte vérifie : source = iframe, origine exacte, nonce, grants)
   │── {egen:2, kind:'port', protocol:2, granted:[…], denied:[{id,reason}]} + transfert(port2) ─▶
   │◀══════════════ RPC sur MessagePort (req/res/evt/sub/unsub/ping/bye) ═══════════════▶
```

- Enveloppe de poignée de main : `{ egen: 2, moduleName, message }` (même forme que la v1, `egen` vaut `2`).
- L'hôte **n'envoie `port` qu'après validation** : `event.source === iframe.contentWindow`, `event.origin === origine autorisée` (jamais `*`), `nonce` identique, `protocol` supporté.
- `probe` : l'app, qui peut charger **après** l'événement `load` de l'iframe, demande à l'hôte de renvoyer `hello`. Elle l'envoie à chacune de ses `hostOrigins` (origine cible explicite).
- **Compatibilité** : si l'app ne répond pas `connect` dans le délai (5 s par défaut), l'hôte reste en protocole 1.1 (messages `ready`, `location`, `goto`, `title`, `resize`, `navigate` inchangés). Une app v1 continue donc de fonctionner à l'identique.

### 3.1 Format RPC sur le port

| Type | Champs | Sens |
| --- | --- | --- |
| `req` | `id`, `cap`, `m`, `a` (tableau) | appel de méthode (les deux sens : hôte → app est permis pour les capacités déclarées « rappel », ex. `ai-tools`) |
| `res` | `id`, `ok`, `v` ou `e:{code,message}` | réponse |
| `sub` / `unsub` | `id`, `cap`, `ev` / `sid` | abonnement à un événement de capacité |
| `evt` | `sid`, `v` | événement poussé |
| `ping` / `pong` | `t` | vivacité (30 s) |
| `bye` | — | fermeture propre |

Codes d'erreur : `DENIED`, `UNKNOWN_CAPABILITY`, `UNKNOWN_METHOD`, `INVALID_ARGS`, `TIMEOUT`, `RATE_LIMITED`, `TOO_LARGE`, `CLOSED`, `INTERNAL`.

Limites par défaut (surchargeables par l'opérateur) : message ≤ 256 Kio · 100 requêtes/s par app · délai d'appel 10 s · 100 abonnements · 1 000 événements/s sortants.

## 4. Versionnage et négociation

- **Protocole** : entier majeur (`2`). L'hôte supporte N et N-1 (donc 2 et 1.1 pendant la transition).
- **Capacité** : `{ id, version }` ; version = entier majeur propre à la capacité. L'hôte accorde si `versionHôte ≥ versionDemandée` dans la même majeure ; sinon refus `denied: { id, reason: 'VERSION' }`.
- Le client expose `client.has('theme')` et `client.caps` : une app dégrade proprement quand une capacité est refusée ou absente (hôte plus ancien).
- Toute évolution **additive** (nouvelle méthode, champ facultatif) ne change pas la version ; tout retrait ou changement de sémantique incrémente la majeure de la capacité.

## 5. Catalogue de capacités (12, version 1 chacune)

| Capacité | Méthodes (app → hôte) | Événements (hôte → app) | Grant par défaut |
| --- | --- | --- | --- |
| `tenant` | `get()` → `{ id }` (informatif, non autoritatif) | `change` | accordé |
| `locale` | `get()` | `change` | accordé |
| `navigation` | `report(path, {replace,title})` · `navigate(to)` (chemin interne du Core) · `setTitle` · `resize(h)` | `goto { path, seq }` | accordé (reprend le protocole 1.1) |
| `config` | `get()` → configuration publique de l'app fixée par l'opérateur (`embed[].config`) | `change` | accordé |
| `telemetry` | `log(level, message, ctx?)` · `metric(name, value, tags?)` | — | accordé (débit plafonné) |
| `lifecycle` | `ready()` · (hôte → app) `canLeave()` | `visibility`, `focus` | accordé |
| `events` | `publish(topic, payload)` · abonnement par sujet | événements des sujets autorisés | refusé (publication limitée à `app.<slug>.*`, abonnement par motifs approuvés) |
| `notifications` | `show({ id?, kind, title, subtitle?, timeoutMs? })` | — | refusé |
| `dialogs` | `confirm({ title, message, danger? })` → booléen (dialogue natif du Core) | — | refusé |
| `flags` | `isEnabled(name)` (noms listés par le grant) | `change` | refusé |
| `extensions` | `list(slot)` → métadonnées des extensions du slot (grant `discover`) | par slot : liste à jour | refusé |
| `ai-tools` | `register(descripteurs[])` · `unregister(noms[])` ; (hôte → app) `invoke(nom, args)` | — | refusé (noms d'outils limités par motifs approuvés ; le backend IA garde l'autorité) |

Toute capacité hors catalogue est refusée (`UNKNOWN`). Le catalogue vit dans `@egen-civitas/esm-embed-protocol`.

### 5.1 Notifications : un seul point d'entrée, jamais de doublon

Le Core est la source d'affichage des toasts. Une app embarquée ne doit **jamais** rendre son propre composant de notifications quand le Core s'en charge — deux toasts identiques pour un même événement est le bug à éviter par construction.

Le SDK impose **un point d'entrée unique** : `egen.notify(toast, local)` (React : `useEgenNotify(local)` → `{ notify, coreDisplays }`).

| Situation | Comportement de `notify` |
| --- | --- |
| Capacité accordée, politique `exclusive` (défaut) | Toast envoyé au Core, affiché **par le Core seul**, attribué à l'app ; `local` **n'est pas appelé** |
| Capacité accordée, politique `exclusive: false` (choix de l'opérateur) | Toast envoyé au Core **et** `local` appelé (l'app affiche aussi) |
| Capacité refusée, connexion fermée, client autonome | `local` appelé (affichage propre à l'app) |
| Trop de toasts (`RATE_LIMITED`) | Abandonné : ni Core ni local (contourner la limite par l'affichage local recréerait le doublon) |

Règles pour l'app :

- `id` optionnel = clé de dédoublonnage : un même `id` rapproché ne produit pas deux toasts.
- Ne rendre son propre `<Toaster>` que si `!egen.coreDisplaysNotifications` (ou `!coreDisplays` côté hook).
- `kind`, `title` (≤ 200), `subtitle` (≤ 500), `timeoutMs` (0–60 000) validés côté protocole ; le Core applique en plus un plafond anti-spam (`RATE_LIMITED`).

## 5 bis. Extensions : contribuer aux slots du Core et découvrir ses extensions

Objectif : une app embarquée dispose, dans la mesure du possible, de ce que dispose une app interne — **injecter ses composants dans les slots** des apps internes et du framework, et **voir** ce que d'autres y ont injecté.

**Contribuer (déclaratif, approuvé par slot).** Le manifeste déclare `extensions[]` ; l'opérateur approuve les slots autorisés (`approved.extensions.contribute`, motifs exacts ou `annuaire-*`, jamais `*` seul). Seul l'approuvé est injecté : c'est le seul moyen d'ajouter un composant à un slot du Core. `serve-prod` synthétise alors l'extension dans le registry, que le système d'extensions du Core traite comme n'importe quelle autre (ordre, privilèges, drapeau de fonctionnalité, `meta`) :

| Contribution déclarée | Composant synthétisé | Rendu |
| --- | --- | --- |
| avec `view` | `extensionView` | la page `view` de l'app, **dans une iframe dédiée à l'intérieur du slot** (hauteur initiale `height`, ajustable via `navigation.resize`) |
| slot de rail, sans `view` | `railPanel` | sous-options de la section de l'app (comme une app interne) |
| autre slot, sans `view` | `navEntry` | déclaratif : seule la `meta` est lue par le slot (ex. entrée de TopBar) |

Raccourcis du manifeste : `placement` (titre, icône, groupe, `rail: left|right`) produit l'entrée de TopBar et le panneau de rail correspondants — toujours sous réserve d'approbation du slot.

```json
"extensions": [
  { "name": "chip", "slot": "topbar-actions-slot", "view": "/_egen/chip", "order": 5, "height": 48,
    "privileges": ["Voir Studio"], "featureFlag": "studio" }
]
```

**Découvrir.** `extensions.list(slot)` renvoie les métadonnées (`name`, `moduleName`, `order`, `meta`) des extensions attachées au slot — apps internes, framework, autres apps — **déjà filtrées par le Core** selon les privilèges de l'utilisateur et les drapeaux de fonctionnalité (le Core reste l'autorité d'affichage). Slots lisibles : grant `extensions.discover`. L'app construit ainsi ses menus et liens.

**Limites assumées.** Un composant React du Core ne s'affiche pas dans l'iframe d'une app (ni l'inverse) : l'équivalent est la **métadonnée** (découverte) et la **vue iframe** (contribution). Pour injecter du code dans le processus du Core, il faut un module Federation (scénarios A/B).

**Sécurité des contributions.** `meta` ≤ 4 Ko, `iconUrl` en https **de la même origine que l'app** (pas de pistage par image externe), ≤ 20 contributions, privilèges et drapeaux **appliqués par le Core** (jamais par l'app), chaque vue est une connexion hôte distincte avec les mêmes grants que l'app.

## 6. Sécurité

1. **Règle d'or** (§2.0) : aucune identité, aucun jeton, aucun droit, aucun thème ni appel API ne transite par le Core.
2. **Moindre privilège** : accordé = demandé ∩ approuvé par l'opérateur (§7). Défaut = refus, sauf les capacités d'état d'interface en lecture marquées « accordé ».
3. **Poignée de main authentifiée** (source, origine exacte, nonce) ; port transféré seulement après validation ; une seconde `connect` est ignorée.
4. **Dispatch fermé** (§2.1) ; arguments validés par schéma avant tout appel ; pas d'`eval`, pas de résolution de chemin.
5. **Anti-abus** : limites §3.1, déconnexion après dépassement répété.
6. **Contributions** : approbation par slot, `meta` bornée, `iconUrl` même origine (§5 bis).
7. **Paramètres sensibles** : la règle `sensitiveParams` du doc 16 §5 reste en vigueur pour la navigation.
8. **Droits de l'iframe négociés** : `sandbox` et `allow` sont demandés par l'app et approuvés par l'opérateur (§7 bis) — jamais de droits figés dans le code, jamais d'auto-attribution.
9. **Sandbox et CSP** (doc 15 C3) : `frame-ancestors` côté app, `frame-src` côté Core ; `egen-embed-check --probe` le vérifie.
10. **Backends** : un backend d'app ne fait jamais confiance à l'iframe ; il valide le jeton Keycloak de l'utilisateur (§9).

## 7. `egen-config.json` : la déclaration publiée par l'app

> ⚠️ **Ne pas confondre** avec le `egen-config.json` du Core (`EGEN_CONFIG_FILE`, doc 15 A10) : celui-ci configure les apps **Module Federation** au runtime (`{ "<app>": { … } }`, servi à `<spa>/config.json`). Ici, `egen-config.json` est le fichier de **déclaration d'intégration** qu'une app **embarquée** publie à la racine de **sa propre** URL — deux fichiers, deux rôles, deux endroits.

**Voie normale : l'app sert elle-même son fichier de déclaration.** À la racine de son URL, l'app expose `egen-config.json` — un seul fichier qui rassemble tout ce que le Core doit savoir pour l'intégrer : identité, route, navigation, capacités demandées, contributions d'extensions, configuration publique et droits d'iframe demandés.

```json
{
  "manifestVersion": 1,
  "name": "@civitas/esm-studio-app",
  "version": "1.2.0",
  "title": "Theme Studio",
  "url": "https://studio.exemple.org",
  "route": "studio",
  "technology": "nextjs",
  "navigation": { "mode": "history", "basePath": "/", "sensitiveParams": ["invite"] },
  "placement": { "rail": "left", "group": "tools", "icon": "Palette" },
  "capabilities": {
    "events": { "publish": ["app.studio.*"], "subscribe": ["core.*"] },
    "notifications": {},
    "extensions": { "discover": ["topbar-nav-slot"] }
  },
  "extensions": [
    { "name": "chip", "slot": "topbar-actions-slot", "view": "/_egen/chip", "height": 48 }
  ],
  "iframe": {
    "sandbox": ["allow-downloads", "allow-modals", "allow-popups-to-escape-sandbox"],
    "allow": ["clipboard-read", "clipboard-write", "fullscreen"]
  },
  "config": { "studioApi": "https://api.exemple.org" }
}
```

Règles de forme (validées par `validateManifest`, doc 17 §7 historique) : `manifestVersion: 1` ; `name` = nom de paquet ; `version` semver ; `title` ≤ 100 ; `url` https sans identifiants ; `route` minuscules/chiffres/tirets (≤ 64) ; `technology` ∈ `nextjs|react|vue|angular|static|other` ; `navigation.mode` ∈ `none|history|hash` ; `extensions[]` ≤ 20 contributions (`meta` ≤ 4 Ko, `iconUrl` https même origine) ; `config` ≤ 8 Ko, rien de secret.

**Second recours : la déclaration côté Core.** Si l'app n'a pas publié `egen-config.json` (ou pour la figer avant mise en production), l'opérateur peut déclarer l'app dans `external-apps.json` — c'est aussi **le seul endroit où les droits sont approuvés** :

```json
{ "embed": [ {
    "manifest": "https://studio.exemple.org/egen-config.json",
    "grants": {
      "notifications": {},
      "events": { "publish": ["app.studio.*"], "subscribe": ["core.*"] },
      "extensions": { "discover": ["topbar-nav-slot"], "contribute": ["topbar-nav-slot", "shell-rail-left-slot", "topbar-actions-slot"] },
      "iframe": { "sandbox": ["allow-downloads", "allow-modals", "allow-popups-to-escape-sandbox"],
                  "allow": ["clipboard-read", "clipboard-write", "fullscreen"] }
    },
    "limits": { "requestsPerSecond": 50 },
    "config": { "studioApi": "https://api.exemple.org" }
} ] }
```

- Les **droits effectifs** (capacités et iframe) = demandé ∩ approuvé, calculés dans le navigateur par `effectiveGrants` du protocole (une seule implémentation). Le verrou `external-apps.lock.json` fige : déclaration (SHA-256), plafond approuvé, limites, `config`.
- Une déclaration modifiée sans nouvelle synchro → **rejet au démarrage** (même logique que les bundles hébergés, doc 15 A7).
- Plus de paquet wrapper : l'app générique `@egen/esm-embed-app` fabrique la page et monte l'hôte ; `serve-prod` fusionne pages et extensions dans le registry et publie `<spa>/embed-apps.json`.

### 7 bis. Droits de l'iframe : `sandbox` et `allow` négociés

Une iframe est enfermée par deux attributs posés par le parent : `sandbox` (ce que l'app peut faire : scripts, téléchargements, dialogues, popups…) et `allow` (permissions riches : presse-papiers, plein écran, caméra…). **Ces droits ne sont pas figés dans le code** : ils se négocient comme les capacités — l'app **demande**, l'opérateur **approuve**, le Core **applique** l'intersection.

| Étape | Où | Contenu |
| --- | --- | --- |
| Demande | `egen-config.json` → `iframe.sandbox[]`, `iframe.allow[]` | jetons demandés par l'app |
| Approbation | `external-apps.json` → `grants.iframe.sandbox[]`, `grants.iframe.allow[]` | plafond de l'opérateur (`false` = rien d'accordé) |
| Calcul | navigateur, `effectiveGrants` | effectif = demande ∩ plafond, chaque jeton validé par **liste blanche** |
| Application | `esm-embed-host` → attributs de l'iframe | `sandbox="…"`, `allow="…"` |

Règles :

- **Liste blanche stricte** des jetons `sandbox` et `allow` (validée côté protocole et outillage) : une app ne peut jamais s'auto-accorder un droit, ni une permission `allow` non prévue — ce qui casserait l'isolation. Le socle par défaut (`allow-scripts allow-same-origin allow-forms allow-popups`) s'applique à toute app ; les droits négociés peuvent l'**étendre** (`allow-downloads`, `allow-modals`, `allow-popups-to-escape-sandbox`, `clipboard-*`, `fullscreen`…) **uniquement** si l'opérateur les a approuvés.
- `allow-same-origin` + `allow-scripts` ensemble neutralisent le sandbox : ce couple n'est jamais accordé à une app d'une origine différente du Shell sans revue explicite de l'opérateur (le protocole journalise l'avertissement existant de `esm-embed-host`).
- Chaque jetion est journalisée dans `external-apps.status.json` (demandé vs approuvé) pour revue opérateur.
- Cas réel : Penpot, tweakcn et Character Factory demandent `allow-downloads`, `allow-modals`, `allow-popups-to-escape-sandbox` et `allow="clipboard-read; clipboard-write; fullscreen"` — impossibles avec le sandbox par défaut.

## 8. Paquets

| Paquet | Dépôt | Rôle | Dépendances |
| --- | --- | --- | --- |
| `@egen-civitas/esm-embed-protocol` | Framework | types, enveloppes, catalogue de 12 capacités (+ `REMOVED_CAPABILITIES`), validateurs, manifeste et contributions d'extension, négociation, moteur RPC pur | aucune |
| `@egen-civitas/esm-embed-client` | Framework | côté app : `connectToEgen()`, façades typées par capacité, mode autonome, liaison `/react` (`useEgenLocale`, `useEgenTenant`, `useEgenExtensions`, `useEgenEvent`) | protocole |
| `@egen-civitas/esm-embed-host` | Framework | côté Core : iframe, poignée de main, application des grants, interfaces de fournisseurs (`HostProviders`), navigation partagée, compatibilité du pont 1.1 (sans session) | protocole |
| `@egen-civitas/esm-embed-testing` | Framework | hôte de test en mémoire, suite de conformité, simulateur (`egen-embed-sim`), vérificateur (`egen-embed-check`) | protocole, client, host |
| `@egen/esm-embed-app` | Core | app générique : page, vues d'extension, panneau de rail, entrée de navigation ; adaptateurs sur les services du Core | host, protocole |

`esm-nextjs-utils` est déprécié (P6.4) puis supprimé (P8) avec le pont 1.1 de l'hôte, une fois aucune app déployée ne l'utilisant ; `esm-integration-utils` reste (apps Module Federation). L'hôte est embarqué dans `esm-embed-app` (Core), pas dans le Shell : la chaîne de release d'une nouvelle capacité se réduit à Framework → Core.

## 9. Identité, droits et thème : les obtenir sans le SDK

Ces éléments ne viennent pas du Core ; une app embarquée les obtient **à leur source**. Recommandations (à valider avec la configuration réelle du realm Keycloak) :

1. **Identité (SSO).** L'app est un client OIDC public du **même realm** Keycloak que le Core : Authorization Code + PKCE (par exemple `keycloak-js`, `onLoad: 'check-sso'` avec `silent-check-sso.html`). Si une session Keycloak existe, la connexion est transparente. **Contrainte navigateur** : en iframe, les cookies Keycloak sont « tiers » s'ils ne sont pas du même site ; les navigateurs les bloquent. Hébergez donc l'app sur le **même domaine enregistrable** que Keycloak et le Core (ex. `studio.egen.exemple.org` pour `auth.egen.exemple.org`), ce qui rend les cookies « même site ». À défaut : redirection de la fenêtre entière vers Keycloak.
2. **Droits.** Rôles et privilèges sont des claims du jeton ; le **backend de l'app** valide le jeton (signature, audience, expiration) et applique les droits. L'iframe n'est jamais une source de vérité.
3. **Thème.** L'app interroge directement le service de thèmes (source décentralisée) ; elle n'attend pas qu'on le lui transmette.
4. **Appels API.** Avec **son** jeton Keycloak. Le Core ne relaie aucun appel authentifié.
5. **Tenant.** La capacité `tenant` informe l'interface ; le backend valide le tenant à partir du jeton/de la requête, comme le Core.

## 10. Qualité et vérification

| Niveau | Moyen |
| --- | --- |
| Unitaire | Vitest ; le transport de test est un **vrai `MessageChannel`** (aucune simulation de fenêtre pour le RPC) |
| Poignée de main | tests avec fenêtres simulées (comme `esm-nextjs-utils`) : source, origine, nonce, double `connect`, délai dépassé → repli 1.1 |
| Conformité | suite `esm-embed-testing` exécutable contre n'importe quelle app (SDK ou implémentation tierce) |
| Développement d'app | simulateur d'hôte : l'app se développe seule, sans Core |
| Navigateur réel | Playwright (phase 7) : iframe, poignée de main, thème, événements, navigation F5/retour |

## 11. Ce qui ne change pas

- Mode Module Federation (docs 05, 13), `external:sync`, verrou, validation des bundles.
- Protocole 1.1 et script `egen-bridge.js` : **en voie de retrait** (décision du 2026-11-26, voie unique SDK). Le pont 1.1 dans `esm-embed-host` est conservé tant qu'une app déployée l'utilise encore ; sa suppression est planifiée (doc 18, P8).
- Règle de release du doc 16 §8 (Framework → Core) : simplifiée, pas supprimée.
