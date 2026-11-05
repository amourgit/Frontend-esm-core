import { useMemo, useSyncExternalStore } from 'react';
import { getExtensionInternalStore } from '@egen-civitas/esm-framework/src/internal';
import { useActiveAppModules } from '../hooks/useActiveAppModules';
import { useTopBarItems } from './items';
import { parseRegionId, regionOfSlot } from './regions';

interface InternalState {
  slots?: Record<string, { attachedIds?: string[] }>;
  extensions?: Record<string, { moduleName: string; meta?: { global?: boolean } } | undefined>;
}

/**
 * Signature (chaîne) des extensions rattachées aux slots de la TopBar : `niveau|module|global`, une ligne par extension.
 *
 * IMPORTANT : le store interne des extensions change à chaque `updateExtensionSlotState` (donc à chaque rendu d'un
 * `<ExtensionSlot state>`). S'abonner à tout le store ferait boucler la TopBar (React #185). On s'abonne donc à une
 * valeur PRIMITIVE dérivée : le composant ne se rend à nouveau que si cette signature change vraiment.
 */
export function declaredSignature(state: InternalState): string {
  const lines: string[] = [];
  for (const [slotName, slot] of Object.entries(state.slots ?? {})) {
    const region = regionOfSlot(slotName);
    if (!region) continue;
    const level = parseRegionId(region)!.level;
    for (const id of slot.attachedIds ?? []) {
      const ext = state.extensions?.[id];
      if (ext) lines.push(`${level}|${ext.moduleName}|${ext.meta?.global === true ? 1 : 0}`);
    }
  }
  return lines.sort().join('\n');
}

/** Niveaux déclarés par du contenu VISIBLE : éléments enregistrés + extensions d'apps actives ou globales. */
export function useDeclaredLevels(): number[] {
  const store = getExtensionInternalStore();
  const signature = useSyncExternalStore(
    store.subscribe,
    () => declaredSignature(store.getState() as InternalState),
    () => declaredSignature(store.getState() as InternalState),
  );
  const active = useActiveAppModules();
  const items = useTopBarItems();

  return useMemo(() => {
    const found = new Set<number>();
    items.forEach((i) => {
      const p = parseRegionId(i.region);
      if (p) found.add(p.level);
    });
    signature.split('\n').forEach((line) => {
      if (!line) return;
      const [level, moduleName, isGlobal] = line.split('|');
      if (isGlobal === '1' || active.has(moduleName)) found.add(Number(level));
    });
    return [...found].sort((a, b) => a - b);
  }, [signature, active, items]);
}
