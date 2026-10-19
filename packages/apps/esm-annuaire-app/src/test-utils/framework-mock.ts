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
  return { ...filters, ...bg, CardModal: CardModalStub, playXboxSound: vi.fn(), showToast: vi.fn() };
}
