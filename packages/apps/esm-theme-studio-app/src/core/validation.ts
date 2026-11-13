import { isColor, SCALE_STEPS } from './color';
import { listLeaves, isPlainObject, pathKey } from './path';
import type { ThemeDoc } from './types';

export interface Issue {
  severity: 'error' | 'warning';
  path: string;
  message: string;
}
export interface ValidationResult {
  valid: boolean;
  issues: Issue[];
}

/** Même exigence de structure que le moteur : aucune valeur ne doit pouvoir sortir de sa déclaration CSS. */
const UNSAFE = /[;{}]|\/\*|\*\/|<|>|@import|url\s*\(\s*['"]?\s*(?:javascript|data:text)/i;
const SCALES = ['primary', 'secondary', 'neutral', 'success', 'warning', 'error', 'info'];

export function validateTheme(doc: unknown): ValidationResult {
  const issues: Issue[] = [];
  const add = (severity: Issue['severity'], path: string, message: string) => issues.push({ severity, path, message });

  if (!isPlainObject(doc)) {
    return { valid: false, issues: [{ severity: 'error', path: '', message: 'Le thème doit être un objet JSON.' }] };
  }
  if (doc.priority !== undefined && typeof doc.priority !== 'number') add('error', 'priority', 'La priorité doit être un nombre.');

  for (const leaf of listLeaves(doc)) {
    const key = pathKey(leaf.path);
    const values = Array.isArray(leaf.value) ? leaf.value : [leaf.value];
    for (const v of values) {
      if (typeof v === 'string' && UNSAFE.test(v)) add('error', key, 'Valeur CSS non autorisée (caractères de structure).');
      if (v !== null && typeof v === 'object') add('error', key, 'Valeur invalide (objet inattendu dans un tableau).');
    }
    if (leaf.path[0] === 'colors' && typeof leaf.value === 'string' && leaf.path.length >= 2) {
      const family = leaf.path[1];
      const isColorToken = SCALES.includes(family) || leaf.path.includes('surface') || leaf.path.includes('border') || family === 'onPrimary' || family === 'onSecondary';
      const isTranslucent = /translucent|overlay|skeleton/i.test(leaf.path.join('.'));
      if (isColorToken && !isTranslucent && !isColor(leaf.value) && !/^(var\(|transparent|currentcolor|inherit|rgba?\(|hsla?\()/i.test(leaf.value)) {
        add('warning', key, `« ${leaf.value} » n’est pas une couleur reconnue.`);
      }
    }
  }

  const colors = doc.colors;
  if (isPlainObject(colors)) {
    for (const family of SCALES) {
      const scale = colors[family];
      if (scale === undefined) continue;
      if (!isPlainObject(scale)) {
        add('error', `colors.${family}`, 'Une échelle de couleur doit être un objet 50→950.');
        continue;
      }
      const missing = SCALE_STEPS.filter((s) => !(s in scale));
      if (missing.length) add('warning', `colors.${family}`, `Échelle incomplète : ${missing.join(', ')}.`);
    }
  }

  return { valid: !issues.some((i) => i.severity === 'error'), issues };
}

export interface ImportOutcome {
  ok: boolean;
  format: 'egen' | 'tweakcn-css' | 'tweakcn-registry' | 'unknown';
  doc?: ThemeDoc;
  issues: Issue[];
}

/** Retire les clés dangereuses d'un JSON importé (prototype pollution). */
function sanitize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sanitize);
  if (isPlainObject(v)) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype') out[k] = sanitize(val);
    return out;
  }
  return v;
}

/** Enveloppes acceptées autour d'un thème EGEN : `{ theme }`, `{ schema }`, ou le JSON direct (thèmes générés inclus). */
function unwrap(json: unknown): unknown {
  if (isPlainObject(json)) {
    if (isPlainObject(json.theme) && !('colors' in json)) return json.theme;
    if (isPlainObject(json.schema) && !('colors' in json)) return json.schema;
  }
  return json;
}

export { unwrap as unwrapThemeEnvelope, sanitize as sanitizeImported };
