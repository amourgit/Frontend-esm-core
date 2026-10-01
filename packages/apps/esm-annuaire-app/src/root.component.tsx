import '@egen-civitas/tailwind-preset/tailwind.tw.css';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AnnuairePage } from './annuaire/annuaire.component';
import { CollaborateurDetailPage } from './collaborateur/collaborateur-detail-page.component';
import { notify } from './utils/notify';

// =============================================================================
//  ROOT — Composant racine de l'app Annuaire
//
//  Route 'annuaire' (espace authentifié, TopBar au-dessus) :
//    annuaire                                  → Annuaire des collaborateurs
//    annuaire/contacts | organigramme | structures
//    annuaire/:collaborateurId[/...]           → Fiche collaborateur (onglet = dernier segment)
//    annuaire/:collaborateurId/details[/:tab]
//  Toute autre sous-route retombe sur l'annuaire.
// =============================================================================

const Root: React.FC = () => (
  <BrowserRouter basename={window.getEgenSpaBase()}>
    <Routes>
      <Route path="annuaire" element={<AnnuairePage onShowNotification={notify} />} />
      <Route path="annuaire/contacts" element={<AnnuairePage onShowNotification={notify} />} />
      <Route path="annuaire/organigramme" element={<AnnuairePage onShowNotification={notify} />} />
      <Route path="annuaire/structures" element={<AnnuairePage onShowNotification={notify} />} />
      <Route path="annuaire/:collaborateurId/details/:tab" element={<CollaborateurDetailPage onShowToast={notify} />} />
      <Route path="annuaire/:collaborateurId/details" element={<CollaborateurDetailPage onShowToast={notify} />} />
      <Route path="annuaire/:collaborateurId/details/*" element={<CollaborateurDetailPage onShowToast={notify} />} />
      <Route path="annuaire/:collaborateurId/:tab" element={<CollaborateurDetailPage onShowToast={notify} />} />
      <Route path="annuaire/:collaborateurId" element={<CollaborateurDetailPage onShowToast={notify} />} />
      <Route path="annuaire/:collaborateurId/*" element={<CollaborateurDetailPage onShowToast={notify} />} />
      <Route path="annuaire/*" element={<AnnuairePage onShowNotification={notify} />} />
    </Routes>
  </BrowserRouter>
);

export default Root;
