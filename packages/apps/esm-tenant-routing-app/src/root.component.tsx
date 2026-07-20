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
//  @egen/esm-home-app). Ce n'est plus le cas : /home est désormais l'écran
//  d'accueil AUTHENTIFIÉ (vitrine de composants) — le guard doit donc aussi
//  s'y appliquer, comme sur n'importe quelle autre route tenant.
//
//  La page /tenant-suspended est enregistrée et rendue indépendamment (voir
//  `suspendedPage` dans index.ts / routes.json, route exacte "tenant-suspended").
//  Elle n'est PAS rendue ici : le routeRegex universel de `root` (".*") matche
//  aussi /tenant-suspended, donc dupliquer ici la route "tenant-suspended"
//  monterait SuspendedPage deux fois en parallèle (une fois via `root`, une
//  fois via `suspendedPage`) — chacun de ces deux composants est enregistré
//  comme sa propre application single-spa avec sa propre fonction d'activité
//  (voir esm-routes/src/loaders/pages.ts), donc les deux seraient actifs
//  simultanément sur cette route.
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
