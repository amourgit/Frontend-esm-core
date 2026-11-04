import { describe, expect, it } from 'vitest';
import { computeLevels } from './levels';

describe('computeLevels', () => {
  it('par défaut : 2 niveaux, même sans contenu déclaré', () => {
    expect(computeLevels(undefined, []).levels).toEqual([1, 2]);
  });

  it('TopBar à une rangée : min = max = 1', () => {
    const r = computeLevels({ min: 1, max: 1, disabled: [] }, [1, 2, 3]);
    expect(r.levels).toEqual([1]);
    expect(r.resolve(3)).toBe(1);
    expect(r.sourcesOf(1)).toEqual([1, 2, 3]);
  });

  it('un contenu au niveau 5 crée 5 niveaux, intermédiaires vides compris', () => {
    expect(computeLevels({ min: 1, max: 8, disabled: [] }, [5]).levels).toEqual([1, 2, 3, 4, 5]);
  });

  it('un niveau désactivé est sauté et son contenu va au niveau inférieur le plus proche', () => {
    const r = computeLevels({ min: 1, max: 8, disabled: [2] }, [2, 3]);
    expect(r.levels).toEqual([1, 3]);
    expect(r.resolve(2)).toBe(1);
    expect(r.sourcesOf(1)).toEqual([1, 2]);
    expect(r.sourcesOf(3)).toEqual([3]);
  });

  it('le niveau 1 ne peut pas être désactivé ; le plafond max est respecté', () => {
    const r = computeLevels({ min: 1, max: 3, disabled: [1] }, [9]);
    expect(r.levels).toEqual([1, 2, 3]);
    expect(r.resolve(9)).toBe(3);
  });

  it('une app active peut imposer un minimum et masquer des niveaux', () => {
    const r = computeLevels({ min: 1, max: 8, disabled: [] }, [], { min: 4, hide: [3] });
    expect(r.levels).toEqual([1, 2, 4]);
  });
});
