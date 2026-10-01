import { describe, it, expect } from 'vitest';
import { DEFAULT_AUDIENCE, isAudienceFilter, matchesAudience, resolveAudience } from './audience';

describe('audiences', () => {
  it("applique l'audience interne par défaut", () => {
    expect(resolveAudience(undefined)).toBe(DEFAULT_AUDIENCE);
    expect(DEFAULT_AUDIENCE).toBe('interne');
  });

  it("'all' laisse tout passer, sinon filtre sur l'audience exacte", () => {
    const items = [
      { audience: 'interne' as const },
      { audience: 'extranet' as const },
      { audience: 'public' as const },
      {},
    ];
    expect(items.filter((i) => matchesAudience(i, 'all'))).toHaveLength(4);
    expect(items.filter((i) => matchesAudience(i, 'interne'))).toHaveLength(2); // + celui sans audience
    expect(items.filter((i) => matchesAudience(i, 'extranet'))).toHaveLength(1);
    expect(items.filter((i) => matchesAudience(i, 'public'))).toHaveLength(1);
  });

  it('valide les valeurs de filtre (config)', () => {
    expect(isAudienceFilter('public')).toBe(true);
    expect(isAudienceFilter('all')).toBe(true);
    expect(isAudienceFilter('inconnu')).toBe(false);
  });
});
