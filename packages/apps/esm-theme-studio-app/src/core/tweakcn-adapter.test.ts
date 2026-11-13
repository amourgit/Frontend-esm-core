import { describe, expect, it } from 'vitest';
import { getIn } from './path';
import { applyTweakcn, exportTweakcnCss, fromTweakcn, parseTweakcnCss, parseTweakcnRegistry, toTweakcn } from './tweakcn-adapter';

const css = `
/* Thème exemple */
:root {
  --background: oklch(1 0 0);
  --foreground: #111111;
  --card: #ffffff;
  --primary: #ff6600;
  --primary-foreground: #ffffff;
  --secondary: hsl(210 40% 96%);
  --destructive: #dc2626;
  --border: #e5e7eb;
  --input: #e5e7eb;
  --ring: #ff6600;
  --font-sans: Inter, ui-sans-serif, system-ui;
  --font-mono: "Fira Code", monospace;
  --radius: 0.5rem;
  --shadow-color: #000000;
  --shadow-opacity: 0.1;
  --shadow-offset-x: 0px;
  --shadow-offset-y: 4px;
  --shadow-blur: 8px;
  --shadow-spread: 0px;
  --letter-spacing: 0em;
}
.dark {
  --background: #0b0b0b;
  --foreground: #f5f5f5;
  --card: #151515;
}
`;

describe('parseTweakcnCss', () => {
  const styles = parseTweakcnCss(css)!;
  it('lit :root et .dark ; dark hérite de light', () => {
    expect(styles.light.primary).toBe('#ff6600');
    expect(styles.dark.background).toBe('#0b0b0b');
    expect(styles.dark.primary).toBe('#ff6600');
    expect(styles.light['font-mono']).toBe('"Fira Code", monospace');
  });
  it('rejette un CSS sans bloc reconnu', () => {
    expect(parseTweakcnCss('body { color: red }')).toBeNull();
  });
});

describe('parseTweakcnRegistry', () => {
  it('fusionne theme + light + dark', () => {
    const s = parseTweakcnRegistry({ cssVars: { theme: { 'font-sans': 'Inter' }, light: { primary: '#111' }, dark: { primary: '#eee' } } })!;
    expect(s.light).toEqual({ 'font-sans': 'Inter', primary: '#111' });
    expect(s.dark.primary).toBe('#eee');
    expect(parseTweakcnRegistry({})).toBeNull();
  });
});

describe('fromTweakcn', () => {
  const doc = fromTweakcn(parseTweakcnCss(css)!);
  it('mappe couleurs, surfaces par mode et bordures', () => {
    expect(getIn(doc, ['colors', 'primary', '500'])).toBe('#ff6600');
    expect(Object.keys(getIn(doc, ['colors', 'primary']) as object)).toHaveLength(11);
    expect(getIn(doc, ['colors', 'onPrimary'])).toBe('#ffffff');
    expect(getIn(doc, ['colors', 'error', '500'])).toBe('#dc2626');
    expect(getIn(doc, ['colors', 'surface', 'light', 'background'])).toBe('#ffffff'); // oklch(1 0 0) converti
    expect(getIn(doc, ['colors', 'surface', 'dark', 'background'])).toBe('#0b0b0b');
    expect(getIn(doc, ['colors', 'border', 'light', 'divider'])).toBe('#e5e7eb');
    expect(getIn(doc, ['colors', 'border', 'dark', 'focus'])).toBe('#ff6600');
  });
  it('mappe polices, rayons et ombres', () => {
    expect(getIn(doc, ['typography', 'fontFamily', 'sans'])).toEqual(['Inter', 'ui-sans-serif', 'system-ui']);
    expect(getIn(doc, ['typography', 'fontFamily', 'heading'])).toEqual(['Inter', 'ui-sans-serif', 'system-ui']);
    expect(getIn(doc, ['borderRadius', 'lg'])).toBe('0.5rem');
    expect(getIn(doc, ['borderRadius', 'sm'])).toBe('0.25rem');
    expect(getIn(doc, ['shadows', 'md'])).toBe('0px 4px 8px 0px rgba(0, 0, 0, 0.1)');
    expect(getIn(doc, ['shadows', 'lg'])).toBe('0px 8px 16px 0px rgba(0, 0, 0, 0.1)');
  });
});

describe('applyTweakcn', () => {
  it('ne détruit pas la richesse du thème EGEN', () => {
    const base = { priority: 3, zIndex: { modal: 50 }, panel: { light: { card: { background: 'x' } } }, colors: { surface: { light: { header: '#abc' } } } };
    const merged = applyTweakcn(base, parseTweakcnCss(css)!);
    expect(merged.priority).toBe(3);
    expect(getIn(merged, ['zIndex', 'modal'])).toBe(50);
    expect(getIn(merged, ['panel', 'light', 'card', 'background'])).toBe('x');
    expect(getIn(merged, ['colors', 'surface', 'light', 'header'])).toBe('#abc');
    expect(getIn(merged, ['colors', 'surface', 'light', 'card'])).toBe('#ffffff');
  });
});

describe('export TweakCN', () => {
  it('aller-retour : EGEN → CSS → EGEN conserve couleurs et polices', () => {
    const egen = fromTweakcn(parseTweakcnCss(css)!);
    const exported = exportTweakcnCss(egen);
    expect(exported).toContain(':root {');
    expect(exported).toContain('.dark {');
    const again = fromTweakcn(parseTweakcnCss(exported)!);
    expect(getIn(again, ['colors', 'primary', '500'])).toBe(getIn(egen, ['colors', 'primary', '500']));
    expect(getIn(again, ['colors', 'surface', 'dark', 'card'])).toBe('#151515');
    expect(getIn(again, ['typography', 'fontFamily', 'sans'])).toEqual(getIn(egen, ['typography', 'fontFamily', 'sans']));
    expect(toTweakcn(egen).dark.background).toBe('#0b0b0b');
  });
});
