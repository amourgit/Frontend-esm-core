import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createThemeLibrary, memoryStorage } from '../core/library';
import { createEsmThemeRuntime, type EsmThemeApi } from '../core/runtime';
import { createStudioStore } from '../core/store';
import { getIn } from '../core/path';
import { PAGES } from '../pages';
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
const page = (id: string) => PAGES.find((p) => p.id === id)!;

function setup(pageId = 'essentials') {
  const applied: unknown[][] = [];
  const api: EsmThemeApi = {
    flattenToCssVars: (d) => ({
      base: { '--border-radius-md': String(getIn(d, ['borderRadius', 'md'])), '--colors-primary-500': String(getIn(d, ['colors', 'primary', '500'])) },
      light: { '--colors-surface-background': String(getIn(d, ['colors', 'surface', 'light', 'background'])) },
      dark: { '--colors-surface-background': String(getIn(d, ['colors', 'surface', 'dark', 'background'])) },
    }),
    applyGlobalThemeOverride: (s, o) => void applied.push(['apply', s, o]),
    removeGlobalThemeOverride: (id) => void applied.push(['remove', id]),
    getThemeState: () => ({ mode: 'light', activeTheme: { schema: doc } }),
    setThemeMode: () => undefined,
  };
  const services: StudioServices = { store: createStudioStore(doc), runtime: createEsmThemeRuntime(api), library: createThemeLibrary(memoryStorage()), applyPriority: 100 };
  const view = render(<StudioApp services={services} page={page(pageId)} />);
  return { services, applied, rerender: (id: string) => view.rerender(<StudioApp services={services} page={page(id)} />) };
}
afterEach(cleanup);
const box = (name: string) => screen.getByRole('textbox', { name });

