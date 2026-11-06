import { describe, expect, it, vi } from 'vitest';
import { parseRegionId } from '../kit/regions';
import { DEFAULT_PLACEMENT, GLOBAL_ITEM_IDS, isContentRegionId, resolvePlacement } from './placement';

describe('placement des éléments globaux', () => {
  it("l'usine couvre chaque élément global, dans une région de contenu valide", () => {
    expect(Object.keys(DEFAULT_PLACEMENT).sort()).toEqual([...GLOBAL_ITEM_IDS].sort());
    for (const { region } of Object.values(DEFAULT_PLACEMENT)) expect(isContentRegionId(region)).toBe(true);
  });

  it('sans surcharge : placement d’usine', () => {
    expect(resolvePlacement(undefined)).toEqual(DEFAULT_PLACEMENT);
    expect(resolvePlacement({})).toEqual(DEFAULT_PLACEMENT);
  });

  it('une surcharge déplace un élément vers n’importe quel niveau, en gardant son ordre', () => {
    const p = resolvePlacement({ clock: 'l4-right', nav: 'l1-center' });
    expect(p.clock).toEqual({ region: 'l4-right', order: DEFAULT_PLACEMENT.clock.order });
    expect(p.nav.region).toBe('l1-center');
    expect(p.user).toEqual(DEFAULT_PLACEMENT.user);
  });

  it('ignore (avec avertissement) un élément inconnu ou une région invalide, sans rien casser', () => {
    const warn = vi.fn();
    const p = resolvePlacement(
      { inconnu: 'l1-left', clock: 'l3-background', theme: 'milieu', user: 42, apps: 'l0-left', nav: 'l2-left' },
      warn,
    );
    expect(warn).toHaveBeenCalledTimes(5);
    expect(p).toEqual({ ...DEFAULT_PLACEMENT, nav: { ...DEFAULT_PLACEMENT.nav, region: 'l2-left' } });
  });

  it('`isContentRegionId` accepte tout niveau ≥ 1 et refuse le calque d’arrière-plan', () => {
    expect(isContentRegionId('l12-center')).toBe(true);
    expect(isContentRegionId('l1-background')).toBe(false);
    expect(parseRegionId('l3-right')).toEqual({ level: 3, region: 'right' });
  });
});
