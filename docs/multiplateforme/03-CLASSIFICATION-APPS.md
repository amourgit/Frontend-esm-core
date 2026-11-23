# 03 — Classification des applications du core

Ce document répond, pour **chaque app**, à quatre questions : sur quelles cibles tourne-t-elle ? de quelles capacités
a-t-elle besoin ? que faut-il changer (fichier et ligne) ? comment le prouver ?

La classification est une **décision** (`D-01`). Elle est révisable, mais seulement par une modification de ce document
**et** de la matrice machine-lisible du §3, dans la même PR.

> **⚠️ À réviser (tâche R0, 2026-11-17)** : `main` compte désormais **30 apps** (4 nouvelles : `launcher` → B, `navigation` → B, `search` → A, `side-panel` → A) et
> `esm-primary-navigation-app` devient **A** (squelette neutre). Totaux attendus : **A 9, B 14, C 2, D 3 = 28 ; 23 natives** (`theme-studio` et `character-factory` ont été retirées du core le 19/11 : réformes Tweakcn et Character). La fiche de `quick-access`
> (§6.14) est erronée : l'app **n'est pas** en cours de retrait (seul un bouton de la TopBar l'a été). Les fiches §6.2 (primary-navigation) et la matrice §3
> sont à régénérer ; voir [02](02-ETAT-DES-LIEUX.md) (bandeau de mise à jour) et `docs/SUIVI-MULTIPLATEFORME.md` (R0).

## 1. Les quatre catégories

| Cat. | Nom | Sens | Valeur de `platforms` dans `routes.json` | Présente dans une distribution native ? |
| --- | --- | --- | --- | --- |
| **A** | Universelle | Aucune incompatibilité trouvée par l'audit. Des vérifications suffisent. | `["web","android","ios"]` | Oui |
| **B** | Universelle après adaptation | Fonctionne sur les trois cibles **une fois** les changements listés faits. | `["web","android","ios"]` | Oui (une fois la vague terminée) |
| **C** | Web seulement | Dépend de capacités du navigateur de bureau ou n'a pas de sens sur téléphone. | `["web"]` | Non |
| **D** | Développement / diagnostic | Outil de l'équipe, à ne jamais livrer à des utilisateurs finaux. | `["web"]` | Non, et **exclue de toute distribution de production** (même Web) |

**Règle de transition** : pendant que l'adaptation d'une app de catégorie B n'est pas terminée, sa valeur de `platforms`
reste `["web"]`. Elle ne passe à `["web","android","ios"]` que dans la PR qui termine ses tâches (critère de sortie de
sa vague, [04](04-PLAN-PHASES.md) §P6). Ainsi une app **incomplète n'est jamais enregistrée en natif**.

## 2. Synthèse

| Cat. | Nombre | Apps |
| --- | --- | --- |
| A | 6 | branding, clock, notifications, quick-access, settings, spaces-sites |
| B | 13 | ai-assistant, annuaire, appearance, footer, help-menu, home, informations, language, login, not-found, primary-navigation, sites, user-profile |
| C | 2 | offline-tools, tenant-routing |
| D | 3 | devtools, implementer-tools, logs |
| **Total** | **24** (audit du 15/11, hors les 4 apps nouvelles du bandeau) | **19 apps « natives »** (A + B), 2 web seulement, 3 développement |

## 3. Matrice de référence (spécification de `tools/platform-matrix.json`)

Cette matrice sera créée en **P1** ; elle est la **source unique** que lisent `tools/check-platforms.mjs`,
`tools/list-apps.mjs` et la configuration ESLint (exemptions des apps C et D). Le tableau ci-dessous en donne le
contenu **final** (colonne « Cible » = valeur à atteindre ; la valeur courante de `platforms` suit la règle de transition
du §1).

```json
{
  "$comment": "Source unique de la classification. Modifier ici ET dans docs/multiplateforme/03-CLASSIFICATION-APPS.md.",
  "version": 1,
  "frameworkPeer": "^4.1.0",
  "apps": {
    "esm-ai-assistant-app":       { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-annuaire-app":           { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-appearance-app":         { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-branding-app":           { "category": "A", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-clock-app":              { "category": "A", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-devtools-app":           { "category": "D", "platforms": ["web"],                   "requiredCapabilities": [] },
    "esm-footer-app":             { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-help-menu-app":          { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-home-app":               { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-implementer-tools-app":  { "category": "D", "platforms": ["web"],                   "requiredCapabilities": [] },
    "esm-informations-app":       { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-language-app":           { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-login-app":              { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": ["session"] },
    "esm-logs-app":               { "category": "D", "platforms": ["web"],                   "requiredCapabilities": [] },
    "esm-not-found-app":          { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-notifications-app":      { "category": "A", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-offline-tools-app":      { "category": "C", "platforms": ["web"],                   "requiredCapabilities": [] },
    "esm-primary-navigation-app": { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-quick-access-app":       { "category": "A", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-settings-app":           { "category": "A", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-sites-app":              { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-spaces-sites-app":       { "category": "A", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] },
    "esm-tenant-routing-app":     { "category": "C", "platforms": ["web"],                   "requiredCapabilities": [] },
    "esm-user-profile-app":       { "category": "B", "platforms": ["web", "android", "ios"], "requiredCapabilities": [] }
  }
}
```

**Champ `frameworkPeer`** : valeur que doit avoir, dans **chaque** app, le peer `@egen-civitas/esm-framework` (`D-17`) ;
il est lu par le contrôle `PLAT-007`.

**Champ `nativePending`** (booléen, présent dans la matrice mais **absent de `routes.json`**) : `true` pour toute app de
catégorie A ou B dont la déclaration native n'est pas encore faite. Tant qu'il vaut `true`, la valeur courante de
`platforms` dans `routes.json` doit être `["web"]` ; quand l'app est terminée, **la même PR** passe `nativePending` à
`false` (ou le retire) et met `platforms` à la valeur cible. Au départ (fin de P1), `nativePending: true` pour les 19 apps
A et B ; il n'existe pas pour les apps C et D.

**Pourquoi `requiredCapabilities: ["session"]` pour le login seulement** : sans capacité `session`, un Host ne peut ni
conserver un jeton ni le fournir à `egenFetch` ; le login ne pourrait pas fonctionner et l'utilisateur resterait bloqué.
Déclarer la capacité rend la situation **explicite** (l'app n'est pas enregistrée et la raison est journalisée) au lieu
d'un échec silencieux. En Web la capacité `session` existe (vide), donc la déclaration est neutre. Les autres apps
n'ont besoin d'aucune capacité obligatoire : leurs fonctions optionnelles testent `has()` à l'exécution (guide
[06](06-GUIDE-DEVELOPPEUR.md) §5).

