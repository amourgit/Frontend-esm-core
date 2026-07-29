import React from 'react';
import NotFoundPage from './not-found/not-found-page.component';

// =============================================================================
//  ROOT — Composant racine de l'app not-found
//  Pas de sous-routing interne nécessaire : le routeRegex de routes.json a
//  déjà filtré les routes concernées (tout ce qui n'est reconnu par aucune
//  autre app) — ce composant n'a donc qu'à rendre la page 404 directement.
// =============================================================================

const Root: React.FC = () => <NotFoundPage />;

export default Root;
