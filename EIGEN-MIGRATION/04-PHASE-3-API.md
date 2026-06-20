# PHASE 3 — Adaptation de l'API vers EGEN

> Durée estimée : 2-3 jours
> Branche : `egen/phase-3-api`
> Objectif : Remplacer tous les appels API Egen (REST `/ws/rest/v1`, FHIR `/ws/fhir2/R4`, session Egen) par les APIs EGEN (FastAPI + Keycloak).

---

## 3.1 Cartographie API : Egen → EGEN

| Endpoint Egen | Endpoint EGEN | Description |
|-----------------|---------------|-------------|
| `POST /ws/rest/v1/session` | `POST /api/v1/auth/token` (Keycloak) | Login |
| `DELETE /ws/rest/v1/session` | Keycloak logout | Logout |
| `GET /ws/rest/v1/session` | `GET /api/v1/auth/me` | Session courante |
| `GET /ws/rest/v1/location` | `GET /api/v1/etablissements` | Localisations/Établissements |
| `GET /ws/rest/v1/user` | `GET /api/v1/utilisateurs` | Utilisateurs |
| `GET /ws/rest/v1/role` | Keycloak roles | Rôles |
| `GET /ws/fhir2/R4/Patient` | `GET /api/v1/apprenants` | Patients → Apprenants |

---

## 3.2 Adaptation du client HTTP (`esm-api`)

### 3.2.1 Constantes de base URL

**Fichier** : `packages/framework/esm-api/src/egen-fetch.ts`

```typescript
// Avant
export const restBaseUrl = '/ws/rest/v1';
export const fhirBaseUrl = '/ws/fhir2/R4';
export const sessionEndpoint = `${restBaseUrl}/session`;

// Après
export const restBaseUrl = '/api/v1';
export const educationBaseUrl = '/api/v1/education';  // API métier éducatif
export const sessionEndpoint = `${restBaseUrl}/auth/session`;

// La fonction makeUrl reste la même (elle utilise window.eigenBase)
export function makeUrl(path: string) {
  if (path && path.startsWith('http')) return path;
  if (path[0] !== '/') path = '/' + path;
  return window.eigenBase + path;
}
```

### 3.2.2 Fonction `eigenFetch` (renommée depuis `egenFetch`)

La mécanique de base du fetch ne change pas beaucoup. Les différences principales :

```typescript
// Fichier : packages/framework/esm-api/src/egen-fetch.ts (renommé)

// CHANGEMENT 1 : Authentification
// Avant : Basic auth ou cookie de session Egen
// Après : Bearer token JWT Keycloak

export async function eigenFetch<T>(
  path: string,
  fetchInit: RequestInit = {},
): Promise<FetchResponse<T>> {
  const token = getAccessToken(); // ← Récupère le JWT Keycloak
  
  const headers = new Headers(fetchInit.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  
  // Le reste de la logique (gestion erreurs, redirects, etc.) reste identique
  const response = await fetch(makeUrl(path), {
    ...fetchInit,
    headers,
  });
  
  // Gestion 401 → rediriger vers login
  if (response.status === 401) {
    clearTokens();
    navigate({ to: '${eigenSpaBase}/login' });
    throw new Error('Session expirée. Redirection vers la page de connexion.');
  }
  
  // ... reste identique
}

// Alias de compatibilité
export const egenFetch = eigenFetch;
```

### 3.2.3 Gestion des tokens Keycloak

Créer un nouveau fichier : `packages/framework/esm-api/src/keycloak-auth.ts`

