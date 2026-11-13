import { COMPONENTS, STATES, type ComponentSpec, type PropKind } from './components';
import { isColor } from './color';
import { getIn, isPlainObject, listLeaves } from './path';
import type { Mode, StudioLevel, ThemeDoc } from './types';

export type ControlKind = PropKind | 'scale' | 'font' | 'boolean';
export type ModeStyle = 'none' | 'branch' | 'leaf';

/** Définition d'un contrôle de l'éditeur : un token (ou un motif de token) + sa présentation. */
export interface ControlDef {
  id: string;
  label: string;
  category: string;
  group: string;
  level: StudioLevel;
  kind: ControlKind;
  /** Chemin avec `{mode}` à la place de `light`/`dark` quand le mode est une branche du JSON. */
  template: string[];
  modeStyle: ModeStyle;
  component?: { id: string; variant: string; state: string; prop: string };
  /** Pour `kind: 'scale'` : famille de couleur (primary, secondary…). */
  scaleFamily?: string;
  fallback?: string;
}

export const LEVEL_RANK: Record<StudioLevel, number> = { simple: 0, advanced: 1, expert: 2 };
export const visibleAt = (def: ControlDef, level: StudioLevel): boolean => LEVEL_RANK[def.level] <= LEVEL_RANK[level];

const ROOT_IGNORED = new Set(['priority', 'meta', 'components']);
const ADVANCED_CATEGORIES = new Set(['colors', 'typography', 'borderRadius', 'shadows', 'layout', 'transitions', 'animation']);
const SIMPLE_IDS = new Set([
  'colors.primary.500',
  'colors.secondary.500',
  'colors.surface.{mode}.background',
  'colors.surface.{mode}.foreground',
  'borderRadius.md',
  'typography.fontFamily.sans',
  'typography.fontFamily.heading',
]);
const SCALE_FAMILIES = ['primary', 'secondary', 'neutral', 'success', 'warning', 'error', 'info'];

const humanize = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());

function inferKind(template: string[], value: unknown): ControlKind {
  const key = template.join('.');
  if (/^colors\.(\w+)\.500$/.test(key) && SCALE_FAMILIES.includes(template[1])) return 'scale';
  if (key.startsWith('typography.fontFamily')) return 'font';
  if (key.startsWith('shadows.') || /(^|\.)(boxShadow|shadow)$/.test(key)) return 'shadow';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string' && (key.startsWith('colors.') || isColor(value))) return 'color';
  if (typeof value === 'string' && /^-?[\d.]+(px|rem|em|%|vh|vw|ms|s)?$/.test(value.trim())) return 'length';
  return 'text';
}

function levelFor(id: string, category: string, template: string[]): StudioLevel {
  if (SIMPLE_IDS.has(id)) return 'simple';
  if (category === 'effects' && template[1] !== 'glass') return 'advanced';
  return ADVANCED_CATEGORIES.has(category) ? 'advanced' : 'expert';
}

/** Remplace le segment `light`/`dark` (branche de mode) par `{mode}`. */
export function toTemplate(path: string[]): { template: string[]; modeStyle: ModeStyle } {
  const i = path.findIndex((s) => s === 'light' || s === 'dark');
  if (i < 0) return { template: path, modeStyle: 'none' };
  return { template: path.map((s, j) => (j === i ? '{mode}' : s)), modeStyle: 'branch' };
}

export const resolveTemplate = (template: string[], mode: Mode): string[] => template.map((s) => (s === '{mode}' ? mode : s));

/** Contrôles « globaux » : dérivés des feuilles réelles du thème, donc rien d'EGEN n'est inaccessible. */
export function buildGlobalControls(doc: ThemeDoc): ControlDef[] {
  const seen = new Map<string, ControlDef>();
  for (const leaf of listLeaves(doc)) {
    if (ROOT_IGNORED.has(leaf.path[0])) continue;
    const { template, modeStyle } = toTemplate(leaf.path);
    const id = template.join('.');
    if (seen.has(id)) continue;
    const category = template[0];
    const kind = inferKind(template, leaf.value);
    const isScaleStep = template[0] === 'colors' && SCALE_FAMILIES.includes(template[1]) && template.length === 3;
    seen.set(id, {
      id,
      label: humanize(template.slice(isScaleStep ? 1 : 1).join(' ') || template[0]),
      category,
      group: template.length > 2 ? humanize(template[1] === '{mode}' ? template[2] : template[1]) : humanize(category),
      level: isScaleStep && template[2] !== '500' ? 'expert' : levelFor(id, category, template),
      kind,
      template,
      modeStyle,
      scaleFamily: kind === 'scale' ? template[1] : undefined,
    });
  }
  return [...seen.values()];
}

/** Contrôles de composants : composant × variante × état × propriété, générés depuis le registre. */
export function buildComponentControls(specs: ComponentSpec[] = COMPONENTS): ControlDef[] {
  const out: ControlDef[] = [];
  for (const spec of specs) {
    for (const variant of spec.variants) {
      for (const state of spec.states) {
        for (const prop of spec.props) {
          out.push({
            id: `components.${spec.id}.${variant}.${state}.${prop.id}`,
            label: prop.label,
            category: 'components',
            group: spec.label,
            level: state === 'default' ? 'advanced' : 'expert',
            kind: prop.kind,
            template: ['components', spec.id, variant, state, prop.id],
            modeStyle: 'leaf',
            component: { id: spec.id, variant, state, prop: prop.id },
            fallback: prop.fallback,
          });
        }
      }
    }
  }
  return out;
}

export const buildCatalog = (doc: ThemeDoc): ControlDef[] => [...buildGlobalControls(doc), ...buildComponentControls()];

export const controlsAt = (catalog: ControlDef[], level: StudioLevel): ControlDef[] => catalog.filter((d) => visibleAt(d, level));

export const categoriesOf = (catalog: ControlDef[]): string[] => [...new Set(catalog.map((d) => d.category))];

/** Lecture de la valeur affichée par un contrôle (mode résolu ; tableau → chaîne ; repli sinon). */
export function readControl(doc: ThemeDoc, def: ControlDef, mode: Mode): string {
  const raw = getIn(doc, resolveTemplate(def.template, mode));
  const pick = (v: unknown): unknown => (isPlainObject(v) && ('light' in v || 'dark' in v) ? v[mode] : v);
  const v = pick(raw);
  if (Array.isArray(v)) return v.join(', ');
  return v === undefined || v === null ? '' : String(v);
}

export const states = STATES;
