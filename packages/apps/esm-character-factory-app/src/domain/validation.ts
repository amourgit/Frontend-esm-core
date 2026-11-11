import {
  FILE_ROLES,
  INSTRUCTION_TYPES,
  PUBLICATION_STATUSES,
  RESOURCE_KINDS,
  type Composition,
  type PresentationProfile,
  type Resource,
} from './types';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

const result = (errors: string[]): ValidationResult => ({ ok: errors.length === 0, errors });
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isRef = (v: any): boolean => v && isNonEmptyString(v.id) && isNonEmptyString(v.version);
const FILE_KEYS = new Set(['files', 'file', 'uri', 'url', 'path']);

/** Cherche, récursivement, toute clé évoquant une copie de fichier 3D (invariant 1). */
function findFileKeys(value: unknown, path = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const here = path ? `${path}.${key}` : key;
    return [...(FILE_KEYS.has(key) ? [here] : []), ...findFileKeys(child, here)];
  });
}

export function validateResource(r: Resource): ValidationResult {
  const e: string[] = [];
  if (!isNonEmptyString(r?.id)) e.push('id: requis');
  if (!RESOURCE_KINDS.includes(r?.kind)) e.push(`kind: invalide (${r?.kind})`);
  if (!isNonEmptyString(r?.name)) e.push('name: requis');
  if (!isNonEmptyString(r?.version)) e.push('version: requis');
  if (!PUBLICATION_STATUSES.includes(r?.status)) e.push(`status: invalide (${r?.status})`);
  if (!Array.isArray(r?.files)) e.push('files: tableau requis');
  else {
    r.files.forEach((f, i) => {
      if (!FILE_ROLES.includes(f?.role)) e.push(`files[${i}].role: invalide`);
      if (!isNonEmptyString(f?.uri)) e.push(`files[${i}].uri: requis`);
      if (!isNonEmptyString(f?.format)) e.push(`files[${i}].format: requis`);
    });
    // Une ressource non brouillon doit avoir un fichier original, sauf l'agrégat « personnage » issu d'un manifeste
    // historique (collection de parties, sans fichier propre).
    const legacyAggregate = r.kind === 'character' && r.source?.origin === 'legacy-manifest';
    if (r.status !== 'draft' && !legacyAggregate && !r.files.some((f) => f.role === 'original')) {
      e.push('files: une ressource non brouillon exige un fichier « original »');
    }
  }
  if (!Array.isArray(r?.tags)) e.push('tags: tableau requis');
  if (!Array.isArray(r?.collections)) e.push('collections: tableau requis');
  if (!r?.compatibility || !Array.isArray(r.compatibility.slots)) e.push('compatibility.slots: tableau requis');
  if (!r?.source?.origin) e.push('source.origin: requis');
  return result(e);
}

export function validateComposition(c: Composition): ValidationResult {
  const e: string[] = [];
  if (!isNonEmptyString(c?.id)) e.push('id: requis');
  if (!isNonEmptyString(c?.name)) e.push('name: requis');
  if (!Number.isInteger(c?.version) || c.version < 1) e.push('version: entier >= 1 requis');
  if (!PUBLICATION_STATUSES.includes(c?.status)) e.push(`status: invalide (${c?.status})`);
  if (!isRef(c?.base)) e.push('base: référence {id, version} épinglée requise');
  if (!Array.isArray(c?.items)) e.push('items: tableau requis');
  else {
    const slots = new Set<string>();
    c.items.forEach((item, i) => {
      if (!isNonEmptyString(item?.slot)) e.push(`items[${i}].slot: requis`);
      else if (slots.has(item.slot)) e.push(`items[${i}].slot: « ${item.slot} » déjà occupé`);
      else slots.add(item.slot);
      if (!isRef(item?.ref)) e.push(`items[${i}].ref: référence {id, version} épinglée requise`);
      if (item?.overrides?.texture && !isRef(item.overrides.texture)) e.push(`items[${i}].overrides.texture: référence invalide`);
      Object.entries(item?.overrides?.blendshapes ?? {}).forEach(([k, v]) => {
        if (!Number.isFinite(v)) e.push(`items[${i}].overrides.blendshapes.${k}: nombre requis`);
      });
    });
  }
  // Invariant 1 : une composition référence, elle ne copie jamais de fichier.
  findFileKeys({ items: c?.items, appearance: c?.appearance, base: c?.base }).forEach((p) =>
    e.push(`${p}: une composition ne doit contenir aucune copie de fichier (référencer la ressource)`),
  );
  if (!c?.appearance || typeof c.appearance !== 'object') e.push('appearance: requis');
  if (c?.variantOf && !(isNonEmptyString(c.variantOf.id) && Number.isInteger(c.variantOf.version))) {
    e.push('variantOf: {id, version} requis');
  }
  return result(e);
}

export function validateProfile(p: PresentationProfile): ValidationResult {
  const e: string[] = [];
  if (!isNonEmptyString(p?.id)) e.push('id: requis');
  if (!isNonEmptyString(p?.context)) e.push('context: requis');
  if (!isNonEmptyString(p?.composition?.id)) e.push('composition.id: requis');
  const v = p?.composition?.version;
  if (!(v === 'latest-published' || (Number.isInteger(v) && (v as number) >= 1))) {
    e.push('composition.version: entier >= 1 ou « latest-published »');
  }
  if (!p?.initialState || typeof p.initialState !== 'object') e.push('initialState: requis');
  if (!Array.isArray(p?.allowedCapabilities)) e.push('allowedCapabilities: tableau requis');
  else
    p.allowedCapabilities.forEach((c, i) => {
      if (!INSTRUCTION_TYPES.includes(c)) e.push(`allowedCapabilities[${i}]: inconnue (${c})`);
    });
  return result(e);
}
