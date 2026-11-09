import React, { useEffect, useRef } from 'react';
import { SupremeIntranetTopBar } from '../../intranet-topbar/components/shell/SupremeIntranetTopBar';
import { WorkspaceProvider } from '../../intranet-topbar/context/WorkspaceContext';
import { SiteProvider } from '../../intranet-topbar/context/SiteContext';

// =============================================================================
//  TOPBAR — Barre de navigation principale EGEN (design "Supreme Intranet")
//
//  La TopBar vit ENTIÈREMENT dans cette app (`src/intranet-topbar`) : elle ne
//  dépend plus du composant `TopBar` / `TopBarIconButton` / `TopBarAvatar` du
//  framework. Une pile de niveaux que les APPS déclarent (nom, rang), chacun fait de
//  trois régions : gauche · centre · droite. N'importe quelle app y place des composants
//  par le slot neutre `topbar-slot` + `meta.topbar` (voir kit/regions.ts, kit/placement.ts).
//
//  Placement d'usine des éléments globaux (modifiable via `topbar.placement`,
//  voir intranet-topbar/global/placement.ts) :
//    niveau `main` : sélecteurs Espace/Site | Recherche · Langue · Apps · Raccourcis · Plein écran · Thème · Date/Heure
//    Injectés par des apps, par extensions : le logo (@egen/esm-branding-app) et le menu
//    utilisateur (@egen/esm-user-profile-app)
//    niveau `navigation` : Navigation déroulante (accueil) ou fil d'Ariane contextuel
// =============================================================================

/** Publie la hauteur réelle de la TopBar (tous niveaux confondus) dans `--egen-topnav-height`. */
function useTopNavHeightVariable(ref: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const publish = () =>
      document.documentElement.style.setProperty('--egen-topnav-height', `${element.getBoundingClientRect().height}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
}

const TopBarContent: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  useTopNavHeightVariable(wrapperRef);

  return (
    <div ref={wrapperRef}>
      <SupremeIntranetTopBar />
    </div>
  );
};

// =============================================================================
//  TOPBAR — squelette neutre
//
//  Rend toujours la pile de niveaux ; elle ne connaît NI la session NI l'authentification. Le renvoi vers la
//  connexion d'un utilisateur sans session, la redirection de la racine du SPA et le menu utilisateur appartiennent à
//  `@egen/esm-user-profile-app` ; le logo à `@egen/esm-branding-app`. Chacune de ces apps injecte son élément par
//  extension, là où elle le décide.
// =============================================================================
const TopBar: React.FC = () => (
  <WorkspaceProvider>
    <SiteProvider>
      <TopBarContent />
    </SiteProvider>
  </WorkspaceProvider>
);

export default TopBar;
