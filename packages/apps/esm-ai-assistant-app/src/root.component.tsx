import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AssistantWidget from './components/assistant-widget/assistant-widget.component';
import styles from './root.scss';

// =============================================================================
//  ROOT — Composant racine de l'app assistant IA
//
//  Monté via un routeRegex qui EXCLUT déjà toutes les routes publiques
//  (login, logout, change-password) — LA MÊME liste que esm-footer-app et
//  la TopBar de esm-primary-navigation-app, afin que l'assistant soit
//  présent sur toutes les pages authentifiées, et uniquement là où la
//  navbar l'est aussi (voir routes.json).
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
//  Routes authentifiées (widget rendu) :
//    /*                    Toutes les autres routes (espaces tenant), y
//                           compris /home — désormais l'écran d'accueil
//                           authentifié (@egen/esm-home-app), plus une
//                           landing page publique.
//
//  Refonte du 8 août 2026 : le gating par feature flag tenant
//  (useTenantFeatureFlag('ai-assistant', true)) a été retiré avec le reste
//  du système de vérification de tenant côté frontend (registry,
//  featureFlags par tenant) — voir @egen/esm-tenant/src/types.ts. En
//  pratique le comportement effectif est identique : le modèle précédent
//  était "opt-out" avec `true` par défaut, et aucun tenant ne déclarait
//  explicitement `featureFlags: { "ai-assistant": false }` (il n'y avait
//  plus de registry pour porter cette donnée). L'assistant est donc
//  désormais actif inconditionnellement sur toutes les routes
//  authentifiées ; toute restriction future par tenant devra passer par le
//  backend (ex: l'API de l'assistant refuse la requête pour ce tenant).
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
