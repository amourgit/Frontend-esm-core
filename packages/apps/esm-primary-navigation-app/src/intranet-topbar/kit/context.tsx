import React, { createContext, useContext } from 'react';

/** État d'interface partagé par les éléments de la TopBar (et passé aux extensions comme `state`). */
export interface TopBarUi {
  activeMenu: string | null;
  isActivePanel: (name: string) => boolean;
  togglePanel: (name: string) => void;
  hidePanel: (name: string) => () => void;
  closePanels: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  isMobile: boolean;
  isDesktop: boolean;
}

const TopBarUiContext = createContext<TopBarUi | null>(null);

export const TopBarUiProvider: React.FC<{ value: TopBarUi; children: React.ReactNode }> = ({ value, children }) => (
  <TopBarUiContext.Provider value={value}>{children}</TopBarUiContext.Provider>
);

export function useTopBarUi(): TopBarUi {
  const ctx = useContext(TopBarUiContext);
  if (!ctx) throw new Error('useTopBarUi doit être utilisé dans <TopBarFrame>.');
  return ctx;
}
