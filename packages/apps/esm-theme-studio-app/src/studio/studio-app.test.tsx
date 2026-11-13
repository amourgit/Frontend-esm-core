import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createThemeLibrary, memoryStorage } from '../core/library';
import { createEsmThemeRuntime, type EsmThemeApi } from '../core/runtime';
import { createStudioStore } from '../core/store';
import { getIn } from '../core/path';
import { StudioApp } from './studio-app';
import type { StudioServices } from './studio-context';

const doc = {
  priority: 1,
  meta: { name: 'Test' },
  colors: {
    primary: { '500': '#6366f1' },
    surface: { light: { background: '#ffffff', foreground: '#111111' }, dark: { background: '#000000', foreground: '#eeeeee' } },
  },
  borderRadius: { md: '0.75rem' },
  zIndex: { modal: 50 },
};

function setup() {
  const applied: unknown[][] = [];
  const api: EsmThemeApi = {
    flattenToCssVars: (d) => {
      const flat = { base: {} as Record<string, string>, light: {} as Record<string, string>, dark: {} as Record<string, string> };
      flat.base['--border-radius-md'] = String(getIn(d, ['borderRadius', 'md']));
      flat.light['--colors-surface-background'] = String(getIn(d, ['colors', 'surface', 'light', 'background']));
      flat.dark['--colors-surface-background'] = String(getIn(d, ['colors', 'surface', 'dark', 'background']));
      flat.base['--colors-primary-500'] = String(getIn(d, ['colors', 'primary', '500']));
      return flat;
    },
    applyGlobalThemeOverride: (s, o) => void applied.push(['apply', s, o]),
    removeGlobalThemeOverride: (id) => void applied.push(['remove', id]),
    getThemeState: () => ({ mode: 'light', activeTheme: { schema: doc } }),
    setThemeMode: () => undefined,
  };
  const services: StudioServices = { store: createStudioStore(doc), runtime: createEsmThemeRuntime(api), library: createThemeLibrary(memoryStorage()), applyPriority: 100 };
  render(<StudioApp services={services} />);
  return { services, applied };
}

afterEach(cleanup);

describe('Theme Studio (UI)', () => {
  it('affiche la prévisualisation avec les variables du thème édité', () => {
    const { services } = setup();
    const preview = screen.getByTestId('preview');
    expect(preview.style.getPropertyValue('--colors-surface-background')).toBe('#ffffff');
    act(() => services.store.setMode('dark'));
    expect(screen.getByTestId('preview').style.getPropertyValue('--colors-surface-background')).toBe('#000000');
  });

  it('modifier la couleur primaire met à jour le thème et la preview immédiatement', () => {
    const { services } = setup();
    const row = screen.getByTestId('control-colors.primary.500');
    fireEvent.change(within(row).getByLabelText('Primary 500 (valeur)'), { target: { value: '#ff6600' } });
    expect(getIn(services.store.getState().doc, ['colors', 'primary', '500'])).toBe('#ff6600');
    expect(screen.getByTestId('preview').style.getPropertyValue('--colors-primary-500')).toBe('#ff6600');
  });

  it('Simple masque composants et expert ; Avancé affiche les composants ; Expert le JSON', () => {
    setup();
    expect(screen.queryByText('Composants')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Avancé' }));
    expect(screen.getByText('Composants')).toBeTruthy();
    expect(screen.queryByLabelText('JSON du thème')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expert' }));
    expect(screen.getByLabelText('JSON du thème')).toBeTruthy();
  });

  it('personnalise une variante de bouton et son état, sans toucher aux autres', () => {
    const { services } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Expert' }));
    fireEvent.click(screen.getByRole('button', { name: 'Button' }));
    fireEvent.change(screen.getByLabelText('Variante'), { target: { value: 'destructive' } });
    fireEvent.change(screen.getByLabelText('État'), { target: { value: 'hover' } });
    const row = screen.getByTestId('control-components.button.destructive.hover.radius');
    fireEvent.change(within(row).getByRole('textbox', { name: 'Rayon' }), { target: { value: '0px' } });
    const d = services.store.getState().doc;
    expect(getIn(d, ['components', 'button', 'destructive', 'hover', 'radius'])).toBe('0px');
    expect(getIn(d, ['components', 'button', 'primary'])).toBeUndefined();
  });

  it('undo / redo et état « modifié »', () => {
    const { services } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'borderRadius' }));
    expect(within(screen.getByRole('toolbar')).getByRole('button', { name: 'Annuler' })).toHaveProperty('disabled', true);
    fireEvent.change(within(screen.getByTestId('control-borderRadius.md')).getByRole('textbox', { name: 'Md' }), { target: { value: '2rem' } });
    expect(services.store.isDirty()).toBe(true);
    expect(screen.getByText(/modifié/)).toBeTruthy();
    fireEvent.click(within(screen.getByRole('toolbar')).getByRole('button', { name: 'Annuler' }));
    expect(getIn(services.store.getState().doc, ['borderRadius', 'md'])).toBe('0.75rem');
    fireEvent.click(within(screen.getByRole('toolbar')).getByRole('button', { name: 'Rétablir' }));
    expect(getIn(services.store.getState().doc, ['borderRadius', 'md'])).toBe('2rem');
  });

  it('Appliquer / Rétablir pilotent le runtime', () => {
    const { applied } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
    expect(applied[0]).toMatchObject(['apply', expect.anything(), { id: 'theme-studio', priority: 100 }]);
    fireEvent.click(screen.getByRole('button', { name: 'Rétablir l’environnement' }));
    expect(applied[1]).toEqual(['remove', 'theme-studio']);
  });

  it('enregistre dans la bibliothèque', () => {
    const { services } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(services.library.list().map((t) => t.name)).toEqual(['Test']);
    expect(screen.getByRole('status').textContent).toContain('enregistré');
  });

  it('importe un fichier CSS TweakCN', async () => {
    const { services } = setup();
    const file = new File([':root{--primary:#00aa00;--background:#fafafa}.dark{--background:#101010}'], 'ocean.css', { type: 'text/css' });
    await act(async () => {
      fireEvent.change(screen.getByTestId('import-input'), { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(getIn(services.store.getState().doc, ['colors', 'primary', '500'])).toBe('#00aa00');
    expect(getIn(services.store.getState().doc, ['zIndex', 'modal'])).toBe(50); // la richesse EGEN est conservée
  });
});
