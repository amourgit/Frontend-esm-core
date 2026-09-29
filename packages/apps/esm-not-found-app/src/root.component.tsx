import '@egen-civitas/tailwind-preset/tailwind.tw.css';
import React from 'react';
import NotFoundPage from './not-found/not-found-page.component';

// =============================================================================
//  ROOT — Composant racine de l'app not-found
//  Pas de sous-routing interne nécessaire : le routeRegex de routes.json a
//  déjà filtré les routes concernées (tout ce qui n'est reconnu par aucune
//  autre app) — ce composant n'a donc qu'à rendre la page 404 directement.
//
//  La page 404 (copiée à l'identique depuis Civitas---GED, en Tailwind) utilise
//  `h-screen` : or le contenu vit dans la zone de scroll du shell, SOUS la
//  TopBar. Le wrapper ci-dessous cale la page sur la hauteur réellement
//  disponible (fenêtre − TopBar, mesurée par le shell dans
//  --egen-navbar-height) pour éviter tout défilement parasite.
// =============================================================================

const Root: React.FC = () => (
  <div className="w-full h-[calc(100dvh-var(--egen-navbar-height,0px))] [&>div]:h-full!">
    <NotFoundPage />
  </div>
);

export default Root;
