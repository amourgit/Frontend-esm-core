import React from 'react';
import { BrowserRouter, Navigate } from 'react-router-dom';
import { interpolateUrl, useConfig, useSession } from '@egen-civitas/esm-framework';
import { useTenantMode } from '@egen-civitas/esm-tenant';
import type { ConfigSchema } from '../config-schema';

// =============================================================================
//  GARDE D'AUTHENTIFICATION (logique préservée à l'identique : elle vivait dans la TopBar)
//
//  Renvoie vers la connexion l'utilisateur sans session authentifiée. N'affiche rien : la TopBar n'en sait rien.
//
//  - Authentifié : rien.
//  - Mode MULTI : rien — le TenantRoutingGuard redirige déjà ; une seconde navigation serait contradictoire.
//  - Mode SINGLE / OFF : redirige vers `session.loginRoute`, en gardant la page demandée (`referrer`) pour y revenir
//    après la connexion.
//
//  Monté par un routeRegex qui exclut déjà login, logout et change-password ; la vérification de chemin ci-dessous
//  est une défense en profondeur si ce regex venait à matcher une route publique.
// =============================================================================

const PUBLIC_ROUTES = /^\/?(?:login|logout|change-password)(?:\/|$)/;

const SessionGuard: React.FC = () => {
  const session = useSession();
  const tenantMode = useTenantMode();
  const { session: sessionConfig } = useConfig<ConfigSchema>();
  const egenSpaBase = window.getEgenSpaBase();

  const currentRoute = window.location.pathname.slice(window.location.pathname.indexOf(egenSpaBase) + egenSpaBase.length - 1);

  if (session?.authenticated && session?.user?.person) return null;
  if (tenantMode === 'multi') return null;
  if (PUBLIC_ROUTES.test(currentRoute)) return null;

  return (
    <BrowserRouter basename={egenSpaBase}>
      <Navigate to={interpolateUrl(sessionConfig.loginRoute)} state={{ referrer: currentRoute }} />
    </BrowserRouter>
  );
};

export default SessionGuard;
