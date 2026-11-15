import React, { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type NavItem } from '../components/shell/DropdownNavigation';
import { useSlotNavEntries } from '../hooks/useSlotNavEntries';
import { useSpacesSitesState } from '../hooks/useSpacesSitesState';
import { buildNavItemsFromSlot } from '../utils/buildNavItemsFromSlot';

// =============================================================================
//  ESPACE ACTIF ET NAVIGATION DE CET ESPACE
//
//  L'Espace actif (et la liste des Espaces) appartiennent à `@egen/esm-spaces-sites-app` : ici, on le LIT dans son store
//  partagé. La TopBar n'en connaît ni la liste, ni le choix. Elle en tire uniquement sa navigation, construite des entrées
//  que les apps déclarent sur le slot `topbar-nav-slot`, filtrées pour l'Espace actif.
// =============================================================================

/** L'Espace actif, enrichi de la navigation que les apps déclarent pour lui. */
export interface Workspace {
  id: string;
  name: string;
  navItems: NavItem[];
}

interface WorkspaceContextType {
  currentWorkspace: Workspace;
  workspaceId: string;
  currentNavItems: NavItem[];
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { spaceId, spaces } = useSpacesSitesState();
  const workspaceId = spaceId ?? '';

  const { t } = useTranslation();
  const slotEntries = useSlotNavEntries();

  const currentWorkspace = useMemo<Workspace>(
    () => ({
      id: workspaceId,
      name: spaces.find((space) => space.id === workspaceId)?.name ?? workspaceId,
      navItems: buildNavItemsFromSlot(slotEntries, workspaceId, t),
    }),
    [workspaceId, spaces, slotEntries, t],
  );

  const value = useMemo(
    () => ({ currentWorkspace, workspaceId, currentNavItems: currentWorkspace.navItems }),
    [currentWorkspace, workspaceId],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
