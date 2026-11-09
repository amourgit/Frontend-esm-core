import { describe, expect, it, vi } from 'vitest';
import { isContentRegion } from '../kit/regions';
import { DEFAULT_PLACEMENT, GLOBAL_ITEM_IDS, GLOBAL_LEVEL_RANKS, resolvePlacement } from './placement';

describe('placement des éléments globaux', () => {
  it("l'usine couvre chaque élément global, dans une région de contenu valide d'un niveau déclaré par cette app", () => {
    expect(Object.keys(DEFAULT_PLACEMENT).sort()).toEqual([...GLOBAL_ITEM_IDS].sort());
    for (const { region, level, rank } of Object.values(DEFAULT_PLACEMENT)) {
      expect(isContentRegion(region)).toBe(true);
      expect(rank).toBe(GLOBAL_LEVEL_RANKS[level]);
    }
  });

  it("la TopBar ne porte aucune identité d'entreprise : pas d'élément « brand » ni de logo (c'est l'app de branding)", () => {
    expect(GLOBAL_ITEM_IDS).not.toContain('brand');
    expect(GLOBAL_ITEM_IDS.filter((id) => /brand|logo/i.test(id))).toEqual([]);
    expect(DEFAULT_PLACEMENT['context-selectors']).toEqual({ level: 'main', rank: 10, region: 'left', order: 0 });
  });

  it('sans surcharge : placement d’usine', () => {
    expect(resolvePlacement(undefined)).toEqual(DEFAULT_PLACEMENT);
    expect(resolvePlacement({})).toEqual(DEFAULT_PLACEMENT);
  });

  it('une surcharge déplace un élément vers n’importe quel niveau (même inconnu), en gardant son ordre', () => {
    const p = resolvePlacement({ clock: 'agenda:right', nav: 'main:center' });
    expect(p.clock).toEqual({
      level: 'agenda',
      rank: undefined,
      region: 'right',
      order: DEFAULT_PLACEMENT.clock.order,
    });
    expect(p.nav).toMatchObject({ level: 'main', rank: GLOBAL_LEVEL_RANKS.main, region: 'center' });
    expect(p.theme).toEqual(DEFAULT_PLACEMENT.theme);
  });

  it('ignore (avec avertissement) un élément inconnu ou une valeur invalide, sans rien casser', () => {
    const warn = vi.fn();
    const p = resolvePlacement(
      {
        inconnu: 'main:left',
        clock: 'agenda:background',
        theme: 'milieu',
        search: 42,
        apps: 'l1-left',
        nav: 'navigation:left',
      },
      warn,
    );
    expect(warn).toHaveBeenCalledTimes(5);
    expect(p).toEqual({ ...DEFAULT_PLACEMENT, nav: { ...DEFAULT_PLACEMENT.nav, region: 'left' } });
  });
});
