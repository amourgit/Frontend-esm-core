# Suivi — Réforme de la TopBar neutre (un squelette, des apps qui l'alimentent)

> **Point de reprise** : état au commit `main` = `922ece9` (core) et `768c770` (framework). Dernière étape terminée :
> **T11 — navigation et fil d'Ariane**. **Prochaine tâche : T12 — fin de réforme** (voir ci-dessous).
> Mettre à jour ce fichier à CHAQUE tâche terminée (état, commit, décisions, pièges) avant de pousser.

## 1. Philosophie (ne pas la remettre en cause)

La TopBar est un **squelette neutre**, comme les rails et zones. Elle ne contient **aucun** élément en dur : ni logo, ni
session, ni sélecteur, ni bouton. Chaque **app spécialisée** injecte son élément par **extension** du **slot neutre unique**
`topbar-slot`, et **déclare elle-même** dans `meta.topbar` où le placer :

```json
{ "name": "language-switcher", "slot": "topbar-slot", "component": "languageSwitcher", "order": 10,
  "meta": { "global": true, "topbar": { "level": "main", "rank": 10, "region": "right", "order": 10 } } }
```

- `level` : nom d'un niveau, **créé par l'app qui le déclare** (jamais numéroté, jamais dans un nom de slot ni de fichier) ;
  plusieurs apps peuvent déclarer le même niveau, tous leurs éléments s'y assemblent. `rank` : place du niveau dans la pile.
- `region` : `left` | `center` | `right` | `background`. `order` : place dans la région, **partagée** entre éléments globaux
  et extensions ; à égalité, l'extension passe avant. `before` / `after` : placement **par référence** à une autre extension.
- `meta.global: true` : toujours affichée ; sinon, seulement quand l'app est active (une de ses pages est montée).
- Le contrat complet est dans `packages/apps/esm-primary-navigation-app/README.md` (section « Un seul slot »).
- Cas à part, déjà fait : **niveaux éphémères** (annonces à durée, `startsAt` / `expiresAt` ISO 8601 avec décalage) via le
  store `egen-topbar-transient` ; non concerné par la migration.
- Règles de codage : `.github/copilot-instructions.md` et `docs/guide-montage-apps-rails-zones.md`. Styles en `*.scss`
  (aucun `*.module.scss` dans le dépôt), `*.component.tsx`, `*.test.tsx`, textes via `t('clé', 'défaut')`.

## 2. Fait (sur `main`)

