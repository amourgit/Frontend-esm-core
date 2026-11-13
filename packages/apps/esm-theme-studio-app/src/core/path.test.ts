import { describe, expect, it } from 'vitest';
import { diffPaths, getIn, hasIn, listLeaves, parsePathKey, pathKey, setIn, unsetIn } from './path';

describe('path', () => {
  const doc = { colors: { primary: { '500': '#111' } }, radius: '4px' };

  it('lit un chemin imbriqué et signale l’absence', () => {
    expect(getIn(doc, ['colors', 'primary', '500'])).toBe('#111');
    expect(getIn(doc, ['colors', 'nope', '500'])).toBeUndefined();
    expect(hasIn(doc, ['radius'])).toBe(true);
  });

  it('setIn est immutable et crée les nœuds manquants', () => {
    const next = setIn(doc, ['components', 'button', 'primary', 'default', 'radius'], '0px');
    expect(doc).not.toHaveProperty('components');
    expect(getIn(next, ['components', 'button', 'primary', 'default', 'radius'])).toBe('0px');
    expect(next.colors).toBe(doc.colors); // partage structurel
  });

  it('unsetIn élague les objets vides', () => {
    const a = setIn(doc, ['components', 'button', 'primary', 'default', 'radius'], '0px');
    expect(unsetIn(a, ['components', 'button', 'primary', 'default', 'radius'])).toEqual(doc);
  });

  it('listLeaves / diffPaths détectent ajout, modification et suppression', () => {
    expect(listLeaves(doc).map((l) => pathKey(l.path))).toEqual(['colors.primary.500', 'radius']);
    const changed = { colors: { primary: { '500': '#222' } }, extra: 1 };
    expect(diffPaths(doc, changed)).toEqual(['colors.primary.500', 'extra', 'radius']);
    expect(parsePathKey('a.b')).toEqual(['a', 'b']);
  });
});
