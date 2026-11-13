import { describe, expect, it } from 'vitest';
import { buildCatalog, buildComponentControls, buildGlobalControls, controlsAt, readControl, resolveTemplate, toTemplate } from './catalog';

const doc = {
  priority: 1,
  meta: { name: 'x' },
  colors: {
    primary: { '500': '#6366f1', '600': '#4f46e5' },
    surface: { light: { background: '#fff', foreground: '#000' }, dark: { background: '#000', foreground: '#fff' } },
  },
  typography: { fontFamily: { sans: ['Poppins', 'sans-serif'] } },
  borderRadius: { md: '0.75rem' },
  zIndex: { modal: 50 },
  panel: { light: { card: { backdropFilter: 'blur(8px)' } }, dark: { card: { backdropFilter: 'blur(4px)' } } },
};

describe('catalogue global', () => {
  const globals = buildGlobalControls(doc);
  const byId = (id: string) => globals.find((c) => c.id === id)!;

  it('ignore priority/meta et fusionne light/dark en un seul contrôle', () => {
    expect(globals.some((c) => c.category === 'meta' || c.category === 'priority')).toBe(false);
    expect(byId('colors.surface.{mode}.background').modeStyle).toBe('branch');
    expect(globals.filter((c) => c.id.startsWith('colors.surface')).length).toBe(2);
  });

  it('infère les types de contrôle', () => {
    expect(byId('colors.primary.500').kind).toBe('scale');
    expect(byId('colors.primary.600').kind).toBe('color');
    expect(byId('typography.fontFamily.sans').kind).toBe('font');
    expect(byId('borderRadius.md').kind).toBe('length');
    expect(byId('zIndex.modal').kind).toBe('number');
  });

  it('répartit Simple / Avancé / Expert', () => {
    expect(byId('colors.primary.500').level).toBe('simple');
    expect(byId('colors.primary.600').level).toBe('expert');
    expect(byId('colors.surface.{mode}.background').level).toBe('simple');
    expect(byId('panel.{mode}.card.backdropFilter').level).toBe('expert');
  });

  it('lit la valeur selon le mode et joint les tableaux', () => {
    expect(readControl(doc, byId('colors.surface.{mode}.background'), 'dark')).toBe('#000');
    expect(readControl(doc, byId('typography.fontFamily.sans'), 'light')).toBe('Poppins, sans-serif');
  });
});

describe('catalogue composants', () => {
  const comps = buildComponentControls();
  it('couvre composant × variante × état × propriété', () => {
    const btn = comps.filter((c) => c.component?.id === 'button');
    expect(btn.some((c) => c.id === 'components.button.ghost.hover.foreground')).toBe(true);
    expect(new Set(comps.map((c) => c.id)).size).toBe(comps.length);
  });
  it('état default = avancé, autres états = expert', () => {
    expect(comps.find((c) => c.id === 'components.button.primary.default.radius')!.level).toBe('advanced');
    expect(comps.find((c) => c.id === 'components.button.primary.hover.radius')!.level).toBe('expert');
  });
  it('le niveau simple ne contient aucun composant', () => {
    expect(controlsAt(buildCatalog(doc), 'simple').some((c) => c.category === 'components')).toBe(false);
    expect(controlsAt(buildCatalog(doc), 'expert').length).toBeGreaterThan(controlsAt(buildCatalog(doc), 'advanced').length);
  });
});

describe('gabarits', () => {
  it('toTemplate / resolveTemplate sont inverses', () => {
    const t = toTemplate(['panel', 'dark', 'card', 'background']);
    expect(t.template).toEqual(['panel', '{mode}', 'card', 'background']);
    expect(resolveTemplate(t.template, 'light')).toEqual(['panel', 'light', 'card', 'background']);
  });
});
