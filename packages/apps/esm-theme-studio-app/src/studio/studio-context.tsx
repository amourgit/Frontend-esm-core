import React, { createContext, useContext, useSyncExternalStore } from 'react';
import type { StudioState, StudioStore } from '../core/store';
import type { ThemeLibrary } from '../core/library';
import type { ThemeRuntimePort } from '../core/runtime';

export interface StudioServices {
  store: StudioStore;
  /** Contrat vers le moteur de thème (esm-theme aujourd'hui, TokiForge demain) : le Studio PRODUIT, le moteur APPLIQUE. */
  runtime: ThemeRuntimePort;
  library: ThemeLibrary;
  applyPriority: number;
}

const Ctx = createContext<StudioServices | null>(null);
const NotifyCtx = createContext<(message: string) => void>(() => undefined);

export const StudioProvider: React.FC<{ services: StudioServices; notify?: (m: string) => void; children: React.ReactNode }> = ({ services, notify, children }) => (
  <Ctx.Provider value={services}>
    <NotifyCtx.Provider value={notify ?? (() => undefined)}>{children}</NotifyCtx.Provider>
  </Ctx.Provider>
);

export function useServices(): StudioServices {
  const s = useContext(Ctx);
  if (!s) throw new Error('StudioProvider manquant');
  return s;
}

export const useNotify = () => useContext(NotifyCtx);

export function useStudio(): StudioState {
  const { store } = useServices();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
