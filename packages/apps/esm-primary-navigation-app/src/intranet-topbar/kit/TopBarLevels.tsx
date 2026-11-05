import React, { useEffect, useMemo } from 'react';
import { useTopBarUi } from './context';
import { computeLevels, type TopBarLevelsConfig } from './levels';
import { useDeclaredLevels } from './declared-levels';
import { useTopBarLayout } from './layout-store';
import { TopBarRegion } from './TopBarRegion';
import { TransientLevels } from './TransientLevels';

// =============================================================================
//  <TopBarLevels> — la pile de niveaux (neutre)
//
//  Calcule le nombre de niveaux (levels.ts) et rend chacun avec la MÊME structure : trois régions
//  gauche / centre / droite. Le niveau 1 est le niveau « primaire » (classes fournies par l'hôte) ;
//  les autres sont des barres d'outils compactes.
// =============================================================================

export interface PrimaryLevelClasses {
  row: string;
  left: string;
  center: string;
  right: string;
  /** Ajouté à la région droite quand la recherche occupe la rangée en mobile. */
  rightFull?: string;
}

const COMPACT = {
  row: 'relative z-30 flex h-10 w-full items-center gap-1 bg-transparent px-2 sm:h-11 sm:px-4 md:px-6 lg:px-7',
  left: 'peer flex shrink-0 items-center gap-1',
  center: 'flex min-w-0 flex-1 items-center justify-between gap-2',
  right: 'flex shrink-0 items-center',
};

interface LevelProps {
  level: number;
  sources: number[];
  primary?: PrimaryLevelClasses;
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

const TopBarLevel: React.FC<LevelProps> = ({ level, sources, primary, background }) => {
  const ui = useTopBarUi();
  const hideLeft = Boolean(primary) && ui.searchOpen && ui.isMobile;

  if (primary) {
    return (
      <div
        className={`${primary.row} relative isolate`}
        data-level={level}
        data-level-primary=""
        style={background ? { background } : undefined}
      >
        <BackgroundLayer level={level} sources={sources} />
        <TopBarRegion level={level} region="left" sources={sources} className={hideLeft ? 'hidden' : primary.left} />
        <TopBarRegion level={level} region="center" sources={sources} className={primary.center} />
        <TopBarRegion
          level={level}
          region="right"
          sources={sources}
          className={hideLeft && primary.rightFull ? `${primary.right} ${primary.rightFull}` : primary.right}
        />
      </div>
    );
  }
  return (
    <div
      role="toolbar"
      aria-label={`Barre d'outils, niveau ${level}`}
      data-level={level}
      className={`${COMPACT.row} isolate`}
      style={background ? { background } : undefined}
    >
      <BackgroundLayer level={level} sources={sources} />
      <TopBarRegion level={level} region="left" sources={sources} className={COMPACT.left} />
      {/* Séparateur : visible seulement si la région gauche affiche du contenu */}
      <span
        aria-hidden="true"
        data-testid={`topbar-divider-${level}`}
        className="mx-1 hidden h-5 w-px shrink-0 bg-white/10 peer-has-[>div:not(:empty)]:block"
      />
      <TopBarRegion level={level} region="center" sources={sources} className={COMPACT.center} />
      <TopBarRegion level={level} region="right" sources={sources} className={COMPACT.right} />
    </div>
  );
};

/** Fond d'un niveau rendu : le sien d'abord, sinon celui d'un niveau dont il accueille le contenu (le plus haut d'abord). */
export function pickBackground(level: number, sources: number[], map: Record<number, string>): string | undefined {
  for (const n of [level, ...sources.filter((x) => x !== level).reverse()]) if (map[n]) return map[n];
  return undefined;
}

export const TopBarLevels: React.FC<{ config?: Partial<TopBarLevelsConfig>; primaryClasses: PrimaryLevelClasses }> = ({
  config,
  primaryClasses,
}) => {
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
      {resolution.levels.map((level) => (
        <TopBarLevel
          key={level}
          level={level}
          sources={resolution.sourcesOf(level)}
          primary={level === 1 ? primaryClasses : undefined}
          background={pickBackground(level, resolution.sourcesOf(level), layout.levels.background)}
        />
      ))}
      {/* Niveaux éphémères : toujours APRÈS le dernier niveau numéroté */}
      <TransientLevels />
    </>
  );
};
