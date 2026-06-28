import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/navbar/navbar.component';
import styles from './root.scss';

// =============================================================================
//  ROOT — Composant racine de l'app de navigation primaire
//
//  Ce composant est monté via un routeRegex qui EXCLUT déjà toutes les routes
//  publiques (login, logout, home, change-password, tenant-suspended).
//
//  Ce composant sert de double-garde (défense en profondeur) :
//  si le routeRegex venait à matcher par erreur une route publique,
//  les Routes internes retournent null — aucun rendu visible.
//
//  Routes publiques (null) :
//    /login/*              Page de connexion
//    /logout/*             Déconnexion
//    /home/*               Landing page publique EIGEN SaaS
//    /change-password/*    Changement de mot de passe
//    /tenant-suspended/*   Page de suspension tenant
//
//  Routes authentifiées (Navbar rendue) :
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
            <div className={styles.primaryNavContainer}>
              <Navbar />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default Root;
