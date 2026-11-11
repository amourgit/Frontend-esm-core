import {
  DomainError,
  type Composition,
  type CompositionItem,
  type Resource,
  type ResourceFile,
  type VersionRef,
} from '../domain/types';
import { validateComposition } from '../domain/validation';
import type { CompositionRepository, ResourceRepository } from '../ports';

export interface ResolvedAsset {
  /** `base` ou le slot de l'élément. */
  slot: string;
  ref: VersionRef;
  resource: Resource;
  /** Fichier à charger : « optimized » si disponible, sinon « original ». */
  file: ResourceFile | null;
  textureOverride?: { ref: VersionRef; resource: Resource } | null;
}

export interface Resolution {
  assets: ResolvedAsset[];
  missing: VersionRef[];
}

export interface CreateCompositionInput {
  name: string;
  base: VersionRef;
  items?: CompositionItem[];
  appearance?: Composition['appearance'];
}

const preferredFile = (r: Resource): ResourceFile | null =>
  r.files.find((f) => f.role === 'optimized') ?? r.files.find((f) => f.role === 'original') ?? null;

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/**
 * Cas d'usage sur les compositions. Applique les invariants du domaine :
 *  1. une composition référence les ressources (id + version), jamais de copie de fichier ;
 *  2. une version non brouillon est immuable — toute modification crée une nouvelle version ;
 *  3. une variante est indépendante de sa source une fois créée.
 */
export class CompositionService {
  constructor(
    private readonly compositions: CompositionRepository,
    private readonly resources: ResourceRepository,
    private readonly clock: () => string = () => new Date().toISOString(),
    private readonly newId: () => string = () => globalThis.crypto.randomUUID(),
  ) {}

  async create(input: CreateCompositionInput): Promise<Composition> {
    const now = this.clock();
    const composition: Composition = {
      id: this.newId(),
      name: input.name,
      version: 1,
      status: 'draft',
      base: input.base,
      items: input.items ?? [],
      appearance: input.appearance ?? { blendshapes: {}, colors: {} },
      createdAt: now,
      updatedAt: now,
    };
    await this.assertValidAndResolvable(composition);
    await this.compositions.put(composition);
    return composition;
  }

  /** Modifie un BROUILLON. Toute autre version est immuable (utiliser createVersion). */
  async update(id: string, version: number, patch: Partial<Pick<Composition, 'name' | 'base' | 'items' | 'appearance' | 'defaultState'>>): Promise<Composition> {
    const current = await this.require(id, version);
    if (current.status !== 'draft') {
      throw new DomainError('IMMUTABLE_VERSION', `La version ${version} de « ${current.name} » n'est pas un brouillon : elle est immuable.`, {
        id,
        version,
        status: current.status,
      });
    }
    const next: Composition = { ...clone(current), ...clone(patch), updatedAt: this.clock() };
    await this.assertValidAndResolvable(next);
    await this.compositions.put(next);
    return next;
  }

  /** Change le statut d'un brouillon vers `validated` ou `published` (la version devient alors immuable). */
  async promote(id: string, version: number, status: 'validated' | 'published'): Promise<Composition> {
    const current = await this.require(id, version);
    if (current.status === 'deprecated') throw new DomainError('IMMUTABLE_VERSION', 'Une version dépréciée ne peut plus évoluer.');
    const next: Composition = { ...clone(current), status, updatedAt: this.clock() };
    await this.assertValidAndResolvable(next);
    await this.compositions.put(next);
    return next;
  }

  /** Nouvelle version (brouillon) issue d'une version existante : mêmes références, numéro suivant. */
  async createVersion(id: string, fromVersion: number): Promise<Composition> {
    const source = await this.require(id, fromVersion);
    const all = await this.compositions.listVersions(id);
    const next: Composition = {
      ...clone(source),
      version: Math.max(...all.map((c) => c.version)) + 1,
      status: 'draft',
      updatedAt: this.clock(),
    };
    await this.compositions.put(next);
    return next;
  }

  /** Variante : nouvelle composition indépendante qui référence les mêmes ressources (aucun fichier copié). */
  async createVariant(id: string, version: number, name: string): Promise<Composition> {
    const source = await this.require(id, version);
    const now = this.clock();
    const variant: Composition = {
      ...clone(source),
      id: this.newId(),
      name,
      version: 1,
      status: 'draft',
      variantOf: { id: source.id, version: source.version },
      createdAt: now,
      updatedAt: now,
    };
    await this.compositions.put(variant);
    return variant;
  }

  /** F7.5 — transforme les références d'une composition en ressources et fichiers à charger. */
  async resolve(composition: Composition): Promise<Resolution> {
    const wanted: { slot: string; ref: VersionRef; texture?: VersionRef }[] = [
      { slot: 'base', ref: composition.base },
      ...composition.items.map((i) => ({ slot: i.slot, ref: i.ref, texture: i.overrides?.texture })),
    ];
    const assets: ResolvedAsset[] = [];
    const missing: VersionRef[] = [];
    for (const w of wanted) {
      const resource = await this.resources.get(w.ref);
      if (!resource) {
        missing.push(w.ref);
        continue;
      }
      let textureOverride: ResolvedAsset['textureOverride'] = null;
      if (w.texture) {
        const t = await this.resources.get(w.texture);
        if (t) textureOverride = { ref: w.texture, resource: t };
        else missing.push(w.texture);
      }
      assets.push({ slot: w.slot, ref: w.ref, resource, file: preferredFile(resource), textureOverride });
    }
    return { assets, missing };
  }

  private async require(id: string, version: number): Promise<Composition> {
    const found = await this.compositions.get(id, version);
    if (!found) throw new DomainError('NOT_FOUND', `Composition ${id} v${version} introuvable.`, { id, version });
    return found;
  }

  private async assertValidAndResolvable(c: Composition): Promise<void> {
    const check = validateComposition(c);
    if (!check.ok) throw new DomainError('INVALID', `Composition invalide : ${check.errors.join(' ; ')}`, check.errors);
    const { missing } = await this.resolve(c);
    if (missing.length) {
      throw new DomainError(
        'MISSING_REFERENCE',
        `Ressources introuvables : ${missing.map((m) => `${m.id}@${m.version}`).join(', ')}`,
        missing,
      );
    }
  }
}
