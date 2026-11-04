import React, { useEffect, useMemo } from 'react';
import { useTopBarUi } from './context';
import { computeLevels, type TopBarLevelsConfig } from './levels';
import { useDeclaredLevels } from './declared-levels';
import { useTopBarLayout } from './layout-store';
import { TopBarRegion } from './TopBarRegion';

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
}

const TopBarLevel: React.FC<LevelProps> = ({ level, sources, primary }) => {
  const ui = useTopBarUi();
  const hideLeft = Boolean(primary) && ui.searchOpen && ui.isMobile;

  if (primary) {
    return (
      <div className={primary.row} data-level={level} data-level-primary="">
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
    <div role="toolbar" aria-label={`Barre d'outils, niveau ${level}`} data-level={level} className={COMPACT.row}>
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
    return () => root.style.removeProperty('--egen-topbar-levels');
  }, [count]);

  return (
    <>
      {resolution.levels.map((level) => (
        <TopBarLevel
          key={level}
          level={level}
          sources={resolution.sourcesOf(level)}
          primary={level === 1 ? primaryClasses : undefined}
        />
      ))}
    </>
  );
};
