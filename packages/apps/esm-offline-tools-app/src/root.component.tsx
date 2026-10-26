import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './home/home.component';
import OfflineToolsPage from './offline-tools-page/offline-tools-page.component';

// =============================================================================
//  ROOT — Composant racine de l'app Outils hors ligne
//
//  Ne monte que du contenu dans la zone principale (route 'offline-tools') :
//    offline-tools                       → accueil (cartes + tableau)
//    offline-tools/:page                 → page déclarée sur le slot `offline-tools-page-slot`
//    offline-tools/:page/:entityUuid     → détail d'une entité
//  La navigation (options et sous-options) n'est PAS montée ici : elle vit dans le rail
//  gauche (`shell-rail-left-slot`) et sa zone gauche, voir `rail-panel.component.tsx`.
// =============================================================================

const Root: React.FC = () => (
  <BrowserRouter basename={window.getEgenSpaBase()}>
    <Routes>
      <Route path="offline-tools" element={<Home />} />
      <Route path="offline-tools/:page" element={<OfflineToolsPage />}>
        <Route path=":entityUuid" element={<OfflineToolsPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default Root;
