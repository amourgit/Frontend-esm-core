import type { Resource, ResourceFile } from '../../domain/types';

// =============================================================================
//  Adaptateur : manifeste CharacterStudio -> catalogue de Ressources (lecture seule)
//
//  Le schéma lu ici est celui consommé par CharacterManifestData.js (champs : assetsLocation, traitsDirectory,
//  thumbnailsDirectory, traits[{trait, name, iconSvg, collection[{id, name, directory, thumbnail, restrictedItems}]}],
//  textureCollections[{trait, collection[{id, name, directory, thumbnail}]}], requiredTraits, randomTraits).
//
//  LIMITES (documentées, voir ROADMAP P9) :
//   - le manifeste historique ne distingue pas corps / vêtement / accessoire : les éléments sont de kind « part » ;
//   - `traitRestrictions` (règles entre traits, forme non confirmée) n'est PAS interprété ; seules les restrictions au niveau
//     des éléments (`restrictedItems`, forme confirmée dans manifestRestrictions.js) le sont ;
//   - les couleurs (colorCollections) sont des valeurs, pas des fichiers : elles ne sont pas des ressources.
// =============================================================================

export interface LegacyManifestOptions {
  /** Identifiant de la collection (celui donné à CharacterManifestData). */
  collectionId: string;
  collectionName?: string;
  /** URL du manifeste : sert de référence de provenance, et de base pour résoudre des chemins relatifs. */
  manifestUrl?: string;
}

/** Même règle que CharacterManifestData.getXDirectory() : concaténation puis « / » final. */
function directory(assetsLocation?: string, sub?: string): string {
  let result = (assetsLocation || '') + (sub || '');
  if (!result.endsWith('/') && !result.endsWith('\\')) result += '/';
  return result;
}

