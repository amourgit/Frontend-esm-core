import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/footer/footer.component';
import styles from './root.module.css';

// =============================================================================
//  ROOT — Composant racine de l'app footer
//
//  Le footer est désormais accessible sur TOUTES les pages, y compris les pages
//  publiques (login, logout, change-password). Plus de garde d'authentification :
//  le footer est un composant purement passif qui affiche les informations de
//  l'entreprise configurées.
//
//  Routes avec footer rendu :
//    /*                    Toutes les routes (publiques et authentifiées)
// =============================================================================

const Root: React.FC = () => {
  return (
    <BrowserRouter basename={window.getEgenSpaBase()}>
      <Routes>
        {/* ── Toutes les routes — footer rendu ── */}
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