```typescript
/**
 * Gestion des tokens Keycloak pour EGEN.
 * 
 * Supporte deux modes :
 * 1. Authorization Code Flow + PKCE (OAuth2 recommandé pour SPA)
 * 2. Password Grant (pour le formulaire de login custom)
 */

const TOKEN_STORAGE_KEY = 'eigen_access_token';
const REFRESH_TOKEN_KEY = 'eigen_refresh_token';
const TOKEN_EXPIRY_KEY = 'eigen_token_expiry';

// URL du realm Keycloak EGEN (configurable via esm-config)
let keycloakTokenUrl: string = '/api/v1/auth/token';

export function setKeycloakConfig(config: { tokenUrl: string }) {
  keycloakTokenUrl = config.tokenUrl;
}

export function getAccessToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) return null;
  
  // Vérifier si le token est expiré (avec 30s de marge)
  if (Date.now() > parseInt(expiry) - 30000) {
    // Token expiré → tenter un refresh
    scheduleTokenRefresh();
    return null;
  }
  
  return token;
}

export function storeTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
}

export function clearTokens() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export async function loginWithCredentials(
  username: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(keycloakTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, grant_type: 'password' }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.detail || 'Identifiants incorrects' };
    }
    
    const data = await response.json();
    storeTokens(data.access_token, data.refresh_token, data.expires_in);
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Erreur de connexion au serveur' };
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;
  
  try {
    const response = await fetch(keycloakTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken, grant_type: 'refresh_token' }),
    });
    
    if (!response.ok) {
      clearTokens();
      return false;
    }
    
    const data = await response.json();
    storeTokens(data.access_token, data.refresh_token, data.expires_in);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleTokenRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  const expiry = parseInt(sessionStorage.getItem(TOKEN_EXPIRY_KEY) || '0');
  const timeUntilRefresh = expiry - Date.now() - 60000; // 1 min avant expiration
  
  if (timeUntilRefresh > 0) {
    refreshTimer = setTimeout(async () => {
      await refreshAccessToken();
    }, timeUntilRefresh);
  }
}
```

---

## 3.3 Adaptation de la gestion de session (`esm-api`)

### Fichier : `packages/framework/esm-api/src/current-user.ts`

La structure du store reste la même mais les données viennent de Keycloak + EGEN API.

```typescript
// Adapter la fonction qui charge la session
async function loadCurrentSession() {
  const token = getAccessToken();
  if (!token) {
    sessionStore.setState({ loaded: true, session: { authenticated: false } });
    return;
  }
  
  try {
    // Appel à ton API EGEN pour récupérer le profil utilisateur
    const response = await eigenFetch<EigenUserSession>('/api/v1/auth/me');
    
    sessionStore.setState({
      loaded: true,
      session: {
        authenticated: true,
        sessionId: response.data.sessionId,
        user: {
          uuid: response.data.uuid,
          display: response.data.displayName,
          username: response.data.username,
          roles: response.data.roles.map(r => ({ name: r, display: r, uuid: r })),
          privileges: response.data.permissions.map(p => ({ name: p, display: p, uuid: p })),
          person: {
            display: response.data.displayName,
            uuid: response.data.uuid,
          },
          userProperties: {},
          retired: false,
          locale: response.data.locale || 'fr',
          allowedLocales: ['fr', 'en'],
        },
        // Pour EGEN, "sessionLocation" = établissement scolaire de l'utilisateur
        sessionLocation: response.data.etablissement ? {
          uuid: response.data.etablissement.id,
          display: response.data.etablissement.nom,
          links: [],
        } : undefined,
      },
    });
  } catch (e) {
    clearTokens();
    sessionStore.setState({ loaded: true, session: { authenticated: false } });
  }
}
```

---

## 3.4 Adaptation de l'app Login (`esm-login-app`)

### Fichier : `packages/apps/esm-login-app/src/login/login.component.tsx`

Le formulaire de login doit maintenant appeler `loginWithCredentials` au lieu de l'endpoint Egen.

```typescript
// Avant
const handleLogin = async (username: string, password: string) => {
  const response = await egenFetch('/ws/rest/v1/session', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(`${username}:${password}`)}` },
  });
  // ...
};

// Après
import { loginWithCredentials } from '@egen/esm-api';

const handleLogin = async (username: string, password: string) => {
  setIsLoggingIn(true);
  setErrorMessage('');
  
  const result = await loginWithCredentials(username, password);
  
  if (result.success) {
    await refetchCurrentUser();
    navigate({ to: referrer || '${eigenSpaBase}/home' });
  } else {
    setErrorMessage(result.error || t('invalidCredentials', 'Identifiants incorrects'));
  }
  
  setIsLoggingIn(false);
};
```

### Fichier : `packages/apps/esm-login-app/src/login.resource.ts`

Adapter les appels de sélection de "location" (établissement scolaire) :

```typescript
// Avant : cherche des locations Egen
export function useLocations(/* ... */) {
  const url = `/ws/rest/v1/location?v=custom&...`;
  return useSWR(url, egenFetch);
}

