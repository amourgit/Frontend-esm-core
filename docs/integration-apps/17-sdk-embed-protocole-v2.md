# 17 — SDK d'intégration embarquée et protocole v2

> **Statut : spécification (💡) puis implémentation par phases (voir [18](18-plan-phases-sdk-embed.md)).** Ce document décrit la cible ; chaque capacité est marquée ✅ quand elle est livrée et testée.
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

### 2.1 Choix de la couche RPC (justifié)

Une bibliothèque RPC générique (Comlink) a été écartée : elle résout les appels par **chemin de propriétés arbitraire** (`get`/`set`/`apply`/`construct`) sur l'objet exposé, ce qui permet à un pair non fiable d'atteindre `constructor.constructor` et donc d'exécuter du code dans l'hôte. C'est incompatible avec un hôte qui accueille des apps tierces. Le protocole v2 réutilise les primitives standard (`MessageChannel`, clonage structuré) et un RPC minimal (~200 lignes) à **table de dispatch fermée** : `Map<capacité, Map<méthode, fonction>>`, aucune résolution dynamique de chemin.

## 3. Transport et poignée de main

Deux phases, la première sur `window.postMessage`, la seconde sur un `MessagePort` dédié.

```
Hôte (Shell)                                   App (iframe)
   │── {egen:2, kind:'hello', nonce, protocols:[2,1], hostVersion} ─▶
   │◀─ {egen:2, kind:'connect', nonce, protocol:2, sdk, requested:[{id,version}]} ──
   │   (hôte vérifie : source = iframe, origine exacte, nonce, grants)
   │── {egen:2, kind:'port', protocol:2, granted:[…], denied:[{id,reason}]} + transfert(port2) ─▶
   │◀══════════════ RPC sur MessagePort (req/res/evt/sub/unsub/ping/bye) ═══════════════▶
```

- Enveloppe de poignée de main : `{ egen: 2, moduleName, message }` (même forme que la v1, `egen` vaut `2`).
- L'hôte **n'envoie `port` qu'après validation** : `event.source === iframe.contentWindow`, `event.origin === origine autorisée` (jamais `*`), `nonce` identique, `protocol` supporté.
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

## 5. Catalogue de capacités (v1 de chaque capacité)

