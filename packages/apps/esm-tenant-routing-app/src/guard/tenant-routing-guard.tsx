import React from 'react';
import { useConfig } from '@egen/esm-framework';
import { type ConfigSchema } from '../config-schema';
import { useTenantRouting, useTenantRoutingNavigator } from './use-tenant-routing';

// =============================================================================
//  TENANT ROUTING GUARD — Composant garde invisible
//
//  Ce composant ne rend RIEN dans le DOM. Son seul rôle est d'évaluer la
//  décision de routage tenant et d'effectuer les redirections nécessaires.
//
//  Il est monté sur toutes les routes (sauf les routes exemptées définies
//  dans la config `skipRoutesRegex`) grâce au routeRegex de routes.json.
//
//  Architecture :
//    useTenantRouting()         → calcule la décision (pure, testable)
//    useTenantRoutingNavigator() → exécute les navigations (effets)
//    TenantRoutingGuard         → compose les deux, retourne null
// =============================================================================

const TenantRoutingGuard: React.FC = () => {
  const config = useConfig<ConfigSchema>();
  const { decision } = useTenantRouting();

  // Exécute les navigations en réaction aux décisions
  useTenantRoutingNavigator(decision, config);

  // Composant invisible — ne rend rien dans le DOM.
  return null;
};

export default TenantRoutingGuard;
