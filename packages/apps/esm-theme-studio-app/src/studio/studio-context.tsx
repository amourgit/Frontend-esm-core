import React, { createContext, useContext, useSyncExternalStore } from 'react';
import type { StudioState, StudioStore } from '../core/store';
import type { ThemeLibrary } from '../core/library';
import type { ThemeRuntimePort } from '../core/runtime';

export interface StudioServices {
  store: StudioStore;
  runtime: ThemeRuntimePort;
  library: ThemeLibrary;
  applyPriority: number;
}

const Ctx = createContext<StudioServices | null>(null);

export const StudioProvider: React.FC<{ services: StudioServices; children: React.ReactNode }> = ({ services, children }) => <Ctx.Provider value={services}>{children}</Ctx.Provider>;

export function useServices(): StudioServices {
  const s = useContext(Ctx);
  if (!s) throw new Error('StudioProvider manquant');
  return s;
}

export function useStudio(): StudioState {
  const { store } = useServices();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
