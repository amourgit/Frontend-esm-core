# EGEN — Référence Rapide & Points Critiques

---

## RÉSUMÉ DES PHASES

| Phase | Durée | Risque | Description |
|-------|-------|--------|-------------|
| **0** | 1 jour | Faible | Préparation, branches, cartographie |
| **1** | 2 jours | **ÉLEVÉ** | Renommage namespace @egen → @egen |
| **2** | 1 jour | Moyen | Déconnexion sources externes |
| **3** | 3 jours | **ÉLEVÉ** | Adaptation API (Keycloak + FastAPI) |
| **4** | 2 jours | Faible | Refonte visuelle |
| **5** | Semaines | Faible | Métier éducatif (itératif) |

---

## RÈGLES D'OR

```
1. JAMAIS de modifications directes sur `main`
2. UN seul fichier modifié à la fois dans les zones à risque
3. `yarn build` après CHAQUE modification significative
4. `git commit` après CHAQUE étape vérifiée
5. Les tests AVANT le merge dans `main`
```

---

## FICHIERS CRITIQUES — NE PAS TOUCHER SANS COMPRENDRE

| Fichier | Risque si cassé | Ce qu'il fait |
|---------|----------------|---------------|
| `packages/shell/esm-app-shell/src/run.ts` | App totalement cassée | Bootstrap Single-SPA |
| `packages/framework/esm-extensions/src/extensions.ts` | Plugins cassés | Système d'extension slots |
| `packages/tooling/egen/src/utils/importmap.ts` | Dev impossible | Chargement des modules |
| `packages/framework/esm-framework/src/index.ts` | Tout les imports cassés | Point d'entrée framework |
| `turbo.json` | Build impossible | Ordre de compilation |
| `packages/tooling/rspack-config/` | Build impossible | Module Federation |

---

## COMMANDES UTILES

```bash
# Développement
yarn run:shell                           # Démarrer le shell seul
yarn workspace @egen/esm-login-app start  # Démarrer une app seule

# Build
yarn build                               # Build tout le monorepo
yarn build:apps                          # Build uniquement les apps

# Vérifications
yarn verify                              # Lint + tests + TypeScript
yarn test                                # Tests unitaires
yarn test-e2e                            # Tests end-to-end

# Migration
bash EGEN-MIGRATION/check-migration.sh  # Vérifier progression migration

# Nettoyage
yarn cache clean --all                   # Vider le cache Yarn
turbo daemon clean                       # Vider le cache Turborepo
find packages -name "dist" -type d -exec rm -rf {} +  # Supprimer tous les dist
```

---

## VARIABLES D'ENVIRONNEMENT IMPORTANTES

| Variable | Description | Défaut actuel |
|----------|-------------|---------------|
| `EGEN_OFFLINE` | Active le mode offline | `disable` en dev |
| `EGEN_CLEAN_BEFORE_BUILD` | Nettoie avant build | `true` |
| `NODE_ENV` | Environnement | `development` |
| `EIGEN_API_BASE` | URL de l'API EGEN | `/api/v1` |
| `EIGEN_IAM_URL` | URL Keycloak | `/auth/realms/egen` |

---

## ARCHITECTURE DE COMMUNICATION INTER-APPS

Les micro-apps ne doivent **JAMAIS** s'importer directement.  
Elles communiquent via :

```
1. Extension Slots    → Une app contribue du contenu dans le slot d'une autre
2. Global Store       → Via esm-state (Zustand), partagé dans le scope global
3. Custom Events      → Via esm-globals (pubsub d'événements)
4. URL / Navigation   → Via esm-navigation (navigate, useNavigate)
```

---

## GESTION DES PERMISSIONS — RÉCAPITULATIF

```
Niveau 1 : RÔLES KEYCLOAK (grossier)
  SUPER_ADMIN → tout
  ADMIN_NATIONAL → gestion nationale
  ADMIN_REGIONAL → gestion régionale
  ADMIN_ETABLISSEMENT → gestion établissement
  ENSEIGNANT → notes, présences (ses classes)
  CENSEUR → absences, discipline
  SECRETAIRE → inscriptions, dossiers
  PARENT → consultation enfant
  APPRENANT → consultation propre profil

Niveau 2 : PRIVILEGES KEYCLOAK (granulaire)
  egen:apprenants:read / write / delete
  egen:notes:read / write / validate
  egen:absences:read / write / justify
  egen:bulletins:read / generate / print
  egen:etablissements:read / admin
  egen:users:read / admin
  egen:planning:read / write

Niveau 3 : LOGIQUE MÉTIER (dans le code)
  Un enseignant ne peut saisir que les notes de ses propres classes
  Un parent ne voit que les infos de son enfant
  Un admin régional ne voit que son périmètre géographique
```

---

## CE QUI RESTE DE L'ARCHITECTURE Egen QU'ON GARDE

✅ **Single-SPA** — Architecture microfrontend parfaite pour la modularité  
✅ **Module Federation** — Partage de React/libs sans duplication  
✅ **Extension Slots** — Système de plugins ultra-puissant  
✅ **Config System** — Configuration live par module  
✅ **Feature Flags** — Activation/désactivation de features sans redeploy  
✅ **Offline Support** — Via service worker + IndexedDB (utile en milieu scolaire)  
✅ **Carbon Design System** — Design system professionnel et accessible  
✅ **i18next** — Internationalisation pour le multilinguisme national  
✅ **SWR** — Cache et revalidation des données API  
✅ **Turborepo** — Build parallèle efficace du monorepo  

---

## MAPPING FINAL : EGEN → EGEN

| Egen | EGEN | Notes |
|---------|-------|-------|
| Patient | Apprenant | |
| Visit | Inscription / Année scolaire | |
| Encounter | Session de cours / Évaluation | |
| Observation | Note / Résultat | |
| Location | Établissement scolaire | |
| Provider | Enseignant | |
| Role | Rôle EGEN (via Keycloak) | |
| Privilege | Privilege EGEN (via Keycloak) | |
| Form | Bulletin / Formulaire d'inscription | |
| Program | Filière / Cursus | |
| Concept | Matière scolaire | |
| `/ws/rest/v1` | `/api/v1` (FastAPI EGEN) | |
| `/ws/fhir2/R4` | `/api/v1/fhir` (si nécessaire) | |
| Session Egen | JWT Keycloak | |

---

*Document généré pour l'équipe EGEN — Mise à jour : 2026*
*Repo : github.com/amourgit/Frontend-esm-core*