// Après : cherche des établissements EGEN
export function useEtablissements(searchQuery?: string) {
  const url = `/api/v1/etablissements?q=${searchQuery || ''}&fields=id,nom,code,type`;
  return useSWR(url, eigenFetch);
}
```

---

## 3.5 Remplacer `esm-data-api` par `esm-data-api`

Le package `esm-data-api` contient des types et fonctions spécifiques au domaine médical. Le remplacer par un package éducatif EGEN.

### Nouveaux types éducatifs (à créer dans `esm-data-api`)

```typescript
// packages/framework/esm-data-api/src/types.ts

export interface Apprenant {
  uuid: string;
  numeroMatricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  classe?: Classe;
  etablissement?: Etablissement;
  tuteurs?: Tuteur[];
  photoUrl?: string;
}

export interface Classe {
  uuid: string;
  nom: string;           // ex: "3ème A", "Terminale C"
  niveau: string;        // ex: "3ème", "Terminale"
  anneeAcademique: string;
  effectif: number;
  enseignantPrincipal?: Enseignant;
  etablissement: Etablissement;
}

export interface Enseignant {
  uuid: string;
  matricule: string;
  nom: string;
  prenom: string;
  specialites: string[];
  classes: Classe[];
}

export interface Etablissement {
  uuid: string;
  code: string;
  nom: string;
  type: 'PRIMAIRE' | 'COLLEGE' | 'LYCEE' | 'SUPERIEUR';
  region: string;
  province: string;
  commune: string;
  directeur?: string;
  telephone?: string;
}

export interface NoteEvaluation {
  uuid: string;
  apprenant: Apprenant;
  matiere: string;
  note: number;
  noteMax: number;
  coefficient: number;
  periode: 'TRIMESTRE_1' | 'TRIMESTRE_2' | 'TRIMESTRE_3' | 'ANNUEL';
  dateEvaluation: string;
  enseignant: Enseignant;
}

export interface Absence {
  uuid: string;
  apprenant: Apprenant;
  dateDebut: string;
  dateFin?: string;
  justifiee: boolean;
  motif?: string;
  matiere?: string;
}

export interface BulletinScolaire {
  uuid: string;
  apprenant: Apprenant;
  periode: string;
  moyenneGenerale: number;
  rang: number;
  effectifClasse: number;
  notes: NoteEvaluation[];
  appreciationGenerale?: string;
  decisionsConseil?: string;
}
```

---

## 3.6 Hooks React pour les données EGEN

Créer `packages/framework/esm-data-api/src/hooks.ts` :

```typescript
import useSWR from 'swr';
import { eigenFetch } from '@egen/esm-api';
import type { Apprenant, Classe, Enseignant, Etablissement, NoteEvaluation } from './types';

// Hook pour récupérer un apprenant
export function useApprenant(uuid: string) {
  const { data, error, isLoading } = useSWR(
    uuid ? `/api/v1/apprenants/${uuid}` : null,
    eigenFetch,
  );
  return {
    apprenant: data?.data as Apprenant | undefined,
    isLoading,
    error,
  };
}

// Hook pour récupérer les classes d'un établissement
export function useClasses(etablissementUuid?: string) {
  const url = etablissementUuid 
    ? `/api/v1/classes?etablissement=${etablissementUuid}`
    : `/api/v1/classes`;
  const { data, error, isLoading } = useSWR(url, eigenFetch);
  return {
    classes: (data?.data as Classe[]) ?? [],
    isLoading,
    error,
  };
}

// Hook pour les notes d'un apprenant
export function useNotesApprenant(apprenantUuid: string, periode?: string) {
  const url = `/api/v1/notes?apprenant=${apprenantUuid}${periode ? `&periode=${periode}` : ''}`;
  const { data, error, isLoading } = useSWR(
    apprenantUuid ? url : null,
    eigenFetch,
  );
  return {
    notes: (data?.data as NoteEvaluation[]) ?? [],
    isLoading,
    error,
  };
}

