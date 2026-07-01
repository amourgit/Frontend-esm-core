import React, { Suspense } from 'react';
import { useConfig } from '@egen/esm-framework';
import { type ConfigSchema } from '../config-schema';
import { useTenantRouting, useTenantRoutingNavigator } from './use-tenant-routing';

// =============================================================================
//  TENANT ROUTING GUARD — Composant garde invisible
//
//  Architecture Suspense :
//    TenantRoutingGuard (public, wrappé dans Suspense)
//      └─ TenantRoutingGuardInner  ← appelle useSession() (peut throw)
//
//  Ce composant est monté sur toutes les routes sauf /home (routeRegex).
//  Il ne rend RIEN dans le DOM. Il observe tenant + session et émet
//  navigate() uniquement quand nécessaire, selon la séparation stricte :
//
//    Mode off / single  →  Guard silencieux, Navbar gère tout
//    Mode multi         →  Guard gère tenant + auth redirect,
//                          Navbar rend le header seulement
// =============================================================================

const TenantRoutingGuardInner: React.FC = () => {
  const config = useConfig<ConfigSchema>();
  // useTenantRouting appelle useSession() → peut throw → géré par Suspense
  const decision = useTenantRouting();
  useTenantRoutingNavigator(decision, config);
  return null;
};

const TenantRoutingGuard: React.FC = () => (
  <Suspense fallback={null}>
    <TenantRoutingGuardInner />
  </Suspense>
);

export default TenantRoutingGuard;
