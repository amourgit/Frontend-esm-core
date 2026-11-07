import React, { useCallback, useMemo } from 'react';
import { ExtensionSlot, type AssignedExtension } from '@egen-civitas/esm-framework';
import { useActiveAppModules } from '../hooks/useActiveAppModules';
import { useTopBarItems, type TopBarItem } from './items';
import { isAllowedByRule, useTopBarLayout, type TopBarRegionRule } from './layout-store';
import { useTopBarUi } from './context';
import { parseRegionId, regionId, slotNamesFor, type TopBarRegion as Region, type TopBarRegionId } from './regions';

// =============================================================================
//  <TopBarRegion> — une région d'un niveau (neutre)
//
//  Rend les slots d'extension de la région PUIS ses éléments globaux : l'identité (logo…) injectée par une app
//  précède ainsi les éléments encore portés par la TopBar. Ces éléments sont transitoires (ils migrent vers des
//  apps) : quand il n'y en aura plus, il ne restera que les slots. Quand des niveaux voisins ne sont pas rendus,
//  `sources` liste les niveaux dont le contenu s'affiche ici (règle 3 de levels.ts). Chaque source applique SES
//  règles de layout. Ne sait RIEN du métier.
// =============================================================================

const SCREEN_CLASS: Record<NonNullable<TopBarItem['visibleFrom']>, string> = {
  tablet: 'hidden md:contents',
  desktop: 'hidden lg:contents',
};

const SLOT_CLASS = 'flex shrink-0 items-center gap-1 empty:hidden';
const BACKGROUND_SLOT_CLASS = 'absolute inset-0 empty:hidden';

interface SlotProps {
  name: string;
  source: TopBarRegionId;
  rule: TopBarRegionRule;
  state: Record<string, unknown>;
  background?: boolean;
}

/** Un slot d'extension filtré : app active (ou `meta.global`) puis règles de layout de la région d'origine. */
const RegionSlot: React.FC<SlotProps> = ({ name, rule, state, background }) => {
  const activeModules = useActiveAppModules();
  const select = useCallback(
    (extensions: AssignedExtension[]) =>
      extensions.filter((e) => {
        const isGlobal = (e.meta as { global?: boolean } | undefined)?.global === true;
        return (isGlobal || activeModules.has(e.moduleName)) && isAllowedByRule(e.name, isGlobal, rule);
      }),
    [activeModules, rule],
  );
  return <ExtensionSlot name={name} state={state} select={select} className={background ? BACKGROUND_SLOT_CLASS : SLOT_CLASS} />;
};

interface Props {
  level: number;
  region: Region;
  /** Niveaux dont le contenu s'affiche dans cette région (au minimum `[level]`). */
  sources?: number[];
  className?: string;
}

export const TopBarRegion: React.FC<Props> = ({ level, region, sources = [level], className = '' }) => {
  const ui = useTopBarUi();
  const layout = useTopBarLayout();
  const all = useTopBarItems();
  const id = regionId(level, region);
  // `state` stable : un nouvel objet à chaque rendu relancerait `updateExtensionSlotState` du slot en boucle.
  const state = useMemo(() => ({ ...ui, region: id, level }), [ui, id, level]);

  const items = all
    .filter((i) => {
      const p = parseRegionId(i.region);
      return p && p.region === region && sources.includes(p.level) && isAllowedByRule(i.id, i.global !== false, layout.ruleFor(i.region));
    })
    .sort((a, b) => (parseRegionId(a.region)!.level - parseRegionId(b.region)!.level) || (a.order ?? 0) - (b.order ?? 0));

  const hideOn = (i: TopBarItem) =>
    ui.searchOpen && ((i.hideOnSearch === 'mobile' && ui.isMobile) || (i.hideOnSearch === 'touch' && !ui.isDesktop));

  return (
    <div data-slot={`topbar-${id}`} className={className}>
      {sources.flatMap((src) => {
        const source = regionId(src, region);
        const rule = layout.ruleFor(source);
        if (rule.hidden) return [];
        return slotNamesFor(source).map((name) => (
          <RegionSlot key={name} name={name} source={source} rule={rule} state={state} background={region === 'background'} />
        ));
      })}
      {items.map((i) => {
        const Item = i.component;
        const cls = hideOn(i) ? 'hidden' : i.visibleFrom ? SCREEN_CLASS[i.visibleFrom] : 'contents';
        return (
          <div key={i.id} data-topbar-item={i.id} className={cls}>
            <Item />
          </div>
        );
      })}
    </div>
  );
};
