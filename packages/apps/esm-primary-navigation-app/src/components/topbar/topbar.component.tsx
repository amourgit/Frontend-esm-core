import React, { useCallback, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '@egen-civitas/esm-framework';
import { useTenantMode } from '@egen-civitas/esm-tenant';
import { SupremeIntranetTopBar } from '../../intranet-topbar/components/shell/SupremeIntranetTopBar';
import { WorkspaceProvider } from '../../intranet-topbar/context/WorkspaceContext';
import { SiteProvider } from '../../intranet-topbar/context/SiteContext';
import { AssistantVoiceProvider, useAssistantVoice } from '../../intranet-topbar/context/AssistantGlobalVoiceContext';

// =============================================================================
//  TOPBAR — Barre de navigation principale EGEN (design "Supreme Intranet")
//
//  La TopBar vit ENTIÈREMENT dans cette app (`src/intranet-topbar`) : elle ne
//  dépend plus du composant `TopBar` / `TopBarIconButton` / `TopBarAvatar` du
//  framework. Deux niveaux :
//
//  Niveau 1 : [Hamburger] Logo EGEN · sélecteurs Espace/Site · (info-slot) ·
//             Recherche Gooey · Langue · Apps · Raccourcis · Notifications ·
//             Plein écran · Thème · (actions-slot) · Utilisateur ·
//             (trailing-slot) · Date/Heure
//  Niveau 2 : Navigation déroulante (accueil) ou fil d'Ariane contextuel
//             (+ slot "top-nav-breadcrumb-slot") · Bouton Assistant IA
// =============================================================================

/** Événement écouté par esm-ai-assistant-app pour ouvrir/fermer le panneau de l'assistant. */
export const ASSISTANT_TOGGLE_EVENT = 'egen:assistant-toggle';

/** Publie la hauteur réelle de la TopBar (2 niveaux) dans `--egen-topnav-height`. */
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
  const { assistantMode, setAssistantMode } = useAssistantVoice();
  useTopNavHeightVariable(wrapperRef);

  const toggleAssistant = useCallback(() => {
    window.dispatchEvent(new CustomEvent(ASSISTANT_TOGGLE_EVENT));
  }, []);

  return (
    <div ref={wrapperRef}>
      <SupremeIntranetTopBar
        assistantMode={assistantMode}
        onSelectAssistantMode={setAssistantMode}
        onToggleAssistant={toggleAssistant}
      />
    </div>
  );
};

// =============================================================================
//  TOPBAR — Garde d'authentification (LOGIQUE PRÉSERVÉE À L'IDENTIQUE)
//
//  RESPONSABILITÉ :
//    • Rend la topbar quand l'utilisateur est connecté.
//    • En mode SINGLE/OFF : redirige vers /login si non connecté
//      (le Guard tenant est silencieux dans ces modes).
//    • En mode MULTI : NE redirige PAS (le TenantRoutingGuard le fait déjà) ;
//      rendre null évite une navigation simultanée contradictoire.
//
//  RÈGLE D'OR :
//    Mode multi  → Guard redirige vers /login,  TopBar rend null
//    Mode single → Guard silencieux,             TopBar redirige vers /login
// =============================================================================
const TopBar: React.FC = () => {
  const session = useSession();
  const tenantMode = useTenantMode();
  const egenSpaBase = window['getEgenSpaBase']();

  const currentReferrer = window.location.pathname.slice(
    window.location.pathname.indexOf(egenSpaBase) + egenSpaBase.length - 1,
  );

  // Connecté → rendre la topbar complète (tous modes)
  if (session?.authenticated && session?.user?.person) {
    return (
      <WorkspaceProvider>
        <SiteProvider>
          <AssistantVoiceProvider>
            <TopBarContent />
          </AssistantVoiceProvider>
        </SiteProvider>
      </WorkspaceProvider>
    );
  }

  // Non connecté, mode multi → Guard TenantRoutingGuard gère la redirection
  if (tenantMode === 'multi') {
    return null;
  }

  // Non connecté, mode SINGLE / OFF → TopBar gère la redirection
  return <Navigate to="/login" state={{ referrer: currentReferrer }} />;
};

export default TopBar;
