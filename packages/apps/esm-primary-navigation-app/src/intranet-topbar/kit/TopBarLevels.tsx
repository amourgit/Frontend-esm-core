import React, { useEffect, useMemo } from 'react';
import { useActiveAppModules } from '../hooks/useActiveAppModules';
import { useTopBarUi } from './context';
import { computeLevels, type DeclaredLevel, type TopBarLevelsConfig } from './levels';
import { useTopBarExtensions } from './extensions';
import { useTopBarItems } from './items';
import { isAllowedByRule, useTopBarLayout } from './layout-store';
import { resolveLevelEntries, type ResolvedRegions } from './placement';
import { regionKey } from './regions';
import { TopBarRegion, TopBarSlotRegistrar, type RegionEntry, type RegionPayload } from './TopBarRegion';
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
  /** Rôle ARIA `toolbar` (avec libellé « Barre d'outils, niveau <rang> ») pour une rangée d'outils. */
  toolbar?: boolean;
  /** Cache la région gauche quand la recherche occupe la rangée en mobile (la région droite prend la place). */
  yieldLeftToSearch?: boolean;
}

/** Où se situe une rangée dans la pile rendue. */
export interface LevelPosition {
  /** Nom du niveau (déclaré par les apps). */
  level: string;
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
  regions: ResolvedRegions<RegionPayload>;
  /** Arrière-plan CSS (surcharge d'une app) ; transparent par défaut. */
  background?: string;
}

/** UNE rangée : le même squelette pour tous les niveaux. */
const TopBarLevel: React.FC<LevelProps> = ({ position, skin, regions, background }) => {
  const ui = useTopBarUi();
  const { level, index, isFirst } = position;
  const yieldLeft = Boolean(skin.yieldLeftToSearch) && ui.searchOpen && ui.isMobile;

  return (
    <div
      className={`${skin.row} relative isolate`}
      data-level={level}
      {...(isFirst ? { 'data-level-first': '' } : {})}
      {...(skin.toolbar ? { role: 'toolbar', 'aria-label': `Barre d'outils, niveau ${index + 1}` } : {})}
      style={background ? { background } : undefined}
    >
      {/* Calque d'arrière-plan : derrière le contenu (`isolate` + `-z-10`), sans capter la souris. */}
      <TopBarRegion
        level={level}
        region="background"
        entries={regions.background}
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      />
      <TopBarRegion level={level} region="left" entries={regions.left} className={yieldLeft ? 'hidden' : skin.left} />
      {skin.divider && (
        <span
          aria-hidden="true"
          data-testid={`topbar-divider-${level}`}
          className="mx-1 hidden h-5 w-px shrink-0 bg-white/10 peer-has-[>div:not(:empty)]:block"
        />
      )}
      <TopBarRegion level={level} region="center" entries={regions.center} className={skin.center} />
      <TopBarRegion
        level={level}
        region="right"
        entries={regions.right}
        className={yieldLeft && skin.rightFull ? `${skin.right} ${skin.rightFull}` : skin.right}
      />
    </div>
  );
};

/** Fond d'un niveau rendu : le sien d'abord, sinon celui d'un niveau dont il accueille le contenu (le dernier de la pile d'abord). */
export function pickBackground(level: string, sources: string[], map: Record<string, string>): string | undefined {
  for (const n of [level, ...sources.filter((x) => x !== level).reverse()]) if (map[n]) return map[n];
  return undefined;
}

const emptyRegions = (): ResolvedRegions<RegionPayload> => ({ left: [], center: [], right: [], background: [] });

export const TopBarLevels: React.FC<{
  config?: Partial<TopBarLevelsConfig>;
  /** Peau de chaque rangée, d'après sa position dans la pile. Défaut : `COMPACT_SKIN` partout. */
  skinFor?: SkinResolver;
  /** Règles de lecture des dates des niveaux éphémères (`topbar.announcements`). */
  dateRules?: Partial<TransientDateRules>;
}> = ({ config, skinFor = defaultSkinFor, dateRules }) => {
  const ui = useTopBarUi();
  const extensions = useTopBarExtensions();
  const items = useTopBarItems();
  const active = useActiveAppModules();
  const layout = useTopBarLayout();

  // Contenu VISIBLE : extensions d'apps actives (ou `meta.global`) et éléments enregistrés.
  const visible = useMemo(() => extensions.filter((e) => e.global || active.has(e.moduleName)), [extensions, active]);

  // Niveaux déclarés par ce contenu (nom + rang éventuel).
  const declared = useMemo<DeclaredLevel[]>(
    () => [
      ...visible.map((e) => ({ id: e.placement.level, rank: e.placement.rank })),
      ...items.map((i) => ({ id: i.placement.level, rank: i.placement.rank })),
    ],
    [visible, items],
  );
  const resolution = useMemo(() => computeLevels(config, declared, layout.levels), [config, declared, layout.levels]);

  // Entrées par niveau RENDU : le contenu d'un niveau non rendu s'affiche sur le niveau qui l'accueille (levels.ts).
  const byLevel = useMemo(() => {
    const groups = new Map<string, RegionEntry[]>();
    const add = (source: string, entry: RegionEntry) => {
      const target = resolution.resolve(source);
      if (target) groups.set(target, [...(groups.get(target) ?? []), entry]);
    };
    for (const extension of visible) {
      const { level, region } = extension.placement;
      const rule = layout.ruleFor(regionKey(level, region));
      if (rule.hidden || !isAllowedByRule(extension.name, extension.global, rule)) continue;
      add(level, {
        key: extension.name,
        placement: extension.placement,
        group: resolution.stack.indexOf(level),
        tie: 0,
        payload: { kind: 'extension', extension, source: level },
      });
    }
    for (const item of items) {
      const { level, region } = item.placement;
      const rule = layout.ruleFor(regionKey(level, region));
      if (rule.hidden || !isAllowedByRule(item.id, item.global !== false, rule)) continue;
      add(level, {
        key: item.id,
        placement: item.placement,
        group: resolution.stack.indexOf(level),
        tie: 1,
        payload: { kind: 'item', item, source: level },
      });
    }
    return new Map([...groups].map(([level, entries]) => [level, resolveLevelEntries(entries)] as const));
  }, [visible, items, resolution, layout]);

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

  const registrarState = useMemo(() => ({ ...ui }), [ui]);

  return (
    <>
      <TopBarSlotRegistrar state={registrarState} />
      {resolution.levels.map((level, index) => {
        const position: LevelPosition = { level, index, count, isFirst: index === 0, isLast: index === count - 1 };
        return (
          <TopBarLevel
            key={level}
            position={position}
            skin={skinFor(position)}
            regions={byLevel.get(level) ?? emptyRegions()}
            background={pickBackground(level, resolution.sourcesOf(level), layout.levels.background)}
          />
        );
      })}
      {/* Niveaux éphémères : toujours APRÈS le dernier niveau de la pile */}
      <TransientLevels dateRules={dateRules} />
    </>
  );
};
