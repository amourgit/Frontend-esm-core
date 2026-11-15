import { describe, expect, it } from 'vitest';
import { contrastRatio, generateScale, parseColor, readableOn, SCALE_STEPS, toHex, wcagLevel } from './color';

describe('color', () => {
  it('lit hex, rgb, hsl', () => {
    expect(toHex('#fff')).toBe('#ffffff');
    expect(toHex('rgb(255, 0, 0)')).toBe('#ff0000');
    expect(toHex('hsl(120 100% 50%)')).toBe('#00ff00');
    expect(toHex('#ff000080')).toBe('#ff000080');
  });

  it('lit oklch (format TweakCN)', () => {
    expect(toHex('oklch(1 0 0)')).toBe('#ffffff');
    expect(toHex('oklch(0 0 0)')).toBe('#000000');
    const red = parseColor('oklch(0.628 0.2577 29.23)')!; // ≈ rouge sRGB
    expect(red.r).toBeGreaterThan(240);
    expect(red.g).toBeLessThan(30);
  });

  it('refuse ce qui n’est pas une couleur lisible', () => {
    expect(toHex('var(--x)')).toBeNull();
    expect(parseColor('transparent')).toBeNull();
    expect(parseColor('#12')).toBeNull();
  });

  it('génère une échelle 50→950 monotone avec la base en 500', () => {
    const s = generateScale('#6366f1')!;
    expect(Object.keys(s)).toEqual([...SCALE_STEPS]);
    expect(s['500']).toBe('#6366f1');
    const lum = SCALE_STEPS.map((k) => contrastRatio(s[k], '#000000')!);
    expect([...lum].sort((a, b) => b - a)).toEqual(lum);
  });

  it('calcule contraste et couleur lisible', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
    expect(readableOn('#111111')).toBe('#ffffff');
    expect(readableOn('#fafafa')).toBe('#000000');
    expect(wcagLevel(21)).toBe('AAA');
    expect(wcagLevel(4.6)).toBe('AA');
    expect(wcagLevel(3.1)).toBe('AA-large');
    expect(wcagLevel(null)).toBe('fail');
  });
});
