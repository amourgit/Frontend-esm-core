import { describe, expect, it, vi } from 'vitest';
import { canUseStudio } from './access';

describe('canUseStudio', () => {
  it('est ouvert sans privilège configuré', () => {
    expect(canUseStudio('', undefined, vi.fn())).toBe(true);
  });
  it('refuse un utilisateur absent quand un privilège est requis', () => {
    expect(canUseStudio('Manage Themes', undefined, vi.fn())).toBe(false);
  });
  it('délègue la décision au framework', () => {
    const has = vi.fn().mockReturnValue(true);
    expect(canUseStudio('Manage Themes', { privileges: [] }, has)).toBe(true);
    expect(has).toHaveBeenCalledWith('Manage Themes', { privileges: [] });
    expect(canUseStudio('Manage Themes', { privileges: [] }, () => false)).toBe(false);
  });
});
