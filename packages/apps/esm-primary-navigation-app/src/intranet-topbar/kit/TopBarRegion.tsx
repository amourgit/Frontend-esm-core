import React, { useCallback, useMemo } from 'react';
import { ExtensionSlot, type AssignedExtension } from '@egen-civitas/esm-framework';
import { useTopBarUi } from './context';
import type { TopBarExtension } from './extensions';
import type { TopBarItem } from './items';
import type { PlacedEntry } from './placement';
import { TOPBAR_SLOT, type TopBarRegion as Region } from './regions';

// =============================================================================
//  <TopBarRegion> — une région d'un niveau (neutre)
//
//  Rend, dans l'ordre calculé par `resolveLevelEntries` (placement.ts), les éléments globaux et les extensions que les
//  apps ont placés ici. Rien n'est réservé à un objet : un logo, un profil, un bouton se placent où leur app le décide.
//  Ne sait RIEN du métier.
// =============================================================================

const SCREEN_CLASS: Record<NonNullable<TopBarItem['visibleFrom']>, string> = {
  tablet: 'hidden md:contents',
  desktop: 'hidden lg:contents',
};

const SLOT_CLASS = 'flex shrink-0 items-center gap-1 empty:hidden';
const BACKGROUND_SLOT_CLASS = 'absolute inset-0 empty:hidden';

/** Ce que porte une entrée de région : une extension d'app ou un élément global, et le niveau où elle est DÉCLARÉE. */
export type RegionPayload =
  | { kind: 'extension'; extension: TopBarExtension; source: string }
  | { kind: 'item'; item: TopBarItem; source: string };

export type RegionEntry = PlacedEntry<RegionPayload>;

const NO_EXTENSION = () => [] as AssignedExtension[];

/**
 * Enregistre le slot unique auprès du framework sans rien afficher. Un slot n'est « enregistré » (et sa configuration
 * `extensionSlots` — ajouts, retraits, ordre — chargée) que s'il est monté : sans cette instance cachée, une extension
 * ajoutée par la CONFIGURATION d'un déploiement ne serait jamais découverte. Monté UNE fois, par `<TopBarLevels>`.
 */
export const TopBarSlotRegistrar: React.FC<{ state: Record<string, unknown> }> = ({ state }) => (
  <ExtensionSlot name={TOPBAR_SLOT} state={state} select={NO_EXTENSION} className="hidden" />
);

/** Une extension précise du slot (le slot en porte d'autres, rendues ailleurs : chacune à sa place). */
const ExtensionEntry: React.FC<{ extension: TopBarExtension; state: Record<string, unknown>; background: boolean }> = ({
  extension,
  state,
  background,
}) => {
  const { id } = extension;
  const select = useCallback((all: AssignedExtension[]) => all.filter((e) => e.id === id), [id]);
  return (
    <ExtensionSlot
      name={TOPBAR_SLOT}
      state={state}
      select={select}
      className={background ? BACKGROUND_SLOT_CLASS : SLOT_CLASS}
    />
  );
};

interface Props {
  /** Niveau RENDU qui porte cette région. */
  level: string;
  region: Region;
  entries: readonly RegionEntry[];
  className?: string;
}

export const TopBarRegion: React.FC<Props> = ({ level, region, entries, className = '' }) => {
  const ui = useTopBarUi();
  // `state` stable : un nouvel objet à chaque rendu relancerait `updateExtensionSlotState` du slot en boucle.
  const state = useMemo(() => ({ ...ui, level, region }), [ui, level, region]);
  const background = region === 'background';

  const hideOn = (i: TopBarItem) =>
    ui.searchOpen && ((i.hideOnSearch === 'mobile' && ui.isMobile) || (i.hideOnSearch === 'touch' && !ui.isDesktop));

  return (
    <div data-region={region} className={className}>
      {entries.map(({ payload }) => {
        if (payload.kind === 'extension') {
          const { extension } = payload;
          return <ExtensionEntry key={extension.id} extension={extension} state={state} background={background} />;
        }
        const { item } = payload;
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
