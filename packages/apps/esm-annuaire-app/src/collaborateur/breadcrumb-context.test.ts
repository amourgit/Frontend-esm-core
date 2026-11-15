import { describe, expect, it } from 'vitest';
import { tabTitleForPath } from './breadcrumb-context';

describe('tabTitleForPath', () => {
  it("donne le libellé de l'onglet, quelle que soit la forme de l'URL", () => {
    expect(tabTitleForPath('/annuaire/c9a1/wishlist')).toBe('Wishlist');
    expect(tabTitleForPath('/annuaire/c9a1/details/activity')).toBe('Activity');
    expect(tabTitleForPath('/annuaire/C9A1/Details')).toBe('Détails');
  });

  it("rien pour une page sans onglet (le fil n'invente pas de titre)", () => {
    expect(tabTitleForPath('/annuaire/contacts')).toBeNull();
  });
});
