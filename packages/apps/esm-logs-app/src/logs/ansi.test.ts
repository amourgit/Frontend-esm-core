import { describe, expect, it } from 'vitest';
import { parseAnsi, stripAnsi } from './ansi';

describe('parseAnsi', () => {
  it('texte simple', () => expect(parseAnsi('abc')).toEqual([{ text: 'abc' }]));

  it('couleurs, gras et reset', () => {
    const segments = parseAnsi('\u001b[1;31mKO\u001b[0m fin');
    expect(segments[0]).toMatchObject({ text: 'KO', bold: true, color: '#f87171' });
    expect(segments[1]).toEqual({ text: ' fin' });
  });

  it('couleurs 256 et RGB', () => {
    expect(parseAnsi('\u001b[38;5;2mx')[0].color).toBe('#4ade80');
    expect(parseAnsi('\u001b[38;2;1;2;3mx')[0].color).toBe('rgb(1,2,3)');
  });

  it('ignore les séquences non SGR', () => expect(stripAnsi('a\u001b[2Kb')).toBe('ab'));
});
