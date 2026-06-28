import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import TenantRoutingGuard from './guard/tenant-routing-guard';
import SuspendedPage from './screens/suspended.component';

// =============================================================================
//  ROOT — Composant racine de l'app de routage tenant
//
//  Deux responsabilités :
//    1. Monter le TenantRoutingGuard (invisible, actif sur toutes les routes)
//    2. Rendre la page de suspension quand on est sur /tenant-suspended
//
//  Le guard lui-même ne rend rien : c'est un "side-effect component" qui
//  observe l'état du tenant store + la session et déclenche des navigate().
// =============================================================================

const Root: React.FC = () => {
  return (
    <BrowserRouter basename={window.getEgenSpaBase()}>
      {/*
        Le guard est monté en dehors des Routes pour qu'il soit toujours actif,
        peu importe la route courante. Il observe et redirige, sans rien rendre.
      */}
      <TenantRoutingGuard />

      <Routes>
        {/* Page d'affichage quand un tenant est suspendu */}
        <Route path="tenant-suspended" element={<SuspendedPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Root;
