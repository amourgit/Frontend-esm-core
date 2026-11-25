import React, { useCallback, useMemo } from 'react';
import { ExtensionSlot, type AssignedExtension } from '@egen-civitas/esm-framework';
import { useTopBarUi } from './context';
import type { TopBarExtension } from './extensions';
import type { PlacedEntry } from './placement';
import { TOPBAR_SLOT, type TopBarRegion as Region } from './regions';

// =============================================================================
//  <TopBarRegion> — une région d'un niveau (neutre)
//
//  Rend, dans l'ordre calculé par `resolveLevelEntries` (placement.ts), les extensions que les apps ont placées ici. Rien n'est réservé à un objet : un logo, un profil, un bouton se placent où leur app le décide.
//  Ne sait RIEN du métier.
// =============================================================================

// `has-[>div:empty]:hidden` : l'extension a rendu `null` → son enveloppe `data-extension-id` est vide
// et le slot sort du flex (sinon il reste un item invisible qui crée des `gap` avec ses voisins).
const SLOT_CLASS = 'flex shrink-0 items-center gap-1 empty:hidden has-[>div:empty]:hidden';
// Recherche ouverte en mobile : le slot de l'extension « search » occupe toute la largeur de la région
// (bloc : ses enfants s'étirent naturellement). Les autres slots passent en `hidden` : leurs extensions
// rendent `null` mais leur enveloppe reste un item flex qui créerait des `gap` résiduels à droite.
const FILL_SLOT_CLASS = 'min-w-0 flex-1 empty:hidden';
const HIDDEN_SLOT_CLASS = 'hidden';
const BACKGROUND_SLOT_CLASS = 'absolute inset-0 empty:hidden';

/** Ce que porte une entrée de région : une extension d'app, et le niveau où elle est DÉCLARÉE. */
export interface RegionPayload {
  kind: 'extension';
  extension: TopBarExtension;
  source: string;
}

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
const ExtensionEntry: React.FC<{
  extension: TopBarExtension;
  state: Record<string, unknown>;
  background: boolean;
  slotClassName?: string;
}> = ({ extension, state, background, slotClassName = SLOT_CLASS }) => {
  const { id } = extension;
  const select = useCallback((all: AssignedExtension[]) => all.filter((e) => e.id === id), [id]);
  return (
    <ExtensionSlot
      name={TOPBAR_SLOT}
      state={state}
      select={select}
      className={background ? BACKGROUND_SLOT_CLASS : slotClassName}
    />
  );
};

interface Props {
  /** Niveau RENDU qui porte cette région. */
  level: string;
  region: Region;
  entries: readonly RegionEntry[];
  className?: string;
  /** La recherche occupe la rangée en mobile : le slot « search » de la région droite prend toute la largeur. */
  searchTakeover?: boolean;
}

export const TopBarRegion: React.FC<Props> = ({ level, region, entries, className = '', searchTakeover = false }) => {
  const ui = useTopBarUi();
  // `state` stable : un nouvel objet à chaque rendu relancerait `updateExtensionSlotState` du slot en boucle.
  const state = useMemo(() => ({ ...ui, level, region }), [ui, level, region]);
  const background = region === 'background';
  const takeover = searchTakeover && region === 'right';

  return (
    <div data-region={region} className={className}>
      {entries.map(({ payload: { extension } }) => (
        <ExtensionEntry
          key={extension.id}
          extension={extension}
          state={state}
          background={background}
          slotClassName={takeover ? (extension.name === 'search' ? FILL_SLOT_CLASS : HIDDEN_SLOT_CLASS) : undefined}
        />
      ))}
    </div>
  );
};
