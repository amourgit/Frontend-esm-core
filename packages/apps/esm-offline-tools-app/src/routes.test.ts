import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import routes from './routes.json';

// Cohérence du montage : le contenu ne se monte que dans la zone principale et dans les rails/zones
// du shell (plus de sidebar propre à l'app), et chaque composant déclaré dans routes.json est exporté.
const indexSource = readFileSync(join(__dirname, 'index.ts'), 'utf8');
const exported = new Set([...indexSource.matchAll(/export const (\w+)/g)].map((m) => m[1]));

// Extensions héritées de l'ancien dossier patient, dont les slots n'existent pas dans ce dépôt.
const LEGACY_PATIENT_CHART = new Set(['offlineToolsPatientChartActions', 'offlineToolsPatientChartActionsDashboardLink']);

describe('esm-offline-tools-app — routes.json', () => {
  it('exporte tous les composants déclarés (hors héritage patient-chart)', () => {
    const declared = [
      ...routes.pages.map((p) => p.component),
      ...routes.extensions.map((e) => e.component),
      ...routes.modals.map((m) => m.component),
    ].filter((c) => !LEGACY_PATIENT_CHART.has(c));
    expect(declared.filter((c) => !exported.has(c))).toEqual([]);
  });

  it("ne monte plus de sidebar : aucun slot `nav-menu-slot` ni extension rattachée dynamiquement", () => {
    expect(routes.extensions.some((e) => e.name === 'offline-tools-nav-items')).toBe(false);
    expect(indexSource).not.toMatch(/nav-menu-slot|SideNav/);
  });

  it('déclare son option dans le rail gauche (non globale) avec ses sous-options en zone gauche', () => {
    const rail = routes.extensions.find((e) => e.slot === 'shell-rail-left-slot');
    expect(rail?.meta).toMatchObject({ title: expect.any(String) });
    expect((rail?.meta as { global?: boolean }).global).toBeUndefined();

    const subOptions = routes.extensions.filter((e) => e.slot === 'topbar-level2-nav');
    expect(subOptions.length).toBeGreaterThan(0);
    for (const e of subOptions) {
      expect(e.meta).toMatchObject({ section: 'offline-tools' });
      expect((e.meta as { route: string }).route.startsWith('offline-tools')).toBe(true);
    }
  });

  it('chaque sous-option « page » a sa page enregistrée sur offline-tools-page-slot', () => {
    const pages = routes.extensions
      .filter((e) => e.slot === 'offline-tools-page-slot')
      .map((e) => (e.meta as { name: string }).name);
    for (const e of routes.extensions.filter((x) => x.slot === 'topbar-level2-nav')) {
      const route = (e.meta as { route: string }).route;
      if (route === 'offline-tools') continue;
      expect(pages).toContain(route.replace('offline-tools/', ''));
    }
  });
});
