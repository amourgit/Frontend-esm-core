import { describe, expect, it } from 'vitest';
import routes from './routes.json';

describe('routes.json', () => {
  it.each([
    ['fullscreen-toggle', 'fullscreenToggle', 60],
    ['theme-toggle', 'themeToggle', 70],
  ])("%s : extension du slot neutre de la TopBar, à sa place historique (région droite, ordre %i)", (name, component, order) => {
    const ext = routes.extensions.find((e) => e.name === name);
    expect(ext).toEqual(
      expect.objectContaining({
        slot: 'topbar-slot',
        component,
        meta: { global: true, topbar: { level: 'main', rank: 10, region: 'right', order } },
      }),
    );
  });
});
