// ============================================================================
//  @eigen/esm-tenant — Types publics
// ============================================================================
//
//  Ce fichier définit l'ensemble du contrat de type du système multi-tenant
//  EIGEN. Il est conçu pour être agnostique du domaine métier : aucune
//  référence à un secteur (santé, académique, ERP, etc.) ne doit apparaître
//  ici. La couche métier est définie dans les apps consommatrices.
//
//  PHILOSOPHIE DU SYSTÈME :
//  ─────────────────────────
//  Le système supporte deux modes :
//
//  1. MODE SINGLE-TENANT (défaut) :
//     Un seul tenant actif, défini statiquement via env vars ou config globale.
//     Aucune UI de sélection de tenant n'est affichée. Les apps ne voient pas
//     la différence — elles consomment les mêmes hooks/APIs que dans le mode
//     multi-tenant.
//
//  2. MODE MULTI-TENANT :
//     Plusieurs tenants peuvent coexister. Un tenant est « résolu » au runtime
//     (depuis l'URL, le localStorage, un claim JWT, ou un sélecteur UI) et
//     son contexte est propagé à toutes les apps via un store Zustand global
//     et un Context React.
//
//  RÉSOLUTION DU TENANT (par ordre de priorité décroissante) :
//  ─────────────────────────────────────────────────────────────
//  1. URL subdomain  : app.acme.com → tenantSlug = "acme"
//  2. URL path       : /t/acme/dashboard → tenantSlug = "acme"
//  3. Query param    : ?tenant=acme
//  4. HTTP header    : X-Tenant-ID (lu depuis la réponse du backend lors du login)
//  5. JWT claim      : token.tenantId ou token.tid
//  6. localStorage   : eigen:tenant:active
//  7. Config statique: window.eigenTenantId ou VITE_TENANT_ID
//  8. Fallback       : premier tenant disponible dans la registry
// ============================================================================

import type { ThemeSchema } from '@eigen/esm-theme';

// ---------------------------------------------------------------------------
// Identité d'un tenant
// ---------------------------------------------------------------------------

/** Identifiant unique du tenant — slug URL-safe, immuable */
export type TenantId = string;

/** État de chargement d'un tenant */
export type TenantStatus = 'idle' | 'loading' | 'active' | 'error' | 'suspended';

/**
 * Définition complète d'un tenant.
 *
 * La plupart des champs sont optionnels pour permettre une déclaration minimale
 * (juste `id` + `name` suffisent pour bootstrapper le système).
 */
export interface TenantDefinition {
  /** Identifiant unique, slug URL-safe (ex: "civitas", "acme-corp") */
  id: TenantId;

  /** Nom d'affichage human-friendly */
  name: string;

  /** Slug alternatif pour la résolution URL (si différent de `id`) */
  slug?: string;

  /** Domaine(s) associé(s) à ce tenant (pour la résolution par subdomain) */
  domains?: string[];

  /** Locale par défaut du tenant */
  locale?: string;

  /** Fuseau horaire par défaut */
  timezone?: string;

  /** URL de l'API backend propre à ce tenant (si architecture isolée par tenant) */
  apiBaseUrl?: string;

  /** URL du fichier de thème JSON propre à ce tenant (surcharge le thème global) */
  themeUrl?: string;

  /** Surcharge de thème inline (alternative à themeUrl, prioritaire) */
  themeOverride?: Partial<ThemeSchema>;

  /** URLs d'import maps propres à ce tenant (microfrontends spécifiques) */
  importMapUrls?: string[];

  /** Feature flags activés/désactivés pour ce tenant */
  featureFlags?: Record<string, boolean>;

  /** Permissions/rôles actifs pour ce tenant (liste des modules/apps autorisés) */
  allowedApps?: string[];

  /** Permissions granulaires (clés libres, interprétées par les apps) */
  permissions?: Record<string, boolean | string[]>;

  /** Métadonnées libres (logo, couleur brand, plan, etc.) */
  meta?: Record<string, unknown>;

  /** Indique si ce tenant est actif (par défaut true) */
  active?: boolean;

  /** Indique si ce tenant est en mode maintenance */
  suspended?: boolean;

  /** Message affiché si `suspended: true` */
  suspendedMessage?: string;
}

// ---------------------------------------------------------------------------
// Configuration du système tenant
// ---------------------------------------------------------------------------

/**
 * Mode de fonctionnement du système tenant.
 *
 * - `"off"`         : système désactivé, aucune logique tenant, apps fonctionnent normalement
 * - `"single"`      : un seul tenant actif (défini par config), pas d'UI de sélection
 * - `"multi"`       : plusieurs tenants, résolution dynamique au runtime
 */
export type TenantMode = 'off' | 'single' | 'multi';

/**
 * Stratégies de résolution du tenant actif, triées par priorité.
 * Chaque stratégie est essayée dans l'ordre jusqu'à ce qu'une réussisse.
 */
