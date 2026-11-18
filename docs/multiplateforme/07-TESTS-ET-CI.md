# 07 — Tests et CI : comment prouver que ça marche, à chaque niveau

Un changement est **terminé** quand il est prouvé à **chaque niveau qui le concerne**. Ce document définit les niveaux, les outils, le **catalogue de
scénarios** (`E-xx`), les seuils mobiles, le protocole sur appareil (`P9-xx`) et la politique CI.

## 1. Les niveaux

| Niveau | Quoi | Outil | Où | Vitesse | Bloquant pour la fusion |
| --- | --- | --- | --- | --- | --- |
| **L0** | Contrôles statiques : déclarations, lint, ressources distantes, copies partagées, version, contenu publié | `tools/*.mjs`, ESLint, `tsc` | local + CI | secondes | **Oui** |
| **L1** | Tests unitaires (fonctions, hooks, composants isolés) | Vitest + Testing Library | local + CI | secondes | **Oui** |
| **L2** | Tests d'intégration de composants (plateforme simulée par `createMockPlatform`) | Vitest + Testing Library | local + CI | secondes | **Oui** |
| **L3** | Banc natif simulé : vrai shell natif + vraies apps du core + **faux Host** + API simulée, dans un vrai navigateur | Playwright (`e2e-native/`) | local + CI | minutes | **Oui** (dès la fin de T3.4) |
| **L3-bis** | E2E Web existant (backend réel, Docker) | Playwright (`e2e/`) | CI dédiée | minutes | Selon l'existant |
| **L4** | Validation sur **appareil réel** | Procès-verbal | humain | heures | Condition de sortie de P9 |

**Ce que chaque niveau ne prouve pas** : L1/L2 ne prouvent ni la CSP, ni la base `/app`, ni le filtrage de plateformes ; L3 ne prouve ni le comportement
du WebView réel (clavier, rotation, presse-papiers, `reload()`), ni la vraie sécurité du Keychain/Keystore ; L4 est le seul à les prouver.

## 2. L0 — Contrôles statiques

