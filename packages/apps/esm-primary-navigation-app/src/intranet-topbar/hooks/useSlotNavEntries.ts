import { useMemo } from 'react';
import { isNavEntryMeta, type NavEntryMeta, useExtensionSlotMeta } from '@egen-civitas/esm-framework';
import { NAV_SLOTS } from '../utils/navSlots';

/** Une entrée déclarée sur le slot : le nom de l'extension (routes.json) et sa `meta` validée. */
export interface SlotNavEntry {
  /** Nom de l'extension dans `routes.json` : sert de cible à `registerNavBehavior({ entry })`. */
  name: string;
  meta: NavEntryMeta;
}

/**
 * Entrées de navigation de la TopBar déclarées par toutes les apps (slot officiel + ancien nom du slot).
 * Les `meta` invalides sont ignorées (le script `verify:nav` les signale à la compilation).
 */
export function useSlotNavEntries(): SlotNavEntry[] {
  // Un nombre FIXE d'appels de hook : un par nom de slot (le nom officiel puis l'ancien).
  const current = useExtensionSlotMeta<unknown>(NAV_SLOTS[0]);
  const legacy = useExtensionSlotMeta<unknown>(NAV_SLOTS[1]);
  return useMemo(
    () =>
      Object.entries({ ...legacy, ...current })
        .filter(([, meta]) => isNavEntryMeta(meta))
        .map(([name, meta]) => ({ name, meta: meta as NavEntryMeta })),
    [current, legacy],
  );
}
