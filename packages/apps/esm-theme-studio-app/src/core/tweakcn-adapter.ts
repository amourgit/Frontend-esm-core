// Frontière TweakCN ↔ EGEN. Le modèle TweakCN (variables shadcn) n'existe QUE ici : le Studio travaille sur le JSON EGEN.
// Inspiré de https://github.com/jnsahaj/tweakcn (Apache-2.0) — voir NOTICE-tweakcn.md.
import { generateScale, parseColor, readableOn, toHex } from './color';
import { getIn, mergeDeep, setIn } from './path';
import type { ThemeDoc } from './types';

export type TweakcnVars = Record<string, string>;
export interface TweakcnStyles {
  light: TweakcnVars;
  dark: TweakcnVars;
}

/** Variables TweakCN → chemin EGEN (sous `colors.surface.<mode>` ou `colors.border.<mode>`). */
const SURFACE_MAP: Record<string, string> = {
  background: 'background',
  foreground: 'foreground',
  card: 'card',
  'card-foreground': 'cardForeground',
  popover: 'popover',
  'popover-foreground': 'popoverForeground',
  muted: 'muted',
  'muted-foreground': 'mutedForeground',
  accent: 'accent',
  'accent-foreground': 'accentForeground',
  sidebar: 'sidebar',
  'sidebar-foreground': 'sidebarForeground',
  destructive: 'destructive',
  'destructive-foreground': 'destructiveForeground',
};
const BORDER_MAP: Record<string, string[]> = { border: ['default', 'divider'], input: ['input'], ring: ['ring', 'focus'] };
const FONT_MAP: Record<string, string[]> = { 'font-sans': ['sans', 'body', 'heading'], 'font-serif': ['serif'], 'font-mono': ['mono'] };

const splitFonts = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);

function toPx(value: string | undefined): number | null {
  if (!value) return null;
  const m = value.trim().match(/^(-?[\d.]+)(rem|px|em)?$/);
  if (!m) return null;
  return parseFloat(m[1]) * (m[2] === 'px' ? 1 : 16);
}
const rem = (px: number) => `${Math.max(0, Math.round((px / 16) * 1000) / 1000)}rem`;

