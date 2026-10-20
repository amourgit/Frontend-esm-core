import '@egen-civitas/tailwind-preset/tailwind.tw.css';
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import SiteActivityPage from './pages/site-activity.page';
import SiteApplicationsPage from './pages/site-applications.page';
import SiteLayoutPage from './pages/site-layout.page';
import SiteMembersPage from './pages/site-members.page';
import SiteResourcesPage from './pages/site-resources.page';
import SiteSettingsPage from './pages/site-settings.page';
import SitesListPage from './pages/sites-list.page';
import SiteTasksPage from './pages/site-tasks.page';

// =============================================================================
//  ROOT — Composant racine de l'app Sites
//
//  Route 'sites' (espace authentifié, TopBar au-dessus) :
//    sites                              → choix du site (carrousel, recherche, filtres)
//    sites/:siteId                      → redirige vers l'onglet « applications »
//    sites/:siteId/applications         → applications & outils
//    sites/:siteId/membres              → membres & équipes
//    sites/:siteId/ressources           → ressources documentaires
//    sites/:siteId/taches               → tâches
//    sites/:siteId/activite             → journal d'activité
//    sites/:siteId/parametres           → paramètres
//  Site inconnu ou sous-route inconnue : retour à la liste / à l'onglet par défaut.
//
//  Fond de page : déclaré par les pages avec <PageBackground> ; le rendu est
//  assuré par l'unique arrière-plan global que monte le shell. Rien à monter ici.
// =============================================================================

const Root: React.FC = () => (
  <BrowserRouter basename={window.getEgenSpaBase()}>
    <Routes>
      <Route path="sites" element={<SitesListPage />} />
      <Route path="sites/:siteId" element={<SiteLayoutPage />}>
        <Route index element={<Navigate to="applications" replace />} />
        <Route path="applications" element={<SiteApplicationsPage />} />
        <Route path="membres" element={<SiteMembersPage />} />
        <Route path="ressources" element={<SiteResourcesPage />} />
        <Route path="taches" element={<SiteTasksPage />} />
        <Route path="activite" element={<SiteActivityPage />} />
        <Route path="parametres" element={<SiteSettingsPage />} />
        <Route path="*" element={<Navigate to="applications" replace />} />
      </Route>
      <Route path="sites/*" element={<Navigate to="/sites" replace />} />
    </Routes>
  </BrowserRouter>
);

export default Root;