// Hook pour les absences
export function useAbsencesApprenant(apprenantUuid: string) {
  const { data, error, isLoading } = useSWR(
    apprenantUuid ? `/api/v1/absences?apprenant=${apprenantUuid}` : null,
    eigenFetch,
  );
  return {
    absences: data?.data ?? [],
    isLoading,
    error,
  };
}
```

---

## 3.7 Permissions frontend basées sur les rôles Keycloak

L'un des objectifs clés est la gestion fine des permissions au niveau frontend.

### Stratégie de permissions EGEN

```typescript
// packages/framework/esm-api/src/permissions.ts

/**
 * Vérification des permissions basée sur les rôles et privileges Keycloak.
 * 
 * Structure de rôles EGEN recommandée (à définir dans Keycloak) :
 * 
 * ROLES GLOBAUX:
 *   - SUPER_ADMIN           : Accès total
 *   - ADMIN_NATIONAL        : Admin au niveau national
 *   - ADMIN_REGIONAL        : Admin région
 *   - ADMIN_ETABLISSEMENT   : Directeur d'établissement
 * 
 * ROLES MÉTIER:
 *   - ENSEIGNANT            : Saisie notes, absences
 *   - CENSEUR               : Gestion discipline, absences
 *   - SECRETAIRE            : Gestion administrative
 *   - COMPTABLE             : Gestion financière
 *   - PARENT                : Consultation seule (son enfant)
 *   - APPRENANT             : Consultation (son propre profil)
 *
 * PRIVILEGES (permissions granulaires Keycloak):
 *   - egen:apprenants:read
 *   - egen:apprenants:write
 *   - egen:notes:read
 *   - egen:notes:write
 *   - egen:absences:read
 *   - egen:absences:write
 *   - egen:bulletins:generate
 *   - egen:etablissements:admin
 *   - egen:users:admin
 */

import { useSession } from './current-user';

export function useHasRole(...roles: string[]): boolean {
  const { session } = useSession();
  if (!session?.authenticated || !session.user) return false;
  const userRoles = session.user.roles.map(r => r.name);
  return roles.some(role => userRoles.includes(role));
}

export function useHasPrivilege(...privileges: string[]): boolean {
  const { session } = useSession();
  if (!session?.authenticated || !session.user) return false;
  const userPrivileges = session.user.privileges.map(p => p.name);
  return privileges.some(priv => userPrivileges.includes(priv));
}

export function useIsAdmin(): boolean {
  return useHasRole('SUPER_ADMIN', 'ADMIN_NATIONAL', 'ADMIN_REGIONAL', 'ADMIN_ETABLISSEMENT');
}

export function useIsEnseignant(): boolean {
  return useHasRole('ENSEIGNANT');
}

// Composant de protection des routes par permission
export const RequirePrivilege: React.FC<{
  privilege: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ privilege, fallback = null, children }) => {
  const hasPrivilege = useHasPrivilege(privilege);
  return hasPrivilege ? <>{children}</> : <>{fallback}</>;
};

// HOC pour composants conditionnels selon le rôle
export const RequireRole: React.FC<{
  role: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ role, fallback = null, children }) => {
  const roles = Array.isArray(role) ? role : [role];
  const hasRole = useHasRole(...roles);
  return hasRole ? <>{children}</> : <>{fallback}</>;
};
```

---

## ✅ Checklist Phase 3

- [ ] `restBaseUrl` changé vers `/api/v1`
- [ ] `sessionEndpoint` changé vers `/api/v1/auth/session`
- [ ] `eigenFetch` créée avec gestion Bearer token
- [ ] `keycloak-auth.ts` créé avec `loginWithCredentials`
- [ ] Store de session adapté pour les données EGEN
- [ ] Login component adapté
- [ ] Resource `login.resource.ts` adapté (établissements)
- [ ] Package `esm-data-api` renommé et adapté en `esm-data-api`
- [ ] Types éducatifs définis (Apprenant, Classe, Enseignant, etc.)
- [ ] Hooks React créés pour les données EGEN
- [ ] Système de permissions (roles/privileges) implémenté
- [ ] Tests mis à jour
