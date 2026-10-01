import { useMemo } from 'react';
import {
  isNavEntryMeta,
  type NavEntryMeta,
  TOPBAR_LEVEL2_NAV_SLOT,
  useExtensionSlotMeta,
} from '@egen-civitas/esm-framework';

/** Entrées de navigation (niveau 2 de la TopBar) déclarées par toutes les apps, dans l'ordre du slot. */
export function useSlotNavEntries(): NavEntryMeta[] {
  const metas = useExtensionSlotMeta<unknown>(TOPBAR_LEVEL2_NAV_SLOT);
  return useMemo(() => Object.values(metas).filter(isNavEntryMeta), [metas]);
}
