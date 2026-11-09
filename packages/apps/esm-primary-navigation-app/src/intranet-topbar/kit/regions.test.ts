import { describe, expect, it } from 'vitest';
import { isLevelId, parseRegionKey, regionKey, TOPBAR_SLOT } from './regions';

describe('contrat des régions', () => {
  it('un seul slot neutre, sans niveau ni région dans son nom', () => {
    expect(TOPBAR_SLOT).toBe('topbar-slot');
  });

  it('un niveau se nomme librement (minuscules, chiffres, tirets), sans numéro imposé', () => {
    for (const ok of ['main', 'promo-ete', 'agenda2', 'a']) expect(isLevelId(ok)).toBe(true);
    for (const ko of ['', 'Main', '2fast', 'a b', 'a:b', 'a/b', 42, undefined, 'x'.repeat(49)])
      expect(isLevelId(ko)).toBe(false);
  });

  it('clé de région : aller-retour <niveau>:<région>', () => {
    expect(regionKey('promo', 'right')).toBe('promo:right');
    expect(parseRegionKey('promo:right')).toEqual({ level: 'promo', region: 'right' });
    expect(parseRegionKey('promo:background')).toEqual({ level: 'promo', region: 'background' });
    expect(parseRegionKey('promo:milieu')).toBeNull();
    expect(parseRegionKey('l1-right')).toBeNull();
    expect(parseRegionKey(':right')).toBeNull();
  });
});
