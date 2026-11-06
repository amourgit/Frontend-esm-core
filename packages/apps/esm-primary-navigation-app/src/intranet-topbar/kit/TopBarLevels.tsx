import React, { useEffect, useMemo } from 'react';
import { useTopBarUi } from './context';
import { computeLevels, type TopBarLevelsConfig } from './levels';
import { useDeclaredLevels } from './declared-levels';
import { useTopBarLayout } from './layout-store';
import { TopBarRegion } from './TopBarRegion';
import { TransientLevels } from './TransientLevels';
import type { TransientDateRules } from './transient-time';

// =============================================================================
//  <TopBarLevels> — la pile de niveaux (neutre)
//
//  Calcule le nombre de niveaux (levels.ts) et rend chacun avec EXACTEMENT le même squelette :
//
//      calque d'arrière-plan  +  région gauche  |  région centre  |  région droite
//
//  Aucun niveau n'est un cas particulier : ni le premier, ni un numéro donné. Ce qui peut varier d'une rangée à
//  l'autre n'est qu'une PEAU (`LevelSkin` : classes CSS + deux comportements), choisie par l'hôte via `skinFor`
//  d'après la POSITION de la rangée dans la pile (première, dernière…) et non d'après son numéro.
// =============================================================================

/** Habillage d'une rangée : classes de la rangée et de ses trois régions, et comportements optionnels. */
export interface LevelSkin {
  row: string;
  left: string;
  center: string;
  right: string;
  /** Ajouté à la région droite quand la recherche occupe la rangée en mobile. */
  rightFull?: string;
  /** Séparateur visible entre la région gauche et le reste, seulement si la région gauche affiche du contenu. */
  divider?: boolean;
  /** Rôle ARIA `toolbar` (avec libellé « Barre d'outils, niveau N ») pour une rangée d'outils. */
  toolbar?: boolean;
  /** Cache la région gauche quand la recherche occupe la rangée en mobile (la région droite prend la place). */
  yieldLeftToSearch?: boolean;
}

/** Où se situe une rangée dans la pile rendue. */
export interface LevelPosition {
  /** Numéro du niveau (1 = en haut). */
  level: number;
  /** Rang dans les rangées rendues (0 = la première). Diffère de `level - 1` si des niveaux sont désactivés. */
  index: number;
  count: number;
  isFirst: boolean;
  isLast: boolean;
}

export type SkinResolver = (position: LevelPosition) => LevelSkin;

/** Peau d'une rangée compacte (barre d'outils). Peau par défaut de toutes les rangées. */
export const COMPACT_SKIN: LevelSkin = {
  row: 'relative z-30 flex h-10 w-full items-center gap-1 bg-transparent px-2 sm:h-11 sm:px-4 md:px-6 lg:px-7',
  left: 'peer flex shrink-0 items-center gap-1',
  center: 'flex min-w-0 flex-1 items-center justify-between gap-2',
  right: 'flex shrink-0 items-center',
  divider: true,
  toolbar: true,
};

const defaultSkinFor: SkinResolver = () => COMPACT_SKIN;

interface LevelProps {
  position: LevelPosition;
  skin: LevelSkin;
  sources: number[];
  /** Arrière-plan CSS (surcharge d'une app) ; transparent par défaut. */
  background?: string;
}

/** Calque d'arrière-plan du niveau : derrière le contenu (`isolate` + `-z-10`), sans capter la souris. */
const BackgroundLayer: React.FC<{ level: number; sources: number[] }> = ({ level, sources }) => (
  <TopBarRegion
    level={level}
    region="background"
    sources={sources}
    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
  />
);

/** UNE rangée : le même squelette pour tous les niveaux. */
const TopBarLevel: React.FC<LevelProps> = ({ position, skin, sources, background }) => {
  const ui = useTopBarUi();
  const { level, isFirst } = position;
  const yieldLeft = Boolean(skin.yieldLeftToSearch) && ui.searchOpen && ui.isMobile;

  return (
    <div
      className={`${skin.row} relative isolate`}
      data-level={level}
      {...(isFirst ? { 'data-level-first': '' } : {})}
      {...(skin.toolbar ? { role: 'toolbar', 'aria-label': `Barre d'outils, niveau ${level}` } : {})}
      style={background ? { background } : undefined}
    >
      <BackgroundLayer level={level} sources={sources} />
      <TopBarRegion level={level} region="left" sources={sources} className={yieldLeft ? 'hidden' : skin.left} />
      {skin.divider && (
        <span
          aria-hidden="true"
          data-testid={`topbar-divider-${level}`}
          className="mx-1 hidden h-5 w-px shrink-0 bg-white/10 peer-has-[>div:not(:empty)]:block"
        />
      )}
      <TopBarRegion level={level} region="center" sources={sources} className={skin.center} />
      <TopBarRegion
        level={level}
        region="right"
        sources={sources}
        className={yieldLeft && skin.rightFull ? `${skin.right} ${skin.rightFull}` : skin.right}
      />
    </div>
  );
};

/** Fond d'un niveau rendu : le sien d'abord, sinon celui d'un niveau dont il accueille le contenu (le plus haut d'abord). */
export function pickBackground(level: number, sources: number[], map: Record<number, string>): string | undefined {
  for (const n of [level, ...sources.filter((x) => x !== level).reverse()]) if (map[n]) return map[n];
  return undefined;
}

export const TopBarLevels: React.FC<{
  config?: Partial<TopBarLevelsConfig>;
  /** Peau de chaque rangée, d'après sa position dans la pile. Défaut : `COMPACT_SKIN` partout. */
  skinFor?: SkinResolver;
  /** Règles de lecture des dates des niveaux éphémères (`topbar.announcements`). */
  dateRules?: Partial<TransientDateRules>;
}> = ({ config, skinFor = defaultSkinFor, dateRules }) => {
  const declared = useDeclaredLevels();
  const layout = useTopBarLayout();
  const resolution = useMemo(() => computeLevels(config, declared, layout.levels), [config, declared, layout.levels]);

  // Publie le nombre de rangées rendues (`--egen-topbar-levels`) : information pour les apps (décalages, styles).
  // La HAUTEUR totale, elle, est mesurée par le shell sur le conteneur de la TopBar (`--egen-navbar-height`).
  const count = resolution.levels.length;
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--egen-topbar-levels', String(count));
    return () => {
      root.style.removeProperty('--egen-topbar-levels');
    };
  }, [count]);

  return (
    <>
      {resolution.levels.map((level, index) => {
        const position: LevelPosition = {
          level,
          index,
          count,
          isFirst: index === 0,
          isLast: index === count - 1,
        };
        const sources = resolution.sourcesOf(level);
        return (
          <TopBarLevel
            key={level}
            position={position}
            skin={skinFor(position)}
            sources={sources}
            background={pickBackground(level, sources, layout.levels.background)}
          />
        );
      })}
      {/* Niveaux éphémères : toujours APRÈS le dernier niveau numéroté */}
      <TransientLevels dateRules={dateRules} />
    </>
  );
};
