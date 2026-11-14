import type { Resource } from '../../domain/types';
import { legacyManifestToResources, rootAnimationsToResources } from '../../adapters/legacy-manifest';

// Source de catalogue TEMPORAIRE (décision D5) : les manifestes historiques de CharacterStudio, en attendant le backend.
// Remplacée par un ResourceRepository réseau sans toucher à l'UI.

export interface CatalogCollection {
  id: string;
  name: string;
  manifestUrl: string;
}
export interface CatalogError {
  source: string;
  message: string;
}
export interface CatalogResult {
  resources: Resource[];
  collections: CatalogCollection[];
  errors: CatalogError[];
}
export type Fetcher = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<any> }>;

const defaultFetcher: Fetcher = (url) => fetch(url);

/** Résout `target` contre `base` (qui peut lui-même être relatif à la page). */
export function resolveUrl(target: string, base: string): string {
  const page = typeof window !== 'undefined' ? window.location.href : 'http://localhost/';
  return new URL(target, new URL(base, page)).toString();
}

/** Identifiant stable d'une collection, tiré de l'URL de son manifeste (les noms ne sont pas uniques : deux « Anata »). */
export function collectionIdFromUrl(manifestUrl: string): string {
  const { hostname, pathname } = new URL(manifestUrl);
  const path = pathname.replace(/\/?manifest\.json$/i, '');
  const slug = (hostname + path).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'collection';
}

async function getJson(fetcher: Fetcher, url: string): Promise<any> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function loadLegacyCatalog(assetBase: string, fetcher: Fetcher = defaultFetcher): Promise<CatalogResult> {
  const result: CatalogResult = { resources: [], collections: [], errors: [] };
  const rootUrl = resolveUrl(`${assetBase.replace(/\/+$/, '')}/manifest.json`, assetBase || '/');

  let root: any;
  try {
    root = await getJson(fetcher, rootUrl);
  } catch (e) {
    result.errors.push({ source: rootUrl, message: (e as Error).message });
    return result;
  }
  result.resources.push(...rootAnimationsToResources(root, rootUrl));

  const characters: any[] = Array.isArray(root.characters) ? root.characters.filter((c) => c?.manifest) : [];
  const nameCount = new Map<string, number>();
  characters.forEach((c) => nameCount.set(c.name, (nameCount.get(c.name) ?? 0) + 1));

  const settled = await Promise.allSettled(
    characters.map(async (c) => {
      const manifestUrl = resolveUrl(c.manifest, rootUrl);
      const id = collectionIdFromUrl(manifestUrl);
      const lastSegment = new URL(manifestUrl).pathname.replace(/\/?manifest\.json$/i, '').split('/').filter(Boolean).pop();
      const name = (nameCount.get(c.name) ?? 0) > 1 && lastSegment ? `${c.name} (${lastSegment})` : c.name;
      const manifest = await getJson(fetcher, manifestUrl).catch((e) => {
        throw Object.assign(new Error(e.message), { source: manifestUrl });
      });
      const portrait = c.portrait ? resolveUrl(c.portrait, rootUrl) : null;
      return { collection: { id, name, manifestUrl }, portrait, resources: legacyManifestToResources(manifest, { collectionId: id, collectionName: name, manifestUrl }) };
    }),
  );
  settled.forEach((s) => {
    if (s.status === 'fulfilled') {
      result.collections.push(s.value.collection);
      result.resources.push(...s.value.resources);
      const character = s.value.resources.find((r) => r.id === `legacy:${s.value.collection.id}`);
      if (character && s.value.portrait) {
        character.files.push({ role: 'preview', uri: s.value.portrait, format: (s.value.portrait.split(/[?#]/)[0].split('.').pop() ?? '').toLowerCase() });
      }
    } else {
      result.errors.push({ source: (s.reason as any)?.source ?? 'manifeste', message: (s.reason as Error).message });
    }
  });
  return result;
}
