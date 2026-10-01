import '@egen-civitas/tailwind-preset/tailwind.tw.css';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { InformationsPage } from './informations/informations.component';

// =============================================================================
//  ROOT — Composant racine de l'app Informations
//
//  Route 'informations' (espace authentifié, TopBar au-dessus). Trois onglets,
//  un par sous-route :
//    informations           → News & Publications (par défaut)
//    informations/news      → News & Publications
//    informations/annonces  → Annonces & Flash Info
//    informations/agenda    → Agenda & Calendrier
//  Toute autre sous-route retombe sur l'onglet par défaut.
// =============================================================================

const Root: React.FC = () => (
  <BrowserRouter basename={window.getEgenSpaBase()}>
    <Routes>
      <Route path="informations" element={<InformationsPage initialTab="news" />} />
      <Route path="informations/news" element={<InformationsPage initialTab="news" />} />
      <Route path="informations/annonces" element={<InformationsPage initialTab="annonces" />} />
      <Route path="informations/agenda" element={<InformationsPage initialTab="agenda" />} />
      <Route path="informations/*" element={<InformationsPage />} />
    </Routes>
  </BrowserRouter>
);

export default Root;