| # | Tâche | App créée | Ce qu'elle injecte (extension → placement) |
| --- | --- | --- | --- |
| T1 | Logo / identité de l'entreprise | `esm-branding-app` | `brand-logo` → main · left · 0 ; config `organization`, `logo` (modifiable à chaud) |
| T2 | Profil utilisateur + session | `esm-user-profile-app` | `user-menu` → main · right · 90 ; `default-user-panel` → `user-panel-slot` ; pages `sessionGuard` (renvoi vers la connexion) et `rootRedirect` (racine → accueil) |
| T3 | Niveaux déclarés par les apps | *(TopBar)* | slot unique `topbar-slot` + `meta.topbar` ; plus aucun `topbar-l<N>-…` dans le code |
| T4 | Espace + Site (arbre infini) | `esm-spaces-sites-app` | `context-selectors` → main · left · après `brand-logo` ; `space-selector-menu` → `staggered-menu-slot` ; store global `egen-spaces-sites` ; registre des sites (slot de données `sites-registry-slot` + config) |
| T5 | Éradication hospitalière | *(framework + core)* | patients / FHIR / hôpital supprimés ; voir §6 |
| T6 | Langue | `esm-language-app` | `language-switcher` → main · right · 10 ; `change-language` → `user-panel-slot` ; modale `change-language-modal` |
| T7 | Apparence + horloge | `esm-appearance-app`, `esm-clock-app` | `fullscreen-toggle` → main · right · 60 ; `theme-toggle` → main · right · 70 ; `clock` → main · right · 100 |
| T8 | Recherche | `esm-search-app` | `search` → main · right · 0 ; config `search.path` ; `GooeyInput` déplacé (`src/search/gooey-input.component.tsx`) ; `GlobalCallbacks` / `onOpenGlobalSearch` supprimés (code mort) |
| T9 | Lanceur d'applications | `esm-launcher-app` | `topbar-divider` → main · right · 20 ; `app-launcher` → main · right · 30 ; config `externalRefLinks` ; contenu = slot `app-menu-slot` (inchangé) ; `quick-access` supprimé (bouton mort) ; clé de traduction `AppMenuTooltip` déplacée (41 langues) |
| T10 | Panneau latéral | `esm-side-panel-app` | `side-panel` → main · right · 110 ; contenu = slot `staggered-menu-slot` (inchangé) ; `TopBarMenuPanel` déplacé avec test et styles |
| T11 | Navigation et fil d'Ariane | `esm-navigation-app` | `topbar-navigation` → navigation (rang 20) · center · 0 ; routeur et `WorkspaceProvider` propres à l'extension ; `link` et `breadcrumb-item` déménagés ; **contexte de fil publié par les pages** dans le store `egen-breadcrumb-context` (contrat dans le README de l'app, référence : `esm-annuaire-app/src/collaborateur/breadcrumb-context.ts`) ; copie de l'annuaire (`directoryData.ts`) et logique `/annuaire/…` supprimées ; `global/` et config `topbar.placement` supprimés |

Extensions d'autres apps déjà sur `topbar-slot` : `home-app-toolbar` (esm-home-app → navigation · left · 0) et
`assistant-robot-button` (esm-ai-assistant-app → navigation · right · 0).

## 3. Reste dans la TopBar (`esm-primary-navigation-app`) — à migrer dans cet ordre

État du code : `global/` et `topbar.placement` sont déjà supprimés (T11) ; il reste le registre d'éléments du kit
(`kit/items.ts`, `registerTopBarItem`, `hideGlobal` / `only` / `hide` de `layout-store.ts`) et `utils/xboxAudio.ts`, à supprimer en T12.

| Tâche | Élément(s) | Placement actuel | App cible (décision prise) |
| --- | --- | --- | --- |
| **T11** | `nav` + fil d'Ariane | navigation · center · 0 | `esm-navigation-app` |
| **T12** | Fin de réforme | — | supprimer `registerTopBarItem` (kit/items.ts) et les règles `only`/`hide`/`hideGlobal` qui ne portent que sur eux, `xboxAudio.ts` (le `togglePanel` de l'hôte joue encore un son) ; la TopBar = kit + shell + providers |

### T12 — Fin de réforme (prochaine tâche)
- Supprimer `utils/xboxAudio.ts` (822 l. ; seul `togglePanel` de l'hôte l'utilise encore), le registre d'éléments du kit
  (`registerTopBarItem`, `TopBarRegion` côté éléments) et ses règles associées dans `layout-store.ts` (README compris : `only: ['nav']`, `hideGlobal`) ; mettre à jour le README de la TopBar et ce fichier.
- Vérifier avec `grep -rn "registerTopBarItem\|topbar.placement"` qu'il ne reste rien, puis réécrire le test d'architecture
  (`components/topbar/topbar.architecture.test.ts`) : plus aucun composant métier dans `esm-primary-navigation-app`.

## 4. Procédure type d'une migration (à suivre pour T8 → T11)

1. `git checkout main && git pull`, puis `git checkout -b feat/<nom>`.
2. `python3 tools/scaffold-app.py esm-<nom>-app "<description>" "<deps>" <sous-dossiers>` (ossature conforme au projet).
3. **Porter** le code de la TopBar (le déplacer, `git mv` quand c'est un dossier entier : l'historique est conservé), l'adapter
   en **extension** : l'état de la TopBar arrive en **props** (`isActivePanel`, `togglePanel`, `searchOpen`, `isDesktop`…) ;
   le composant doit aussi marcher **sans** TopBar (props absentes).
4. `src/index.ts` (`getSyncLifecycle` / `getAsyncLifecycle`, `importTranslation`), `src/routes.json` (extension sur `topbar-slot`
   avec `meta.topbar`, **même placement que l'ancien élément**), `config-schema.ts` si l'élément avait de la config.
5. **Traductions** : déplacer les clés par langue de `esm-primary-navigation-app/translations/*.json` vers la nouvelle app
   (méthode : parcourir les 41 fichiers, copier les clés utilisées, les retirer de la navigation ; ne PAS retirer une clé encore
   utilisée ailleurs — vérifier par `git grep` ; `en.json` peut rester `{}` quand les défauts sont dans le code).
6. **Retirer** de la TopBar : composant, élément global, clé de `placement.ts`, export `options/index.ts`, styles, tests,
   mentions du README ; corriger `placement.test.ts` (ses exemples utilisent des identifiants d'éléments existants).
7. **Tests** de la nouvelle app (comportement, props TopBar, routes) + test d'architecture si pertinent. Le fichier de tests doit
   demander le mock du framework : `vi.mock('@egen-civitas/esm-framework', () => import('@egen-civitas/esm-framework/mock'))`.
8. README de l'app, entrée dans le README racine, `.changeset/<nom>.md` (TopBar en `major`), `yarn install`.
9. **Valider** : `npx tsc --noEmit`, `npx eslint src --ext ts,tsx`, `npx cross-env TZ=UTC vitest run`, dans CHAQUE app touchée ;
   `node tools/check-nav-routes.mjs` ; `npx turbo run build --filter=<apps touchées>` ; `yarn install --immutable`.
10. Commit, **fusion** dans `main`, `git push --no-verify origin main` (préférence du projet), mettre ce fichier à jour.

## 5. Pièges déjà rencontrés (à ne pas refaire)

- **`yarn.lock`** : toute nouvelle app le modifie ; en cas de conflit à la fusion, prendre celui de `main` puis relancer
  `yarn install` (jamais le fusionner à la main). Vérifier `yarn install --immutable` avant de pousser.
- **Versions `@egen-civitas/*`** : un commit concurrent les aligne parfois sur le framework publié (4.x) ; l'ossature part de
  `esm-user-profile-app`, donc déjà alignée. Si `--immutable` échoue, recopier les plages de cette app.
- **Config de tests** : celle de `esm-primary-navigation-app` (plugin `.scss`) est la bonne ; le framework n'y est pas mocké
  automatiquement (voir étape 7). Les types du mock du framework publié sont périmés : charger le mock par `vi.importActual('…/mock')`.
- **Boucle de rendu** : ne JAMAIS s'abonner à l'état complet du store d'extensions (React #185) ; dériver une signature primitive
  (voir `kit/region-extensions.ts`).
- **Slots enregistrés** : une région monte un `SlotRegistrar` caché par slot pour que la configuration `extensionSlots` d'un
  déploiement (ajouts/retraits) soit prise en compte ; ne pas le retirer.
- **Dans le shell** : `mkdir -p a/{b,c}` ne développe pas les accolades (sh) ; les remplacements par regex sur de gros fichiers
  ont supprimé trop de lignes une fois (toujours relire le `git diff`).
- **Sons d'interface** : supprimés avec les boutons migrés (logo, sélecteurs, langue, thème…) ; si on les veut, ce sera une app
  dédiée qui écoute des événements, jamais un retour dans la TopBar.

- **Outillage (sandbox)** : le `yarn` vendored plante ; utiliser `@yarnpkg/cli-dist@4.10.3` (`npm i` dans un dossier à part) via un shim `yarn` mis dans le `PATH` — `turbo` en a besoin (« Unable to find package manager binary »). Un `yarn install` long doit être lancé détaché (`setsid nohup … &`) et interrogé par petits `sleep`.
- **`translations/en.json` vide** : le scaffold le crée avec `touch` (0 octet) → le build échoue (« JSON parse error: Unexpected end of JSON »). Toujours y écrire `{}`.
- **Tests de `GooeyInput`** : replié, le déclencheur est un `div` (pas un `button`) et l'`input` (`type="search"`, rôle `searchbox`) ne reçoit pas les clics ; cliquer son parent avec `fireEvent`. `interpolateUrl` est le vrai (non mocké) : fournir `window.getEgenSpaBase`.

## 6. Dettes et décisions en attente

- **Mutualiser** `OptionButton` (copié dans `esm-language-app`, `esm-appearance-app`) et le panneau « verre d'eau » (`GlassPanel`
  dans `esm-user-profile-app`) en **composants du framework** (styleguide), — le lanceur (T9) a ajouté un 3ᵉ exemplaire de `GlassPanel` et un `OptionButton` à pastille ; T10 en aura encore besoin. Nécessite une
  version publiée du framework (le core le consomme depuis npm).
- **Sites en trois exemplaires** : `esm-sites-app` garde ses propres jeux de données pour ses pages (`data/sites-data.ts`,
  `home-sections/sites/sites.data.ts`) ; à rebrancher sur le registre `egen-spaces-sites`.
- **Token / session** : aucune surveillance ni relance périodique du token n'existe dans le dépôt (la session vit dans le framework,
  `esm-api`). Si on la veut, l'ajouter dans `esm-user-profile-app`.
- **Éradication hospitalière** (faite) — décisions laissées ouvertes : `LICENSE` (clause « Healthcare Disclaimer » d'origine, avis
  juridique requis, non modifié) ; `CHANGELOG.md` (historique, non purgé) ; `getSessionLocation` / `setSessionLocation` dans
  `esm-api` ; module backend `webservices.rest` ; icônes `programs` / `pedestrian-family` et pictogramme `service-queues` gardés.
- **Branches** : `feat/annuaire-welcome-banner` = test du bandeau éphémère, **volontairement non fusionnée** (déjà sur GitHub).
  `dependabot/…/type-definitions-*` (`@types/fhir` 0.0.44) est **sans objet** : à fermer sans fusionner.
- **Échecs de tests/typecheck anciens** existent dans le dépôt (hooks husky ignorés par choix, `--no-verify`) ; ce qui compte pour
  l'instant : **le build vert**. Ne pas confondre avec une régression de la réforme (comparer à `main` avant d'accuser).
- **Jumeau CIVITAS TV** : `tools/shared-paths.txt` / `SYNC-CORE-TV.md` — vérifier si des fichiers de la TopBar y sont partagés avant
  de finaliser T11/T12.
- **Sécurité** : le token GitHub de travail a été collé en clair dans une conversation : **le révoquer** et en générer un nouveau.

## 7. Prompt de reprise (à coller au début de la prochaine session)

> Reprends la réforme de la TopBar neutre. Lis `docs/SUIVI-REFORME-TOPBAR.md`, vérifie que `main` est à jour, puis fais la
> tâche **T8 (recherche → `esm-search-app`)** en suivant la procédure du §4, valide (§4 étape 9), fusionne dans `main`, pousse avec
> `--no-verify`, et mets le fichier de suivi à jour (point de reprise = T9). Enchaîne T9, T10, T11, T12 sans me redemander.
