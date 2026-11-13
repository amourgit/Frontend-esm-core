import { describe, expect, it } from 'vitest';
import { buildCatalog } from './core/catalog';
import { controlsForPage } from './page-controls';
import { APP_ROUTE, DEFAULT_PAGE, PAGES, pageFromPath, routeOf, segmentFromPath } from './pages';
import routes from './routes.json';

type Ext = { name: string; slot: string; component: string; meta?: Record<string, unknown> };
const exts = (routes as { extensions: Ext[] }).extensions;
const navEntries = exts.filter((e) => e.slot === 'topbar-nav-slot');

describe('pages ↔ routes.json (rails, TopBar, zones)', () => {
  it('une seule page principale, sur la route de l’app', () => {
    expect((routes as { pages: { route: string }[] }).pages.map((p) => p.route)).toEqual([APP_ROUTE]);
  });

  it('chaque page d’édition a exactement une entrée de navigation cohérente', () => {
    expect(navEntries).toHaveLength(PAGES.length);
    for (const page of PAGES) {
      const entry = navEntries.find((e) => e.meta?.route === routeOf(page));
      expect(entry, page.id).toBeTruthy();
      expect(entry!.meta).toMatchObject({ section: APP_ROUTE, sectionRoute: APP_ROUTE, label: page.label, group: page.group, groupLabel: page.groupLabel, icon: page.icon, workspaces: ['intranet'] });
      expect(entry!.component).toBe('navEntry');
      expect(entry!.order).toBe(page.order);
    }
  });

  it('déclare l’option de rail gauche et la tuile du menu Applications, sans sidebar', () => {
    const rail = exts.find((e) => e.slot === 'shell-rail-left-slot')!;
    expect(rail.component).toBe('railPanel');
    expect(rail.meta).toMatchObject({ title: 'Theme Studio', icon: 'Palette' });
    expect(exts.some((e) => e.slot === 'app-menu-slot' && e.component === 'appMenuLink')).toBe(true);
    expect(exts.some((e) => /sidebar/i.test(e.slot))).toBe(false);
  });

  it('segments uniques ; aucune page « accueil » ni login', () => {
    expect(new Set(PAGES.map((p) => p.segment)).size).toBe(PAGES.length);
    expect(PAGES.some((p) => /accueil|home|login|connexion|pricing|tarif/i.test(`${p.id} ${p.segment} ${p.label}`))).toBe(false);
  });
});

describe('routage', () => {
  it('résout la page depuis l’URL (avec base SPA)', () => {
    expect(pageFromPath('/egen/theme-studio/couleurs').id).toBe('colors');
    expect(pageFromPath('/theme-studio').id).toBe('essentials');
    expect(pageFromPath('/theme-studio/inconnu')).toBe(DEFAULT_PAGE);
    expect(pageFromPath('/ailleurs')).toBe(DEFAULT_PAGE);
    expect(segmentFromPath('/ailleurs')).toBeNull();
  });
});

describe('contrôles par page', () => {
  const catalog = buildCatalog({
    colors: { primary: { '500': '#6366f1', '600': '#4f46e5' }, surface: { light: { background: '#fff' }, dark: { background: '#000' } } },
    typography: { fontFamily: { sans: ['Inter'] } },
    borderRadius: { md: '4px' },
    shadows: { md: '0 1px 2px red' },
    layout: { sidebarWidth: '16rem' },
    zIndex: { modal: 50 },
  });
  const page = (id: string) => PAGES.find((p) => p.id === id)!;

  it('Essentiels = niveau Simple uniquement', () => {
    const ids = controlsForPage(catalog, page('essentials'), 'expert').map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining(['colors.primary.500', 'borderRadius.md', 'typography.fontFamily.sans']));
    expect(ids).not.toContain('colors.primary.600');
  });
  it('Couleurs / Formes respectent le niveau', () => {
    expect(controlsForPage(catalog, page('colors'), 'advanced').map((d) => d.id)).not.toContain('colors.primary.600'); // expert
    expect(controlsForPage(catalog, page('colors'), 'expert').map((d) => d.id)).toContain('colors.primary.600');
    expect(controlsForPage(catalog, page('shapes'), 'advanced').map((d) => d.id)).toEqual(expect.arrayContaining(['borderRadius.md', 'shadows.md']));
  });
  it('Autres tokens = ce qu’aucune page ne couvre (Expert)', () => {
    expect(controlsForPage(catalog, page('rest'), 'expert').map((d) => d.id)).toEqual(['zIndex.modal']);
    expect(controlsForPage(catalog, page('rest'), 'advanced')).toEqual([]);
  });
  it('les pages non « categories » n’ont pas de contrôles génériques', () => {
    expect(controlsForPage(catalog, page('components'), 'expert')).toEqual([]);
  });
});
