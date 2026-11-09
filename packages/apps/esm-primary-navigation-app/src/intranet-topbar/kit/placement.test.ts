import { describe, expect, it, vi } from 'vitest';
import {
  parsePlacementShorthand,
  readPlacement,
  resolveLevelEntries,
  type PlacedEntry,
  type TopBarPlacement,
} from './placement';

const warn = vi.fn();
const entry = (
  key: string,
  p: Partial<TopBarPlacement> = {},
  extra: Partial<PlacedEntry<string>> = {},
): PlacedEntry<string> => ({
  key,
  placement: { level: 'main', region: 'left', order: 0, ...p },
  payload: key,
  ...extra,
});
const keys = (list: PlacedEntry<string>[]) => list.map((e) => e.key);

describe('readPlacement', () => {
  it('lit une déclaration complète', () => {
    expect(readPlacement({ level: 'promo', rank: 4, region: 'center', order: 7, after: 'x' }, 0, 'e', warn)).toEqual({
      level: 'promo',
      rank: 4,
      region: 'center',
      order: 7,
      before: undefined,
      after: 'x',
    });
  });
  it('valeurs par défaut : région `left`, ordre de repli', () => {
    expect(readPlacement({ level: 'promo' }, 12, 'e', warn)).toMatchObject({
      region: 'left',
      order: 12,
      rank: undefined,
    });
  });
  it.each([
    [undefined],
    [null],
    ['main'],
    [{}],
    [{ level: 3 }],
    [{ level: 'Main' }],
    [{ level: 'ok', region: 'haut' }],
  ])('refuse %j avec un avertissement', (raw) => {
    const w = vi.fn();
    expect(readPlacement(raw, 0, 'e', w)).toBeNull();
    expect(w).toHaveBeenCalledTimes(1);
  });
  it('ignore un rang ou un ordre qui n’est pas un nombre fini', () => {
    expect(readPlacement({ level: 'a', rank: 'x', order: Infinity }, 3, 'e', warn)).toMatchObject({
      rank: undefined,
      order: 3,
    });
  });
});

describe('parsePlacementShorthand', () => {
  it('"<niveau>:<région>" ; le calque d’arrière-plan n’accueille pas d’éléments', () => {
    expect(parsePlacementShorthand('promo:right')).toEqual({ level: 'promo', region: 'right' });
    expect(parsePlacementShorthand('promo:background')).toBeNull();
    expect(parsePlacementShorthand('l1-right')).toBeNull();
    expect(parsePlacementShorthand(7)).toBeNull();
  });
});

describe('resolveLevelEntries', () => {
  it('répartit par région et trie par ordre, puis par nom', () => {
    const r = resolveLevelEntries([
      entry('b', { region: 'right', order: 1 }),
      entry('a', { region: 'right', order: 1 }),
      entry('c', { region: 'center' }),
    ]);
    expect(keys(r.right)).toEqual(['a', 'b']);
    expect(keys(r.center)).toEqual(['c']);
  });

  it('`group` (niveau d’origine) prime sur l’ordre : un niveau garde ses propres entrées devant celles qu’il accueille', () => {
    const r = resolveLevelEntries([
      entry('accueilli', { order: 0 }, { group: 1 }),
      entry('propre', { order: 50 }, { group: 0 }),
    ]);
    expect(keys(r.left)).toEqual(['propre', 'accueilli']);
  });

  it('suit les chaînes de références : c après b après a', () => {
    const r = resolveLevelEntries([
      entry('c', { after: 'b' }),
      entry('b', { after: 'a' }),
      entry('a', { region: 'right' }),
    ]);
    expect(keys(r.right)).toEqual(['a', 'b', 'c']);
    expect(r.left).toEqual([]);
  });

  it('plusieurs suiveurs d’une même référence : leur ordre propre les départage', () => {
    const r = resolveLevelEntries([
      entry('ref'),
      entry('s2', { after: 'ref', order: 2 }),
      entry('s1', { after: 'ref', order: 1 }),
      entry('av', { before: 'ref' }),
    ]);
    expect(keys(r.left)).toEqual(['av', 'ref', 's1', 's2']);
  });

  it('une référence à soi-même ou à une entrée absente est ignorée', () => {
    const r = resolveLevelEntries([
      entry('x', { after: 'x', region: 'right' }),
      entry('y', { before: 'absent', region: 'center' }),
    ]);
    expect(keys(r.right)).toEqual(['x']);
    expect(keys(r.center)).toEqual(['y']);
  });

  it('un cycle est ignoré avec un avertissement, sans perdre d’entrée', () => {
    const w = vi.fn();
    const r = resolveLevelEntries(
      [entry('a', { after: 'b', order: 1 }), entry('b', { after: 'a', order: 2 }), entry('c', { order: 3 })],
      w,
    );
    expect(keys(r.left)).toEqual(['a', 'b', 'c']);
    expect(w).toHaveBeenCalledTimes(1);
  });

  it('un suiveur dont la référence est dans le calque d’arrière-plan le rejoint', () => {
    const r = resolveLevelEntries([entry('fond', { region: 'background' }), entry('suit', { after: 'fond' })]);
    expect(keys(r.background)).toEqual(['fond', 'suit']);
  });
});
