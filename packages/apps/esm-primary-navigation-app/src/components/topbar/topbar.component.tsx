import React, { useEffect, useRef } from 'react';
import { SupremeIntranetTopBar } from '../../intranet-topbar/components/shell/SupremeIntranetTopBar';

// =============================================================================
//  TOPBAR — Barre de navigation principale EGEN (design "Supreme Intranet")
//
//  La TopBar vit ENTIÈREMENT dans cette app (`src/intranet-topbar`) : elle ne
//  dépend plus du composant `TopBar` / `TopBarIconButton` / `TopBarAvatar` du
//  framework. Une pile de niveaux que les APPS déclarent (nom, rang), chacun fait de
//  trois régions : gauche · centre · droite. N'importe quelle app y place des composants
//  par le slot neutre `topbar-slot` + `meta.topbar` (voir kit/regions.ts, kit/placement.ts).
//
//  Elle ne contient AUCUN élément : tout ce qui s'affiche est injecté par des apps (logo, Espace/Site, recherche, langue,
//  lanceur, thème, horloge, panneau latéral, navigation…), chacune déclarant son niveau et sa place dans `meta.topbar`.
// =============================================================================

/** Publie la hauteur réelle de la TopBar (tous niveaux confondus) dans `--egen-topnav-height`. */
function useTopNavHeightVariable(ref: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    let last = -1;
    let pending = -1;
    let raf = 0;

    // Écriture différée à la frame suivante : modifier une variable CSS dans le
    // callback ResizeObserver peut redéclencher une notification dans la même
    // frame (« ResizeObserver loop completed with undelivered notifications »).
    const flush = () => {
      raf = 0;
      if (pending !== last) {
        last = pending;
        root.style.setProperty('--egen-topnav-height', `${pending}px`);
      }
    };
    const publish = () => {
      pending = Math.round(element.getBoundingClientRect().height);
      if (!raf) raf = requestAnimationFrame(flush);
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty('--egen-topnav-height');
    };
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
const TopBar: React.FC = () => <TopBarContent />;

export default TopBar;
