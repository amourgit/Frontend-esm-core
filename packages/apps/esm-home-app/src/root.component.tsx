import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './home/home.component';

// =============================================================================
//  ROOT — Composant racine de l'app Home
//  Gère le routing interne minimal de la page d'accueil publique.
//  Pas de navigation primaire, pas de guard d'authentification.
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
