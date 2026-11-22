import React, { useEffect, useState } from 'react';
import NotFoundPage from './not-found/not-found-page.component';
import { isUnknownRoute } from './is-unknown-route';

// =============================================================================
//  ROOT — Composant racine de l'app not-found
//  Cette app est montée sur toute route non vide (routeRegex fourre-tout) mais ne rend quelque chose que si
//  aucune autre page n'est enregistrée pour la route courante (voir is-unknown-route.ts) : la décision est
//  prise à l'exécution d'après les pages réellement enregistrées, internes comme externes. Il n'y a plus de
//  liste de routes à tenir à jour.
//
//  La page 404 (copiée à l'identique depuis Civitas---GED, en Tailwind) utilise `h-screen`. Elle s'affiche
//  en plein écran, SANS TopBar (route publique, voir l'effet ci-dessous). Le wrapper cale la page sur la
//  hauteur réellement disponible (fenêtre − TopBar, mesurée par le shell dans --egen-navbar-height, soit 0
//  ici) pour éviter tout défilement parasite.
// =============================================================================

const Root: React.FC = () => {
  const [unknown, setUnknown] = useState<boolean>(() => isUnknownRoute());

  // La route change sans remonter ce composant (il reste monté sur toutes les routes) : on réévalue à chaque
  // événement de routage de single-spa.
  useEffect(() => {
    const update = () => setUnknown(isUnknownRoute());
    window.addEventListener('single-spa:routing-event', update);
    update();
    return () => window.removeEventListener('single-spa:routing-event', update);
  }, []);

  // Route publique : pas de TopBar, de rails ni de footer sur la 404. Mécanisme du shell
  // (html[data-public-route='true'], déjà utilisé par esm-login-app), posé UNIQUEMENT quand la 404 est affichée
  // et retiré dès qu'une page normale reprend la main : la navigation retrouve immédiatement sa TopBar.
  useEffect(() => {
    if (!unknown) return undefined;
    const root = document.documentElement;
    root.setAttribute('data-public-route', 'true');
    return () => root.removeAttribute('data-public-route');
  }, [unknown]);

  if (!unknown) return null;

  return (
    <div className="w-full h-[calc(100dvh-var(--egen-navbar-height,0px))] [&>div]:h-full!">
      <NotFoundPage />
    </div>
  );
};

export default Root;
