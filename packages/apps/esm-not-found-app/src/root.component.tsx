import React, { useEffect } from 'react';
import NotFoundPage from './not-found/not-found-page.component';

// =============================================================================
//  ROOT — Composant racine de l'app not-found
//  Pas de sous-routing interne nécessaire : le routeRegex de routes.json a
//  déjà filtré les routes concernées (tout ce qui n'est reconnu par aucune
//  autre app) — ce composant n'a donc qu'à rendre la page 404 directement.
//
//  La page 404 (copiée à l'identique depuis Civitas---GED, en Tailwind) utilise
//  `h-screen`. Elle s'affiche en plein écran, SANS TopBar (route publique, voir
//  l'effet ci-dessous). Le wrapper cale la page sur la hauteur réellement
//  disponible (fenêtre − TopBar, mesurée par le shell dans
//  --egen-navbar-height, soit 0 ici) pour éviter tout défilement parasite.
// =============================================================================

const Root: React.FC = () => {
  // Route publique : pas de TopBar, de left-nav ni de footer sur la 404.
  // On utilise le mécanisme du shell (html[data-public-route='true'], cf.
  // _general.scss du styleguide, déjà utilisé par esm-login-app) : la hauteur
  // du conteneur de la TopBar tombe à 0, donc --egen-navbar-height aussi, et le
  // wrapper ci-dessous occupe tout l'écran. Retiré au démontage : la navigation
  // vers une page normale retrouve immédiatement sa TopBar.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-public-route', 'true');
    return () => root.removeAttribute('data-public-route');
  }, []);

  return (
    <div className="w-full h-[calc(100dvh-var(--egen-navbar-height,0px))] [&>div]:h-full!">
      <NotFoundPage />
    </div>
  );
};

export default Root;