function shadowFrom(v: TweakcnVars, scale: number): string | null {
  const color = parseColor(v['shadow-color'] ?? '');
  const opacity = parseFloat(v['shadow-opacity'] ?? '');
  const ox = toPx(v['shadow-offset-x']);
  const oy = toPx(v['shadow-offset-y']);
  const blur = toPx(v['shadow-blur']);
  const spread = toPx(v['shadow-spread']);
  if (!color || [opacity, ox, oy, blur, spread].some((n) => n === null || Number.isNaN(n as number))) return null;
  return `${ox! * scale}px ${oy! * scale}px ${blur! * scale}px ${spread!}px rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
}

/** TweakCN → fragment de thème EGEN (à fusionner dans un thème existant avec `applyTweakcn`). */
export function fromTweakcn(styles: TweakcnStyles): ThemeDoc {
  let doc: ThemeDoc = {};
  const { light, dark } = styles;

  for (const [family, key, on] of [
    ['primary', 'primary', 'onPrimary'],
    ['secondary', 'secondary', 'onSecondary'],
    ['error', 'destructive', ''],
  ] as const) {
    const hex = toHex(light[key] ?? '');
    const scale = hex ? generateScale(hex) : null;
    if (scale) doc = setIn(doc, ['colors', family], scale);
    const fg = toHex(light[`${key}-foreground`] ?? '');
    if (on && hex) doc = setIn(doc, ['colors', on], fg ?? readableOn(hex));
  }

  (['light', 'dark'] as const).forEach((mode) => {
    const vars = styles[mode];
    for (const [from, to] of Object.entries(SURFACE_MAP)) {
      if (vars[from]) doc = setIn(doc, ['colors', 'surface', mode, to], toHex(vars[from]) ?? vars[from]);
    }
    for (const [from, tos] of Object.entries(BORDER_MAP)) {
      if (vars[from]) tos.forEach((to) => (doc = setIn(doc, ['colors', 'border', mode, to], toHex(vars[from]) ?? vars[from])));
    }
  });

  for (let i = 1; i <= 5; i++) {
    const hex = toHex(light[`chart-${i}`] ?? '');
    if (hex) doc = setIn(doc, ['colors', 'chart', String(i)], hex);
  }

  for (const [from, tos] of Object.entries(FONT_MAP)) {
    if (light[from]) tos.forEach((to) => (doc = setIn(doc, ['typography', 'fontFamily', to], splitFonts(light[from]))));
  }
  if (light['letter-spacing']) doc = setIn(doc, ['typography', 'letterSpacing'], light['letter-spacing']);
  if (light.spacing) doc = setIn(doc, ['spacing', 'base'], light.spacing);

  const r = toPx(light.radius);
  if (r !== null) {
    doc = setIn(doc, ['borderRadius', 'sm'], rem(r - 4));
    doc = setIn(doc, ['borderRadius', 'md'], rem(r - 2));
    doc = setIn(doc, ['borderRadius', 'lg'], rem(r));
    doc = setIn(doc, ['borderRadius', 'xl'], rem(r + 4));
  }

  const md = shadowFrom(light, 1);
  if (md) {
    doc = setIn(doc, ['shadows', 'sm'], shadowFrom(light, 0.5)!);
    doc = setIn(doc, ['shadows', 'md'], md);
    doc = setIn(doc, ['shadows', 'lg'], shadowFrom(light, 2)!);
  }
  return doc;
}

/** Applique un thème TweakCN par-dessus un thème EGEN existant (ne touche pas à ce que TweakCN ne décrit pas). */
export const applyTweakcn = (base: ThemeDoc, styles: TweakcnStyles): ThemeDoc => mergeDeep(base, fromTweakcn(styles));

const str = (v: unknown): string | undefined => {
  if (Array.isArray(v)) return v.join(', ');
  return typeof v === 'string' ? v : undefined;
};

/** EGEN → variables TweakCN/shadcn (export d'interopérabilité ; les tokens EGEN sans équivalent sont ignorés). */
export function toTweakcn(doc: ThemeDoc): TweakcnStyles {
  const out: TweakcnStyles = { light: {}, dark: {} };
  (['light', 'dark'] as const).forEach((mode) => {
    const vars = out[mode];
    const put = (k: string, v: string | undefined) => {
      if (v !== undefined && v !== '') vars[k] = v;
    };
    for (const [to, from] of Object.entries(SURFACE_MAP)) put(to, str(getIn(doc, ['colors', 'surface', mode, from])));
    for (const [to, froms] of Object.entries(BORDER_MAP)) put(to, str(getIn(doc, ['colors', 'border', mode, froms[0]])));
    put('primary', str(getIn(doc, ['colors', 'primary', '500'])));
    put('primary-foreground', str(getIn(doc, ['colors', 'onPrimary'])));
    put('secondary', str(getIn(doc, ['colors', 'secondary', '500'])));
    put('secondary-foreground', str(getIn(doc, ['colors', 'onSecondary'])));
    for (let i = 1; i <= 5; i++) put(`chart-${i}`, str(getIn(doc, ['colors', 'chart', String(i)])));
    for (const [to, froms] of Object.entries(FONT_MAP)) put(to, str(getIn(doc, ['typography', 'fontFamily', froms[0]])));
    put('letter-spacing', str(getIn(doc, ['typography', 'letterSpacing'])));
    put('spacing', str(getIn(doc, ['spacing', 'base'])));
    put('radius', str(getIn(doc, ['borderRadius', 'lg'])));
  });
  return out;
}

export function exportTweakcnCss(doc: ThemeDoc): string {
  const { light, dark } = toTweakcn(doc);
  const block = (sel: string, vars: TweakcnVars) => `${sel} {\n${Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`).join('\n')}\n}`;
  return `${block(':root', light)}\n\n${block('.dark', dark)}\n`;
}

/** Découpe sur `;` hors parenthèses/guillemets. */
function splitDeclarations(body: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = '';
  let cur = '';
  for (const ch of body) {
    if (quote) {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ';' && depth === 0 && !quote) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/** Lit le CSS exporté par TweakCN / shadcn (`:root { --… }` + `.dark { --… }`). `null` si aucun bloc reconnu. */
export function parseTweakcnCss(css: string): TweakcnStyles | null {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const read = (selector: RegExp): TweakcnVars | null => {
    const m = clean.match(new RegExp(`(?:^|[}\\s])${selector.source}\\s*\\{([^}]*)\\}`));
    if (!m) return null;
    const vars: TweakcnVars = {};
    for (const decl of splitDeclarations(m[1])) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const name = decl.slice(0, i).trim();
      if (name.startsWith('--')) vars[name.slice(2)] = decl.slice(i + 1).trim();
    }
    return vars;
  };
  const light = read(/:root/);
  const dark = read(/\.dark/);
  if (!light && !dark) return null;
  return { light: light ?? dark!, dark: { ...(light ?? {}), ...(dark ?? {}) } };
}

/** Lit le « registry item » JSON de TweakCN (`cssVars: { theme, light, dark }`). */
export function parseTweakcnRegistry(json: unknown): TweakcnStyles | null {
  const cssVars = (json as { cssVars?: Record<string, TweakcnVars> } | null)?.cssVars;
  if (!cssVars || typeof cssVars !== 'object' || !cssVars.light) return null;
  return { light: { ...cssVars.theme, ...cssVars.light }, dark: { ...cssVars.theme, ...cssVars.light, ...cssVars.dark } };
}
