# 06 — Guide du développeur : écrire du code qui tourne sur Web, Android et iOS

Ce guide est **normatif** pour les 19 apps de catégorie A et B ([03](03-CLASSIFICATION-APPS.md)). Les apps C et D en sont dispensées. Chaque règle est
vérifiable : soit par un contrôle automatique (identifiant `N-xx` ou `ASSET-xx`, [04](04-PLAN-PHASES.md) P2), soit par la liste de relecture du §10.

**Règle d'or** : *le Web ne change pas* (P-1). Tout comportement nouveau est derrière `isNativePlatform()` ou neutre pour le Web, **et** le Web a un test nommé.

## 1. Ce que vous importez, et d'où

Tout vient d'un seul paquet, `@egen-civitas/esm-framework` (il ré-exporte les paquets du framework) :

```ts
import {
  getPlatform,          // l'objet « plateforme » : capacités natives
  isNativePlatform,     // true si la cible est android ou ios
  getPlatformEnvironment, // 'web' | 'android' | 'ios'
  PlatformError,        // erreur typée des capacités
  isPlatformError,
  navigate,             // navigation interne ; mailto: / tel: ; sortie vers le Host en natif
  ConfigurableLink,     // lien INTERNE dont le clic passe par navigate (pas pour un lien externe : voir §3.1)
  egenFetch,            // le SEUL moyen d'appeler l'API
  useSession,
} from '@egen-civitas/esm-framework';
```

- **Ne jamais** importer `@capacitor/*` ni toute autre enveloppe native : le core ne connaît pas le Host (règle ESLint N-07).
- **Ne jamais** détecter la plateforme par `navigator.userAgent` (N-06) ni par la largeur d'écran.
- Les apps A/B n'appellent l'API **que** par `egenFetch` (vérifié : le seul `fetch(` direct du dépôt est dans `esm-character-factory-app`, app web seulement).

## 2. Les trois questions avant d'écrire une ligne

1. *Est-ce que ça sort de l'app ?* (lien, e-mail, téléphone) → §3.1 et §3.3.
2. *Est-ce que ça charge quelque chose depuis Internet ?* (image, police, script) → §4.
3. *Est-ce que ça touche au stockage, aux cookies ou à l'URL ?* → §3.4 à §3.7.

Si la réponse à l'une est oui, lire la section indiquée **avant** de coder.

## 3. Motifs interdits et leurs remplaçants

Chaque ligne donne le motif interdit, son identifiant de contrôle, et ce qu'il faut écrire à la place.

### 3.1 Liens vers l'extérieur — `N-04`

```tsx
// ❌ Interdit : en WebView, le comportement de target="_blank" est indéfini
<a href="https://exemple.ga/docs" target="_blank" rel="noopener noreferrer">Documentation</a>

// ❌ Aussi interdit : ConfigurableLink / navigate() vers une URL externe CHANGENT LE WEB
//    (en Web, navigate() quitte le SPA dans le même onglet au lieu d'ouvrir un nouvel onglet)
<ConfigurableLink to="https://exemple.ga/docs">Documentation</ConfigurableLink>

// ✅ ExternalLink : Web strictement inchangé (nouvel onglet), natif : confié au Host
import { ExternalLink } from '../external-link/external-link.component';   // copie locale (T2.5, FW-REQ-7)
<ExternalLink to="https://exemple.ga/docs">Documentation</ExternalLink>
```

Comportement de `ExternalLink` : **Web** → `<a href target="_blank" rel="noopener noreferrer">` exactement comme avant ; **natif** → le clic appelle
`navigate({ to })`, qui envoie toute URL ayant un schéma autorisé (`https:`, `mailto:`, `tel:`) à la capacité `openExternal` du Host. La spécification et les tests
sont dans [04](04-PLAN-PHASES.md) T2.5 ; le fichier porte le marqueur `// SHARED: ExternalLink v1` et toutes les copies doivent être **identiques**
(`tools/check-shared-copies.mjs`). `ConfigurableLink` reste le bon composant pour les liens **internes** (§3.7).

### 3.2 Navigation par affectation de l'URL — `N-03`

```ts
// ❌ Interdit : sort de l'app (et de la base /app en natif)
window.location.href = '/';
window.location.assign('/annuaire');
window.location.replace('/login');

// ✅ Navigation interne : base de l'app incluse
import { navigate } from '@egen-civitas/esm-framework';
navigate({ to: '${egenSpaBase}/' });
navigate({ to: '${egenSpaBase}/annuaire' });
```

