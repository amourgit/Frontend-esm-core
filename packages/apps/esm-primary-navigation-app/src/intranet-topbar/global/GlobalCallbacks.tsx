import React, { createContext, useContext } from 'react';

/** Callbacks optionnels fournis par l'hôte de la TopBar aux éléments globaux. */
export interface TopBarGlobalCallbacks {
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onOpenGlobalSearch?: () => void;
}

const Ctx = createContext<TopBarGlobalCallbacks>({});

export const GlobalCallbacksProvider: React.FC<{ value: TopBarGlobalCallbacks; children: React.ReactNode }> = ({
  value,
  children,
}) => <Ctx.Provider value={value}>{children}</Ctx.Provider>;

export const useGlobalCallbacks = () => useContext(Ctx);
