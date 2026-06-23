// ============================================================================
//  @egen/esm-tenant — Composants React : Provider + Guards
// ============================================================================
//
//  TenantProvider :
//    Wrapper optionnel à placer à la racine d'une app (ou d'un arbre de
//    composants). Expose un Context React avec le tenant actif pour les
//    librairies/composants qui préfèrent le Context au hook de store Zustand.
//    Le store reste la source de vérité — le Context est juste une projection.
//
//  TenantGuard :
//    Protège un arbre de composants : si l'accès est refusé (tenant suspendu,
//    app non autorisée, permission manquante…), rend un composant de fallback
//    au lieu de l'enfant. Zero-config si mode "off".
//
//  TenantRequired :
//    Version simplifiée de TenantGuard qui s'assure juste qu'un tenant actif
//    existe avant de rendre ses enfants.
//
//  TenantSelector :
//    Sélecteur de tenant minimaliste (mode "multi") — liste les tenants
//    disponibles avec un bouton de sélection. Sans style intégré pour être
//    composable avec n'importe quel design system.
// ============================================================================

import React, { createContext, useContext, useEffect, useState, type ReactNode, type FC } from 'react';
import type { TenantDefinition, TenantAccessOptions, TenantAccessResult } from '../types';
import {
  useTenant,
  useTenantAccess,
  useAvailableTenants,
  useSwitchTenant,
  useTenantMode,
  useTenantStatus,
} from './useTenant';
import { getTenantStore } from '../context/store';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TenantContextValue {
  tenant: TenantDefinition | null;
}

const TenantContext = createContext<TenantContextValue>({ tenant: null });

/** Hook bas niveau pour lire depuis le Context React (sans Zustand) */
export function useTenantContext(): TenantContextValue {
  return useContext(TenantContext);
}

// ---------------------------------------------------------------------------
// TenantProvider
// ---------------------------------------------------------------------------

export interface TenantProviderProps {
  children: ReactNode;
}

/**
 * Provider React qui expose le tenant actif via Context.
 * À placer à la racine de l'app shell ou de chaque microfrontend.
 *
 * @example
 * ```tsx
 * export default function Root() {
 *   return (
 *     <TenantProvider>
 *       <App />
 *     </TenantProvider>
 *   );
 * }
 * ```
 */
export const TenantProvider: FC<TenantProviderProps> = ({ children }) => {
  const tenant = useTenant();
  return <TenantContext.Provider value={{ tenant }}>{children}</TenantContext.Provider>;
};

// ---------------------------------------------------------------------------
// TenantGuard
// ---------------------------------------------------------------------------

export interface TenantGuardProps extends TenantAccessOptions {
  children: ReactNode;
  /** Rendu alternatif si l'accès est refusé */
  fallback?: ReactNode;
  /** Si non fourni, le fallback par défaut affiche null */
  onDenied?: (result: TenantAccessResult) => ReactNode;
  /** Si true, affiche un spinner pendant la résolution (status === 'loading') */
  loadingFallback?: ReactNode;
}

/**
 * Guard qui protège un arbre de composants selon les droits tenant.
 *
 * @example
 * ```tsx
 * // L'accès est bloqué si l'app n'est pas dans tenant.allowedApps
 * <TenantGuard
 *   appName="egen-academique"
 *   fallback={<AccessDenied />}
 * >
 *   <AcademiqueApp />
 * </TenantGuard>
 * ```
 */
export const TenantGuard: FC<TenantGuardProps> = ({
  children,
  fallback = null,
  onDenied,
  loadingFallback = null,
  ...accessOptions
}) => {
  const status = useTenantStatus();
  const result = useTenantAccess(accessOptions);

  if (status === 'loading') {
    return <>{loadingFallback}</>;
  }

  if (!result.allowed) {
    if (onDenied) return <>{onDenied(result)}</>;
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ---------------------------------------------------------------------------
// TenantRequired
// ---------------------------------------------------------------------------

export interface TenantRequiredProps {
  children: ReactNode;
  /** Fallback si aucun tenant actif (résolution en cours ou mode "off" + requireTenant) */
  fallback?: ReactNode;
}

/**
 * Version simplifiée de TenantGuard : s'assure juste qu'un tenant actif existe.
 * Utile pour les apps qui n'ont pas besoin de vérification fine des permissions
 * mais qui veulent éviter de rendre avant que le tenant soit résolu.
 *
 * En mode "off", rend toujours les enfants.
 */
export const TenantRequired: FC<TenantRequiredProps> = ({ children, fallback = null }) => {
  const mode = useTenantMode();
  const tenant = useTenant();
  const status = useTenantStatus();

  // Mode "off" : tout passe
  if (mode === 'off') return <>{children}</>;

  // En cours de résolution
  if (status === 'loading') return <>{fallback}</>;

  // Tenant résolu
  if (tenant) return <>{children}</>;

  return <>{fallback}</>;
};

// ---------------------------------------------------------------------------
// TenantSuspendedBoundary
// ---------------------------------------------------------------------------

export interface TenantSuspendedBoundaryProps {
  children: ReactNode;
  /** Rendu alternatif si le tenant est suspendu */
  fallback?: ReactNode | ((message?: string) => ReactNode);
}

/**
 * Affiche un écran de maintenance si le tenant actif est suspendu.
 *
 * @example
 * ```tsx
 * <TenantSuspendedBoundary
 *   fallback={(msg) => <MaintenancePage message={msg} />}
 * >
 *   <App />
 * </TenantSuspendedBoundary>
 * ```
 */
export const TenantSuspendedBoundary: FC<TenantSuspendedBoundaryProps> = ({ children, fallback = null }) => {
  const status = useTenantStatus();
  const tenant = useTenant();

  if (status === 'suspended') {
    const message = tenant?.suspendedMessage;
    if (typeof fallback === 'function') return <>{fallback(message)}</>;
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ---------------------------------------------------------------------------
// TenantSelector (headless)
// ---------------------------------------------------------------------------

export interface TenantSelectorRenderProps {
  tenants: TenantDefinition[];
  activeTenant: TenantDefinition | null;
  switchTo: (id: string) => Promise<void>;
  switching: boolean;
}

export interface TenantSelectorProps {
  /** Render prop pour une composition maximale avec votre design system */
  render: (props: TenantSelectorRenderProps) => ReactNode;
}

/**
 * Composant headless de sélection de tenant (mode "multi").
 * En mode "off" ou "single", render retourne null par convention.
 *
 * @example
 * ```tsx
 * <TenantSelector
 *   render={({ tenants, activeTenant, switchTo, switching }) => (
 *     <select
 *       value={activeTenant?.id ?? ''}
 *       onChange={(e) => switchTo(e.target.value)}
 *       disabled={switching}
 *     >
 *       {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
 *     </select>
 *   )}
 * />
 * ```
 */
export const TenantSelector: FC<TenantSelectorProps> = ({ render }) => {
  const mode = useTenantMode();
  const tenants = useAvailableTenants();
  const activeTenant = useTenant();
  const { switchTo, switching } = useSwitchTenant();

  // En mode "off" ou "single" : le sélecteur n'a pas lieu d'être
  if (mode === 'off' || mode === 'single') return null;

  return <>{render({ tenants, activeTenant, switchTo, switching })}</>;
};
