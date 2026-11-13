import type { Mode } from './types';

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}
export type ColorScale = Record<'50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950', string>;
export const SCALE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const byte = (n: number) => Math.round(clamp(n, 0, 255));
const hex2 = (n: number) => byte(n).toString(16).padStart(2, '0');

function parseNumber(token: string, scale = 1): number {
  const t = token.trim();
  return t.endsWith('%') ? (parseFloat(t) / 100) * scale : parseFloat(t);
}

function parseAlpha(token?: string): number {
  if (token === undefined) return 1;
  return clamp(parseNumber(token, 1));
}

const srgbEncode = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

/** OKLCH → sRGB (matrices de Björn Ottosson). */
function oklchToRgb(L: number, C: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [srgbEncode(clamp(r)) * 255, srgbEncode(clamp(g)) * 255, srgbEncode(clamp(bl)) * 255];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hh = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

/** Lit hex, rgb(), hsl() et oklch() ; retourne `null` pour tout le reste (`var(...)`, noms, `transparent`...). */
export function parseColor(input: string): Rgba | null {
  const v = String(input ?? '').trim().toLowerCase();
  let m = v.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  m = v.match(/^(rgba?|hsla?|oklch)\(([^)]*)\)$/);
  if (!m) return null;
  const parts = m[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const alpha = parseAlpha(parts[3]);
  let rgb: [number, number, number];
  if (m[1].startsWith('rgb')) {
    rgb = [parseNumber(parts[0], 255), parseNumber(parts[1], 255), parseNumber(parts[2], 255)];
  } else if (m[1].startsWith('hsl')) {
    rgb = hslToRgb(parseFloat(parts[0]), clamp(parseNumber(parts[1], 1)), clamp(parseNumber(parts[2], 1)));
  } else {
    rgb = oklchToRgb(clamp(parseNumber(parts[0], 1)), parseNumber(parts[1], 0.4), parseFloat(parts[2]) || 0);
  }
  if (rgb.some((n) => Number.isNaN(n))) return null;
  return { r: byte(rgb[0]), g: byte(rgb[1]), b: byte(rgb[2]), a: alpha };
}

export const isColor = (v: string): boolean => parseColor(v) !== null;

/** Normalise en `#rrggbb` (ou `#rrggbbaa` si transparence). `null` si non convertible. */
export function toHex(input: string): string | null {
  const c = parseColor(input);
  if (!c) return null;
  const base = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
  return c.a < 1 ? `${base}${hex2(c.a * 255)}` : base;
}

const LIGHTER: Record<string, number> = { '50': 1, '100': 0.9, '200': 0.72, '300': 0.52, '400': 0.27 };
const DARKER: Record<string, number> = { '600': 0.18, '700': 0.38, '800': 0.58, '900': 0.75, '950': 0.9 };

/** Génère une échelle 50→950 à partir d'une couleur de référence (placée en 500). */
export function generateScale(base: string): ColorScale | null {
  const c = parseColor(base);
  if (!c) return null;
  const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
  const at = (L: number, sat: number) => {
    const [r, g, b] = hslToRgb(h, clamp(sat), clamp(L));
    return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  };
  const scale = {} as Record<string, string>;
  for (const step of SCALE_STEPS) {
    if (step === '500') scale[step] = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
    else if (LIGHTER[step] !== undefined) scale[step] = at(l + (0.97 - l) * LIGHTER[step], s * (1 - 0.15 * LIGHTER[step]));
    else scale[step] = at(l - (l - 0.12) * DARKER[step], s);
  }
  return scale as ColorScale;
}

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export function luminance(color: string): number {
  const c = parseColor(color);
  if (!c) return 0;
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** Ratio de contraste WCAG (1 → 21). `null` si une des couleurs n'est pas lisible. */
export function contrastRatio(a: string, b: string): number | null {
  if (!parseColor(a) || !parseColor(b)) return null;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Couleur de texte la plus lisible (#ffffff ou #000000) sur un fond donné. */
export function readableOn(background: string): string {
  return (contrastRatio('#ffffff', background) ?? 21) >= (contrastRatio('#000000', background) ?? 1) ? '#ffffff' : '#000000';
}

export type WcagLevel = 'AAA' | 'AA' | 'AA-large' | 'fail';
export function wcagLevel(ratio: number | null): WcagLevel {
  if (ratio === null) return 'fail';
  return ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA-large' : 'fail';
}

export const otherMode = (m: Mode): Mode => (m === 'light' ? 'dark' : 'light');