## 4. Comment classer une nouvelle app (ou reclasser une app)

Répondre dans l'ordre ; **la première réponse « oui » décide**.

1. L'app est-elle un outil de l'équipe (développement, diagnostic, éditeur interne) ? → **D**.
2. L'app dépend-elle d'une API que le WebView mobile n'offre pas de façon fiable (plein écran, IndexedDB volumineux,
   cookies, service worker, `window.open`) **et** n'existe-t-elle pas sans elle ? → **C**.
3. L'app contient-elle, dans son code ou ses données, l'un des éléments du guide [06](06-GUIDE-DEVELOPPEUR.md) §3
   (liens bruts, ressources distantes, `location.href`, stockage de secret, chemin absolu à la racine) ? → **B**.
4. Sinon → **A**.

Puis : ajouter l'app à la matrice du §3, remplir sa fiche ci-dessous, lancer `yarn verify:platforms`.

## 5. Apps mixtes : une partie universelle, une partie web seulement

Le framework filtre **au niveau de l'app uniquement** (pas de `platforms` par page ou par extension). Décision `D-04` :

1. Si la partie web seulement est **petite** (un bouton, un champ), l'app reste de catégorie B et la partie est
   **neutralisée à l'exécution** par `isNativePlatform()` (le composant rend `null`, la route n'est pas montée).
   Cas concernés : `esm-appearance-app` (plein écran), `esm-ai-assistant-app` (voix), `esm-home-app` (vitrine).
