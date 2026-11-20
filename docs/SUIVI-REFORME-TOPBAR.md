# Suivi — Réforme de la TopBar neutre (un squelette, des apps qui l'alimentent)

> **Point de reprise** : état au commit `main` = `cf09c18` (core) et `768c770` (framework). Dernière étape terminée :
> **T12 — fin de réforme**. **La migration T1 → T12 est terminée** : la TopBar est un squelette neutre (kit + hôte), plus aucun
> élément en dur. Il ne reste que les dettes du §6.
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
- `region` : `left` | `center` | `right` | `background`. `order` : place dans la région, **partagée** entre les extensions. `before` / `after` : placement **par référence** à une autre extension.
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
| T12 | Fin de réforme | *(TopBar)* | registre d'éléments du kit (`kit/items.ts`, `registerTopBarItem`, éléments dans `TopBarRegion` / `TopBarLevels`) supprimé ; `utils/xboxAudio.ts` (822 l.) et le son de `togglePanel` supprimés ; dépendances inutiles retirées (`lucide-react`, `motion`, `@carbon/react`) ; `routes.json` de la TopBar sans extension (test d'architecture) ; règles `only` / `hide` / `hideGlobal` du layout-store conservées, elles portent sur les `name` d'extensions |

Extensions d'autres apps déjà sur `topbar-slot` : `home-app-toolbar` (esm-home-app → navigation · left · 0) et
`assistant-robot-button` (esm-ai-assistant-app → navigation · right · 0).

## 3. État final de la TopBar (`esm-primary-navigation-app`)

`routes.json` sans extension ; code = **kit** (`intranet-topbar/kit/` : niveaux, régions, placement, layout-store, niveaux
éphémères) + **hôte** (`SupremeIntranetTopBar`, état d'interface partagé, pile de niveaux) + `useActiveAppModules`. Le test
`components/topbar/topbar.architecture.test.ts` verrouille la règle (aucune session, aucune extension, aucune navigation).
Toute nouvelle fonction de la TopBar est une **app** qui injecte une extension (procédure §4).

## 4. Procédure type d'une migration (à suivre pour tout nouvel élément de la TopBar)

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
6. Si l'élément existait déjà dans la TopBar : le **retirer** (composant, styles, tests, mentions du README). La TopBar ne
   garde plus de registre d'éléments : un nouvel élément n'a rien à retirer.
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

## 5 bis. Retrait de Carbon et de SCSS (terminé dans le core)

Carbon (`@carbon/*`) et SCSS (`sass*`) sont retirés de tout le core. Les composants viennent du module style
(`@egen-civitas/esm-styleguide`, ré-exporté par `@egen-civitas/esm-framework`) : `Button`, `IconButton`, `TextLink`, `Tile`, `Dialog`,
`Table`, `Tabs`, `Checkbox`, `RadioGroup`, `SearchInput`, `PasswordInput`, `Accordion`, `NotificationBanner`, `MenuList`,
`StructuredList`… (correspondances : `docs/MIGRATION-CARBON.md` du dépôt framework). Les 75 `.scss` sont devenus des `.module.css`
(CSS standard, mêmes noms de classes). Garde-fou : `yarn verify:no-carbon` (`tools/check-no-carbon.mjs`, inclus dans `yarn verify`).
- **Piège** : sous React 18, un composant fonction ne reçoit pas `ref` : les composants du module style qui sont des cibles de
  `ref` / `asChild` doivent être en `forwardRef` (c'est le cas de `Button`, `IconButton`, `TextLink`, `Input`, `TextInput`,
  `PasswordInput`, `SearchInput`, `Badge`).
- **Reste** : convertir les `.module.css` en classes Tailwind au fil de l'eau (écran par écran) ; contrôle visuel dans le navigateur.

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
- **Jumeau CIVITAS TV** : vérifié (T12) — `tools/shared-paths.txt` ne partage que l'infrastructure (outils, CI, config), aucun
  fichier de la TopBar. À refaire si la liste évolue.
- **Navigation : maillons de fil d'Ariane** : seule l'annuaire publie un contexte (`egen-breadcrumb-context`) ; les autres apps
  (sites, informations…) n'ont pas de contexte de fiche à ce jour. Un nouveau besoin = la page publie, la navigation ne déduit rien.
- **Mutualisation de `WaterGlassModal`** : copié dans `esm-navigation-app` (menu déroulant, fil), `GlassPanel` dans
  `esm-user-profile-app` et `esm-launcher-app` — même dette que `OptionButton` ci-dessus.
- **Sécurité** : le token GitHub de travail a été collé en clair dans une conversation : **le révoquer** et en générer un nouveau.

## 7. Prompt de reprise (à coller au début de la prochaine session)

> La réforme de la TopBar neutre est terminée (T1 → T12). Lis `docs/SUIVI-REFORME-TOPBAR.md` (§1 philosophie, §4 procédure)
> avant tout ajout à la TopBar : un nouvel élément = une app qui injecte une extension dans `topbar-slot` avec `meta.topbar`.
> Les dettes ouvertes sont au §6 ; en traiter une seulement sur demande, valider (§4 étape 9), fusionner dans `main`, pousser
> avec `--no-verify` et mettre ce fichier à jour.
