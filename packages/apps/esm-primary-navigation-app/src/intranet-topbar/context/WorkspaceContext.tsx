import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { type Workspace, type WorkspaceId } from '../types/workspace';
import { WORKSPACES_MOCK_DATA } from '../data/workspaceMockData';
import { type IntranetApp } from '../data/intranetAppsMock';
import { type NavItem } from '../components/shell/DropdownNavigation';
import { useTranslation } from 'react-i18next';
import { useSlotNavEntries } from '../hooks/useSlotNavEntries';
import { buildNavItemsFromSlot } from '../utils/buildNavItemsFromSlot';

interface WorkspaceContextType {
  currentWorkspace: Workspace;
  workspaceId: WorkspaceId;
  setWorkspaceId: (id: WorkspaceId) => void;
  availableWorkspaces: Workspace[];
  currentApps: IntranetApp[];
  currentNavItems: NavItem[];
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaceId, setWorkspaceIdState] = useState<WorkspaceId>('intranet');

  const setWorkspaceId = useCallback((id: WorkspaceId) => {
    const exists = WORKSPACES_MOCK_DATA.some((w) => w.id === id);
    if (exists) {
      setWorkspaceIdState(id);
    }
  }, []);

  const { t } = useTranslation();
  const slotEntries = useSlotNavEntries();

  // Navigation du niveau 2 : fournie par les apps (slot `topbar-level2-nav`),
  // avec repli sur les données actuelles tant qu'une app n'a pas migré.
  const currentWorkspace = useMemo(() => {
    const base = WORKSPACES_MOCK_DATA.find((w) => w.id === workspaceId) || WORKSPACES_MOCK_DATA[0];
    return { ...base, navItems: buildNavItemsFromSlot(base.navItems, slotEntries, t) };
  }, [workspaceId, slotEntries, t]);

  const currentApps = useMemo(() => {
    return currentWorkspace.apps;
  }, [currentWorkspace]);

  const currentNavItems = useMemo(() => {
    return currentWorkspace.navItems;
  }, [currentWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaceId,
        setWorkspaceId,
        availableWorkspaces: WORKSPACES_MOCK_DATA,
        currentApps,
        currentNavItems,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
