import * as React from 'react';
import type { ThemeStyles } from '../types/theme';

/** Fonctions fournies par l'application hôte (EGEN) à l'éditeur : appliquer / retirer le thème du projet. */
export interface HostBridge {
  apply: (styles: ThemeStyles) => void;
  revert: () => void;
  isApplied: boolean;
}

const HostBridgeContext = React.createContext<HostBridge | null>(null);
export const HostBridgeProvider = HostBridgeContext.Provider;
export const useHostBridge = () => React.useContext(HostBridgeContext);
