import { useMemo } from 'react';
import {
  isNavEntryMeta,
  type NavEntryMeta,
  TOPBAR_LEVEL2_NAV_SLOT,
  useExtensionSlotMeta,
} from '@egen-civitas/esm-framework';

/** Une entrée déclarée sur le slot : le nom de l'extension (routes.json) et sa `meta` validée. */
export interface SlotNavEntry {
  /** Nom de l'extension dans `routes.json` : sert de cible à `registerNavBehavior({ entry })`. */
  name: string;
  meta: NavEntryMeta;
}

/**
 * Entrées de navigation (niveau 2 de la TopBar) déclarées par toutes les apps, dans l'ordre du slot.
 * Les `meta` invalides sont ignorées (le script `verify:nav` les signale à la compilation).
 */
export function useSlotNavEntries(): SlotNavEntry[] {
  const metas = useExtensionSlotMeta<unknown>(TOPBAR_LEVEL2_NAV_SLOT);
  return useMemo(
    () =>
      Object.entries(metas)
        .filter(([, meta]) => isNavEntryMeta(meta))
        .map(([name, meta]) => ({ name, meta: meta as NavEntryMeta })),
    [metas],
  );
}
