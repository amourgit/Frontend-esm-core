import React, { useCallback, useSyncExternalStore } from 'react';
import { ExtensionSlot, type AssignedExtension } from '@egen-civitas/esm-framework';
import { useActiveAppModules } from '../hooks/useActiveAppModules';
import { getTopBarItems, subscribeTopBarItems, type TopBarItem } from './items';
import { isAllowedByRule as allowed, useRegionRule } from './layout-store';
import { useTopBarUi } from './context';
import { LEGACY_SLOTS, topBarSlotName, type TopBarRegionId } from './regions';

// =============================================================================
//  <TopBarRegion> — une région de la TopBar (neutre)
//
//  Rend, dans cet ordre : les éléments enregistrés pour la région, le slot `topbar-<région>-slot`, puis les
//  slots historiques. Applique les règles de layout des apps actives (voir layout-store.ts). Ne sait RIEN
//  du métier : tout ce qui s'y affiche vient d'éléments ou d'extensions.
// =============================================================================

const SCREEN_CLASS: Record<NonNullable<TopBarItem['visibleFrom']>, string> = {
  tablet: 'hidden md:contents',
  desktop: 'hidden lg:contents',
};

interface Props {
  id: TopBarRegionId;
  className?: string;
}

export const TopBarRegion: React.FC<Props> = ({ id, className = '' }) => {
  const ui = useTopBarUi();
  const rule = useRegionRule(id);
  const activeModules = useActiveAppModules();
  const all = useSyncExternalStore(subscribeTopBarItems, getTopBarItems, getTopBarItems);

  const items = all
    .filter((i) => i.region === id && allowed(i.id, i.global !== false, rule))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Extension : visible si son app est active ou si elle est globale, puis règles de layout.
  const select = useCallback(
    (extensions: AssignedExtension[]) =>
      extensions.filter((e) => {
        const isGlobal = (e.meta as { global?: boolean } | undefined)?.global === true;
        return (isGlobal || activeModules.has(e.moduleName)) && allowed(e.name, isGlobal, rule);
      }),
    [activeModules, rule],
  );

  if (rule.hidden) return null;

  const hideOn = (i: TopBarItem) =>
    ui.searchOpen && ((i.hideOnSearch === 'mobile' && ui.isMobile) || (i.hideOnSearch === 'touch' && !ui.isDesktop));

  const slots = [topBarSlotName(id), ...(LEGACY_SLOTS[id] ?? [])];

  return (
    <div data-slot={`topbar-${id}`} className={className}>
      {items.map((i) => {
        const Item = i.component;
        const cls = hideOn(i) ? 'hidden' : i.visibleFrom ? SCREEN_CLASS[i.visibleFrom] : 'contents';
        return (
          <div key={i.id} data-topbar-item={i.id} className={cls}>
            <Item />
          </div>
        );
      })}
      {slots.map((name) => (
        <ExtensionSlot
          key={name}
          name={name}
          state={{ ...ui, region: id }}
          select={select}
          className="flex shrink-0 items-center gap-1 empty:hidden"
        />
      ))}
    </div>
  );
};
