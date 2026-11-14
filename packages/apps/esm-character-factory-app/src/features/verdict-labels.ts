import type { Verdict } from '../domain/compatibility';

/** Libellés de repli (français) des verdicts de compatibilité ; les traductions `verdict_*` les remplacent. */
export const VERDICT_DEFAULTS: Record<Verdict, string> = {
  compatible: '✓ Compatible',
  adaptation: '⚠ Adaptation requise',
  incompatible: '✕ Incompatible',
};
