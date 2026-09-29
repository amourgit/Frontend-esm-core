import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Workspace, WorkspaceId } from '../types/workspace';
import { WORKSPACES_MOCK_DATA } from '../data/workspaceMockData';
import { IntranetApp } from '../data/intranetAppsMock';
import { NavItem } from '../components/shell/DropdownNavigation';

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
    const exists = WORKSPACES_MOCK_DATA.some(w => w.id === id);
    if (exists) {
      setWorkspaceIdState(id);
    }
  }, []);

  const currentWorkspace = useMemo(() => {
    return WORKSPACES_MOCK_DATA.find(w => w.id === workspaceId) || WORKSPACES_MOCK_DATA[0];
  }, [workspaceId]);

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
        currentNavItems
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
