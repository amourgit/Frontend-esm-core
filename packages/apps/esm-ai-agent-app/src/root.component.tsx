import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AgentLauncher from './components/agent-launcher/agent-launcher.component';

// =============================================================================
//  ROOT — Composant racine du widget IA (Layer 2)
//
//  Ce composant est monté via un routeRegex qui EXCLUT déjà toutes les routes
//  publiques (login, logout, home, change-password, tenant-suspended) — la
//  liste EXACTE utilisée par esm-primary-navigation-app pour la TopBar et par
//  esm-footer-app, afin que le widget IA soit présent sur toutes les pages
//  authentifiées, et uniquement là où la navbar l'est aussi (voir routes.json).
//
//  Ces routes sont dupliquées ici (double-garde, défense en profondeur) au
//  lieu d'être partagées, pour rester indépendant et ne créer aucun couplage
//  de build avec les autres apps — même choix d'isolation que le reste des
//  micro-frontends du monorepo.
//
//  La garde "IA activée ?" (config.enabled) et "session authentifiée ?" est
//  déléguée à AgentLauncher lui-même, qui ne rend rien tant que ces deux
//  conditions ne sont pas réunies.
// =============================================================================

const Root: React.FC = () => {
  return (
    <BrowserRouter basename={window.getEgenSpaBase()}>
      <Routes>
        {/* ── Routes publiques — rendu null (défense en profondeur) ── */}
        <Route path="login/*" element={null} />
        <Route path="logout/*" element={null} />
        <Route path="home/*" element={null} />
        <Route path="change-password/*" element={null} />
        <Route path="tenant-suspended/*" element={null} />

        {/* ── Toutes les autres routes — espace tenant authentifié ── */}
        <Route path="*" element={<AgentLauncher />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Root;
