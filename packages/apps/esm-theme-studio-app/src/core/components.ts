import { getIn, isPlainObject } from './path';
import type { Mode, ThemeDoc, TokenPath } from './types';

/** États personnalisables (cahier des charges §8). */
export const STATES = ['default', 'hover', 'focus', 'active', 'disabled', 'selected', 'loading', 'readonly', 'error', 'success'] as const;
export type ComponentState = (typeof STATES)[number];

/** Variante « commune à toutes les variantes » d'un composant. */
export const BASE_VARIANT = 'base';

export type PropKind = 'color' | 'length' | 'shadow' | 'text' | 'number';
export interface PropSpec {
  id: string;
  label: string;
  kind: PropKind;
  /** Repli CSS (token global) quand rien n'est défini pour ce composant. */
  fallback: string;
}

export interface ComponentSpec {
  id: string;
  label: string;
  variants: string[];
  states: ComponentState[];
  props: PropSpec[];
  /** Replis spécifiques à une variante : `{ primary: { background: 'var(--colors-primary-500)' } }`. */
  variantFallbacks?: Record<string, Record<string, string>>;
}

const P = (id: string, label: string, kind: PropKind, fallback: string): PropSpec => ({ id, label, kind, fallback });

const colorProps = (bg: string, fg: string, border: string): PropSpec[] => [
  P('background', 'Fond', 'color', bg),
  P('foreground', 'Texte', 'color', fg),
  P('borderColor', 'Bordure', 'color', border),
];
const shape = (radius = 'var(--border-radius-md)'): PropSpec[] => [
  P('borderWidth', 'Épaisseur de bordure', 'length', '1px'),
  P('radius', 'Rayon', 'length', radius),
  P('shadow', 'Ombre', 'shadow', 'var(--shadows-none)'),
];
const box = (px: string, py: string): PropSpec[] => [P('paddingX', 'Marge interne X', 'length', px), P('paddingY', 'Marge interne Y', 'length', py)];

const INTERACTIVE: ComponentState[] = ['default', 'hover', 'focus', 'active', 'disabled'];
const SURFACE = (c: string, fg: string) => colorProps(`var(--colors-surface-${c})`, `var(--colors-surface-${fg})`, 'var(--colors-border-default)');

