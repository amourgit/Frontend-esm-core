import React, { createContext, useContext } from 'react';
import type { NavItem } from '../components/shell/DropdownNavigation';

/** Navigation (déclarée par les apps via le slot `topbar-level2-nav`, nom historique conservé), fournie par l'hôte. */
export interface TopBarNavState {
  isHome: boolean;
  showFullNav: boolean;
  onShowFullNav: () => void;
  onHideFullNav: () => void;
  navItems: NavItem[];
}

const Ctx = createContext<TopBarNavState | null>(null);

export const TopBarNavProvider: React.FC<{ value: TopBarNavState; children: React.ReactNode }> = ({
  value,
  children,
}) => <Ctx.Provider value={value}>{children}</Ctx.Provider>;

export function useTopBarNav(): TopBarNavState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTopBarNav doit être utilisé dans <TopBarNavProvider>.');
  return v;
}
