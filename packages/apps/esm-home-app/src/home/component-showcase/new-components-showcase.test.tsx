import path from 'node:path';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AssistantShowcase, SelectionsShowcase } from './new-components-showcase.component';

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
// (selections + assistant : react / motion uniquement) ; le reste passe par le mock du framework.
vi.mock('@egen-civitas/esm-framework', async () => {
  const dist = path.resolve(process.cwd(), '../../../node_modules/@egen-civitas/esm-styleguide/dist');
  const [selections, assistant] = await Promise.all([
    import(/* @vite-ignore */ `${dist}/selections/index.js`),
    import(/* @vite-ignore */ `${dist}/assistant/index.js`),
  ]);
  return {
    ...selections,
    ...assistant,
    // Composants WebGL / iframe / audio : non exécutables sous happy-dom, remplacés par des balises.
    LiveOrb: () => <div data-testid="live-orb" />,
    SplineScene: () => <div data-testid="spline-scene" />,
    RecursiveErosionBackground: () => <div data-testid="erosion" />,
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

  it('rend la section assistant et charge la scène Spline à la demande', () => {
    render(<AssistantShowcase />);
    expect(screen.getAllByTestId('live-orb')).toHaveLength(6);
    expect(screen.queryByTestId('spline-scene')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Charger la scène 3D' }));
    expect(screen.getByTestId('spline-scene')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ASSISTANT_MODES' })).toBeInTheDocument();
  });
});
