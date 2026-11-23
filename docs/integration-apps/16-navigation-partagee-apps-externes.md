# 16 — Navigation partagée Core ↔ applications externes (protocole 1.1)

> Problème résolu : une app externe affichée en iframe (Penpot, tweakcn…) avait sa propre navigation, mais l'URL du Core restait figée sur `…/penpot`. Impossible d'actualiser la page, de revenir en arrière ou de partager un lien vers la bonne page de l'app.
> Cible : se comporter comme une app interne, dont l'URL du Core **est** l'état de navigation.

## 1. Principe

L'URL du Core reste la **source de vérité**, comme pour les apps internes (Single-SPA active la page quand `route` correspond au début du chemin ; tout ce qui suit est libre) :

```
<base du SPA>/<route de la page>/<chemin interne de l'app>?requête#fragment
/egen/spa/penpot/dashboard/recent?team-id=42
```

Les deux côtés se parlent par le pont `postMessage` existant (`@egen-civitas/esm-nextjs-utils`). Le protocole reste en version 1 : les nouveaux messages sont **additifs** et un message inconnu est ignoré, donc une app ou un Core plus ancien continue de fonctionner à l'identique.

| Sens | Message | Rôle |
| --- | --- | --- |
| Shell → app | `hello` | Poignée de main à **chaque chargement** de l'iframe. L'app répond sans connaître l'origine du Shell à l'avance |
| App → Shell | `ready {caps}` | L'app est prête et sait annoncer sa position (`location`) et obéir (`goto`) |
| App → Shell | `location {path, replace?, title?}` | « Je suis sur cette page » : le Shell met à jour l'URL du Core (`pushState`, ou `replaceState` si `replace`) |
| Shell → app | `goto {path, seq}` | Retour/avance du navigateur, ou lien du Core vers une page de l'app : l'app y va |
| App → Shell | `title` (existant) | Titre de page (fil d'Ariane, titre accessible de l'iframe) |

`path` est toujours un **chemin interne de l'app** (`/dashboard/recent?team-id=42#x`), jamais une URL absolue.

## 2. Ce qui se passe, scénario par scénario

| Action de l'utilisateur | Déroulement |
| --- | --- |
| Il clique dans l'app | L'app change de page → `location` → le Shell fait `pushState` : l'URL du Core change, l'historique du navigateur s'enrichit |
| Il actualise (F5) | Le Shell lit l'URL du Core, calcule l'adresse de l'iframe (`url de base` + chemin) et l'app s'ouvre **directement sur la bonne page** |
| Il copie/partage l'URL | Même mécanisme que l'actualisation |
| Il clique « Précédent » | L'URL du Core change → `goto` → l'app navigue |
| App **sans** pont (ancien wrapper, app non modifiée) | Le Core ne voit rien venir de l'app ; si l'URL du Core change, l'iframe est rechargée à la bonne adresse (dégradation propre) |

Garde-fous : un changement de l'URL du Core provoqué par `location` ne génère pas de `goto` en retour (comparaison avec la dernière position connue : aucune boucle) ; les rafales sont plafonnées (40 messages/s) car les navigateurs limitent l'History API.

## 3. Modes de navigation

| Mode | Pour quelles apps | Position lue / écrite par l'app |
| --- | --- | --- |
| `history` (défaut) | Next.js, React Router, Vue Router (mode history)… | `pathname + search + hash` (moins le préfixe `data-base-path`) |
| `hash` | Apps à routage par fragment (`#/chemin`) | contenu du fragment |
| `none` | Apps sans URL (état interne), ex. Character Factory | rien : comportement opaque d'origine |

Le mode se choisit **par instance** dans la configuration du Core (`navigation` du wrapper), sans reconstruire : on peut désactiver la synchro d'une app en cas de souci (`"navigation": "none"`).

## 4. Brancher une application

### 4.1 Côté Core : le wrapper (`getEmbedLifecycle`)

```ts
getEmbedLifecycle({
  moduleName: '@civitas/esm-tweakcn-app', featureName: 'theme-studio', url: cfg.studioUrl,
  navigation: {
    route: 'theme-studio',              // = "route" de la page dans routes.json
    mode: cfg.navigation,               // 'history' | 'hash' | 'none'
    sensitiveParams: ['invite'],        // s'ajoute à la liste par défaut
    pathMap: { toApp, toCore },         // facultatif : traduire les chemins du Core ↔ de l'app
    onTitle: (t) => { /* fil d'Ariane */ },
  },
});
```

La page doit déclarer une `route` **de préfixe** (`"route": "theme-studio"`) : `/theme-studio/n'importe/quoi` active déjà la page.

### 4.2 Côté app : le script injectable (aucune dépendance, aucun changement de code métier)

Copier `assets/egen-bridge.js` du paquet `@egen-civitas/esm-nextjs-utils` (copie vendorisée, version indiquée en en-tête) puis :

```html
<script src="/egen-bridge.js" defer data-mode="history" data-base-path="/"></script>
```

