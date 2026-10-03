import '@egen-civitas/tailwind-preset/tailwind.tw.css';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GlobalPageBackground, PageBackgroundProvider } from '@egen-civitas/esm-framework';
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
//
//  Fond de page : les pages (annuaire, fiche collaborateur) déclarent leur image
//  via <PageBackground>, qui n'a d'effet que sous un <PageBackgroundProvider>
//  accompagné d'un <GlobalPageBackground> (ni le shell ni le core n'en montent
//  un). Ils sont donc montés ici, localement, comme esm-home-app le fait pour
//  son propre fond.
// =============================================================================

const Root: React.FC = () => (
  <PageBackgroundProvider>
    <GlobalPageBackground />
    <BrowserRouter basename={window.getEgenSpaBase()}>
      <Routes>
        <Route path="annuaire" element={<AnnuairePage onShowNotification={notify} />} />
        <Route path="annuaire/contacts" element={<AnnuairePage onShowNotification={notify} />} />
        <Route path="annuaire/organigramme" element={<AnnuairePage onShowNotification={notify} />} />
        <Route path="annuaire/structures" element={<AnnuairePage onShowNotification={notify} />} />
        <Route
          path="annuaire/:collaborateurId/details/:tab"
          element={<CollaborateurDetailPage onShowToast={notify} />}
        />
        <Route path="annuaire/:collaborateurId/details" element={<CollaborateurDetailPage onShowToast={notify} />} />
        <Route path="annuaire/:collaborateurId/details/*" element={<CollaborateurDetailPage onShowToast={notify} />} />
        <Route path="annuaire/:collaborateurId/:tab" element={<CollaborateurDetailPage onShowToast={notify} />} />
        <Route path="annuaire/:collaborateurId" element={<CollaborateurDetailPage onShowToast={notify} />} />
        <Route path="annuaire/:collaborateurId/*" element={<CollaborateurDetailPage onShowToast={notify} />} />
        <Route path="annuaire/*" element={<AnnuairePage onShowNotification={notify} />} />
      </Routes>
    </BrowserRouter>
  </PageBackgroundProvider>
);

export default Root;
