import type { Resource, ResourceKind } from '../../domain/types';

export type SortKey = 'name' | 'kind' | 'collection';

export interface Facets {
  kinds: { kind: ResourceKind; count: number }[];
  collections: { id: string; count: number }[];
  tags: { tag: string; count: number }[];
}

const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);
const ranked = <T extends string>(map: Map<string, number>) =>
  [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([key, count]) => ({ key: key as T, count }));

/** Compteurs par type, collection et étiquette (pour les filtres de la bibliothèque). */
export function computeFacets(resources: Resource[]): Facets {
  const kinds = new Map<string, number>();
  const collections = new Map<string, number>();
  const tags = new Map<string, number>();
  for (const r of resources) {
    bump(kinds, r.kind);
    r.collections.forEach((c) => bump(collections, c));
    r.tags.forEach((t) => bump(tags, t));
  }
  return {
    kinds: ranked<ResourceKind>(kinds).map(({ key, count }) => ({ kind: key, count })),
    collections: ranked(collections).map(({ key, count }) => ({ id: key, count })),
    tags: ranked(tags).map(({ key, count }) => ({ tag: key, count })),
  };
}

export function sortResources(resources: Resource[], key: SortKey): Resource[] {
  const by = (r: Resource) => (key === 'name' ? r.name : key === 'kind' ? r.kind : (r.collections[0] ?? ''));
  return [...resources].sort((a, b) => by(a).localeCompare(by(b), undefined, { sensitivity: 'base', numeric: true }) || a.name.localeCompare(b.name));
}

/** Fichier de prévisualisation 3D : le premier fichier original VRM / GLB / glTF. */
export function previewable3dFile(resource: Resource) {
  return resource.files.find((f) => f.role === 'original' && ['vrm', 'glb', 'gltf'].includes(f.format)) ?? null;
}

export function thumbnailOf(resource: Resource): string | null {
  return resource.files.find((f) => f.role === 'preview')?.uri ?? null;
}