| Capacité | Méthodes (app → hôte) | Événements (hôte → app) | Grant par défaut |
| --- | --- | --- | --- |
| `session` | `get()` → session filtrée par liste blanche (jamais `sessionId`, jamais de jeton) | `change` | accordé, champs `DEFAULT_SESSION_FIELDS` |
| `tenant` | `get()` → `{ id }` | `change` | accordé |
| `locale` | `get()` | `change` | accordé |
| `theme` | `get()` → `{ mode, tokens }` (variables CSS du Core) | `change` | accordé |
| `permissions` | `can(permission)` → booléen ; liste sondable limitée à `probe` du grant | `change` | refusé |
| `navigation` | `report(path, {replace,title})` · `navigate(to)` (chemin interne du Core) · `setTitle` · `resize(h)` | `goto { path, seq }` | accordé (reprend le protocole 1.1) |
| `events` | `publish(topic, payload)` · abonnement par `sub` | événements des sujets autorisés | refusé (publication limitée à `app.<slug>.*` ; abonnement à `core.*` et `app.*` selon grant) |
| `notifications` | `show({ kind, title, subtitle?, timeoutMs? })` | — | refusé |
| `dialogs` | `confirm({ title, message, danger? })` → booléen | — | refusé |
| `api` | `fetch({ path\|url, method, headers?, body? })` → `{ status, headers, body }` ; le Core ajoute authentification et tenant, **le jeton ne quitte jamais le Core** | — | refusé (liste d'hôtes obligatoire) |
| `flags` | `isEnabled(name)` | `change` | refusé |
| `config` | `get()` → configuration publique de l'app | `change` | accordé |
| `telemetry` | `log(level, message, ctx?)` · `metric(name, value, tags?)` | — | accordé (débit plafonné) |
| `ai-tools` | `register(descripteurs[])` · `unregister(noms[])` ; **hôte → app** : `invoke(nom, args)` | — | refusé (voir doc IA : le frontend n'a aucune autorité propre, le backend valide) |
| `lifecycle` | `ready()` · `onBeforeLeave` (l'hôte demande `canLeave()`) | `visibility`, `focus` | accordé |

Toute capacité hors catalogue est refusée (`UNKNOWN_CAPABILITY`). Le catalogue vit dans `@egen-civitas/esm-embed-protocol` (descripteurs + validateurs d'arguments).

## 6. Sécurité

1. **Moindre privilège** : accordé = demandé ∩ approuvé par l'opérateur (§7). Défaut = refus, sauf capacités de lecture sans risque marquées « accordé ».
2. **Poignée de main authentifiée** (source, origine exacte, nonce) ; port transféré seulement après validation ; une seconde `connect` est ignorée.
3. **Aucun jeton, aucun identifiant de session** transmis. `api.fetch` s'exécute côté Core, avec liste d'hôtes, liste blanche d'en-têtes, taille et délai plafonnés, redirections limitées.
4. **Dispatch fermé** (§2.1) ; arguments validés par schéma avant tout appel ; pas d'`eval`, pas de résolution de chemin.
5. **Anti-abus** : limites §3.1, déconnexion après dépassement répété.
6. **Paramètres sensibles** : la règle `sensitiveParams` du doc 16 §5 reste en vigueur pour la navigation.
7. **Sandbox et CSP** inchangés (doc 15 C3) : `frame-ancestors` côté app, `frame-src` côté Core.
8. **SSO** : voir §9.

## 7. Manifeste d'app embarquée et grants

Fichier `egen-app.json`, publié par l'app (URL stable) ou fourni par l'opérateur :

```json
{
  "manifestVersion": 1,
  "name": "@civitas/esm-tweakcn-app",
  "version": "1.2.0",
  "title": "Theme Studio",
  "url": "https://studio.exemple.org",
  "route": "theme-studio",
  "technology": "nextjs",
  "navigation": { "mode": "history", "basePath": "/", "sensitiveParams": ["invite"] },
  "placement": { "rail": "left", "group": "tools", "icon": "palette" },
  "capabilities": {
    "session": { "fields": ["user.display", "authenticated"] },
    "theme": {},
    "events": { "publish": ["app.theme-studio.*"], "subscribe": ["core.theme.*"] },
    "notifications": {}
  }
}
```

Déclaration par l'opérateur dans `external-apps.json` (nouveau `kind: "embed"`, remplace le wrapper par app) :

```json
{ "embed": [ {
    "manifest": "https://studio.exemple.org/egen-app.json",
    "grants": { "theme": {}, "session": { "fields": ["user.display"] }, "notifications": {} },
    "limits": { "requestsPerSecond": 50 }
} ] }
```

- Les **grants effectifs** (= demandé ∩ approuvé) et l'empreinte SHA-256 du manifeste sont écrits dans `external-apps.lock.json`.
- Un manifeste modifié sans nouvelle synchro → **rejet au démarrage** (même logique que les bundles hébergés, doc 15 A7).
- Plus de paquet wrapper : une **app générique** du Core (`esm-embed-app`) fabrique la page et le montage pour toute entrée `embed` ; `serve-prod` synthétise les entrées du registry.

## 8. Paquets

| Paquet | Dépôt | Rôle | Dépendances |
| --- | --- | --- | --- |
| `@egen-civitas/esm-embed-protocol` | Framework | types, enveloppes, catalogue de capacités, validateurs, codes d'erreur, négociation, moteur RPC pur | aucune |
| `@egen-civitas/esm-embed-client` | Framework | côté app : `connectToEgen()`, proxys typés par capacité, reconnexion, mode dégradé, liaisons `/react` | protocole |
| `@egen-civitas/esm-embed-host` | Framework | côté Core : iframe, poignée de main, application des grants, fournisseurs de capacités adossés aux services EGEN, compatibilité v1.1 | protocole |
| `@egen-civitas/esm-embed-testing` | Framework | simulateur d'hôte pour développer l'app seule, suite de conformité | protocole, client, host |
| `esm-embed-app` | Core | app générique : lit les entrées `embed`, monte l'hôte | host |

`esm-nextjs-utils` reste publié (compatibilité) et devient un alias déprécié du couple host/client après la phase 6.

**Pas de republication du Shell** : l'hôte est embarqué dans `esm-embed-app` (Core), pas dans le Shell. La chaîne de release d'une nouvelle capacité se réduit à Framework → Core.

## 9. Authentification et SSO (cible)

Les apps iframe ont leur propre connexion (Penpot, tweakcn). Trois modèles, du plus simple au plus fort :
1. **Même site + cookie de session** via passerelle (déjà documenté pour Penpot).
2. **OIDC fédéré** avec l'IAM central : l'app est un client OIDC, connexion transparente si la session IAM existe.
3. **Échange de jeton court** : capacité `auth` (v2 du catalogue) `getToken({ audience })`, réservée aux apps `trust: "first-party"`, durée de vie ≤ 5 min, jamais dans l'URL. **Dépend du backend IAM** : hors périmètre des phases front 1 à 6, cadré en phase 7.

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
- Protocole 1.1 et script `egen-bridge.js` : conservés tant que des apps les utilisent.
- Règle de release du doc 16 §8 (Framework → Core) : simplifiée, pas supprimée.
