// =============================================================================
//  DATES DES NIVEAUX ÉPHÉMÈRES — lecture ISO 8601 stricte + fenêtre d'affichage [début, fin]
//
//  Module pur (aucune dépendance) : utilisé par `openTopBarLevel` ET par la TopBar pour valider les entrées écrites
//  directement dans le store par d'autres apps — une seule règle, donc aucun écart de comportement.
//
//  Formats acceptés pour `startsAt` / `expiresAt` :
//    • nombre  : epoch en ms (non ambigu) ;           • Date  : instant JS (non ambigu) ;
//    • chaîne  : ISO 8601 date + HEURE, ex. `2026-11-06T09:00:00+01:00`, `2026-11-06T08:00Z`, `2026-11-06T09:00:30.250+01:00`.
//  Une chaîne SANS décalage est ambiguë (heure de quel fuseau ?) : refusée par défaut (`requireOffset`). Si l'entreprise
//  préfère l'autoriser, `defaultOffset` (ex. `+01:00` pour Libreville) lui est appliqué. Une date seule (sans heure),
//  un séparateur espace ou une date impossible (30 février) sont toujours refusés.
// =============================================================================

export interface TransientDateRules {
  /** `true` (défaut) : une chaîne ISO sans décalage est refusée. */
  requireOffset: boolean;
  /** Décalage appliqué aux chaînes sans décalage quand `requireOffset` est `false` (`+01:00`, `-05:00`, `Z`). */
  defaultOffset: string;
}

export const DEFAULT_TRANSIENT_DATE_RULES: TransientDateRules = { requireOffset: true, defaultOffset: '+01:00' };

export type InstantError = 'format' | 'offset-required' | 'invalid-date' | 'invalid-offset';
export type InstantFailure = { ok: false; reason: InstantError };
export type InstantResult = { ok: true; value: number } | InstantFailure;
/** Garde de type (le narrowing par `ok` ne fonctionne pas hors `strictNullChecks`). */
export const isInstantFailure = (r: InstantResult): r is InstantFailure => r.ok === false;

const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/;
const OFFSET = /^(Z|([+-])(\d{2}):(\d{2}))$/;

/** Décalage `Z` / `±HH:MM` → minutes (`null` si invalide : heures ≤ 14, minutes ≤ 59). */
export function offsetMinutes(offset: string): number | null {
  const m = OFFSET.exec(offset);
  if (!m) return null;
  if (m[1] === 'Z') return 0;
  const hours = Number(m[3]);
  const minutes = Number(m[4]);
  if (hours > 14 || minutes > 59) return null;
  return (m[2] === '-' ? -1 : 1) * (hours * 60 + minutes);
}

/** Lit une chaîne ISO 8601 (date + heure) selon les règles ; retourne l'instant en ms epoch. */
export function parseIsoInstant(text: string, rules: TransientDateRules = DEFAULT_TRANSIENT_DATE_RULES): InstantResult {
  const m = ISO.exec(text.trim());
  if (!m) return { ok: false, reason: 'format' };
  const [, y, mo, d, h, mi, s = '0', ms = '0', offset] = m;

  let minutes: number | null;
  if (offset) {
    minutes = offsetMinutes(offset);
    if (minutes === null) return { ok: false, reason: 'invalid-offset' };
  } else {
    if (rules.requireOffset) return { ok: false, reason: 'offset-required' };
    minutes = offsetMinutes(rules.defaultOffset);
    if (minutes === null) return { ok: false, reason: 'invalid-offset' };
  }

  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  const second = Number(s);
  const millis = Number(ms.padEnd(3, '0'));
  const wall = Date.UTC(year, month - 1, day, hour, minute, second, millis);
  const check = new Date(wall);
  // Aller-retour : refuse 2026-02-30, 25:00, 12:61… (Date.UTC « déborde » au lieu d'échouer).
  const valid =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day &&
    check.getUTCHours() === hour &&
    check.getUTCMinutes() === minute &&
    check.getUTCSeconds() === second;
  if (!valid) return { ok: false, reason: 'invalid-date' };
  return { ok: true, value: wall - minutes * 60_000 };
}

/** Normalise une valeur de date (nombre, Date ou chaîne ISO) en ms epoch. */
export function parseInstant(value: unknown, rules: TransientDateRules = DEFAULT_TRANSIENT_DATE_RULES): InstantResult {
  if (typeof value === 'number') return Number.isFinite(value) ? { ok: true, value } : { ok: false, reason: 'format' };
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? { ok: true, value: t } : { ok: false, reason: 'invalid-date' };
  }
  if (typeof value === 'string') return parseIsoInstant(value, rules);
  return { ok: false, reason: 'format' };
}

export interface TransientTimeInput {
  openedAt: number;
  /** Début d'affichage ; absent / `null` : immédiat. */
  startsAt?: number | string | Date | null;
  /** Fin d'affichage ; absente / `null` : illimitée (sauf `ttl`). */
  expiresAt?: number | string | Date | null;
  /** Durée de vie en ms, comptée à partir du DÉBUT d'affichage (et non de l'ouverture). */
  ttl?: number;
}

export type TransientWindowFailure = {
  ok: false;
  field: 'startsAt' | 'expiresAt' | 'window';
  reason: InstantError | 'ends-before-start';
};
export type TransientWindow = { ok: true; start: number; end: number | null } | TransientWindowFailure;
export const isWindowFailure = (w: TransientWindow): w is TransientWindowFailure => w.ok === false;

/**
 * Fenêtre d'affichage effective d'un niveau, indépendante de l'heure courante (donc stable dans le temps) :
 * `start` = le plus tardif de `openedAt` et de `startsAt` ; `end` = la plus proche de `expiresAt` et de `start + ttl`
 * (`null` : illimitée). Une date invalide, ou une fin ≤ un début programmé, rend la fenêtre invalide (jamais affiché).
 * Une fin déjà dépassée à l'ouverture reste valide : le niveau est simplement « déjà expiré » (jamais affiché non plus).
 */
export function resolveWindow(
  input: TransientTimeInput,
  rules: TransientDateRules = DEFAULT_TRANSIENT_DATE_RULES,
): TransientWindow {
  let start = input.openedAt;
  let scheduled = false;
  if (input.startsAt !== undefined && input.startsAt !== null) {
    const parsed = parseInstant(input.startsAt, rules);
    if (isInstantFailure(parsed)) return { ok: false, field: 'startsAt', reason: parsed.reason };
    if (parsed.value > start) {
      start = parsed.value;
      scheduled = true;
    }
  }

  const candidates: number[] = [];
  if (typeof input.ttl === 'number' && Number.isFinite(input.ttl) && input.ttl > 0) candidates.push(start + input.ttl);
  if (input.expiresAt !== undefined && input.expiresAt !== null) {
    const parsed = parseInstant(input.expiresAt, rules);
    if (isInstantFailure(parsed)) return { ok: false, field: 'expiresAt', reason: parsed.reason };
    candidates.push(parsed.value);
  }
  const end = candidates.length ? Math.min(...candidates) : null;
  if (scheduled && end !== null && end <= start) return { ok: false, field: 'window', reason: 'ends-before-start' };
  return { ok: true, start, end };
}
