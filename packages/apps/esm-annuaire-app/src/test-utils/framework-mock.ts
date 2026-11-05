import React from 'react';
import { vi } from 'vitest';

// Le vrai `CardModal` (portail + animation) importe tout le barrel d'icônes du styleguide, non chargeable
// sous Node/happy-dom : on le remplace par un stub qui rend simplement ses enfants quand `open` est vrai.
interface CardModalStubProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function CardModalStub({ open, onOpenChange, children }: CardModalStubProps) {
  if (!open) return null;
  return React.createElement(
    'div',
    { role: 'dialog', 'aria-modal': 'true' },
    React.createElement('button', { type: 'button', 'aria-label': 'Fermer', onClick: () => onOpenChange?.(false) }),
    children,
  );
}

// Mock du framework pour les tests de rendu : on garde les VRAIS composants du
// styleguide utilisés par l'app (FilterBar, système de fond de page) et on ne
// remplace que ce qui touche à l'audio / aux toasts. L'alias `@egen-test/styleguide-dist`
// est défini dans vitest.config.ts (résolu depuis node_modules).
export async function frameworkMock() {
  const dist = '@egen-test/styleguide-dist';
  const filters = await import(/* @vite-ignore */ `${dist}/filters/index.js`);
  const bg = await import(/* @vite-ignore */ `${dist}/page-background/index.js`);
  // `useConfig` / `getGlobalStore` : fonctions simples (pas vi.fn, `mockReset` les viderait). Valeurs par défaut du
  // schéma recopiées ici : importer `config-schema` créerait une boucle d'import (il importe le framework mocké).
  const defaults = {
    welcomeBanner: {
      enabled: true,
      durationSeconds: 10,
      message: 'Bienvenue à {name}, {role} : un nouveau collaborateur rejoint l’entreprise !',
      collaboratorName: '',
      collaboratorRole: '',
      background: '#dc2626',
      textColor: '#ffffff',
    },
  };
  const stores = new Map<string, { state: unknown; getState: () => unknown; setState: (u: unknown) => void }>();
  const getGlobalStore = (name: string, initial: unknown) => {
    if (!stores.has(name)) {
      const store = {
        state: initial,
        getState: () => store.state,
        setState: (u: unknown) => {
          store.state = typeof u === 'function' ? (u as (s: unknown) => unknown)(store.state) : u;
        },
      };
      stores.set(name, store);
    }
    return stores.get(name);
  };
  return {
    ...filters,
    ...bg,
    CardModal: CardModalStub,
    playXboxSound: vi.fn(),
    showToast: vi.fn(),
    useConfig: () => defaults,
    getGlobalStore,
    Type: { Boolean: 'Boolean', Number: 'Number', String: 'String' },
  };
}