function extension(uri: string): string {
  const clean = uri.split(/[?#]/)[0];
  const dot = clean.lastIndexOf('.');
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : '';
}

function resolve(uri: string, base?: string): string {
  if (!base || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(uri)) return uri;
  try {
    return new URL(uri, base).toString();
  } catch {
    return uri;
  }
}

const asArray = <T>(v: T | T[] | undefined | null): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

export function legacyManifestToResources(manifest: any, options: LegacyManifestOptions): Resource[] {
  const { collectionId, collectionName, manifestUrl } = options;
  const traitsDir = directory(manifest.assetsLocation, manifest.traitsDirectory);
  const thumbsDir = directory(manifest.assetsLocation, manifest.thumbnailsDirectory);
  const rebase = (uri: string) => resolve(uri, manifestUrl);
  const source = { origin: 'legacy-manifest' as const, reference: manifestUrl };

  const filesOf = (dir: string, thumbnail?: string): ResourceFile[] => {
    const files: ResourceFile[] = asArray<string>(dir).map((d) => ({ role: 'original', uri: rebase(d), format: extension(d) }));
    if (thumbnail) files.push({ role: 'preview', uri: rebase(thumbsDir + thumbnail), format: extension(thumbnail) });
    return files;
  };
  const modelFiles = (directoryValue: string | string[], thumbnail?: string): ResourceFile[] => [
    ...asArray(directoryValue).map<ResourceFile>((d) => ({ role: 'original', uri: rebase(traitsDir + d), format: extension(d) })),
    ...(thumbnail ? [{ role: 'preview', uri: rebase(thumbsDir + thumbnail), format: extension(thumbnail) } as ResourceFile] : []),
  ];

  const groups: any[] = asArray(manifest.traits);
  const resources: Resource[] = [];
  const resourceId = (trait: string, itemId: string) => `legacy:${collectionId}:${trait}:${itemId}`;

  // Même résolution que ManifestRestrictions : un item restreint désigne un autre item par son `id` (premier trouvé).
  const resourceIdByItemId = new Map<string, string>();
  for (const group of groups) for (const item of asArray<any>(group.collection)) if (!resourceIdByItemId.has(item.id)) resourceIdByItemId.set(item.id, resourceId(group.trait, item.id));

  // Éléments par défaut = premier élément de chaque trait initial (initialTraits, sinon requis + aléatoires),
  // comme CharacterManifestData ; à défaut, le premier élément du premier groupe.
  const declaredInitial = asArray<string>(manifest.initialTraits);
  const initialTraits = declaredInitial.length ? declaredInitial : [...new Set([...asArray<string>(manifest.requiredTraits), ...asArray<string>(manifest.randomTraits)])];
  let seeds = initialTraits.flatMap((trait) => {
    const item = asArray<any>(groups.find((g) => g.trait === trait)?.collection)[0];
    return item ? [{ trait, item }] : [];
  });
  if (!seeds.length) {
    const group = groups.find((g) => asArray<any>(g.collection).length);
    if (group) seeds = [{ trait: group.trait, item: asArray<any>(group.collection)[0] }];
  }

  // Agrégat « personnage » : la collection elle-même (sans fichier propre ; ses parties sont des ressources distinctes)
  resources.push({
    id: `legacy:${collectionId}`,
    kind: 'character',
    name: collectionName ?? collectionId,
    tags: [],
    collections: [collectionId],
    version: '1',
    status: 'published',
    files: [],
    defaults: seeds.map(({ trait, item }) => ({ id: resourceId(trait, item.id), version: '1' })),
    compatibility: { skeleton: 'vrm-humanoid', slots: groups.map((g) => g.trait), attachmentPoints: [], constraints: [] },
    source,
  });

  for (const group of groups) {
    for (const item of asArray<any>(group.collection)) {
      resources.push({
        id: resourceId(group.trait, item.id),
        kind: 'part',
        name: item.name ?? item.id,
        tags: [group.trait, ...(group.name ? [group.name] : [])],
        collections: [collectionId],
        version: '1',
        status: 'published',
        files: modelFiles(item.directory, item.thumbnail),
        compatibility: {
          skeleton: 'vrm-humanoid',
          slots: [group.trait],
          attachmentPoints: [],
          // restrictedItems : A ne peut pas être porté avec B (relation symétrique, cf. manifestRestrictions.js).
          // Un item introuvable est ignoré, comme le fait le code d'origine (simple avertissement).
          constraints: asArray<string>(item.restrictedItems).flatMap((r) => {
            const target = resourceIdByItemId.get(r);
            return target && target !== resourceId(group.trait, item.id) ? [`conflicts-with:${target}`] : [];
          }),
        },
        source,
      });
    }
  }

  for (const group of asArray<any>(manifest.textureCollections)) {
    for (const item of asArray<any>(group.collection)) {
      resources.push({
        id: `legacy:${collectionId}:texture:${group.trait}:${item.id}`,
        kind: 'texture',
        name: item.name ?? item.id,
        tags: [group.trait],
        collections: [collectionId],
        version: '1',
        status: 'published',
        files: filesOf(traitsDir + item.directory, item.thumbnail),
        compatibility: { slots: [group.trait], attachmentPoints: [], constraints: [] },
        source,
      });
    }
  }
  return resources;
}

/** Animations du manifeste racine (`defaultAnimations[{name, description, location, icon}]`). */
export function rootAnimationsToResources(rootManifest: any, manifestUrl?: string): Resource[] {
  return asArray<any>(rootManifest.defaultAnimations).map((a) => ({
    id: `legacy:animation:${a.name}`,
    kind: 'animation',
    name: a.name,
    description: a.description,
    tags: ['animation'],
    collections: ['default-animations'],
    version: '1',
    status: 'published',
    files: [{ role: 'original', uri: resolve(a.location, manifestUrl), format: extension(a.location) }],
    compatibility: { skeleton: 'vrm-humanoid', slots: [], attachmentPoints: [], constraints: [] },
    source: { origin: 'legacy-manifest', reference: manifestUrl },
  }));
}
