import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import TopBar from './components/topbar/topbar.component';
import styles from './root.scss';

// =============================================================================
//  ROOT — Composant racine de l'app de navigation primaire
//
//  Ce composant est monté via un routeRegex qui EXCLUT déjà toutes les routes
//  publiques (login, logout, change-password).
//
//  Ce composant sert de double-garde (défense en profondeur) :
//  si le routeRegex venait à matcher par erreur une route publique,
//  les Routes internes retournent null — aucun rendu visible.
//
//  Routes publiques (null) :
//    /login/*              Page de connexion
//    /logout/*             Déconnexion
//    /change-password/*    Changement de mot de passe
//
//  Routes authentifiées (Navbar rendue) :
//    /*                    Toutes les autres routes (espaces tenant), y
//                           compris /home — désormais l'écran d'accueil
//                           authentifié (@egen/esm-home-app), plus une
//                           landing page publique.
// =============================================================================

const Root: React.FC = () => {
  return (
    <BrowserRouter basename={window.getEgenSpaBase()}>
      <Routes>
        {/* ── Routes publiques — rendu null (défense en profondeur) ── */}
        <Route path="login/*" element={null} />
        <Route path="logout/*" element={null} />
        <Route path="change-password/*" element={null} />

        {/* ── Toutes les autres routes — espace tenant authentifié ── */}
        <Route
          path="*"
          element={
            <div className={styles.primaryNavContainer}>
              <TopBar />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default Root;
