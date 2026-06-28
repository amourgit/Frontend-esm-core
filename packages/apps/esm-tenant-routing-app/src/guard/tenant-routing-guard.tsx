import React, { Suspense } from 'react';
import { useConfig } from '@egen/esm-framework';
import { type ConfigSchema } from '../config-schema';
import { useTenantRouting, useTenantRoutingNavigator } from './use-tenant-routing';

// =============================================================================
//  TENANT ROUTING GUARD — Composant garde invisible
//
//  Architecture Suspense :
//    TenantRoutingGuard (public)
//      └─ <Suspense fallback={null}>          ← capture le throw de useSession()
//           └─ TenantRoutingGuardInner        ← appelle useSession() + hooks de décision
//
//  Pourquoi ce pattern ?
//    useSession() utilise React Suspense : il throw une Promise tant que la
//    session n'est pas chargée. Le composant qui appelle useSession() doit
//    donc être wrappé dans une limite Suspense, sinon le throw remonte jusqu'à
//    la limite Suspense la plus proche (souvent la racine de l'app) et peut
//    créer des comportements inattendus.
//
//  Ce composant ne rend RIEN dans le DOM.
//  Son seul rôle est d'observer l'état tenant + session et de déclencher
//  les navigate() appropriés via useTenantRoutingNavigator().
// =============================================================================

/** Composant interne — à l'intérieur de la limite Suspense */
const TenantRoutingGuardInner: React.FC = () => {
  const config = useConfig<ConfigSchema>();

  // useTenantRouting appelle useSession() qui peut throw → géré par Suspense parent
  const decision = useTenantRouting();

  // Exécute les navigate() en réaction aux décisions (un seul navigate par décision)
  useTenantRoutingNavigator(decision, config);

  return null;
};

/**
 * Composant garde public — invisible, monté sur toutes les routes.
 * Enveloppe l'inner component dans une limite Suspense pour absorber
 * le throw de useSession() pendant le chargement initial de la session.
 */
const TenantRoutingGuard: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <TenantRoutingGuardInner />
    </Suspense>
  );
};

export default TenantRoutingGuard;
