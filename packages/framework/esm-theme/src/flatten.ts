// ============================================================================
//  EIGEN THEME ENGINE — Flatten JSON → CSS custom properties
// ============================================================================

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
  // Garder alphanumérique + tiret uniquement
  return kebab.replace(/[^a-zA-Z0-9-]/g, '-');
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
    return value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(', ');
  }
  if (value === null) return 'initial';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export interface FlattenOptions {
  prefix?: string;
  separator?: string;
  ignoreRootKeys?: string[];
}

/**
 * Aplati récursivement un objet JSON en un dictionnaire plat de variables CSS.
 *
 * @example
 * flattenToCssVars({ colors: { primary: { 500: "#6366f1" } } })
 * // → { "--colors-primary-500": "#6366f1" }
 *
 * flattenToCssVars({ glass: { dark: { modal: { background: "rgba(15,23,42,0.82)" } } } })
 * // → { "--glass-dark-modal-background": "rgba(15,23,42,0.82)" }
 */
export function flattenToCssVars(
  obj: Record<string, unknown>,
  options: FlattenOptions = {},
): Record<string, string> {
  const {
    prefix = DEFAULT_PREFIX,
    separator = DEFAULT_SEPARATOR,
    ignoreRootKeys = DEFAULT_IGNORE_KEYS,
  } = options;

  const result: Record<string, string> = {};

  function walk(node: unknown, segments: string[], depth: number): void {
    if (isPlainObject(node)) {
      for (const [key, value] of Object.entries(node)) {
        // Ignorer les clés racines listées
        if (depth === 0 && ignoreRootKeys.includes(key)) continue;

        const cleanKey = sanitizeSegment(key);
        walk(value, [...segments, cleanKey], depth + 1);
      }
    } else {
      // Feuille atteinte → construire le nom de variable
      const parts = prefix ? [prefix, ...segments] : segments;
      const varName = `--${parts.join(separator)}`;
      result[varName] = serializeLeaf(node);
    }
  }

  walk(obj, [], 0);
  return result;
}
