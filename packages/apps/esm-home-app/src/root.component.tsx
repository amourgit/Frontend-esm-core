import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './home/home.component';

// =============================================================================
//  ROOT — Composant racine de l'app Home
//
//  Écran d'accueil de l'espace AUTHENTIFIÉ (route 'home', incluse dans les
//  routes privées de @egen/esm-primary-navigation-app — voir routes.json de
//  cette app-ci et le routeRegex de esm-primary-navigation-app). La TopBar
//  s'affiche naturellement au-dessus : cette app ne gère plus sa propre
//  navigation ni de garde d'authentification.
// =============================================================================

const Root: React.FC = () => {
  return (
    <BrowserRouter basename={window.getEgenSpaBase()}>
      <Routes>
        <Route path="home" element={<HomePage />} />
        <Route path="home/*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Root;
