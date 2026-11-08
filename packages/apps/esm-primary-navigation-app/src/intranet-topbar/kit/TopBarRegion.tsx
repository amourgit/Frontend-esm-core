import React, { useCallback, useMemo } from 'react';
import { ExtensionSlot, type AssignedExtension } from '@egen-civitas/esm-framework';
import { useRegionExtensions, type RegionExtension, type RegionSlotRef } from './region-extensions';
import { useActiveAppModules } from '../hooks/useActiveAppModules';
import { useTopBarItems, type TopBarItem } from './items';
import { isAllowedByRule, useTopBarLayout, type TopBarRegionRule } from './layout-store';
import { useTopBarUi } from './context';
import { parseRegionId, regionId, slotNamesFor, type TopBarRegion as Region, type TopBarRegionId } from './regions';

// =============================================================================
//  <TopBarRegion> — une région d'un niveau (neutre)
//
//  Rend, dans UN SEUL ordre, les éléments globaux de la région et les extensions que les apps y attachent : tout
//  est trié par niveau source, puis par `order` (celui de l'élément, ou celui du routes.json de l'extension) ; à
//  `order` égal, l'extension passe avant l'élément. Rien n'est réservé à un objet : un logo, un profil, un bouton se
//  placent où leur app le décide (slot + `order`). Les éléments globaux sont transitoires (ils migrent vers des
//  apps) : quand il n'y en aura plus, il ne restera que des extensions. Quand des niveaux voisins ne sont pas
//  rendus, `sources` liste les niveaux dont le contenu s'affiche ici (règle 3 de levels.ts). Chaque source applique
//  SES règles de layout. Ne sait RIEN du métier.
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

const NO_EXTENSION = () => [] as AssignedExtension[];

/**
 * Enregistre un slot auprès du framework sans rien afficher. Un slot n'est « enregistré » (et sa configuration
 * `extensionSlots` — ajouts, retraits, ordre — chargée) que s'il est monté : sans cette instance cachée, une extension
 * ajoutée à un slot par la CONFIGURATION d'un déploiement ne serait jamais découverte. Le rendu visible est fait,
 * extension par extension, par `ExtensionEntry`.
 */
const SlotRegistrar: React.FC<{ name: string; state: Record<string, unknown> }> = ({ name, state }) => (
  <ExtensionSlot name={name} state={state} select={NO_EXTENSION} className="hidden" />
);

/** Une extension précise d'un slot (le slot peut en porter d'autres, rendues ailleurs dans l'ordre de la région). */
const ExtensionEntry: React.FC<{ extension: RegionExtension; state: Record<string, unknown> }> = ({ extension, state }) => {
  const select = useCallback((all: AssignedExtension[]) => all.filter((e) => e.id === extension.id), [extension.id]);
  return <ExtensionSlot name={extension.slot} state={state} select={select} className={SLOT_CLASS} />;
};

type Entry =
  | { kind: 'item'; level: number; order: number; item: TopBarItem }
  | { kind: 'extension'; level: number; order: number; extension: RegionExtension };

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
  const activeModules = useActiveAppModules();
  const id = regionId(level, region);
  // `state` stable : un nouvel objet à chaque rendu relancerait `updateExtensionSlotState` du slot en boucle.
  const state = useMemo(() => ({ ...ui, region: id, level }), [ui, id, level]);
  const background = region === 'background';

  // Slots visibles de la région : un par source dont les règles de layout ne la masquent pas.
  const slotRefs: RegionSlotRef[] = sources.flatMap((src) => {
    const source = regionId(src, region);
    return layout.ruleFor(source).hidden ? [] : slotNamesFor(source).map((name) => ({ name, source }));
  });
  const extensions = useRegionExtensions(background ? [] : slotRefs);

  const items = all.filter((i) => {
    const p = parseRegionId(i.region);
    return p && p.region === region && sources.includes(p.level) && isAllowedByRule(i.id, i.global !== false, layout.ruleFor(i.region));
  });

  const entries: Entry[] = [
    ...extensions
      .filter((e) => (e.global || activeModules.has(e.moduleName)) && isAllowedByRule(e.name, e.global, layout.ruleFor(e.source)))
      .map((extension): Entry => ({ kind: 'extension', level: parseRegionId(extension.source)!.level, order: extension.order, extension })),
    ...items.map((item): Entry => ({ kind: 'item', level: parseRegionId(item.region)!.level, order: item.order ?? 0, item })),
  ].sort((a, b) => a.level - b.level || a.order - b.order || (a.kind === b.kind ? 0 : a.kind === 'extension' ? -1 : 1));

  const hideOn = (i: TopBarItem) =>
    ui.searchOpen && ((i.hideOnSearch === 'mobile' && ui.isMobile) || (i.hideOnSearch === 'touch' && !ui.isDesktop));

  return (
    <div data-slot={`topbar-${id}`} className={className}>
      {/* Le fond n'a ni éléments ni ordre : un slot par source, rendu en bloc. */}
      {background &&
        slotRefs.map(({ name, source }) => (
          <RegionSlot key={name} name={name} source={source} rule={layout.ruleFor(source)} state={state} background />
        ))}
      {!background && slotRefs.map(({ name }) => <SlotRegistrar key={`registrar:${name}`} name={name} state={state} />)}
      {entries.map((entry) => {
        if (entry.kind === 'extension') {
          return <ExtensionEntry key={`${entry.extension.slot}:${entry.extension.id}`} extension={entry.extension} state={state} />;
        }
        const { item } = entry;
        const Item = item.component;
        const cls = hideOn(item) ? 'hidden' : item.visibleFrom ? SCREEN_CLASS[item.visibleFrom] : 'contents';
        return (
          <div key={item.id} data-topbar-item={item.id} className={cls}>
            <Item />
          </div>
        );
      })}
    </div>
  );
};
