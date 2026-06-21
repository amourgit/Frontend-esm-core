// ============================================================================
//  EGEN THEME ENGINE — Flatten JSON → variables CSS (résolution light/dark)
// ============================================================================

import type { FlattenResult } from './types';

const DEFAULT_IGNORE_KEYS = ['priority', 'meta', 'tenant'];
const DEFAULT_SEPARATOR = '-';
const DEFAULT_PREFIX = '';

/**
 * Convertit "backdropFilter" → "backdrop-filter" (camelCase → kebab-case)
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Nettoie un segment de clé pour un usage valide dans un nom de variable CSS.
 * "2xl" → "2xl", "backdropFilter" → "backdrop-filter"
 */
function sanitizeSegment(segment: string): string {
  const kebab = toKebabCase(String(segment));
  return kebab.replace(/[^a-zA-Z0-9-]/g, '-');
}

/**
 * Échappe une valeur de feuille avant de l'écrire dans un fichier CSS.
 * Empêche toute injection (un thème peut provenir d'une URL distante /
 * d'un tenant non totalement fiable) : on retire tout caractère permettant
 * de sortir de la déclaration `nom: valeur;` (accolades, point-virgule,
 * ouverture de commentaire CSS).
 */
function escapeCssValue(value: string): string {
  return value.replace(/[{};]/g, '').replace(/\/\*/g, '').trim();
}

/**
 * Sérialise une valeur feuille en string CSS exploitable.
 * - Array  → "Poppins, sans-serif"
 * - null   → "initial"
 * - bool   → "true" / "false"
 * - autres → String()
 */
function serializeLeaf(value: unknown): string {
  if (Array.isArray(value)) {
    return escapeCssValue(value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(', '));
  }
  if (value === null) return 'initial';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return escapeCssValue(String(value));
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

/**
 * Détecte une "branche thématisable" : un nœud dont les SEULES clés sont
 * "light" et/ou "dark". Ce mécanisme est totalement générique — n'importe
 * quelle clé du schéma (colors.surface, colors.border, panel, ou toute
 * extension future ajoutée par une app) bénéficie automatiquement de la
 * résolution de mode sans aucune logique spécifique à écrire.
 */
function isThemableBranch(node: Record<string, unknown>): boolean {
  const keys = Object.keys(node);
  if (keys.length === 0) return false;
  return keys.every((k) => k === 'light' || k === 'dark');
}

export interface FlattenOptions {
  prefix?: string;
  separator?: string;
  ignoreRootKeys?: string[];
}

/**
 * Aplatit récursivement un objet JSON de thème en 3 groupes de variables CSS :
 * `base` (communes à tous les modes), `light` et `dark`.
 *
 * @example
 * flattenToCssVars({ colors: { primary: { 500: "#6366f1" } } })
 * // → { base: { "--colors-primary-500": "#6366f1" }, light: {}, dark: {} }
 *
 * flattenToCssVars({ panel: { dark: { card: { background: "rgba(15,23,42,0.65)" } } } })
 * // → { base: {}, light: {}, dark: { "--panel-card-background": "rgba(15,23,42,0.65)" } }
 *
 * Notez que le nom de variable ne contient JAMAIS "light"/"dark" — c'est le
 * sélecteur CSS (`[data-theme="dark"]`) qui active le bon groupe au runtime.
 */
export function flattenToCssVars(obj: Record<string, unknown>, options: FlattenOptions = {}): FlattenResult {
  const { prefix = DEFAULT_PREFIX, separator = DEFAULT_SEPARATOR, ignoreRootKeys = DEFAULT_IGNORE_KEYS } = options;

  const result: FlattenResult = { base: {}, light: {}, dark: {} };

  function walk(node: unknown, segments: string[], depth: number, bucket: keyof FlattenResult): void {
    if (isPlainObject(node)) {
      if (depth > 0 && isThemableBranch(node)) {
        if (node.light !== undefined) walk(node.light, segments, depth + 1, 'light');
        if (node.dark !== undefined) walk(node.dark, segments, depth + 1, 'dark');
        return;
      }

      for (const [key, value] of Object.entries(node)) {
        if (depth === 0 && ignoreRootKeys.includes(key)) continue;
        const cleanKey = sanitizeSegment(key);
        walk(value, [...segments, cleanKey], depth + 1, bucket);
      }
    } else {
      const parts = prefix ? [prefix, ...segments] : segments;
      const varName = `--${parts.join(separator)}`;
      result[bucket][varName] = serializeLeaf(node);
    }
  }

  walk(obj, [], 0, 'base');
  return result;
}
