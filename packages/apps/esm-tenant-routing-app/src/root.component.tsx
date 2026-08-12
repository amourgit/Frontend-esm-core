import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import TenantRoutingGuard from './guard/tenant-routing-guard';

// =============================================================================
//  ROOT — Composant racine de l'app de routage tenant
//
//  Responsabilité UNIQUE : monter le TenantRoutingGuard (invisible, actif
//  sur TOUTES les routes — voir routeRegex ".*" dans routes.json).
//  Le guard lui-même ne rend rien : c'est un "side-effect component" qui
//  observe l'état du tenant store + la session et déclenche des navigate().
//
//  /home a longtemps été exclue ici (c'était la landing page publique de
//  @egen-civitas/esm-home-app). Ce n'est plus le cas : /home est désormais l'écran
//  d'accueil AUTHENTIFIÉ (vitrine de composants) — le guard doit donc aussi
//  s'y appliquer, comme sur n'importe quelle autre route tenant.
//
//  Refonte du 8 août 2026 : la page "/tenant-suspended" a été retirée avec
//  le reste du système de vérification de tenant côté frontend — voir
//  @egen-civitas/esm-tenant/src/types.ts.
// =============================================================================

const Root: React.FC = () => {
  return (
    <BrowserRouter basename={window.getEgenSpaBase()}>
      {/*
        Le guard est monté hors de toute <Routes> pour qu'il soit toujours
        actif, peu importe la route courante. Il observe et redirige, sans
        rien rendre.
      */}
      <TenantRoutingGuard />
    </BrowserRouter>
  );
};

export default Root;