/** Registre des composants exposés par le Studio. Ajouter un composant EGEN ici l'expose dans l'éditeur ET la vitrine. */
export const COMPONENTS: ComponentSpec[] = [
  {
    id: 'button',
    label: 'Button',
    variants: ['primary', 'secondary', 'destructive', 'success', 'warning', 'outline', 'ghost', 'transparent'],
    states: [...INTERACTIVE, 'loading'],
    props: [...colorProps('var(--colors-primary-500)', 'var(--colors-on-primary)', 'transparent'), ...shape(), ...box('1rem', '0.5rem'), P('fontWeight', 'Graisse', 'text', 'var(--typography-font-weight-medium)')],
    variantFallbacks: {
      secondary: { background: 'var(--colors-secondary-500)', foreground: 'var(--colors-on-secondary)' },
      destructive: { background: 'var(--colors-error-600)', foreground: '#ffffff' },
      success: { background: 'var(--colors-success-600)', foreground: '#ffffff' },
      warning: { background: 'var(--colors-warning-500)', foreground: '#000000' },
      outline: { background: 'transparent', foreground: 'var(--colors-surface-foreground)', borderColor: 'var(--colors-border-default)' },
      ghost: { background: 'transparent', foreground: 'var(--colors-surface-foreground)' },
      transparent: { background: 'transparent', foreground: 'var(--colors-primary-500)' },
    },
  },
  { id: 'input', label: 'Input', variants: ['outline', 'filled', 'underline'], states: [...INTERACTIVE, 'readonly', 'error', 'success'], props: [...colorProps('var(--colors-surface-background)', 'var(--colors-surface-foreground)', 'var(--colors-border-input)'), ...shape(), ...box('0.75rem', '0.5rem')] },
  { id: 'select', label: 'Select', variants: ['outline', 'filled'], states: [...INTERACTIVE, 'error'], props: [...colorProps('var(--colors-surface-background)', 'var(--colors-surface-foreground)', 'var(--colors-border-input)'), ...shape(), ...box('0.75rem', '0.5rem')] },
  { id: 'checkbox', label: 'Checkbox', variants: [BASE_VARIANT], states: [...INTERACTIVE, 'selected', 'error'], props: [...colorProps('var(--colors-surface-background)', 'var(--colors-on-primary)', 'var(--colors-border-input)'), P('radius', 'Rayon', 'length', 'var(--border-radius-xs)'), P('size', 'Taille', 'length', '1rem')] },
  { id: 'radio', label: 'Radio', variants: [BASE_VARIANT], states: [...INTERACTIVE, 'selected', 'error'], props: [...colorProps('var(--colors-surface-background)', 'var(--colors-primary-500)', 'var(--colors-border-input)'), P('size', 'Taille', 'length', '1rem')] },
  { id: 'switch', label: 'Switch', variants: [BASE_VARIANT], states: [...INTERACTIVE, 'selected'], props: [...colorProps('var(--colors-neutral-300)', '#ffffff', 'transparent'), P('radius', 'Rayon', 'length', 'var(--border-radius-full)'), P('width', 'Largeur', 'length', '2.5rem')] },
  { id: 'card', label: 'Card', variants: ['default', 'elevated', 'outline', 'translucent'], states: ['default', 'hover', 'selected'], props: [...SURFACE('card', 'card-foreground'), ...shape('var(--border-radius-lg)'), ...box('1.25rem', '1.25rem')] },
  { id: 'badge', label: 'Badge', variants: ['neutral', 'primary', 'success', 'warning', 'error', 'info'], states: ['default'], props: [...colorProps('var(--colors-neutral-100)', 'var(--colors-neutral-800)', 'transparent'), P('radius', 'Rayon', 'length', 'var(--border-radius-full)'), ...box('0.5rem', '0.125rem')], variantFallbacks: { primary: { background: 'var(--colors-primary-100)', foreground: 'var(--colors-primary-800)' }, success: { background: 'var(--colors-success-100)', foreground: 'var(--colors-success-800)' }, warning: { background: 'var(--colors-warning-100)', foreground: 'var(--colors-warning-800)' }, error: { background: 'var(--colors-error-100)', foreground: 'var(--colors-error-800)' }, info: { background: 'var(--colors-info-100)', foreground: 'var(--colors-info-800)' } } },
  { id: 'alert', label: 'Alert', variants: ['info', 'success', 'warning', 'error'], states: ['default'], props: [...colorProps('var(--colors-info-50)', 'var(--colors-info-900)', 'var(--colors-info-300)'), ...shape(), ...box('1rem', '0.75rem')], variantFallbacks: { success: { background: 'var(--colors-success-50)', foreground: 'var(--colors-success-900)', borderColor: 'var(--colors-success-300)' }, warning: { background: 'var(--colors-warning-50)', foreground: 'var(--colors-warning-900)', borderColor: 'var(--colors-warning-300)' }, error: { background: 'var(--colors-error-50)', foreground: 'var(--colors-error-900)', borderColor: 'var(--colors-error-300)' } } },
  { id: 'dialog', label: 'Dialog / Modal', variants: [BASE_VARIANT], states: ['default'], props: [...SURFACE('popover', 'popover-foreground'), ...shape('var(--border-radius-xl)'), P('overlay', 'Voile', 'color', 'var(--colors-surface-overlay)')] },
  { id: 'dropdown', label: 'Dropdown / Menu', variants: [BASE_VARIANT], states: ['default', 'hover', 'selected', 'disabled'], props: [...SURFACE('popover', 'popover-foreground'), ...shape(), ...box('0.5rem', '0.375rem')] },
  { id: 'tabs', label: 'Tabs', variants: ['line', 'pill'], states: ['default', 'hover', 'selected', 'disabled'], props: [...colorProps('transparent', 'var(--colors-surface-muted-foreground)', 'transparent'), P('radius', 'Rayon', 'length', 'var(--border-radius-md)'), ...box('0.75rem', '0.5rem')] },
  { id: 'table', label: 'Table', variants: [BASE_VARIANT], states: ['default', 'hover', 'selected'], props: [...colorProps('var(--colors-surface-card)', 'var(--colors-surface-card-foreground)', 'var(--colors-border-divider)'), P('headerBackground', 'Fond d’en-tête', 'color', 'var(--colors-surface-muted)'), ...box('0.75rem', '0.5rem')] },
  { id: 'tooltip', label: 'Tooltip', variants: [BASE_VARIANT], states: ['default'], props: [...SURFACE('popover', 'popover-foreground'), ...shape('var(--border-radius-sm)'), ...box('0.5rem', '0.25rem')] },
  { id: 'toast', label: 'Toast', variants: ['info', 'success', 'warning', 'error'], states: ['default'], props: [...SURFACE('popover', 'popover-foreground'), ...shape('var(--border-radius-lg)'), ...box('1rem', '0.75rem')] },
  { id: 'navigation', label: 'Navigation', variants: [BASE_VARIANT], states: ['default', 'hover', 'selected', 'disabled'], props: [...colorProps('transparent', 'var(--colors-surface-foreground)', 'transparent'), P('radius', 'Rayon', 'length', 'var(--border-radius-md)'), ...box('0.75rem', '0.5rem')] },
  { id: 'sidebar', label: 'Sidebar', variants: [BASE_VARIANT], states: ['default'], props: [...SURFACE('sidebar', 'sidebar-foreground'), P('width', 'Largeur', 'length', 'var(--layout-sidebar-width)'), P('shadow', 'Ombre', 'shadow', 'var(--shadows-none)')] },
  { id: 'header', label: 'Header', variants: [BASE_VARIANT], states: ['default'], props: [...SURFACE('header', 'header-foreground'), P('height', 'Hauteur', 'length', 'var(--layout-header-height)'), P('shadow', 'Ombre', 'shadow', 'var(--shadows-none)')] },
];

