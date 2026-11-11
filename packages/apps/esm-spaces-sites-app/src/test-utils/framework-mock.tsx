import React, { useSyncExternalStore } from 'react';
import { vi } from 'vitest';

// =============================================================================
//  Mock du framework pour les tests de cette app
//
//  Complète le mock officiel (`@egen-civitas/esm-framework/mock`) avec :
//   - un VRAI petit store global réactif (`getGlobalStore` / `useStore`) : le contexte Espace/Site est un store partagé,
//     ses tests doivent le voir bouger ;
//   - des composants de sélection simplifiés (`MorphSelect*`, `Combobox`) rendus en `<select>` natifs, interrogeables
//     par rôle — leur rendu visuel n'est pas l'objet de ces tests.
// =============================================================================

interface TestStore<T> {
  getState: () => T;
  setState: (update: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: () => void) => () => void;
}

const stores = new Map<string, TestStore<unknown>>();

export function getGlobalStore<T>(name: string, initial: T): TestStore<T> {
  if (!stores.has(name)) {
    let state = initial;
    const listeners = new Set<() => void>();
    stores.set(name, {
      getState: () => state,
      setState: (update: unknown) => {
        const patch = typeof update === 'function' ? (update as (s: T) => Partial<T>)(state) : (update as Partial<T>);
        state = { ...state, ...patch };
        listeners.forEach((l) => l());
      },
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    } as TestStore<unknown>);
  }
  return stores.get(name) as TestStore<T>;
}

export const useStore = <T,>(store: TestStore<T>) => useSyncExternalStore(store.subscribe, store.getState);

type Children = { children?: React.ReactNode };

const MorphSelectContext = React.createContext<{ value?: string; onValueChange?: (v: string) => void }>({});

export const MorphSelect = ({ value, onValueChange, children }: Children & { value?: string; onValueChange?: (v: string) => void; className?: string }) => (
  <MorphSelectContext.Provider value={{ value, onValueChange }}>{children}</MorphSelectContext.Provider>
);
export const MorphSelectTrigger = ({ children }: Children) => <>{children}</>;
export const MorphSelectValue = ({ placeholder }: { placeholder?: string }) => <span data-testid="space-placeholder">{placeholder}</span>;
export const MorphSelectContent = ({ children }: Children) => {
  const { value, onValueChange } = React.useContext(MorphSelectContext);
  return (
    <select aria-label="espace" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  );
};
export const MorphSelectItem = ({ value, label }: { value: string; label: string }) => <option value={value}>{label}</option>;

interface ComboboxProps {
  items: Array<{ value: string; label: string }>;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
}
export const Combobox = ({ items, value, onValueChange, placeholder, ...rest }: ComboboxProps) => (
  <select aria-label={rest['aria-label']} value={value} onChange={(e) => onValueChange(e.target.value)}>
    <option value="">{placeholder}</option>
    {items.map((item) => (
      <option key={item.value} value={item.value}>
        {item.label}
      </option>
    ))}
  </select>
);

export async function createFrameworkMock() {
  // Chemin en texte (et non `import()` typé) : le fichier mock du framework publié n'a pas des types à jour.
  const actual = await vi.importActual<Record<string, unknown>>('@egen-civitas/esm-framework/mock');
  return {
    ...actual,
    getGlobalStore,
    useStore,
    MorphSelect,
    MorphSelectTrigger,
    MorphSelectValue,
    MorphSelectContent,
    MorphSelectItem,
    Combobox,
    showSnackbar: vi.fn(),
  };
}

export function resetTestStores() {
  stores.clear();
}