2. Si la partie web seulement est **grosse ou dominante**, l'app est scindée en deux paquets (un universel, un web
   seulement). Aucun cas aujourd'hui.
3. En cas de besoin récurrent, demander `FW-REQ-4` (filtre fin) plutôt que de multiplier les gardes.

Quand une partie est neutralisée à l'exécution, **le code web seulement doit être chargé paresseusement**
(`React.lazy` / `import()` conditionnel) pour ne pas alourdir l'artefact natif ni déclencher de chargement externe.

## 6. Fiches par application

Légende des champs : **Cat.** catégorie ; **platforms** valeur finale ; **caps** `requiredCapabilities` ; **Constats**
références `F-xx` de [02](02-ETAT-DES-LIEUX.md) ; **Vague** voir [04](04-PLAN-PHASES.md) §P6 ; **Taille** S ≈ 1–2 j,
M ≈ 3–5 j, L ≈ 6–10 j (pour l'adaptation seule, tests compris).

---

### 6.1 `esm-login-app` — Cat. **B (critique)** · `["web","android","ios"]` · caps `["session"]`

- **Rôle** : pages `login`, `logout`, `change-password`, modale de changement de mot de passe, pied de page de connexion.
- **Constats** : F-01 (critique), F-06.
- **Changements** — détaillés dans [05](05-CONTRAT-SESSION-LOGIN.md) ; en résumé :
  - [ ] `login/login.component.tsx` (`handleSubmit`) et `login.resource.ts` (`performLogin`) : stratégie **cookie**
    (Web, inchangée) ou **jeton** (natif, `isNativePlatform()`).
  - [ ] Natif : échange identifiant/mot de passe contre jetons, puis `getPlatform().session.setTokens(...)`, puis
    `refetchCurrentUser()` **sans** identifiants.
  - [ ] `redirect-logout/logout.resource.ts` : natif → révocation côté serveur (au mieux) **puis toujours**
    `getPlatform().session.clear()`.
  - [ ] `login/login-footer.component.tsx:32` : `<a target="_blank">` → `ExternalLink` (copie de T2.5).
  - [ ] Nouvelles clés de traduction (erreur réseau, stockage sécurisé indisponible, Host sans session).
  - [ ] `routes.json` : `requiredCapabilities: ["session"]`.
- **Tests à ajouter** : unitaires (plateforme simulée : `setTokens` appelé avec les bons arguments, **aucun** `localStorage.setItem` de
  jeton, mapping des erreurs) ; e2e natif simulé E-10 à E-15.
- **Vague** : P4 (pas P6) · **Taille** : L.

### 6.2 `esm-primary-navigation-app` — Cat. **B** · `["web","android","ios"]` · caps `[]`

- **Rôle** : barre supérieure (TopBar), fil d'Ariane, navigation à niveaux, recherche d'annuaire ; **page** sur toutes les
  routes sauf login/logout/change-password. 75 fichiers, 21 fichiers de test.
- **Constats** : F-02, F-06, F-14 (mise en page mobile : le gros du travail), F-18.
- **Changements** :
  - [ ] `intranet-topbar/components/options/AppsMenuOption.tsx:52` : `<a target="_blank">` → `ExternalLink`.
  - [ ] `intranet-topbar/data/directoryData.ts` : ≈ 24 URL `images.unsplash.com` (avatars, couverture) → avatars à
    initiales ou ressources locales (politique P5).
  - [ ] `intranet-topbar/components/navigation/BreadcrumbNav.tsx:122` : copie dans le presse-papiers sans retour
    utilisateur → afficher un retour en cas d'échec (`navigator.clipboard` peut rejeter).
  - [ ] `intranet-topbar/utils/xboxAudio.ts` : ne jouer un son qu'après un geste de l'utilisateur ; préférences
    `egen_xbox_sound_*` (non sensibles) conservées.
  - [ ] `intranet-topbar/kit/TransientLevels.tsx:62` : l'écoute de `visibilitychange` est **correcte** en WebView, à conserver.
  - [ ] **Mise en page mobile** (rails, niveaux, menus) : traitée en P7, pas en P6.
- **Tests à ajouter** : unitaire du lien (clic → `navigate`), du son (aucune lecture sans geste), non-régression Web des
  21 tests existants ; e2e : la barre s'affiche sur 390 × 844 sans débordement horizontal (P7).
- **Vague** : 4 · **Taille** : M (+ P7 : L).

### 6.3 `esm-home-app` — Cat. **B** · `["web","android","ios"]` · caps `[]`

- **Rôle** : page `home` (fond animé + sections `home-sections` + liens sociaux) ; sous-route de démonstration
  `home/showcase` (vitrine de composants, 3 122 lignes dans `home/component-showcase/`).
- **Constats** : F-02, F-06, F-18.
- **Changements** :
  - [ ] `root.component.tsx:27` : la route `home/showcase` est une **vitrine de développement** (F-18). En natif elle
    n'est **pas montée** (`!isNativePlatform()`), et `ComponentShowcasePage` est chargée par `React.lazy` : les ≈ 35 images
    `images.unsplash.com`/`picsum.photos` et la scène `prod.spline.design` (`new-components-showcase.component.tsx:122`)
    ne sont ni demandées ni embarquées dans le chunk principal.
  - [ ] `home/social-links/social-links.component.tsx:103` : `<a target="_blank">` → `ExternalLink`.
  - [ ] Vérifier `home/background` : aucune ressource distante (aucun constat à ce jour).
  - [ ] `setInterval` de `component-showcase.page.tsx:234` : sans objet une fois la vitrine non montée.
- **Tests à ajouter** : natif → la route `home/showcase` n'est pas rendue ; Web → rendue (non-régression) ; lien social
  → `navigate`.
- **Vague** : 2 · **Taille** : S.

### 6.4 `esm-informations-app` — Cat. **B** · `["web","android","ios"]` · caps `[]`

- **Rôle** : page `informations` (actualités, agenda, annonces), 17 extensions de navigation. 48 fichiers, 5 de test.
- **Constats** : F-02, F-06, F-09, F-18.
- **Changements** :
  - [ ] Images de démonstration (≈ 40 URL `images.unsplash.com`, dont des doublons) dans `home-sections/hero/hero.data.ts` (5),
    `home-sections/events/events.data.ts` (6), `home-sections/news/news.data.ts` (8), `news/news-feed-view.component.tsx`
    (6), `data/events-mock-data.ts` (≈ 15) → ressources locales compressées (P5) ; **dédupliquer** (les mêmes
    photographies reviennent dans plusieurs fichiers).
  - [ ] Partage : `home-sections/news/blog-section.component.tsx:50`, `events/event-details-modal.component.tsx:56`,
    `news/news-feed-view.component.tsx:295`, `events/event-card.component.tsx:48` copient
    `window.location.href` ou `origin + '/informations/agenda?event='…` : en natif l'URL est **locale**.
    Introduire une clé de configuration `publicBaseUrl` (`config-schema.ts`) ; Web : défaut = `window.location.origin`
    (comportement inchangé) ; natif : si elle est absente, **le bouton de partage est masqué** (jamais de lien local copié).
    Décision `D-16`.
  - [ ] `events/event-details-modal.component.tsx:240` : `<a target="_blank">` → `ExternalLink`.
  - [ ] Presse-papiers : retour utilisateur en cas d'échec.
- **Tests à ajouter** : unitaires du partage (Web : URL d'origine ; natif sans `publicBaseUrl` : bouton absent ; natif
  avec : URL publique) ; e2e E-02 (aucune requête vers `images.unsplash.com`).
- **Vague** : 3 · **Taille** : L (volume d'images).

### 6.5 `esm-annuaire-app` — Cat. **B** · `["web","android","ios"]` · caps `[]`

- **Rôle** : page `annuaire` (répertoire du personnel, fiche collaborateur, avis), 5 extensions. 43 fichiers, 5 de test.
- **Constats** : F-02, F-03, F-04, F-18.
- **Changements** :
  - [ ] `directory/employee-card.component.tsx:47` et `directory/employee-detail-modal.component.tsx:366` :
    `window.location.href = 'mailto:…'` → `navigate({ to: 'mailto:…' })` (le framework route le schéma vers
    `openExternal` en natif ; en Web l'effet est le même).
  - [ ] Photos de démonstration : `data/directory-data.ts` (≈ 24 avatars + 1 couverture + 1 image de repli),
    `home-sections/directory/directory.data.ts` (8), `collaborateur/collaborateur-review-list.component.tsx` (5) →
    avatars à initiales (aucun fichier) ou ressources locales.
  - [ ] **Photos réelles** (quand l'API les fournira) : elles seront **protégées par jeton** → passer par `egenFetch`
    puis `URL.createObjectURL` (décision `D-08`, `BE-REQ-3`).
  - [ ] Presse-papiers : `collaborateur/collaborateur-contact-info-card.component.tsx:24`,
    `collaborateur/collaborateur-review-card.component.tsx:48`, `directory/employee-detail-modal.component.tsx:63`
    utilisent `navigator.clipboard?.writeText` sans retour : afficher un retour d'échec.
  - [ ] Préférence de langue (`LANG_STORAGE_KEY`) : non sensible, conservée.
- **Tests à ajouter** : clic sur l'e-mail → `navigate` appelé avec `mailto:` ; e2e : `openExternal.open` reçoit
  `mailto:…` (Host simulé) ; aucune requête externe.
- **Vague** : 2 · **Taille** : M.

### 6.6 `esm-ai-assistant-app` — Cat. **B** · `["web","android","ios"]` · caps `[]`

- **Rôle** : panneau d'assistant (chat, voix), page sur toutes les routes sauf login…, 2 extensions. 49 fichiers, 6 de test.
- **Constats** : F-06, F-07, F-21.
- **Changements** :
  - [ ] **Voix désactivée en natif v1** (`D-13`) : `hooks/use-speech-recognition.ts` retourne `supported: false` quand
    `isNativePlatform()` ; le bouton micro de `components/chat-input/chat-input.component.tsx:48` n'est pas affiché ;
    `assistant-experience/services/vadService.ts:81-86` (`getUserMedia`) et
    `assistant-experience/context/AssistantGlobalVoiceContext.tsx:423-451` (`SpeechRecognition`) ne s'initialisent pas.
    L'assistant fonctionne en **mode texte**.
  - [ ] `components/assistant-panel/assistant-panel.component.tsx:87` : `<a target="_blank">` → `ExternalLink`.
  - [ ] **Canal WebSocket** (`esm-ai-framework`, `EGEN_AI_CHANNEL_URL`, défaut `${egenBase}/api/ai/ws`) : vérifier qu'il
    n'est pas bloqué par `connect-src` (scénario E-05). S'il l'est : `FW-REQ-6`, et l'assistant reste indisponible en
    natif jusqu'à sa livraison (message explicite, principe P-10).
  - [ ] Préférences vocales (`localStorage`, 5 clés) : non sensibles, conservées.
- **Tests à ajouter** : hook vocal avec plateforme native simulée ; assistant utilisable en texte ; E-05.
- **Vague** : 5 · **Taille** : M · **Évolution** : voix (P10).

### 6.7 `esm-appearance-app` — Cat. **B (mixte)** · `["web","android","ios"]` · caps `[]`

- **Rôle** : deux extensions de la barre supérieure : `theme-toggle` (clair/sombre) et `fullscreen-toggle`.
- **Constats** : F-08.
- **Changements** :
  - [ ] `appearance/fullscreen-toggle.component.tsx` : `return null` quand `isNativePlatform()` (`D-14`) ; l'app est déjà
    plein écran en natif et l'API plein écran n'est pas fiable en WebView iOS.
  - [ ] `theme-toggle` : inchangé (le thème est une préférence non sensible).
- **Tests à ajouter** : natif → rien rendu ; Web → bouton rendu et bascule (non-régression).
- **Vague** : 1 · **Taille** : S.

### 6.8 `esm-footer-app` — Cat. **B** · `["web","android","ios"]` · caps `[]`

- **Rôle** : pied de page sur toutes les routes sauf login/logout/change-password.
- **Constats** : F-06.
- **Changements** : [ ] `components/footer/footer.component.tsx:23` et `:56` : deux `<a target="_blank">` →
  `ExternalLink`. [ ] Vérifier que le pied de page ne masque pas le contenu sur petit écran (P7).
- **Tests à ajouter** : **Web** : le lien garde `target="_blank"` et `rel="noopener noreferrer"` ; **natif** : le clic appelle `navigate` avec l'URL.
- **Vague** : 1 · **Taille** : S.

### 6.9 `esm-help-menu-app` — Cat. **B** · `["web","android","ios"]` · caps `[]`

- **Rôle** : menu d'aide (4 extensions : notes de version, contact, documentation…).
- **Constats** : F-06, F-16 (aucun test aujourd'hui).
- **Changements** : [ ] `help-menu/components/release-notes.component.tsx:16`, `contact-us.component.tsx:15`,
  `docs.component.tsx:15` : `<a target="_blank">` → `ExternalLink`. [ ] **Ajouter des tests** (l'app n'en a aucun) :
  un par composant.
- **Tests à ajouter** : 3 tests de rendu + clic → `navigate`.
- **Vague** : 1 · **Taille** : S.

### 6.10 `esm-language-app` — Cat. **B** · `["web","android","ios"]` · caps `[]`

- **Rôle** : sélecteur de langue (barre supérieure et panneau utilisateur), modale de changement de langue.
- **Constats** : F-05.
- **Changements** : [ ] `change-language/change-language.resource.ts:22,34` : `window.location.reload()` après le
  changement. Comportement conservé en Web. En natif, **conservé uniquement** si le scénario Host `HOST-REQ-1` (repli
  `index.html`) est validé en P9 ; sinon remplacé par `window.location.replace(window.getEgenSpaBase())` (`D-15`).
- **Tests à ajouter** : changement de langue → `reload` appelé (Web) ; natif : même comportement tant que `D-15` n'est
  pas tranchée (test marqué à réviser).
- **Vague** : 1 · **Taille** : S.

### 6.11 `esm-not-found-app` — Cat. **B** · `["web","android","ios"]` · caps `[]`

- **Rôle** : page 404 (toute route non reconnue).
- **Constats** : F-02, F-04, F-05.
- **Changements** :
  - [ ] `not-found/not-found-page.component.tsx` (lignes 34-51) : **natif** : `navigate({ to: '${egenSpaBase}/' })` (sinon l'utilisateur
    sort de la base `/app`) ; **Web : `window.location.href = "/"` est conservé tel quel** (P-1, `D-21`), avec la dérogation préenregistrée
    `X-01` ([08](08-DECISIONS-ET-RISQUES.md) §4) pour la règle N-03. Ce comportement Web (retour à la racine du site, pas à la base du SPA) est un
    **possible défaut préexistant** (F-24), à traiter séparément.
  - [ ] Six illustrations `cdn.21st.dev` (lignes 137-167) → ressources locales.
  - [ ] Bouton « recharger » (`location.reload()`) : voir `D-15`.
- **Tests à ajouter** : retour à l'accueil → `navigate` avec la base ; E-03 ; E-02.
- **Vague** : 1 · **Taille** : S.

### 6.12 `esm-user-profile-app` — Cat. **B** · `["web","android","ios"]` · caps `[]`

- **Rôle** : garde de session (redirige vers `login` si non authentifié), redirection de la racine, menu utilisateur,
  panneau utilisateur par défaut.
- **Constats** : F-01 (en lien avec le login).
- **Changements** : [ ] `session/session-guard.component.tsx:29` : le calcul de la route courante à partir de
  `pathname` et de `getEgenSpaBase()` doit être **testé sous `/app/`** (aucun changement attendu). [ ] **Vérifier, sans modifier** : `useSession()` (framework) **suspend** jusqu'à ce que la session soit chargée
  (`loaded: true`, y compris après un échec de chargement) ; la garde ne peut donc pas rediriger vers `login` pendant l'attente du
  Host et du réseau. Le test doit le **prouver** (garde rendue dans un `Suspense` : pas de `Navigate` avant `loaded`).
- **Tests à ajouter** : garde sous la base `/app/` ; non-boucle pendant le chargement ; menu utilisateur → déconnexion.
- **Vague** : P4 (avec le login) · **Taille** : S.

### 6.13 `esm-sites-app` — Cat. **B** · `["web","android","ios"]` · caps `[]`

- **Rôle** : page `sites` (liste des sites), 10 extensions (navigation, registre).
- **Constats** : F-02, F-18.
- **Changements** : [ ] `pages/sites-list.page.tsx:20-23` : quatre URL `images.unsplash.com` → ressources locales ou
  visuels générés. [ ] `matchMedia` utilisé : conforme.
- **Tests à ajouter** : E-02.
- **Vague** : 1 · **Taille** : S.

### 6.14 Apps de catégorie A — vérifications uniquement

Aucune incompatibilité trouvée. Pour chacune : (a) déclaration `platforms` (P1) ; (b) lint avec règles natives (P2) ;
(c) présence au scénario de fumée E-20 (enregistrée et rendue en natif) ; (d) revue mobile (P7).

| App | Rôle | Point de vérification particulier |
| --- | --- | --- |
| `esm-branding-app` | Logo de la barre supérieure | Le logo vient d'une ressource **locale** ; taille sur petit écran |
| `esm-clock-app` | Horloge de la barre supérieure | `setInterval` : se resynchronise au retour au premier plan (suspension du WebView) |
| `esm-notifications-app` | Panneau de notifications (rail droit) | Rail droit sur petit écran ; futur push natif = P10 |
| `esm-quick-access-app` | Accès rapide (rail droit, 6 extensions) | **Erratum** : l'app existe toujours (le suivi de la TopBar T9 a supprimé un *bouton* mort, pas l'app) ; `window.addEventListener('online')` conforme |
| `esm-settings-app` | Réglages (rail droit, apparence, langue) | Dépend de `appearance` et `language` (vague 1) |
| `esm-spaces-sites-app` | Sélecteurs de contexte (barre supérieure) | `sites/site-route.ts:32` lit `pathname` : test sous la base `/app/` |

### 6.15 Apps de catégorie C — web seulement

| App | Pourquoi pas en natif | À faire dans ce programme | Réexamen |
| --- | --- | --- | --- |
| `esm-offline-tools-app` | S'appuie sur le service worker et le mode hors ligne web ; le service worker **n'existe pas** en natif (framework A4) | `platforms: ["web"]` | P10 (stratégie hors ligne native) |
| `esm-tenant-routing-app` | Résout le tenant par **sous-domaine** (nom d'hôte) : sans objet en WebView local | `platforms: ["web"]` ; la distribution native fixe `EGEN_TENANT_MODE=single` et `EGEN_TENANT_ID` au **build** (`D-09`) | Si un produit natif est multi-tenant : décision produit |

### 6.16 Apps de catégorie D — développement et diagnostic

| App | Pourquoi | À faire | Règle |
| --- | --- | --- | --- |
| `esm-devtools-app` | Outils de l'équipe (import map locale, URL `localhost:<port>`) | `platforms: ["web"]` | Jamais dans une distribution de production |
| `esm-implementer-tools-app` | Outils d'intégration (éditeur de configuration, mode JSON) | `platforms: ["web"]` | Idem |
| `esm-logs-app` | Affiche les logs du terminal `egen develop` (flux `EventSource` vers `${baseUrl}/stream`) et la console du navigateur ; visible dans le rail pour tous | `platforms: ["web"]` | Idem ; à reclasser seulement si le support veut une console de diagnostic **sans** le flux du terminal (F-22) |

La colonne « Règle » est une exigence pour `egen-distributions` : `tools/list-apps.mjs --production` **n'inclut jamais**
les apps de catégorie D (`DIST-REQ-1`).

## 7. Tableau de bilan par vague (rappel du plan)

| Vague | Apps | Taille cumulée | Prérequis |
| --- | --- | --- | --- |
| 1 | appearance, footer, help-menu, language, not-found, sites | S × 6 | P2 |
| 2 | home, annuaire | S + M | P5 (politique d'images) |
| 3 | informations | L | P5 |
| 4 | primary-navigation | M | P5, P2 |
| 5 | ai-assistant | M | `FW-REQ-6` si E-05 confirme le blocage |
| (P4) | login, user-profile | L + S | Contrat backend validé |
