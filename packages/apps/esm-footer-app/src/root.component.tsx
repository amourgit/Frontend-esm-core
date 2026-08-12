import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/footer/footer.component';
import styles from './root.scss';

// =============================================================================
//  ROOT — Composant racine de l'app footer
//
//  Ce composant est monté via un routeRegex qui EXCLUT déjà toutes les routes
//  publiques (login, logout, change-password) — la liste
//  EXACTE utilisée par esm-primary-navigation-app pour la TopBar, afin que
//  le footer soit présent sur toutes les pages authentifiées, et
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
//    /change-password/*    Changement de mot de passe
//
//  Routes authentifiées (Footer rendu) :
//    /*                    Toutes les autres routes (espaces tenant), y
//                           compris /home — désormais l'écran d'accueil
//                           authentifié (@egen-civitas/esm-home-app), plus une
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
            <div className={styles.footerAppContainer}>
              <Footer />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default Root;
