import type React from 'react';
import { useSyncExternalStore } from 'react';
import type { TopBarRegionId } from './regions';

// Registre d'ÉLÉMENTS : composants ajoutés à une région depuis le module global de cette app.
// (Les autres apps passent par les slots d'extension, voir regions.ts.)

export interface TopBarItem {
  /** Identifiant unique : sert aux règles `only` / `hide`. */
  id: string;
  region: TopBarRegionId;
  /** Ordre dans la région (croissant). */
  order?: number;
  component: React.ComponentType;
  /** Élément global (masquable en bloc par `hideGlobal`). Défaut : `true`. */
  global?: boolean;
  /** Masqué quand la recherche est ouverte : `mobile` (< 640px) ou `touch` (tablette et mobile). */
  hideOnSearch?: 'mobile' | 'touch';
  /** Affichage conditionnel par taille d'écran. Défaut : partout. */
  visibleFrom?: 'tablet' | 'desktop';
}

const items = new Map<string, TopBarItem>();
const listeners = new Set<() => void>();
let snapshot: readonly TopBarItem[] = [];

const emit = () => {
  snapshot = [...items.values()];
  listeners.forEach((l) => l());
};

export function registerTopBarItem(item: TopBarItem): () => void {
  items.set(item.id, item);
  emit();
  return () => {
    if (items.get(item.id) === item) {
      items.delete(item.id);
      emit();
    }
  };
}

export const subscribeTopBarItems = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
export const getTopBarItems = () => snapshot;

/** Éléments enregistrés (réactif). */
export const useTopBarItems = (): readonly TopBarItem[] =>
  useSyncExternalStore(subscribeTopBarItems, getTopBarItems, getTopBarItems);