`${egenSpaBase}` est remplacé par la base du SPA (en natif `/app`). Pour lire la base en code : `window.getEgenSpaBase()` (retourne `/app/`).
`window.location.reload()` n'est **pas** interdit (le Web le garde), mais son usage en natif dépend de `D-15` : le noter dans la PR.

**Le Web ne doit pas changer** (P-1) : `navigate` fait une navigation **interne** (sans rechargement), alors que `window.location.href = '/'` recharge la page vers la **racine du site**.
Quand la cible Web est volontairement hors de la base du SPA, **conserver** le comportement Web dans une branche `!isNativePlatform()` et inscrire une dérogation
préenregistrée (`X-nn`, [08](08-DECISIONS-ET-RISQUES.md) §4) pour la règle N-03. Cas connu : `esm-not-found-app` (`X-01`).

### 3.3 E-mail et téléphone — `N-03`

```ts
// ❌ Interdit : le WebView quitterait l'app
window.location.href = `mailto:${email}`;

// ✅
navigate({ to: `mailto:${email}` });   // et `tel:${numero}` de même
```

### 3.4 Stockage navigateur — `N-05`

| Permis | Interdit |
| --- | --- |
| **Préférences non sensibles** : langue, thème, volume, dernière vue consultée, drapeaux d'interface | Tout **jeton**, mot de passe, secret, identifiant de session, donnée personnelle (identité, numéros, adresses) |

```ts
// ✅ préférence : clé préfixée, valeur anodine
localStorage.setItem('egen:appearance:theme', 'dark');

// ❌ interdit : nom évoquant un secret (token, secret, passw, jwt, credential, authoriz)
localStorage.setItem('egen:token', value);
sessionStorage.setItem('authorization', value);
```

- Toute clé écrite par une app est **documentée** dans le `README.md` de l'app (tableau « Données stockées » : clé, contenu, sensibilité).
- Le seul stockage de secret est la capacité `secureStorage` du Host (`getPlatform().secureStorage`), **uniquement après** `has('secureStorage')`.
- `IndexedDB` : réservé aux apps web seulement ; une app A/B qui en a besoin le **demande** (dérogation + décision).

### 3.5 Cookies — `N-02`

Aucun usage de `document.cookie` dans une app A/B. En natif il n'y a pas de cookie utile (`credentials: 'omit'`).

### 3.6 Ouverture de fenêtres — `N-01`

`window.open(...)` est interdit : utiliser `navigate({ to })`.

### 3.7 Chemins : jamais à la racine — `N-10` (avertissement) et revue

```tsx
// ❌ chemin absolu à la racine : en natif l'app est servie sous /app
<a href="/annuaire">Annuaire</a>
<img src="/assets/logo.png" />

// ✅ liens internes : composants du routeur ou navigate(), avec la base
<ConfigurableLink to="${egenSpaBase}/annuaire">Annuaire</ConfigurableLink>

// ✅ ressources : import par le code, le bundler les émet dans dist/ avec le bon chemin public
import logoUrl from './logo.png';
<img src={logoUrl} alt="" />
```

### 3.8 Presse-papiers

`navigator.clipboard.writeText` fonctionne en contexte sécurisé mais **peut rejeter** (permission, WebView). Toujours **gérer le rejet** et informer l'utilisateur :

```ts
try {
  await navigator.clipboard.writeText(text);
  showSnackbar({ title: t('copied', 'Copié'), kind: 'success' });
} catch {
  showSnackbar({ title: t('copyFailed', 'Copie impossible'), kind: 'error' });
}
```

Ne copiez **jamais** `window.location.href` ni `origin + chemin` pour du **partage** (c'est une URL locale en natif) : utilisez la clé de configuration `publicBaseUrl` (`D-16`) ; si elle est absente en natif, **masquez** l'action de partage.

### 3.9 Plein écran, notifications, géolocalisation

- `requestFullscreen`/`exitFullscreen` : à neutraliser en natif (`isNativePlatform()` → `null`), `D-14`.
- `new Notification(...)`, `Notification.requestPermission()` : interdits (`N-08`) ; les notifications push relèvent de la capacité `push` (P10).
- `navigator.geolocation` : demander d'abord une décision (capacité non fournie aujourd'hui).

## 4. Ressources : images, polices, scripts

La CSP native est (framework) : `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' <origine de l'API>; base-uri 'self'; form-action 'self'`.
**Tout ce qui est chargé depuis un autre hôte est bloqué.**

### 4.1 Règles (décision `D-08`)