export const getComponent = (id: string): ComponentSpec | undefined => COMPONENTS.find((c) => c.id === id);

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '-');

/** Nom de la variable CSS générée par `esm-theme` (flatten) pour un chemin de token. */
export const cssVarName = (path: TokenPath): string => `--${path.map(kebab).join('-')}`;

export const componentPath = (component: string, variant: string, state: string, prop: string): string[] => ['components', component, variant || BASE_VARIANT, state || 'default', prop];

/** Cascade de résolution, du plus spécifique au plus général (cahier des charges §8, §15). */
export function cascadeChain(component: string, variant: string, state: string, prop: string): string[][] {
  const v = variant || BASE_VARIANT;
  const s = state || 'default';
  const chain = [componentPath(component, v, s, prop), componentPath(component, v, 'default', prop), componentPath(component, BASE_VARIANT, s, prop), componentPath(component, BASE_VARIANT, 'default', prop)];
  return chain.filter((p, i) => chain.findIndex((q) => q.join('.') === p.join('.')) === i);
}

/** Repli CSS d'une propriété (spécifique à la variante si défini, sinon celui du composant). */
export function fallbackFor(component: string, variant: string, prop: string): string {
  const spec = getComponent(component);
  return spec?.variantFallbacks?.[variant]?.[prop] ?? spec?.props.find((p) => p.id === prop)?.fallback ?? 'inherit';
}

/** Expression CSS `var(--…, var(--…, repli))` qui implémente la cascade côté navigateur — aucun JS à l'exécution. */
export function componentVar(component: string, variant: string, state: string, prop: string, fallback = fallbackFor(component, variant, prop)): string {
  return cascadeChain(component, variant, state, prop)
    .reverse()
    .reduce((inner, path) => `var(${cssVarName(path)}, ${inner})`, fallback);
}

const leafValue = (leaf: unknown, mode: Mode): string | undefined => {
  if (typeof leaf === 'string' || typeof leaf === 'number') return String(leaf);
  if (isPlainObject(leaf)) {
    const v = leaf[mode];
    return typeof v === 'string' || typeof v === 'number' ? String(v) : undefined;
  }
  return undefined;
};

export interface ResolvedToken {
  value: string;
  /** Chemin d'où vient la valeur ; `null` = repli global. */
  source: string[] | null;
}

/** Équivalent JS de `componentVar` — sert à l'inspecteur (« d'où vient cette valeur ? ») et aux tests. */
export function resolveComponentToken(doc: ThemeDoc, mode: Mode, component: string, variant: string, state: string, prop: string): ResolvedToken {
  for (const path of cascadeChain(component, variant, state, prop)) {
    const v = leafValue(getIn(doc, path), mode);
    if (v !== undefined) return { value: v, source: path };
  }
  return { value: fallbackFor(component, variant, prop), source: null };
}
