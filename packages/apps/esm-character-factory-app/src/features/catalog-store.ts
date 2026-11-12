import { MemoryResourceRepository } from '../adapters/memory';
import type { ResourceRepository } from '../ports';
import { loadLegacyCatalog, type CatalogResult } from './library/catalog';

// Catalogue partagé entre les sections (bibliothèque, compositions) : chargé une fois, pas à chaque changement de section.
// Un catalogue vide (source racine injoignable) n'est PAS mis en cache : la section suivante réessaie.
let cache: { base: string; promise: Promise<CatalogResult> } | null = null;

export function getCatalog(base: string): Promise<CatalogResult> {
  if (!cache || cache.base !== base) {
    const promise = loadLegacyCatalog(base).then((result) => {
      if (!result.resources.length && cache?.promise === promise) cache = null;
      return result;
    });
    cache = { base, promise };
  }
  return cache.promise;
}

export function resetCatalog(): void {
  cache = null;
}

export function resourceRepositoryFor(catalog: CatalogResult): ResourceRepository {
  return new MemoryResourceRepository().seed(catalog.resources);
}