| Type | Règle |
| --- | --- |
| Image de démonstration | Avatar à **initiales** (portrait) ou visuel **local** compressé |
| Illustration d'interface | Fichier **local** importé par le code |
| Image publique de l'API | Autorisée seulement après `FW-REQ-2` |
| Image/fichier **protégé** | `egenFetch` → `Blob` → `URL.createObjectURL`, révoquée au démontage (§4.4) |
| Police | Embarquée ; jamais `fonts.googleapis.com` |
| Script / iframe / vidéo distants | Interdits |

Contrôles : `N-09` (attribut `src` à URL absolue littérale), `ASSET-001` (`tools/check-remote-assets.mjs`, toutes les URL de `src/`).

### 4.2 Budget d'images locales

≤ **60 Ko** par image (WebP), ≤ **600 Ko** cumulés par app A/B ; dérogation inscrite dans [08](08-DECISIONS-ET-RISQUES.md) sinon. Dédupliquer : une photo utilisée à plusieurs endroits est importée **une fois**.

### 4.3 Avatar à initiales (modèle)

```tsx
function InitialsAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  return (
    <span
      role="img"
      aria-label={name}
      style={{ width: size, height: size, borderRadius: '50%', display: 'inline-flex', alignItems: 'center',
               justifyContent: 'center', background: `hsl(${hue} 45% 40%)`, color: '#fff', fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}
```

Couleur **déterministe** (même nom → même teinte), sans fichier, sans requête. Contraste de texte à vérifier par E-34.

### 4.4 Image protégée (conception — implémenter quand `BE-REQ-3` le confirme)

Un jeton `Bearer` **ne peut pas** être joint à `<img src="https://api/…">`. Principe :

```ts
// Signature visée (hook local à l'app qui en a besoin en premier ; FW-REQ-5 à la deuxième)
function useAuthenticatedObjectUrl(path: string | null): { url: string | null; error: Error | null; loading: boolean }
```

- `egenFetch(path)` → `await response.blob()` → `URL.createObjectURL(blob)` ;
- **annulation** à la sortie du composant (`AbortController`) et `URL.revokeObjectURL(url)` au démontage ;
- cache par `path` pour éviter de retélécharger ; états `loading` / `error` rendus explicitement (image de repli) ;
- `blob:` est autorisé par `img-src`.

## 5. Plateforme et capacités

### 5.1 Neutraliser une fonction web seulement

```tsx
export function FullscreenToggle() {
  if (isNativePlatform()) return null;       // l'app est déjà plein écran en natif
  return <button /* … */ />;
}
```

Une partie web seulement **volumineuse** se charge paresseusement pour ne pas alourdir l'artefact natif :

```tsx
const ComponentShowcasePage = React.lazy(() => import('./home/component-showcase/component-showcase.page'));
// …
{!isNativePlatform() && <Route path="home/showcase" element={<Suspense fallback={null}><ComponentShowcasePage /></Suspense>} />}
```

### 5.2 Utiliser une capacité optionnelle

```ts
const platform = getPlatform();
if (platform.has('permissions')) {
  // la fonction n'existe que si le Host la fournit
} else {
  // masquer la fonction ou afficher une alternative (jamais un faux succès, P-10)
}
```

### 5.3 `requiredCapabilities` ou garde à l'exécution ?

| Situation | Choix |
| --- | --- |
| Sans la capacité, **toute l'app** est inutilisable (ex. login sans `session`) | `requiredCapabilities` dans `routes.json` : l'app n'est pas enregistrée |
| Seule **une fonction** de l'app en dépend | Garde `has('…')` à l'exécution |

### 5.4 Erreurs des capacités : `PlatformError`

Toute capacité **rejette** avec `PlatformError` (champs `code`, `message`, `retryable`, `capability`, `method`). Le texte du `message` **n'est pas localisé** et **ne doit pas être affiché** : afficher une clé de traduction choisie selon `code`.

| `code` | Sens | Comportement de l'app |
| --- | --- | --- |
| `UNAVAILABLE` | Capacité absente | Masquer la fonction ou proposer une alternative |
| `DENIED` | Refus de l'utilisateur ou du système | Expliquer, ne pas insister |
| `CANCELLED` | L'utilisateur a annulé | Ne rien afficher |
| `INVALID_ARGS` | Bogue d'appel | Journaliser (sans donnée sensible), message générique |
| `TIMEOUT` | Pas de réponse du Host | Proposer de **réessayer** (rejouable) |
| `INCOMPATIBLE` | Host incompatible | Géré par le shell (écran bloquant) |
| `HOST_ERROR` | Échec du Host | Message générique, réessayer si `retryable` |

