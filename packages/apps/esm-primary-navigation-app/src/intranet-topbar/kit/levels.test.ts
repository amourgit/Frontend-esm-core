import { describe, expect, it } from 'vitest';
import { computeLevels, orderLevels } from './levels';

const decl = (...ids: string[]) => ids.map((id) => ({ id }));

describe('computeLevels', () => {
  it('sans niveau déclaré ni gardé : aucune rangée', () => {
    const r = computeLevels(undefined, []);
    expect(r.levels).toEqual([]);
    expect(r.resolve('nimporte')).toBeNull();
  });

  it('un niveau déclaré par plusieurs apps n’existe qu’une fois, avec le plus petit rang', () => {
    const r = computeLevels(undefined, [
      { id: 'a', rank: 30 },
      { id: 'a', rank: 10 },
      { id: 'a' },
      { id: 'b', rank: 20 },
    ]);
    expect(r.levels).toEqual(['a', 'b']);
  });

  it('ordre : épinglés (`order`), puis classés par rang, puis sans rang par nom', () => {
    const ranks = new Map<string, number | undefined>([
      ['r2', 2],
      ['r1', 1],
      ['zz', undefined],
      ['aa', undefined],
      ['p', 99],
    ]);
    expect(orderLevels(ranks.keys(), ranks, ['p'])).toEqual(['p', 'r1', 'r2', 'aa', 'zz']);
  });

  it('une valeur de config invalide retombe sur les défauts', () => {
    const r = computeLevels({ order: 'x' as never, hidden: [1, 'a'] as never, max: NaN }, decl('a', 'b'));
    expect(r.levels).toEqual(['a', 'b']);
  });

  it('le premier niveau de la pile n’est jamais masqué', () => {
    const r = computeLevels({ hidden: ['a', 'b'] }, [
      { id: 'a', rank: 1 },
      { id: 'b', rank: 2 },
    ]);
    expect(r.levels).toEqual(['a']);
    expect(r.resolve('b')).toBe('a');
  });

  it('le contenu d’un niveau non rendu va au niveau rendu précédent, sinon au premier', () => {
    const r = computeLevels({ hidden: ['b', 'c'] }, [
      { id: 'a', rank: 1 },
      { id: 'b', rank: 2 },
      { id: 'c', rank: 3 },
      { id: 'd', rank: 4 },
    ]);
    expect(r.levels).toEqual(['a', 'd']);
    expect(r.resolve('b')).toBe('a');
    expect(r.resolve('c')).toBe('a');
    expect(r.sourcesOf('a')).toEqual(['a', 'b', 'c']);
    expect(r.sourcesOf('d')).toEqual(['d']);
  });

  it('`max` est plafonné par le garde-fou absolu et vaut au moins 1', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: `n${String(i).padStart(2, '0')}`, rank: i }));
    expect(computeLevels({ max: 99 }, many).levels).toHaveLength(12);
    expect(computeLevels({ max: 0 }, many).levels).toHaveLength(1);
  });

  it('`keep` (config ou app active) ajoute des niveaux vides ; `hide` d’une app active masque', () => {
    const r = computeLevels(
      { keep: ['reserve'] },
      [
        { id: 'a', rank: 1 },
        { id: 'b', rank: 2 },
      ],
      { keep: ['autre'], hide: ['b'] },
    );
    expect(r.levels).toEqual(['a', 'b'].filter((x) => x !== 'b').concat(['autre', 'reserve']));
  });
});
