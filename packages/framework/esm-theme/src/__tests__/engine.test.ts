import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeEngine } from '../engine';

function mockFetchJson(themesByUrl: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const url = String(input).split('?')[0];
      const body = themesByUrl[url];
      if (!body) return { ok: false, status: 404 } as Response;
      return { ok: true, json: async () => body } as Response;
    }),
  );
}

const BASE_THEME = {
  priority: 1,
  meta: { name: 'Thème de test' },
  colors: { primary: { '500': '#6366f1' } },
  colors_extra: undefined,
  panel: {
    dark: { card: { background: 'rgba(15,23,42,0.65)' } },
    light: { card: { background: 'rgba(255,255,255,0.60)' } },
  },
};

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.head.innerHTML = '';
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ThemeEngine — résolution du mode clair/sombre', () => {
  it("applique le mode par défaut ('dark') si aucune préférence n'existe", async () => {
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine = new ThemeEngine({ themeUrls: ['/theme.json'] });
    await engine.apply();

    expect(engine.getMode()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('injecte bien les DEUX jeux de variables (light + dark) dans le DOM', async () => {
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine = new ThemeEngine({ themeUrls: ['/theme.json'] });
    await engine.apply();

    const css = document.getElementById('egen-theme-vars')?.textContent ?? '';
    expect(css).toContain("[data-theme='dark']");
    expect(css).toContain("[data-theme='light']");
    expect(css).toContain('--panel-card-background: rgba(15,23,42,0.65)');
    expect(css).toContain('--panel-card-background: rgba(255,255,255,0.60)');
  });

  it('setMode() change instantanément l’attribut data-theme SANS ré-injecter les variables', async () => {
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine = new ThemeEngine({ themeUrls: ['/theme.json'] });
    await engine.apply();

    const cssBefore = document.getElementById('egen-theme-vars')?.textContent;
    engine.setMode('light');

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(engine.getMode()).toBe('light');
    // Le contenu CSS ne doit pas changer : les deux modes étaient déjà injectés
    expect(document.getElementById('egen-theme-vars')?.textContent).toBe(cssBefore);
  });

  it('toggleMode() bascule entre les deux modes', async () => {
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine = new ThemeEngine({ themeUrls: ['/theme.json'] });
    await engine.apply();

    expect(engine.getMode()).toBe('dark');
    engine.toggleMode();
    expect(engine.getMode()).toBe('light');
    engine.toggleMode();
    expect(engine.getMode()).toBe('dark');
  });

  it('persiste le mode choisi en localStorage et le relit au prochain boot', async () => {
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine1 = new ThemeEngine({ themeUrls: ['/theme.json'] });
    await engine1.apply();
    engine1.setMode('light');
    engine1.destroy();

    const engine2 = new ThemeEngine({ themeUrls: ['/theme.json'] });
    expect(engine2.getMode()).toBe('light');
  });

  it('respecte un attribut data-theme déjà posé sur <html> (anti-FOUC) en priorité sur defaultMode', async () => {
    document.documentElement.setAttribute('data-theme', 'light');
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine = new ThemeEngine({ themeUrls: ['/theme.json'], defaultMode: 'dark' });
    expect(engine.getMode()).toBe('light');
  });
});

describe('ThemeEngine — surcharge de thème scopée par app, avec priorité', () => {
  it('injecte une surcharge dans une balise scopée à [data-egen-app="scope"]', async () => {
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine = new ThemeEngine({ themeUrls: ['/theme.json'] });
    await engine.apply();

    engine.applyAppOverride('mon-app', { colors: { primary: { '500': '#16a34a' } } });

    const css = document.getElementById('egen-theme-override-mon-app')?.textContent ?? '';
    expect(css).toContain("[data-egen-app='mon-app']");
    expect(css).toContain('--colors-primary-500: #16a34a');

    // La surcharge ne doit PAS toucher le thème global
    const globalCss = document.getElementById('egen-theme-vars')?.textContent ?? '';
    expect(globalCss).toContain('--colors-primary-500: #6366f1');
  });

  it('fusionne plusieurs surcharges du même scope par priorité croissante (pas de winner-take-all)', async () => {
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine = new ThemeEngine({ themeUrls: ['/theme.json'] });
    await engine.apply();

    // Surcharge tenant (priorité basse) : touche primary ET panel.card
    engine.applyAppOverride(
      'mon-app',
      { colors: { primary: { '500': '#16a34a' } }, panel: { dark: { card: { boxShadow: 'none' } } } },
      { id: 'tenant', priority: 5 },
    );
    // Préférence utilisateur (priorité haute) : ne touche QUE primary
    engine.applyAppOverride('mon-app', { colors: { primary: { '500': '#0ea5e9' } } }, { id: 'user-pref', priority: 10 });

    const css = document.getElementById('egen-theme-override-mon-app')?.textContent ?? '';

    // La priorité la plus haute gagne sur la clé en conflit...
    expect(css).toContain('--colors-primary-500: #0ea5e9');
    expect(css).not.toContain('#16a34a');
    // ...mais la clé non-conflictuelle de la surcharge basse priorité est conservée (fusion, pas écrasement total)
    expect(css).toContain('--panel-card-box-shadow: none');
  });

  it('removeAppOverride(scope, id) retire une seule surcharge et recalcule le reste', async () => {
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine = new ThemeEngine({ themeUrls: ['/theme.json'] });
    await engine.apply();

    engine.applyAppOverride('mon-app', { colors: { primary: { '500': '#16a34a' } } }, { id: 'tenant', priority: 5 });
    engine.applyAppOverride('mon-app', { colors: { primary: { '500': '#0ea5e9' } } }, { id: 'user-pref', priority: 10 });

    engine.removeAppOverride('mon-app', 'user-pref');

    const css = document.getElementById('egen-theme-override-mon-app')?.textContent ?? '';
    expect(css).toContain('--colors-primary-500: #16a34a');
  });

  it('removeAppOverride(scope) sans id retire tout le scope et supprime la balise', async () => {
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine = new ThemeEngine({ themeUrls: ['/theme.json'] });
    await engine.apply();

    engine.applyAppOverride('mon-app', { colors: { primary: { '500': '#16a34a' } } });
    expect(document.getElementById('egen-theme-override-mon-app')).not.toBeNull();

    engine.removeAppOverride('mon-app');
    expect(document.getElementById('egen-theme-override-mon-app')).toBeNull();
  });

  it('plusieurs scopes (plusieurs apps) coexistent indépendamment', async () => {
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine = new ThemeEngine({ themeUrls: ['/theme.json'] });
    await engine.apply();

    engine.applyAppOverride('app-a', { colors: { primary: { '500': '#16a34a' } } });
    engine.applyAppOverride('app-b', { colors: { primary: { '500': '#dc2626' } } });

    expect(document.getElementById('egen-theme-override-app-a')?.textContent).toContain('#16a34a');
    expect(document.getElementById('egen-theme-override-app-b')?.textContent).toContain('#dc2626');
  });

  it('re-applique automatiquement les surcharges actives après un hot-reload du thème global', async () => {
    mockFetchJson({ '/theme.json': BASE_THEME });
    const engine = new ThemeEngine({ themeUrls: ['/theme.json'] });
    await engine.apply();
    engine.applyAppOverride('mon-app', { colors: { primary: { '500': '#16a34a' } } });

    // Simule un rechargement complet du thème global (ex: hot-reload)
    await engine.apply();

    expect(document.getElementById('egen-theme-override-mon-app')?.textContent).toContain('#16a34a');
  });
});
