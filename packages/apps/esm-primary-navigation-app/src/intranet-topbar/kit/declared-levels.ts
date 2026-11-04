import { useMemo } from 'react';
import { useStore } from '@egen-civitas/esm-framework';
import { getExtensionInternalStore } from '@egen-civitas/esm-framework/src/internal';
import { useActiveAppModules } from '../hooks/useActiveAppModules';
import { useTopBarItems } from './items';
import { parseRegionId, regionOfSlot } from './regions';

/** Niveaux déclarés par du contenu VISIBLE : éléments enregistrés + extensions d'apps actives ou globales. */
export function useDeclaredLevels(): number[] {
  const { slots, extensions } = useStore(getExtensionInternalStore());
  const active = useActiveAppModules();
  const items = useTopBarItems();

  return useMemo(() => {
    const found = new Set<number>();
    items.forEach((i) => {
      const p = parseRegionId(i.region);
      if (p) found.add(p.level);
    });
    for (const [slotName, slot] of Object.entries(slots)) {
      const region = regionOfSlot(slotName);
      if (!region) continue;
      const visible = slot.attachedIds.some((id) => {
        const ext = extensions[id];
        return ext && (ext.meta?.global === true || active.has(ext.moduleName));
      });
      if (visible) found.add(parseRegionId(region)!.level);
    }
    return [...found].sort((a, b) => a - b);
  }, [slots, extensions, active, items]);
}
