import { describe, expect, it } from 'vitest';
import { LEGACY_SLOTS, regionId, regionOfSlot, slotNamesFor, topBarSlotName } from './regions';

describe('régions et slots', () => {
  it('le slot officiel d’une région est topbar-l<N>-<région>-slot, pour tout N', () => {
    expect(topBarSlotName(regionId(7, 'center'))).toBe('topbar-l7-center-slot');
    expect(regionOfSlot('topbar-l9-background-slot')).toBe('l9-background');
    expect(regionOfSlot('topbar-transient-slot')).toBeNull();
  });

  it('chaque slot historique reste rattaché à sa région et reste honoré', () => {
    for (const [region, slots] of Object.entries(LEGACY_SLOTS)) {
      for (const slot of slots) {
        expect(regionOfSlot(slot)).toBe(region);
        expect(slotNamesFor(region as `l${number}-left`)).toContain(slot);
      }
    }
    // contrat de compatibilité des apps déjà déployées
    expect(regionOfSlot('top-nav-level2-end-slot')).toBe('l2-right');
    expect(regionOfSlot('top-nav-app-slot')).toBe('l2-left');
    expect(regionOfSlot('top-nav-actions-slot')).toBe('l1-right');
  });

  it('le slot officiel passe toujours en premier', () => {
    expect(slotNamesFor('l1-right')[0]).toBe('topbar-l1-right-slot');
  });
});
