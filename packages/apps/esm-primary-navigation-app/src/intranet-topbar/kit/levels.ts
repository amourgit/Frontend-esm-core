import { TOPBAR_HARD_MAX_LEVELS } from './regions';

// =============================================================================
//  NIVEAUX — combien de rangées la TopBar rend, et où va le contenu d'un niveau absent
//
//  Règles (uniques, sans exception) :
//   1. Nombre de niveaux = max( config.min, plus haut niveau déclaré par du contenu visible, `levels.min` d'une app
//      active ), plafonné à config.max. Les niveaux intermédiaires vides sont rendus : N niveaux dès qu'un niveau N
//      est utilisé.
//   2. Un niveau ≥ 2 peut être désactivé (config `disabled`, ou `levels.hide` d'une app active). Le niveau 1 ne
//      l'est jamais.
//   3. Le contenu d'un niveau non rendu (désactivé ou au-dessus du max) s'affiche sur le niveau rendu inférieur le
//      plus proche, dans la MÊME région. Rien n'est perdu en silence.
// =============================================================================

export interface TopBarLevelsConfig {
  /** Nombre minimal de niveaux rendus, même vides (1 = TopBar « à l'ancienne » à une seule rangée). */
  min: number;
  /** Nombre maximal de niveaux. */
  max: number;
  /** Niveaux (≥ 2) jamais rendus. */
  disabled: number[];
}

export const DEFAULT_LEVELS_CONFIG: TopBarLevelsConfig = { min: 2, max: 8, disabled: [] };

export interface TopBarLevelsResolution {
  /** Niveaux rendus, croissants (toujours au moins [1]). */
  levels: number[];
  /** Niveau rendu qui accueille le contenu déclaré sur `declared`. */
  resolve: (declared: number) => number;
  /** Niveaux déclarés dont le contenu s'affiche sur `level` (lui-même inclus). */
  sourcesOf: (level: number) => number[];
}

const clampInt = (n: unknown, lo: number, hi: number, fallback: number) => {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.trunc(n) : fallback;
  return Math.min(hi, Math.max(lo, v));
};

/** Calcul pur (testable) des niveaux rendus. */
export function computeLevels(
  config: Partial<TopBarLevelsConfig> | undefined,
  declared: readonly number[],
  runtime: { min?: number; hide?: readonly number[] } = {},
): TopBarLevelsResolution {
  const max = clampInt(config?.max, 1, TOPBAR_HARD_MAX_LEVELS, DEFAULT_LEVELS_CONFIG.max);
  const cap = (n: number) => Math.min(Math.max(1, Math.trunc(n)), max);
  const disabled = new Set([...(config?.disabled ?? []), ...(runtime.hide ?? [])].filter((n) => n > 1));
  const top = Math.min(
    max,
    Math.max(
      clampInt(config?.min, 1, max, DEFAULT_LEVELS_CONFIG.min),
      runtime.min ? cap(runtime.min) : 1,
      ...declared.map(cap),
    ),
  );
  const levels = Array.from({ length: top }, (_, i) => i + 1).filter((n) => !disabled.has(n));

  const resolve = (n: number) => {
    const target = cap(n);
    let best = 1;
    for (const l of levels) if (l <= target) best = l;
    return best;
  };
  const sourcesOf = (level: number) => {
    const set = new Set<number>([level]);
    declared.forEach((d) => resolve(d) === level && set.add(Math.max(1, Math.trunc(d))));
    return [...set].sort((a, b) => a - b);
  };
  return { levels, resolve, sourcesOf };
}