- **Next.js** : `public/egen-bridge.js` + balise dans `app/layout.tsx` ; pour une navigation douce au retour/avance : `window.EgenBridge.onGoto((p) => { router.push(p); return true; })`.
- **Apps servies par nginx** (Penpot, Character) : injection sans toucher au code de l'app :
  ```nginx
  location = /egen-bridge.js { alias /usr/share/egen/egen-bridge.js; }
  sub_filter '</head>' '<script src="/egen-bridge.js" defer data-mode="hash"></script></head>';
  sub_filter_once on;
  ```
  (`sub_filter` exige une réponse non compressée : `proxy_set_header Accept-Encoding "";` si nginx est devant un autre serveur.)
- **Sans le script**, une app qui a déjà `esm-nextjs-utils/client` peut appeler `bridge.reportLocation(path)` et `bridge.onGoto(fn)`.

Autorisation : l'app ne répond qu'à `window.parent`, jamais avant un message valide du Shell, et seulement à l'origine de ce message. Qui peut embarquer l'app est déjà décidé par `frame-ancestors` (`EGEN_FRAME_ANCESTORS` / `CHARACTER_FRAME_ANCESTORS`) : pas de seconde liste à maintenir. `data-hosts` permet de la restreindre davantage.

## 5. Sécurité

- Seuls les **chemins internes** passent (`/…`, sans `//`, sans schéma, sans espace ni caractère de contrôle, 2000 caractères max).
- Jamais recopiés dans l'URL du Core, requête **et** fragment compris : `token`, `access_token`, `id_token`, `refresh_token`, `code`, `state`, `password`, `secret`, `otp`, `session`, `sessionid`, `auth`, `key`, `api_key`, `apikey` (insensible à la casse, extensible par `sensitiveParams`).
- Les contrôles du pont v1 restent en vigueur (source = l'iframe, origine exacte, origine cible explicite, jamais `*`).
- Bonne pratique côté app : utiliser `replaceState` pour ses **redirections** (sinon une entrée d'historique piège le retour arrière).

## 6. Vérification

| Élément | État |
| --- | --- |
| Fonctions pures (chemins, filtrage, `pathMap`, débit) | ✅ tests unitaires |
| Shell : chargement initial, `location`, `goto`, anti-boucle, dégradation sans pont, démontage | ✅ tests unitaires |
| Script injectable : silence avant le Shell, `hello`, `pushState`/`replaceState`/`popstate`, base, hash, `data-hosts`, `goto` | ✅ tests unitaires |
| tweakcn : build de production, script servi et présent dans la page | ✅ |
| tweakcn dans le Core, navigateur (clic, F5, retour, lien partagé) | ⛔ à valider |
| Penpot | ⛔ non branché : adaptateur (`history` ou `hash`) à relever sur l'instance réelle |
| Character Factory | `none` : pas d'URL à partager |

## 7. Limites connues

- Une app qui **écrit des jetons dans l'URL** doit les nommer dans `sensitiveParams` si leur nom n'est pas dans la liste par défaut.
- Les apps qui détruisent/recréent leur routeur au `goto` perdent leur état local : préférer `onGoto` (navigation douce).
- Le fil d'Ariane du Core affiche le titre annoncé ; une hiérarchie de pages complète demanderait un message `breadcrumbs` (non spécifié ici).

## 8. Mise en service (ordre des opérations)

> État au 23/11/2026 : étapes 1 à 3 faites (`esm-nextjs-utils` 0.3.0 et `esm-app-shell` 3.0.10 publiés, tweakcn `egen-app-v1.1.0`, Core aligné). Reste l'étape 4 puis la validation dans le navigateur.

1. **Framework** : la modification est sur `main` avec son changeset ; la CI ouvre la PR « Version Packages » ; la fusionner publie `@egen-civitas/esm-nextjs-utils@0.3.0` sur npm. Le Shell embarque les paquets du Framework : `scripts/ensure-shell-rebuild.mjs` ajoute seul un changeset pour `@egen-civitas/esm-app-shell` (ici 3.0.10), qui est donc republié dans la même release.
2. **Apps** : les wrappers ≥ 1.1.0 exigent `esm-nextjs-utils ^0.3.0`. Après la publication, créer le tag de release de l'app (`egen-app-v1.1.0`) ; la CI produit le tarball.
3. **Core** : monter `@egen-civitas/esm-app-shell` à la version publiée (`package.json`, `yarn install`), pointer `external-apps.json` vers le nouveau tarball, `yarn external:sync --strict`, `yarn prepare:prod`, redémarrer.
4. **Service de l'app** : déployer la nouvelle image/version (le script `egen-bridge.js` est servi par l'app).
5. **Retour arrière** : `"navigation": "none"` dans la configuration du Core désactive la synchro sans rien reconstruire.

Tant que l'étape 1 n'est pas faite, ne pas poser le tag de l'étape 2 (le build du wrapper ne trouverait pas la version 0.3.0).
