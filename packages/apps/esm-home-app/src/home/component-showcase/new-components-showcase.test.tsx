import path from 'node:path';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SoundsShowcase, SelectionsShowcase } from './new-components-showcase.component';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

// icons.js (tiré par selections) importe esm-react-utils, qui tire à son tour esm-offline →
// workbox-window (CJS). Seul RenderIfValueIsTruthy est utilisé : remplacé par un stub.
vi.mock('@egen-civitas/esm-react-utils', () => ({
  RenderIfValueIsTruthy: ({ value, children }: { value: unknown; children: React.ReactNode }) =>
    value ? <>{children}</> : null,
}));

// Le barrel du styleguide tire esm-offline → workbox-window (CJS, non chargeable sous vitest).
// On charge donc directement les modules réellement testés depuis le dist du styleguide
// (selections : react / motion uniquement) ; le reste passe par le mock du framework.
vi.mock('@egen-civitas/esm-framework', async () => {
  const dist = path.resolve(process.cwd(), '../../../node_modules/@egen-civitas/esm-styleguide/dist');
  const selections = await import(/* @vite-ignore */ `${dist}/selections/index.js`);
  return {
    ...selections,
    // Audio : non exécutable sous happy-dom, remplacé par des stubs.
    playXboxSound: () => undefined,
    toggleXboxAudio: () => true,
    isXboxAudioMuted: () => false,
  };
});

describe('vitrine des nouveaux composants', () => {
  it('rend les sélections (MorphSelect, Autocomplete, Combobox) avec toutes leurs variantes', () => {
    render(<SelectionsShowcase />);
    expect(screen.getByRole('heading', { name: 'MorphSelect' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Autocomplete' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Combobox' })).toBeInTheDocument();
    expect(screen.getByText('Recherche côté serveur (filterFn=false)')).toBeInTheDocument();
  });

  it("rend la section des sons d'interface et bascule le mode muet", () => {
    render(<SoundsShowcase />);
    expect(screen.getByRole('heading', { name: 'playXboxSound' })).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole('button', { name: /Son (actif|coupé)/ }));
    expect(screen.getByRole('button', { name: /Son coupé/ })).toBeInTheDocument();
  });
});
