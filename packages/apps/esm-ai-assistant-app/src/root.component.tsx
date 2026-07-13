import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AssistantWidget from './components/assistant-widget/assistant-widget.component';
import styles from './root.scss';

// =============================================================================
//  ROOT — Composant racine de l'app assistant IA
//
//  Monté via un routeRegex qui EXCLUT déjà toutes les routes publiques
//  (login, logout, home, change-password, tenant-suspended) — LA MÊME liste
//  que esm-footer-app et la TopBar de esm-primary-navigation-app, afin que
//  l'assistant soit présent sur toutes les pages authentifiées, et
//  uniquement là où la navbar l'est aussi (voir routes.json).
//
//  Ces routes sont dupliquées ici (double-garde, défense en profondeur) au
//  lieu d'être partagées, pour que cette app reste indépendante et ne crée
//  aucun couplage de build avec esm-primary-navigation-app — même choix
//  d'isolation que le reste des micro-frontends du monorepo.
//
//  Routes publiques (null) :
//    /login/*              Page de connexion
//    /logout/*             Déconnexion
//    /home/*               Landing page publique EGEN SaaS
//    /change-password/*    Changement de mot de passe
//    /tenant-suspended/*   Page de suspension tenant
//
//  Routes authentifiées (widget rendu) :
//    /*                    Toutes les autres routes (espaces tenant)
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
        <Route
          path="*"
          element={
            <div className={styles.assistantAppContainer}>
              <AssistantWidget />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default Root;
