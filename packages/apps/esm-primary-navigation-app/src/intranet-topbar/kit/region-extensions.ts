import { useMemo, useSyncExternalStore } from 'react';
import { getExtensionInternalStore, getExtensionStore } from '@egen-civitas/esm-framework/src/internal';
import type { TopBarRegionId } from './regions';

// =============================================================================
//  Extensions d'une région, AVEC leur ordre
//
//  Pour que l'ordre d'une région soit unique — éléments globaux et extensions d'apps entrelacés par `order` —, la
//  TopBar a besoin de connaître chaque extension (id, module, global, `order` du routes.json) et non plus seulement
//  de laisser un `<ExtensionSlot>` les rendre en bloc.
//
//  IMPORTANT : on ne s'abonne JAMAIS à l'état complet des stores d'extensions. Ils changent à chaque
//  `updateExtensionSlotState` (donc à chaque rendu d'un `<ExtensionSlot state>`) : s'y abonner ferait boucler la TopBar
//  (React #185). On s'abonne à une valeur PRIMITIVE dérivée (la signature) : le composant ne se rend à nouveau que si
//  les extensions de la région changent vraiment.
// =============================================================================

export interface RegionExtension {
  /** Slot dans lequel l'extension est assignée. */
  slot: string;
  /** Région d'origine du slot (pour appliquer SES règles de layout). */
  source: TopBarRegionId;
  id: string;
  /** Nom d'enregistrement de l'extension (clé des règles de layout). */
  name: string;
  moduleName: string;
  global: boolean;
  /** `order` du routes.json ; 0 par défaut. */
  order: number;
}

export interface RegionSlotRef {
  name: string;
  source: TopBarRegionId;
}

interface AssignedLike {
  id: string;
  name: string;
  moduleName: string;
  meta?: { global?: boolean };
}
interface ExtensionStoreState {
  slots?: Record<string, { assignedExtensions?: AssignedLike[] }>;
}
interface InternalState {
  extensions?: Record<string, { order?: number } | undefined>;
}

const SEP = '\u0001';

function subscribe(onChange: () => void) {
  const unsubscribeAssigned = getExtensionStore().subscribe(onChange);
  const unsubscribeInternal = getExtensionInternalStore().subscribe(onChange);
  return () => {
    unsubscribeAssigned();
    unsubscribeInternal();
  };
}

/** Signature des extensions assignées aux slots donnés : `slot|id|name|module|global|order`, une ligne par extension. */
export function regionExtensionsSignature(slotNames: string[]): string {
  const assigned = getExtensionStore().getState() as unknown as ExtensionStoreState;
  const internal = getExtensionInternalStore().getState() as unknown as InternalState;
  const lines: string[] = [];
  for (const slot of slotNames) {
    for (const e of assigned.slots?.[slot]?.assignedExtensions ?? []) {
      const order = internal.extensions?.[e.name]?.order;
      lines.push([slot, e.id, e.name, e.moduleName, e.meta?.global === true ? 1 : 0, typeof order === 'number' ? order : 0].join(SEP));
    }
  }
  return lines.join('\n');
}

/** Extensions assignées aux slots d'une région (tous niveaux sources confondus), dans l'ordre d'assignation. */
export function useRegionExtensions(slots: RegionSlotRef[]): RegionExtension[] {
  const names = slots.map((s) => s.name);
  const signature = useSyncExternalStore(
    subscribe,
    () => regionExtensionsSignature(names),
    () => regionExtensionsSignature(names),
  );
  const key = slots.map((s) => `${s.name}${SEP}${s.source}`).join('\n');

  return useMemo(() => {
    const sourceOf = new Map(slots.map((s) => [s.name, s.source] as const));
    return signature
      ? signature.split('\n').map((line) => {
          const [slot, id, name, moduleName, global, order] = line.split(SEP);
          return { slot, source: sourceOf.get(slot)!, id, name, moduleName, global: global === '1', order: Number(order) };
        })
      : [];
    // `slots` est dérivé de `key` : on ne dépend que de valeurs primitives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, key]);
}
