import type React from 'react';
import { useSyncExternalStore } from 'react';
import { readPlacement, type TopBarPlacement } from './placement';

// Registre d'ÉLÉMENTS : composants posés dans la TopBar depuis le module global de cette app. Ils se placent avec la
// MÊME déclaration que les extensions d'apps (voir placement.ts) : ni plus ni moins privilégiés.

export interface TopBarItem {
  /** Identifiant unique : sert aux règles `only` / `hide` et aux références `before` / `after`. */
  id: string;
  /** Placement déclaré (`level` obligatoire). */
  placement: TopBarPlacement;
  component: React.ComponentType;
  /** Élément global (masquable en bloc par `hideGlobal`). Défaut : `true`. */
  global?: boolean;
  /** Masqué quand la recherche est ouverte : `mobile` (< 640px) ou `touch` (tablette et mobile). */
  hideOnSearch?: 'mobile' | 'touch';
  /** Affichage conditionnel par taille d'écran. Défaut : partout. */
  visibleFrom?: 'tablet' | 'desktop';
}

/** Ce que l'on passe à `registerTopBarItem` : le placement peut être partiel (région, ordre : valeurs par défaut). */
export type TopBarItemInput = Omit<TopBarItem, 'placement'> & {
  placement: Partial<TopBarPlacement> & { level: string };
};

const items = new Map<string, TopBarItem>();
const listeners = new Set<() => void>();
let snapshot: readonly TopBarItem[] = [];

const emit = () => {
  snapshot = [...items.values()];
  listeners.forEach((l) => l());
};

export function registerTopBarItem(input: TopBarItemInput): () => void {
  const placement = readPlacement(input.placement, 0, input.id);
  if (!placement) return () => undefined;
  const item: TopBarItem = { ...input, placement };
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