export type TenantResolutionStrategy =
  | 'subdomain'   // Lit le subdomain de window.location.hostname
  | 'path'        // Lit un segment /t/{slug}/ ou /{slug}/ dans window.location.pathname
  | 'query'       // Lit ?tenant= dans window.location.search
  | 'jwt'         // Lit le claim tenantId/tid dans le JWT de session
  | 'header'      // Lit X-Tenant-ID dans les réponses HTTP (posé lors du login)
  | 'localStorage'// Lit eigen:tenant:active depuis localStorage
  | 'static'      // Lit window.eigenTenantId ou import.meta.env.VITE_TENANT_ID
  | 'first';      // Prend le premier tenant disponible dans la registry

/** Configuration du chemin URL pour la stratégie "path" */
export interface TenantPathConfig {
  /** Préfixe de path attendu (ex: "/t/" pour /t/acme/...) */
  prefix?: string;
  /** Position du segment slug dans le path (0 = premier segment après spaBase) */
  segment?: number;
}

/** Configuration de la résolution JWT */
export interface TenantJwtConfig {
  /** Nom du claim JWT contenant l'ID tenant (ex: "tenantId", "tid", "org") */
  claim: string;
}

/** Configuration complète du système tenant */
export interface TenantSystemConfig {
  /**
   * Mode de fonctionnement du système.
   * Peut être surchargé par :
   *  - `window.eigenTenantMode`
   *  - `import.meta.env.VITE_TENANT_MODE`
   *  - `EIGEN_TENANT_MODE` (via injection HTML)
   *
   * @default "off"
   */
  mode: TenantMode;

  /**
   * Ordre des stratégies de résolution du tenant actif.
   * Seule la première stratégie réussie est utilisée.
   *
   * @default ["subdomain", "path", "query", "jwt", "localStorage", "static", "first"]
   */
  resolutionOrder?: TenantResolutionStrategy[];

  /** Configuration pour la stratégie "path" */
  pathConfig?: TenantPathConfig;

  /** Configuration pour la stratégie "jwt" */
  jwtConfig?: TenantJwtConfig;

  /**
   * En mode "single", identifiant du tenant forcé.
   * Si non défini, cherché dans window.eigenTenantId / VITE_TENANT_ID.
   */
  defaultTenantId?: TenantId;

  /**
   * URL d'un fichier JSON de registry de tenants (chargé au boot).
   * Format attendu : TenantDefinition[]
   */
  registryUrl?: string;

  /**
   * Tenants définis statiquement (fusionnés avec la registry distante).
   * Utile pour les envs sans backend ou pour les tests.
   */
  staticTenants?: TenantDefinition[];

  /**
   * Si true, persist le tenant actif en localStorage pour survie aux rechargements.
   * @default true
   */
  persistActive?: boolean;

  /**
   * Clé localStorage utilisée pour la persistence.
   * @default "eigen:tenant:active"
   */
  storageKey?: string;

  /**
   * Si true, applique automatiquement le thème du tenant via @eigen/esm-theme.
   * @default true
   */
  applyTheme?: boolean;

  /**
   * Callback appelé après résolution et activation d'un tenant.
   */
  onTenantActivated?: (tenant: TenantDefinition) => void;

  /**
   * Callback appelé en cas d'erreur de résolution.
   */
  onError?: (err: Error) => void;
}

// ---------------------------------------------------------------------------
// Store state
// ---------------------------------------------------------------------------

/** État du store global du système tenant */
export interface TenantStore {
  /** Mode actif résolu au runtime */
  mode: TenantMode;

  /** Statut courant */
  status: TenantStatus;

  /** Tenant actuellement actif (null si aucun résolu ou mode "off") */
  activeTenant: TenantDefinition | null;

  /** Tous les tenants disponibles (registry complète) */
  availableTenants: TenantDefinition[];

  /** Message d'erreur si status === "error" */
  error: string | null;

  /** Timestamp de la dernière résolution réussie */
  resolvedAt: number | null;

  /** Configuration active du système */
  config: TenantSystemConfig;
}

// ---------------------------------------------------------------------------
// Permissions frontend
// ---------------------------------------------------------------------------

/**
 * Résultat d'un contrôle d'accès tenant.
 * Utilisé par les guards et hooks de permission.
 */
export interface TenantAccessResult {
  /** L'accès est-il autorisé ? */
  allowed: boolean;
  /** Raison du refus (si `allowed: false`) */
  reason?: 'no-tenant' | 'tenant-suspended' | 'app-not-allowed' | 'permission-denied' | 'mode-off';
  /** Tenant vérifié */
  tenant: TenantDefinition | null;
}

/**
 * Options pour le hook useTenantAccess / le guard TenantGuard.
 */
export interface TenantAccessOptions {
  /** Nom de l'app à vérifier dans tenant.allowedApps */
  appName?: string;
  /** Permission granulaire à vérifier dans tenant.permissions */
  permission?: string;
  /** Si true, bloque l'accès quand le mode est "off" (par défaut, mode "off" laisse tout passer) */
  requireTenant?: boolean;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Payload de l'événement esm:tenant-activated */
export interface TenantActivatedEvent {
  tenant: TenantDefinition;
  previousTenantId: TenantId | null;
}

/** Payload de l'événement esm:tenant-changed */
export interface TenantChangedEvent {
  from: TenantDefinition | null;
  to: TenantDefinition;
}
