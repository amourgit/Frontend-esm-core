import type { Composition, Resource } from '../../domain/types';
import { previewable3dFile } from '../library/library-model';

const MODULAR = ['part', 'garment', 'accessory'];

export const slotsOf = (character: Resource | undefined): string[] => character?.compatibility.slots ?? [];

/** Éléments pouvant occuper un emplacement. */
export const candidatesForSlot = (slot: string, resources: Resource[]): Resource[] =>
  resources
    .filter((r) => MODULAR.includes(r.kind) && r.compatibility.slots.includes(slot))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));

/** Dernière version de chaque composition. */
export function latestPerComposition(all: Composition[]): Composition[] {
  const latest = new Map<string, Composition>();
  for (const c of all) if (!latest.has(c.id) || latest.get(c.id)!.version < c.version) latest.set(c.id, c);
  return [...latest.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name));
}

/**
 * Modèles 3D de l'aperçu d'une composition : les éléments par défaut du personnage, sauf ceux dont l'emplacement est
 * redéfini par un élément de la composition, puis les éléments de la composition.
 */
export function compositionPreviewUris(composition: Composition, resources: Resource[]): string[] {
  const byRef = (ref: { id: string; version: string }) => resources.find((r) => r.id === ref.id && r.version === ref.version);
  const base = byRef(composition.base);
  const chosen = composition.items.flatMap((i) => (byRef(i.ref) ? [byRef(i.ref)!] : []));
  const overridden = new Set(chosen.flatMap((r) => r.compatibility.slots));
  const defaults = (base?.defaults ?? []).flatMap((ref) => {
    const part = byRef(ref);
    return part && !part.compatibility.slots.some((s) => overridden.has(s)) ? [part] : [];
  });
  const uris = [...defaults, ...chosen].flatMap((r) => {
    const file = previewable3dFile(r);
    return file ? [file.uri] : [];
  });
  return [...new Set(uris)];
}

export interface DiffRow {
  key: string;
  label: string;
  values: (string | null)[];
  same: boolean;
}

/** Comparaison de 2 à 3 compositions : base, puis chaque emplacement utilisé par l'une d'elles. */
export function diffCompositions(compositions: Composition[], resources: Resource[]): DiffRow[] {
  const nameOf = (ref?: { id: string; version: string }) => (ref ? (resources.find((r) => r.id === ref.id && r.version === ref.version)?.name ?? ref.id) : null);
  const rows: DiffRow[] = [];
  const push = (key: string, label: string, values: (string | null)[]) => rows.push({ key, label, values, same: values.every((v) => v === values[0]) });
  push('base', 'base', compositions.map((c) => nameOf(c.base)));
  const slots = [...new Set(compositions.flatMap((c) => c.items.map((i) => i.slot)))].sort();
  for (const slot of slots) push(slot, slot, compositions.map((c) => nameOf(c.items.find((i) => i.slot === slot)?.ref)));
  return rows;
}