describe('Theme Studio — pages d’édition (Carbon)', () => {
  it('prévisualise avec les variables du thème édité, dans le mode choisi', () => {
    const { services } = setup();
    expect(screen.getByTestId('preview').style.getPropertyValue('--colors-surface-background')).toBe('#ffffff');
    expect(screen.getByTestId('preview').style.getPropertyValue('--cds-background')).toContain('var(--colors-surface-background');
    act(() => services.store.setMode('dark'));
    expect(screen.getByTestId('preview').style.getPropertyValue('--colors-surface-background')).toBe('#000000');
  });

  it('prévisualise avec de vrais composants Carbon', () => {
    setup();
    expect(screen.getByTestId('preview').querySelector('.cds--btn--primary')).toBeTruthy();
    expect(screen.getByTestId('preview').querySelector('.cds--tag')).toBeTruthy();
  });

  it('Essentiels : modifier la couleur principale met à jour thème et preview', () => {
    const { services } = setup();
    fireEvent.change(box('Primary 500'), { target: { value: '#ff6600' } });
    expect(getIn(services.store.getState().doc, ['colors', 'primary', '500'])).toBe('#ff6600');
    expect(screen.getByTestId('preview').style.getPropertyValue('--colors-primary-500')).toBe('#ff6600');
  });

  it('une page n’édite que ses catégories ; la navigation est celle du shell', () => {
    const { rerender } = setup('shapes');
    expect(screen.queryByRole('textbox', { name: 'Md' })).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: 'Primary 500' })).toBeNull();
    rerender('colors');
    expect(screen.queryByRole('textbox', { name: 'Primary 500' })).toBeTruthy();
    expect(screen.queryByRole('navigation')).toBeNull(); // aucune navigation propre au Studio
  });

  it('niveaux : Simple masque les composants, Avancé les ouvre, Expert montre le JSON', () => {
    const { services, rerender } = setup('components');
    expect(screen.getAllByText(/mode Avancé/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Passer en mode Avancé' }));
    expect(services.store.getState().level).toBe('advanced');
    expect(screen.getByLabelText('Composant')).toBeTruthy();
    rerender('json');
    expect(screen.getAllByText(/réservé au mode Expert/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Passer en mode Expert' }));
    expect(screen.getByLabelText('JSON du thème')).toBeTruthy();
  });

  it('Composants : personnalise variante + état sans toucher aux autres, et montre l’origine des valeurs', () => {
    const { services } = setup('components');
    act(() => services.store.setLevel('expert'));
    fireEvent.change(screen.getByLabelText('Variante'), { target: { value: 'destructive' } });
    fireEvent.change(screen.getByLabelText('État'), { target: { value: 'hover' } });
    fireEvent.change(box('Rayon'), { target: { value: '0px' } });
    const d = services.store.getState().doc;
    expect(getIn(d, ['components', 'button', 'destructive', 'hover', 'radius'])).toBe('0px');
    expect(getIn(d, ['components', 'button', 'primary'])).toBeUndefined();
    const table = screen.getByRole('table', { name: 'Valeurs résolues' });
    expect(within(table).getByText('destructive › hover › radius')).toBeTruthy();
  });

  it('annuler / rétablir et état « modifié »', () => {
    const { services } = setup('shapes');
    const bar = within(screen.getByRole('toolbar'));
    expect(bar.getByRole('button', { name: 'Annuler' })).toHaveProperty('disabled', true);
    fireEvent.change(box('Md'), { target: { value: '2rem' } });
    expect(services.store.isDirty()).toBe(true);
    expect(bar.getByText(/modifié/)).toBeTruthy();
    fireEvent.click(bar.getByRole('button', { name: 'Annuler' }));
    expect(getIn(services.store.getState().doc, ['borderRadius', 'md'])).toBe('0.75rem');
    fireEvent.click(bar.getByRole('button', { name: 'Rétablir' }));
    expect(getIn(services.store.getState().doc, ['borderRadius', 'md'])).toBe('2rem');
  });

  it('niveau et mode se changent depuis la barre d’actions', () => {
    const { services } = setup();
    const bar = within(screen.getByRole('toolbar'));
    fireEvent.click(bar.getByRole('tab', { name: 'Expert' }));
    expect(services.store.getState().level).toBe('expert');
    fireEvent.click(bar.getByRole('tab', { name: 'Sombre' }));
    expect(services.store.getState().mode).toBe('dark');
  });

  it('Appliquer / Rétablir délèguent au runtime', () => {
    const { applied } = setup();
    const bar = within(screen.getByRole('toolbar'));
    fireEvent.click(bar.getByRole('button', { name: 'Appliquer' }));
    expect(applied[0]).toMatchObject(['apply', expect.anything(), { id: 'theme-studio', priority: 100 }]);
    fireEvent.click(bar.getByRole('button', { name: 'Rétablir l’environnement' }));
    expect(applied[1]).toEqual(['remove', 'theme-studio']);
  });

  it('Mes thèmes : enregistre, liste, duplique, supprime', () => {
    const { services } = setup('library');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(services.library.list().map((t) => t.name)).toEqual(['Test']);
    expect(screen.getByTestId('studio-message').textContent).toContain('enregistré');
    fireEvent.click(screen.getByRole('button', { name: 'Dupliquer' }));
    expect(services.library.list()).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer' })[1]);
    expect(services.library.list()).toHaveLength(1);
  });

  it('Mes thèmes : importe du CSS TweakCN en conservant la richesse EGEN', async () => {
    const { services } = setup('library');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([':root{--primary:#00aa00;--background:#fafafa}.dark{--background:#101010}'], 'ocean.css', { type: 'text/css' });
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(getIn(services.store.getState().doc, ['colors', 'primary', '500'])).toBe('#00aa00');
    expect(getIn(services.store.getState().doc, ['zIndex', 'modal'])).toBe(50);
  });

  it('isole les erreurs de rendu (un thème cassé ne casse pas la page)', () => {
    const { services } = setup();
    const spy = console.error;
    console.error = () => undefined;
    try {
      act(() => services.store.load({ priority: 1, colors: 'cassé' } as never));
    } finally {
      console.error = spy;
    }
    expect(screen.getByTestId('theme-studio')).toBeTruthy();
  });
});