```ts
try {
  await getPlatform().openExternal.open(url);
} catch (error) {
  if (isPlatformError(error) && error.code === 'UNAVAILABLE') { /* alternative */ }
  else throw error;
}
```

Préférer `navigate({ to })` à l'appel direct de `openExternal` : il applique en plus les règles de sécurité du framework (schémas autorisés).

## 6. Session et authentification

- Une app **ne lit jamais** un jeton : elle ne voit que l'état de la session (`useSession()`).
- Tous les appels passent par `egenFetch`, qui ajoute l'autorisation, rafraîchit sur 401 et rejoue **une fois**. **N'ajoutez pas d'intercepteur ni d'en-tête `Authorization`** à la main.
- La connexion/déconnexion natives relèvent **exclusivement** de `esm-login-app` ([05](05-CONTRAT-SESSION-LOGIN.md)).
- Ne comptez pas sur un cookie : en natif il n'y en a pas.

## 7. Interface mobile

Seuils vérifiés automatiquement en P7 ([07](07-TESTS-ET-CI.md) §5).

| Règle | Détail |
| --- | --- |
| Pas de défilement horizontal | `document.documentElement.scrollWidth <= window.innerWidth` à 360, 390 et 768 px de large |
| Cibles tactiles | ≥ **44 × 44 px CSS** pour tout `button`, `a[href]`, `[role="button"]`, `input`, `select` |
| Texte | ≥ **14 px** pour le contenu courant |
| Pas d'action **uniquement au survol** | Toute action accessible au survol (`:hover`) l'est aussi au toucher (`:focus`, clic). Apps concernées à auditer : `quick-access`, `ai-assistant`, `primary-navigation`, `informations` |
| Hauteur d'écran | Préférer `100dvh` (avec repli `100vh`) à `100vh` seul : la barre d'adresse et le clavier changent la hauteur utile. Apps concernées : `primary-navigation`, `user-profile`, `sites`, `login`, `annuaire` |
| Zones sûres | Barres fixes en haut/bas : `padding-top: env(safe-area-inset-top)` / `padding-bottom: env(safe-area-inset-bottom)` (une fois `FW-REQ-1` livrée) |
| Saisie | `inputMode`, `type` et `autoComplete` adaptés (e-mail, numérique) ; ne pas modifier les attributs du formulaire de login pour le Web |
| Contraste | 4,5:1 pour le texte courant, thèmes clair et sombre |
| Pas de dépendance au clavier physique | Tout parcours est faisable au doigt |

## 8. Tests

### 8.1 Simuler la plateforme dans un test unitaire

