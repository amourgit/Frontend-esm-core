/**
 * Découpe une ligne de terminal en segments stylés (séquences SGR : gras, couleurs 16/256/RGB).
 * Les autres séquences ANSI (curseur, effacement) sont ignorées.
 */
export interface AnsiSegment {
  text: string;
  color?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const BASE = ['#6b7280', '#f87171', '#4ade80', '#facc15', '#60a5fa', '#c084fc', '#22d3ee', '#e5e7eb'];
const BRIGHT = ['#9ca3af', '#fca5a5', '#86efac', '#fde047', '#93c5fd', '#d8b4fe', '#67e8f9', '#ffffff'];

function color256(n: number): string | undefined {
  if (n < 0 || n > 255) return undefined;
  if (n < 8) return BASE[n];
  if (n < 16) return BRIGHT[n - 8];
  if (n >= 232) {
    const v = 8 + (n - 232) * 10;
    return `rgb(${v},${v},${v})`;
  }
  const i = n - 16;
  const level = (c: number) => (c === 0 ? 0 : 55 + c * 40);
  return `rgb(${level(Math.floor(i / 36))},${level(Math.floor(i / 6) % 6)},${level(i % 6)})`;
}

// eslint-disable-next-line no-control-regex
const SEQUENCE = /\u001b\[([0-9;]*)([A-Za-z])/g;

export function parseAnsi(input: string): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  let style: Omit<AnsiSegment, 'text'> = {};
  let last = 0;

  const push = (text: string) => {
    if (text) segments.push({ text, ...style });
  };

  for (const match of input.matchAll(SEQUENCE)) {
    push(input.slice(last, match.index));
    last = (match.index ?? 0) + match[0].length;
    if (match[2] !== 'm') continue;

    const codes = match[1] === '' ? [0] : match[1].split(';').map((c) => Number(c) || 0);
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      if (code === 0) style = {};
      else if (code === 1) style = { ...style, bold: true };
      else if (code === 2) style = { ...style, dim: true };
      else if (code === 3) style = { ...style, italic: true };
      else if (code === 4) style = { ...style, underline: true };
      else if (code === 22) style = { ...style, bold: false, dim: false };
      else if (code === 23) style = { ...style, italic: false };
      else if (code === 24) style = { ...style, underline: false };
      else if (code >= 30 && code <= 37) style = { ...style, color: BASE[code - 30] };
      else if (code >= 90 && code <= 97) style = { ...style, color: BRIGHT[code - 90] };
      else if (code === 39) style = { ...style, color: undefined };
      else if (code === 38 && codes[i + 1] === 5) {
        style = { ...style, color: color256(codes[i + 2]) };
        i += 2;
      } else if (code === 38 && codes[i + 1] === 2) {
        style = { ...style, color: `rgb(${codes[i + 2] ?? 0},${codes[i + 3] ?? 0},${codes[i + 4] ?? 0})` };
        i += 4;
      }
    }
  }
  push(input.slice(last));
  return segments;
}

/** Texte brut d'une ligne (séquences ANSI retirées) : recherche, copie, export. */
export function stripAnsi(input: string): string {
  return input.replace(SEQUENCE, '');
}
