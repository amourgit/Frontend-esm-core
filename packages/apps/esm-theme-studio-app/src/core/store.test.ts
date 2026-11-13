import { describe, expect, it } from 'vitest';
import { buildCatalog } from './catalog';
import { getIn } from './path';
import { createStudioStore } from './store';

const doc = {
  priority: 1,
  meta: { name: 'Base' },
  colors: {
    primary: { '500': '#6366f1' },
    surface: { light: { background: '#ffffff' }, dark: { background: '#0f172a' } },
  },
  typography: { fontFamily: { sans: ['Poppins', 'sans-serif'] } },
  borderRadius: { md: '0.75rem' },
};
const catalog = buildCatalog(doc);
const def = (id: string) => catalog.find((c) => c.id === id)!;

describe('store d’édition', () => {
  it('modifie un token selon le mode courant', () => {
    const s = createStudioStore(doc);
    s.setMode('dark');
    s.setValue(def('colors.surface.{mode}.background'), '#111111');
    expect(getIn(s.getState().doc, ['colors', 'surface', 'dark', 'background'])).toBe('#111111');
    expect(getIn(s.getState().doc, ['colors', 'surface', 'light', 'background'])).toBe('#ffffff');
    expect(s.isDirty()).toBe(true);
    expect(s.changedPaths()).toEqual(['colors.surface.dark.background']);
  });

  it('conserve le format tableau des familles de polices', () => {
    const s = createStudioStore(doc);
    s.setValue(def('typography.fontFamily.sans'), 'Inter, system-ui');
    expect(getIn(s.getState().doc, ['typography', 'fontFamily', 'sans'])).toEqual(['Inter', 'system-ui']);
  });

  it('setScale régénère l’échelle et onPrimary', () => {
    const s = createStudioStore(doc);
    expect(s.setScale('primary', '#ff6600')).toBe(true);
    const c = s.getState().doc.colors as any;
    expect(c.primary['500']).toBe('#ff6600');
    expect(Object.keys(c.primary)).toHaveLength(11);
    expect(c.onPrimary).toMatch(/^#(ffffff|000000)$/);
    expect(s.setScale('primary', 'pas-une-couleur')).toBe(false);
  });

  it('undo / redo, avec coalescence des glissements de curseur', () => {
    let t = 0;
    const s = createStudioStore(doc, { now: () => t });
    const radius = def('borderRadius.md');
    s.setValue(radius, '1rem');
    t = 100;
    s.setValue(radius, '1.1rem');
    t = 200;
    s.setValue(radius, '1.2rem');
    expect(s.getState().canUndo).toBe(true);
    s.undo(); // une seule étape annule tout le glissement
    expect(getIn(s.getState().doc, ['borderRadius', 'md'])).toBe('0.75rem');
    expect(s.getState().canUndo).toBe(false);
    s.redo();
    expect(getIn(s.getState().doc, ['borderRadius', 'md'])).toBe('1.2rem');
    t = 5000;
    s.setValue(radius, '2rem');
    s.undo();
    expect(getIn(s.getState().doc, ['borderRadius', 'md'])).toBe('1.2rem');
  });

  it('un nouveau changement vide la pile redo', () => {
    let t = 0;
    const s = createStudioStore(doc, { now: () => (t += 2000) });
    s.setValue(def('borderRadius.md'), '1rem');
    s.undo();
    s.setValue(def('borderRadius.md'), '2rem');
    expect(s.getState().canRedo).toBe(false);
  });

  it('tokens de composant : valeur commune ou par mode, override par état', () => {
    const s = createStudioStore(doc);
    const radius = def('components.button.primary.default.radius');
    s.setValue(radius, '0px');
    expect(getIn(s.getState().doc, ['components', 'button', 'primary', 'default', 'radius'])).toBe('0px');

    const bg = def('components.button.primary.hover.background');
    s.setMode('dark');
    s.setValue(bg, '#222222', { perMode: true });
    expect(getIn(s.getState().doc, ['components', 'button', 'primary', 'hover', 'background'])).toEqual({ light: '#222222', dark: '#222222' });
    s.setMode('light');
    s.setValue(bg, '#eeeeee'); // déjà par mode → ne touche que le mode courant
    expect(getIn(s.getState().doc, ['components', 'button', 'primary', 'hover', 'background'])).toEqual({ light: '#eeeeee', dark: '#222222' });
  });

  it('resetValue restaure la base ou retire l’override', () => {
    const s = createStudioStore(doc);
    s.setValue(def('borderRadius.md'), '2rem');
    s.resetValue(def('borderRadius.md'));
    expect(getIn(s.getState().doc, ['borderRadius', 'md'])).toBe('0.75rem');
    const radius = def('components.card.default.default.radius');
    s.setValue(radius, '0');
    s.resetValue(radius);
    expect(getIn(s.getState().doc, ['components'])).toBeUndefined();
    expect(s.isDirty()).toBe(false);
  });

  it('load réinitialise historique et base ; markSaved efface l’état modifié ; notifie les abonnés', () => {
    const s = createStudioStore(doc);
    let calls = 0;
    const off = s.subscribe(() => calls++);
    s.setValue(def('borderRadius.md'), '2rem');
    s.markSaved();
    expect(s.isDirty()).toBe(false);
    s.load({ ...doc, meta: { name: 'Autre' } });
    expect(s.getState()).toMatchObject({ name: 'Autre', canUndo: false });
    off();
    const before = calls;
    s.setMode('dark');
    expect(calls).toBe(before);
  });
});

describe('load avec base distincte (reprise de brouillon)', () => {
  it('le brouillon repris reste « modifié » par rapport au thème de départ', () => {
    const s = createStudioStore(doc);
    s.load({ ...doc, borderRadius: { md: '2rem' } }, 'Brouillon', doc);
    expect(s.isDirty()).toBe(true);
    expect(s.changedPaths()).toEqual(['borderRadius.md']);
    expect(s.getState().name).toBe('Brouillon');
  });
});

describe('changements sans effet', () => {
  it('ne créent pas d’historique et ne vident pas « Rétablir »', () => {
    let t = 0;
    const s = createStudioStore(doc, { now: () => (t += 5000) });
    const radius = def('borderRadius.md');
    s.setValue(radius, '2rem');
    s.undo();
    expect(s.getState().canRedo).toBe(true);
    s.setValue(radius, '0.75rem'); // même valeur que l'actuelle
    expect(s.getState().canRedo).toBe(true);
    expect(s.getState().canUndo).toBe(false);
  });
});