La détection native **lit `window.egenTarget`** (c'est la vraie implémentation, y compris dans `@egen-civitas/esm-framework/mock`). Deux motifs, selon le mock de l'app :

```ts
// Motif A — l'app utilise le mock complet du framework (setup-tests.ts : vi.mock('@egen-civitas/esm-framework', () => import('@egen-civitas/esm-framework/mock')))
beforeEach(() => { (window as any).egenTarget = 'android'; });
afterEach(() => { delete (window as any).egenTarget; });

it('natif : le plein écran n’est pas proposé', () => {
  render(<FullscreenToggle />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('web : le plein écran est proposé (non-régression)', () => {
  delete (window as any).egenTarget;
  render(<FullscreenToggle />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

```ts
// Motif B — l'app écrit un mock partiel (comme esm-footer-app) : ajouter explicitement isNativePlatform
vi.mock('@egen-civitas/esm-framework', () => ({
  useConfig: vi.fn(),
  ConfigurableLink: ({ children, to }: any) => <a href={to}>{children}</a>,
  isNativePlatform: vi.fn(() => false),
  navigate: vi.fn(),
}));
vi.mocked(isNativePlatform).mockReturnValue(true);
```

### 8.2 Simuler une capacité

`createMockPlatform` n'existe **que** dans le mock du framework (il n'est pas exporté par le paquet réel) : l'importer depuis `@egen-civitas/esm-framework/mock`.

```ts
import { getPlatform } from '@egen-civitas/esm-framework';
import { createMockPlatform } from '@egen-civitas/esm-framework/mock';
vi.mocked(getPlatform).mockReturnValue(
  createMockPlatform({ environment: 'android', capabilities: { session: { setTokens: vi.fn().mockResolvedValue(undefined) } } }),
);
```

### 8.3 Vérifier qu'un secret n'est pas stocké

```ts
const setItem = vi.spyOn(Storage.prototype, 'setItem');
await login();
expect(setItem.mock.calls.flat().join(' ')).not.toContain('SECRET-ACCESS-TOKEN');
```

### 8.4 Ce que chaque PR doit ajouter

| Vous changez… | Test à ajouter |
| --- | --- |
| Un comportement derrière `isNativePlatform()` | Un test **natif** et un test **web** (non-régression nommée) |
| Un lien ou une navigation | Le clic appelle `navigate` avec l'URL attendue |
| Une ressource | Aucune URL distante dans le rendu (E-02 pour l'app) |
| Du stockage | Test du contenu stocké (clé, valeur) et absence de secret |
| Une app sans test (`help-menu`, `tenant-routing`, `character-factory`) | Au moins un test de rendu |

### 8.5 Banc natif simulé

`yarn build:native-preview && yarn e2e:native` ; pour une app : `yarn e2e:native --grep "<nom de l'app>"`. Un test annoté `test.fail(true, '<F-xx> → <tâche>')` documente un défaut connu : **s'il se met à passer, retirer l'annotation dans la même PR**.

## 9. Données de démonstration

Les jeux de données factices (annuaire, actualités, événements, vitrine) **ne doivent pas** déclencher de requête externe en natif. Tant qu'ils existent : images locales ou avatars à initiales (§4). Quand l'API fournit les vraies données, supprimer le jeu factice **et** ses images dans la même PR.

## 10. Liste de relecture d'une PR (à copier dans la description)

- [ ] Aucun motif interdit du §3 (le lint est vert, **zéro avertissement N-0x** pour l'app concernée si elle est native) ; liens externes par `ExternalLink`.
- [ ] Aucune URL distante (`node tools/check-remote-assets.mjs --app <nom>` → 0).
- [ ] Comportement Web inchangé, avec **un test nommé**.
- [ ] Comportement natif testé (unitaire et/ou `yarn e2e:native`).
- [ ] Aucun jeton, mot de passe ni donnée personnelle en stockage navigateur ; clés documentées dans le README de l'app.
- [ ] Aucun message d'erreur n'affiche un texte brut d'exception ou d'API.
- [ ] Les chemins utilisent la base (`${egenSpaBase}`) ; aucun chemin racine.
- [ ] Les actions ne dépendent pas du survol ; cibles ≥ 44 px (si l'écran est modifié).
- [ ] `version` de l'app incrémentée + note `.changeset/` si le comportement publié change.
- [ ] `tools/platform-matrix.json` et `routes.json` cohérents (`node tools/check-platforms.mjs` → 0).
- [ ] Le suivi `docs/SUIVI-MULTIPLATEFORME.md` est à jour.
- [ ] Aucune dérogation non inscrite dans [08](08-DECISIONS-ET-RISQUES.md).

## 11. Demander une dérogation

Une règle peut être levée **pour une raison précise et datée**. Procédure : (1) ouvrir une ligne dans [08](08-DECISIONS-ET-RISQUES.md) §4 (identifiant `X-nn`, règle, fichier, raison, date de réexamen, responsable) ;
(2) mettre dans le code un commentaire `// EXEMPTION X-nn : <raison>` à l'endroit exact ; (3) pour ESLint, `// eslint-disable-next-line <règle> -- X-nn` (jamais `eslint-disable` sur un fichier entier) ;
(4) la PR est relue par un second développeur. Une dérogation **sans** ligne dans [08](08-DECISIONS-ET-RISQUES.md) fait échouer la relecture.

## 12. Pièges connus

| Piège | Explication |
| --- | --- |
| « Ça marche dans mon navigateur » | Le navigateur n'applique ni la CSP native, ni la base `/app`, ni l'absence de cookie. Tester avec `yarn e2e:native` |
| `?.` qui masque une erreur | `navigator.clipboard?.writeText(...)` ne dit rien si l'API manque ; gérer explicitement (§3.8) |
| Image copiée dans un composant puis oubliée | Le contrôle `ASSET-001` regarde **tous** les fichiers de `src/`, données comprises |
| Mock partiel sans `isNativePlatform` | Le test passe **faussement** en Web ; utiliser le motif A ou ajouter la fonction au mock (§8.1) |
| Lien relatif sans base | Fonctionne en Web servi à la racine, casse en natif (`/app`) |
| `ConfigurableLink` pour un lien externe | En Web, il quitte le SPA dans le **même onglet** (régression par rapport à `target="_blank"`) : utiliser `ExternalLink` |
| `reload()` | Dépend du Host (`HOST-REQ-1`, `D-15`) : ne pas l'ajouter sans nécessité |
