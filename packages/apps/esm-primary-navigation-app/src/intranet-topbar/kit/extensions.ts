import { useMemo, useSyncExternalStore } from 'react';
import { getExtensionInternalStore, getExtensionStore } from '@egen-civitas/esm-framework/src/internal';
import { readPlacement, type TopBarPlacement } from './placement';
import { TOPBAR_SLOT } from './regions';

// =============================================================================
//  Extensions du slot `topbar-slot`, avec le placement que chaque app a DÉCLARÉ
//
//  La TopBar a besoin de connaître chaque extension (id, nom, module, global, placement) et non plus de laisser un
//  `<ExtensionSlot>` les rendre en bloc : c'est ce qui permet d'assembler les composants de plusieurs apps dans un
//  même niveau, dans un ordre unique.
//
//  IMPORTANT : on ne s'abonne JAMAIS à l'état complet des stores d'extensions. Ils changent à chaque
//  `updateExtensionSlotState` (donc à chaque rendu d'un `<ExtensionSlot state>`) : s'y abonner ferait boucler la
//  TopBar (React #185). On s'abonne à une valeur PRIMITIVE dérivée (la signature) : le composant ne se rend à nouveau
//  que si les extensions de la TopBar changent vraiment.
// =============================================================================

export interface TopBarExtension {
  id: string;
  /** Nom d'enregistrement : clé des règles de layout et des références `before` / `after`. */
  name: string;
  moduleName: string;
  global: boolean;
  placement: TopBarPlacement;
}

interface AssignedLike {
  id: string;
  name: string;
  moduleName: string;
  meta?: { global?: boolean; topbar?: unknown };
}
interface ExtensionStoreState {
  slots?: Record<string, { assignedExtensions?: AssignedLike[] }>;
}
interface InternalState {
  extensions?: Record<string, { order?: number } | undefined>;
}

const SEP = '\u0001';

function subscribe(onChange: () => void) {
  const a = getExtensionStore().subscribe(onChange);
  const b = getExtensionInternalStore().subscribe(onChange);
  return () => {
    a();
    b();
  };
}

/** Signature des extensions assignées à la TopBar : `id|name|module|global|order|placement(JSON)`, une ligne chacune. */
export function topBarExtensionsSignature(): string {
  const assigned = getExtensionStore().getState() as unknown as ExtensionStoreState;
  const internal = getExtensionInternalStore().getState() as unknown as InternalState;
  return (assigned.slots?.[TOPBAR_SLOT]?.assignedExtensions ?? [])
    .map((e) => {
      const order = internal.extensions?.[e.name]?.order;
      return [
        e.id,
        e.name,
        e.moduleName,
        e.meta?.global === true ? 1 : 0,
        typeof order === 'number' ? order : 0,
        JSON.stringify(e.meta?.topbar ?? null),
      ].join(SEP);
    })
    .join('\n');
}

/** Lit une signature. Les extensions sans placement valide sont ignorées (avertissement console). */
export function parseTopBarExtensions(signature: string): TopBarExtension[] {
  if (!signature) return [];
  return signature.split('\n').flatMap((line) => {
    const [id, name, moduleName, global, order, placementJson] = line.split(SEP);
    const placement = readPlacement(JSON.parse(placementJson), Number(order), name);
    return placement ? [{ id, name, moduleName, global: global === '1', placement }] : [];
  });
}

/** Extensions de la TopBar (réactif). */
export function useTopBarExtensions(): TopBarExtension[] {
  const signature = useSyncExternalStore(subscribe, topBarExtensionsSignature, topBarExtensionsSignature);
  return useMemo(() => parseTopBarExtensions(signature), [signature]);
}
