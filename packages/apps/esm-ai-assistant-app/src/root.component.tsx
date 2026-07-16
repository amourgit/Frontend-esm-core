import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useTenantFeatureFlag } from '@egen/esm-tenant';
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
//  Routes authentifiées (widget rendu, sous réserve du feature flag tenant
//  "ai-assistant" — voir ci-dessous) :
//    /*                    Toutes les autres routes (espaces tenant)
//
//  GATING PAR TENANT (@egen/esm-tenant) :
//  ────────────────────────────────────────
//  useTenantFeatureFlag('ai-assistant', true) — le SECOND argument (true)
//  est important : c'est le defaultValue, utilisé quand aucun tenant n'est
//  résolu (mode "off"/"single", ou registry pas encore chargée) OU quand le
//  tenant actif ne déclare pas explicitement ce flag. Modèle "opt-out" :
//  l'assistant reste actif par défaut partout: seul un tenant qui déclare
//  EXPLICITEMENT `featureFlags: { "ai-assistant": false }` dans sa
//  TenantDefinition (registry) le désactive. Ça évite toute régression pour
//  les déploiements qui n'utilisent pas (encore) le système multi-tenant.
// =============================================================================

const Root: React.FC = () => {
  const aiAssistantEnabledForTenant = useTenantFeatureFlag('ai-assistant', true);

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
            aiAssistantEnabledForTenant ? (
              <div className={styles.assistantAppContainer}>
                <AssistantWidget />
              </div>
            ) : null
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default Root;