| Contrôle | Commande | Codes | Phase | Échec ⇒ |
| --- | --- | --- | --- | --- |
| Déclaration de plateforme | `yarn verify:platforms` (`tools/check-platforms.mjs`) | `PLAT-001` à `PLAT-007` | P1 | PR bloquée |
| Règles ESLint natives | `yarn lint` | `N-01` à `N-10` (avertissement tant que l'app est `nativePending`, erreur ensuite) | P2 | PR bloquée si erreur |
| Ressources distantes | `node tools/check-remote-assets.mjs` | `ASSET-001` | P2 | idem |
| Copies partagées identiques | `node tools/check-shared-copies.mjs` | `SHARED-001` | P2 (T2.5) | PR bloquée |
| Incrément de version | `node tools/check-version-bump.mjs` | — (liste les apps) | P0 | informatif puis bloquant (décision fin de P1) |
| Contenu publié | `node tools/check-pack.mjs` | `PACK-001` à `PACK-005` | P8 | PR bloquée |
| Tests des outils | `node --test tools/*.test.mjs` | — | P1+ | PR bloquée |
| Navigation | `node tools/check-nav-routes.mjs` | (existant) | existant | PR bloquée |
| Types | `turbo run typescript` | — | existant | PR bloquée |

`yarn verify` les enchaîne tous (sauf `check-pack`, lancé en CI de livraison). Une règle sans test **n'existe pas** : chaque contrôle a sa suite `node --test` avec un cas qui échoue et un cas qui passe.

## 3. L1 et L2 — Tests unitaires et d'intégration

- **Outils existants conservés** : Vitest, Testing Library, `setup-tests.ts` de chaque app (qui charge le mock `@egen-civitas/esm-framework/mock`), `cleanup` automatique.
- **Obligation par PR** : voir [06](06-GUIDE-DEVELOPPEUR.md) §8.4 (un test **natif** et un test **Web** pour tout comportement derrière `isNativePlatform()`).
- **Simulation de la plateforme** : `window.egenTarget = 'android'` pour la cible ; `createMockPlatform` (depuis `@egen-civitas/esm-framework/mock`) pour les capacités ([06](06-GUIDE-DEVELOPPEUR.md) §8.1-8.2).
- **Apps sans test** : `help-menu`, `tenant-routing`, `character-factory` — **au moins un test de rendu** chacune (`help-menu` : en vague 1 ; les deux autres : dette consignée, pas de gel de la matrice).
- **Pas de seuil de couverture global imposé** par ce programme ; l'exigence est **le test du changement**. Le seuil éventuel est une décision d'équipe, hors périmètre.
- **Non-régression Web** : tout test Web ajouté par ce programme porte un titre commençant par `Web :` pour être retrouvable (`yarn test -t "Web :"`).

## 4. L3 — Banc natif simulé

### 4.1 Architecture

```
 yarn build:native-preview                              yarn e2e:native
        │                                                      │
 apps (dist/) + egen build --platform android  ──►  e2e-native/.artifact/android/
        │                                                      │
        │            ┌──────────── Playwright (Chromium) ──────┤
        │            │  addInitScript : faux Host (createMockHost, lu dans esm-platform/dist/testing)
        │            │  route 'https://api.test.local/**' : API simulée (fixtures 05)
        │            │  serveur statique /app/* (repli SPA) : journal des requêtes
        │            │  sondes : CSP, requêtes hors origine, pageerror, console
        └────────────┴──────────────────────────────────────────────────────────
```

- **Le shell est le vrai shell natif** (construit par `egen build --platform android`, CSP stricte, règles de validation) ; **les apps sont les vraies apps** du core.
- **Le faux Host** est `createMockHost` du framework, **jamais copié** : le script est lu à l'exécution depuis `@egen-civitas/esm-platform/dist/testing/mock-host.js`.
  Il est injecté par `page.addInitScript` (avant tout script de la page, hors CSP) ; les gestionnaires de capacités (`session.*`…) sont des **fonctions sérialisées** qui
  s'exécutent dans la page, l'état partagé passant par `window.__host`.
- **L'API est entièrement simulée** (`page.route`) : aucune requête réseau réelle ; une requête vers un hôte **non prévu** est **enregistrée** (sonde) et fait échouer E-01/E-02.
- **Déterminisme** : 1 worker, aucune nouvelle tentative, aucune attente fixe (`waitForTimeout` interdit ; attentes sur état observable), fuseau et langue fixés.

### 4.2 Sondes (communes à tous les scénarios)

| Sonde | Mécanisme | Vérifiée |
| --- | --- | --- |
| Violation de CSP | écouteur `securitypolicyviolation` injecté dans la page | `afterEach` de **chaque** scénario : 0 violation (**c'est E-04**) |
| Requête hors origine | `page.on('request')` : origine ∉ {serveur statique, API simulée, `data:`, `blob:`} | E-01, E-02 |
| Erreur de page | `page.on('pageerror')` | `afterEach` : 0 erreur non interceptée |
| Réponses non 200 du serveur statique | journal du serveur | E-01 |

### 4.3 Catalogue des scénarios

**Légende** : *Obl.* = obligatoire pour la sortie de la phase indiquée. *Statut initial* : état attendu au premier passage (avant les correctifs).
`test.fail` = défaut **connu**, le test est écrit pour **échouer** tant que le défaut existe (voir §8).

**Famille A — Démarrage, CSP, base, plateformes**

| ID | Titre | Étapes | Assertions | Phase | Obl. | Statut initial |
| --- | --- | --- | --- | --- | --- | --- |
| E-01 | Démarrage natif propre | Charger `/app/` avec un Host compatible | 0 réponse ≠ 200 du serveur statique ; 0 requête hors origine ; 0 `pageerror` ; au moins une app enregistrée | P3 | ✔ | vert attendu |
| E-02 | Aucune ressource externe | Visiter chaque route des apps A/B (`login`, `home`, `annuaire`, `informations`, `sites`, 404, `home/showcase`) | Aucune requête vers un hôte autre que le serveur et l'API ; **témoin positif** : une image locale d'app est servie (200) depuis `/app/apps/<dir>/` | P3, P5 | ✔ | `test.fail` (F-02) |
| E-03 | Base `/app` respectée | Aller sur une route inconnue (404), cliquer « retour à l'accueil » | L'URL commence par `/app/` ; aucune requête hors `/app/` ; la page d'accueil s'affiche | P3, P6 | ✔ | `test.fail` (F-04) |
| E-04 | CSP respectée | (sonde `afterEach`) | 0 violation sur **tous** les scénarios | P3 | ✔ | vert attendu |
| E-05 | Canal WebSocket de l'assistant sous CSP | Ouvrir le panneau de l'assistant ; le canal tente `wss://api.test.local/...` | Aucune violation `connect-src` | P6 | ✔ | **à confirmer** : son premier résultat confirme ou infirme F-21 ; s'il échoue, ajouter `test.fail(true, 'F-21 → FW-REQ-6')` |
| E-06 | Host incompatible | Host simulé avec `protocol: 99` | Écran `.egen-host-incompatible` visible, bouton « Réessayer » ; `0` app enregistrée ; `0` appel API ; `0` `pageerror` | P3 | ✔ | vert attendu |
| E-06b | Host absent | Aucun Host injecté | Même écran | P3 | ✔ | vert attendu |
| E-07 | Filtrage des plateformes | Démarrer avec Host `android` | Pour chaque app C/D : un avertissement « pas enregistrée » (raison `platform`) ; pour chaque app A/B déclarée native : aucun | P3 | ✔ | vert attendu |

**Famille B — Session (détail dans [05](05-CONTRAT-SESSION-LOGIN.md) §9)**

| ID | Titre | Phase | Obl. |
| --- | --- | --- | --- |
| E-10 | Connexion réussie (jetons chez le Host, pas dans le WebView) | P4 | ✔ |
| E-11 | Les appels portent `Bearer`, sans cookie | P4 | ✔ |
| E-12 | 401 → un seul rafraîchissement → rejeu | P4 | ✔ |
| E-13 | Rafraîchissement refusé → retour au login, sans boucle | P4 | ✔ |
| E-14 | Aucun jeton ni mot de passe en `localStorage`, `sessionStorage`, cookie, IndexedDB | P4 | ✔ |
| E-15 | Host sans `session` → message clair, aucune requête d'échange | P4 | ✔ |
| E-16 | Déconnexion, y compris API coupée | P4 | ✔ |
| E-17 | Mauvais mot de passe | P4 | ✔ |
| E-18 | API injoignable | P4 | ✔ |
| E-19 | Changement de mot de passe porte `Bearer` | P4 | ✔ |

**Famille C — Apps**

| ID | Titre | Étapes | Assertions | Phase | Obl. |
| --- | --- | --- | --- | --- | --- |
| E-20 | Fumée par app (test **paramétré** par app A/B) | Charger la route ou le slot de l'app (`e2e-native/support/app-smoke-map.json`) | L'app est enregistrée ; son contenu se rend (sélecteur de la carte) ; 0 erreur. **Garde-fou de complétude** : une app A/B **sans entrée** dans la carte fait échouer le test | P3 → P6 | ✔ |
| E-21 | Liens externes → Host | Cliquer chaque lien externe (footer ×2, aide ×3, pied de login, liens sociaux, menu d'applications, modale d'événement, panneau assistant) | Le faux Host reçoit `openExternal.open(<url>)` **une fois** ; aucune nouvelle fenêtre ; l'app reste sur sa page | P6 | ✔ |
| E-22 | `mailto:` (annuaire) | Cliquer l'e-mail d'un collaborateur | `openExternal.open('mailto:…')` reçu ; l'app ne quitte pas sa page | P6 | ✔ |
| E-23 | Partage (informations) | Natif **sans** `publicBaseUrl` ; puis **avec** | Sans : bouton de partage **absent** ; avec : le presse-papiers contient l'URL publique, jamais une URL locale | P6 | ✔ |
| E-24 | Plein écran absent (appearance) | Ouvrir la barre supérieure | Le bouton plein écran n'existe pas ; le thème se bascule | P6 | ✔ |
| E-25 | Vitrine non montée (home) | Aller sur `/app/home/showcase` | Page inconnue (404) ; aucune requête vers `images.unsplash.com`, `picsum.photos`, `prod.spline.design` | P6 | ✔ |
| E-26 | Assistant en mode texte | Ouvrir l'assistant | Pas de bouton micro ; un échange texte fonctionne avec un canal simulé | P6 | ✔ |
| E-27 | Changement de langue | Changer de langue | Rechargement ; retour sur la **même route** ; libellés dans la nouvelle langue | P6 | ✔ (révisé par `D-15`) |

**Famille D — Mobile (seuils du §5)**

| ID | Titre | Phase | Obl. |
| --- | --- | --- | --- |
| E-30 | Pas de défilement horizontal (par écran et par viewport) | P7 | ✔ |
| E-31 | Zones sûres : les barres fixes utilisent `env(safe-area-inset-*)` | P7 | ✔ si `FW-REQ-1` livrée |
| E-32 | Cibles tactiles ≥ 44 × 44 px (barre supérieure, pied de page, login) | P7 | ✔ |
| E-33 | Taille de texte ≥ 14 px | P7 | ✔ |
| E-34 | Accessibilité de base (`@axe-core/playwright` : aucune violation `serious`/`critical`) sur login, accueil, annuaire, informations | P7 | ✔ |

**Famille E — Non-régression Web (obligatoire dès P3)**

| ID | Titre | Étapes | Assertions |
| --- | --- | --- | --- |
| E-90 | Le Web démarre et le login garde Basic + cookie | Artefact **Web** du même build (`yarn build:native-preview --platform web`) ; aucun Host | La page de connexion s'affiche ; la requête de connexion porte `Authorization: Basic …` ; **aucun** appel à `setTokens` |
| E-91 | Aucune CSP imposée en Web, aucun écran d'incompatibilité | Idem | Pas de balise `Content-Security-Policy` ; jamais `.egen-host-incompatible` |
| E-92 | Les liens externes gardent `target="_blank"` | Idem | Chaque lien externe porte `target="_blank"` et `rel` contenant `noopener` ; le clic ouvre un **nouvel onglet** (événement `popup`) |
| E-93 | Plein écran et vitrine présents en Web | Idem | Bouton plein écran présent ; `/home/showcase` rend la vitrine |
| E-94 | Retour à l'accueil du 404 en Web | Idem | Comportement identique à l'avant (`window.location.href = "/"`, `X-01`) |

### 4.4 Carte de fumée `app-smoke-map.json`

Entrée par app A/B : `{ "esm-help-menu-app": { "slot": "help-menu-slot", "selector": "[data-testid='help-menu']" } }` ou `{ "route": "/annuaire", "selector": "…" }`.
Créée en T3.3, complétée **dans la PR de chaque app** (même PR que le passage en natif).

### 4.5 Exécution locale

```bash
yarn build:apps
yarn build:native-preview                     # artefact android ; --platform ios pour iOS
yarn e2e:native                                # tous les scénarios
yarn e2e:native --grep "E-1[0-9]"              # un sous-ensemble
EGEN_E2E_CHROMIUM=/chemin/vers/chromium yarn e2e:native   # poste sans accès au CDN de Playwright
```

Recette Chromium sans CDN : `npm i @sparticuz/chromium playwright-core` puis passer `chromium.executablePath()` dans la variable.

## 5. Seuils mobiles (référence de P7)

| Mesure | Seuil | Viewports | Test |
| --- | --- | --- | --- |
| Défilement horizontal | `scrollWidth <= innerWidth` | 360×800, 390×844, 768×1024 | E-30 |
| Cible tactile | ≥ 44 × 44 px CSS (`button`, `a[href]`, `[role="button"]`, `input`, `select`) | idem | E-32 |
| Texte courant | `font-size` calculé ≥ 14 px | idem | E-33 |
| Contenu masqué par une barre fixe | aucun élément interactif entièrement recouvert | idem | E-30/E-32 |
| Zones sûres | présence de `env(safe-area-inset-*)` dans les styles des barres fixes | — | E-31 |
| Accessibilité | 0 violation `serious`/`critical` | 390×844 | E-34 |
| Démarrage | mesure consignée, **pas de dégradation > 10 %** | CPU ×4 | T7.7 |

Les valeurs 44 px et 14 px sont des **seuils de départ** (recommandations de plateformes mobiles) ; toute modification passe par [08](08-DECISIONS-ET-RISQUES.md).

## 6. L4 — Validation sur appareil (P9)

### 6.1 Prérequis
Voir [04](04-PLAN-PHASES.md) P9. Backend de test avec jeton d'accès **court** (ex. 2 minutes) pour provoquer le rafraîchissement.

### 6.2 Parcours

| ID | Parcours | Résultat attendu | Simulable ? |
| --- | --- | --- | --- |
| P9-01 | Installer et lancer | L'app démarre sans écran d'erreur | non |
| P9-02 | Handshake : Host compatible, puis Host forcé incompatible | Accueil normal ; écran « Mise à jour requise » dans le 2ᵉ cas | partiel (E-06) |
| P9-03 | Connexion nominale | Arrivée à l'accueil | partiel (E-10) |
| P9-04 | Mauvais mot de passe | Message clair, champ vidé | partiel (E-17) |
| P9-05 | Tuer l'app et la relancer avec une session | Toujours connecté, sans ressaisie | non |
| P9-06 | Utiliser l'app au-delà de la durée du jeton | Aucune déconnexion visible (rafraîchissement) | partiel (E-12) |
| P9-07 | Révoquer la session côté serveur | Retour au login avec « session expirée » | partiel (E-13) |
| P9-08 | Lien externe (pied de page / aide) | S'ouvre dans le navigateur système ; l'app reste en l'état | non |
| P9-09 | `mailto:` (annuaire) | Ouvre l'application de messagerie | non |
| P9-10 | Partage (informations) | Bouton absent sans `publicBaseUrl` ; sinon URL publique copiée | partiel (E-23) |
| P9-11 | Changer de langue (rechargement) | Retour sur la même route, langue appliquée (`D-15`) | non |
| P9-12 | Clavier virtuel ouvert sur le login | Champs visibles, validation possible | non |
| P9-13 | Rotation portrait ↔ paysage | Aucune perte d'état, aucun débordement | non |
| P9-14 | Arrière-plan > 5 min puis retour | Session valide, horloge à l'heure | non |
| P9-15 | Coupure réseau pendant l'usage, puis retour | Messages adaptés, pas de plantage, reprise au retour | non |
| P9-16 | Déconnexion hors ligne | Déconnecté localement | partiel (E-16) |
| P9-17 | Ouvrir chacune des 19 apps natives | Chaque app visible s'affiche | partiel (E-20) |
| P9-18 | Bouton retour matériel (Android) / geste retour (iOS) | Navigation arrière dans le SPA, pas de sortie inopinée | non |
| P9-19 | Mesurer le démarrage (chronomètre) sur l'appareil d'entrée de gamme | Valeur consignée ; pas d'écran blanc anormal | non |
| P9-20 | 404 puis retour à l'accueil | Reste sous `/app`, accueil affiché | partiel (E-03) |

### 6.3 Modèle de procès-verbal (`docs/multiplateforme/pv/AAAA-MM-JJ-<appareil>.md`)

```markdown
# PV P9 — <appareil> — <date>
- Appareil / OS / version du WebView :
- Version de l'application native / du Host / de l'artefact (commit des distributions) :
- Backend (URL, jeton d'accès : <durée>) :
- Testeur :

| Parcours | Résultat (OK / KO / N/A) | Preuve (capture, vidéo) | Écart (F-xx) |
| --- | --- | --- | --- |
| P9-01 | | | |
| … (20 lignes) | | | |

## Écarts
| F-xx | Gravité (C/H/M/B) | Description | Tâche |
## Conclusion : accepté / refusé (motif)
```

## 7. CI

| Job | Déclenchement | Contenu | Durée cible | Requis |
| --- | --- | --- | --- | --- |
| Build & verify (existant) | PR et `main` | `turbo build`, puis `yarn verify` (inclut L0, L1, L2) | existant | Oui |
| **e2e-native** (nouveau, T3.4) | PR et `main` | `yarn build` → `build:native-preview --skip-apps-build` → `playwright install --with-deps chromium` → `yarn e2e:native` | ≤ 20 min | Oui, une fois stable |
| Contrôle de version (nouveau, T0.3) | PR | `check-version-bump` | < 1 min | Informatif, puis oui |
| Dérive des dépendances `@egen-civitas` (existant) | PR | informatif | existant | Non |
| Publication npm (existant) | release / `main` | `ci:publish` | existant | — |

- **Artefacts d'échec** : captures et traces Playwright téléversées.
- **Cache** : mise en cache de `node_modules` et du cache Turbo.
- **Protection de branche** : le job `e2e-native` devient **vérification requise** après trois exécutions consécutives vertes sur `main` (décision du responsable).
- **Règle** : une PR qui rend un test `test.fail` vert **doit** retirer l'annotation ; un test `test.fail` dont le défaut a disparu est une **erreur** (par construction).

## 8. Politique

| Sujet | Règle |
| --- | --- |
| Test instable (« flaky ») | **Interdit de relancer jusqu'à ce que ça passe.** On diagnostique : attente non déterministe, dépendance d'ordre, état partagé. Un test instable est corrigé dans la semaine ou retiré avec une entrée dans [08](08-DECISIONS-ET-RISQUES.md) |
| Défaut connu | Annotation `test.fail(true, '<F-xx> → <tâche>')` **avec référence de tâche** ; aucune annotation sans référence |
| `test.skip` / `test.fixme` | Interdits pour les scénarios **obligatoires** ; ailleurs, dérogation inscrite dans [08](08-DECISIONS-ET-RISQUES.md) |
| Fixtures d'API | Dérivées du contrat de [05](05-CONTRAT-SESSION-LOGIN.md) §6 ; toute évolution du contrat met à jour les fixtures **dans la même PR** |
| Réseau réel | Interdit dans L1/L2/L3 |
| Rapport | À la fin de chaque phase, le nombre de tests par niveau et la liste des `test.fail` restants sont consignés dans le suivi |
