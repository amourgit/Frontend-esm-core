import type { Composition, PresentationProfile, Resource } from '../../domain/types';
import type { CompositionRepository, ProfileRepository, ResourceFilter, ResourceRepository } from '../../ports';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const byVersionDesc = (a: string, b: string) => b.localeCompare(a, undefined, { numeric: true });

/** Dépôt de ressources en mémoire (lecture ; `seed` pour l'alimenter : manifeste historique, tests). */
export class MemoryResourceRepository implements ResourceRepository {
  private items: Resource[] = [];

  seed(resources: Resource[]): this {
    this.items = clone(resources);
    return this;
  }

  async list(filter: ResourceFilter = {}): Promise<Resource[]> {
    const text = filter.text?.trim().toLowerCase();
    return clone(
      this.items.filter(
        (r) =>
          (!filter.kind || r.kind === filter.kind) &&
          (!filter.collection || r.collections.includes(filter.collection)) &&
          (!filter.tags?.length || filter.tags.every((t) => r.tags.includes(t))) &&
          (!text || r.name.toLowerCase().includes(text) || r.tags.some((t) => t.toLowerCase().includes(text))),
      ),
    );
  }

  async get(ref: { id: string; version?: string }): Promise<Resource | null> {
    const versions = (await this.listVersions(ref.id)).filter((r) => (ref.version ? r.version === ref.version : r.status !== 'deprecated'));
    return versions[0] ?? null;
  }

  async listVersions(id: string): Promise<Resource[]> {
    return clone(this.items.filter((r) => r.id === id).sort((a, b) => byVersionDesc(a.version, b.version)));
  }
}

export class MemoryCompositionRepository implements CompositionRepository {
  private items = new Map<string, Composition>();
  private key = (id: string, version: number) => `${id}@${version}`;

  async list() { return clone([...this.items.values()]); }
  async get(id: string, version?: number) {
    const versions = await this.listVersions(id);
    return (version === undefined ? versions[0] : versions.find((c) => c.version === version)) ?? null;
  }
  async listVersions(id: string) {
    return clone([...this.items.values()].filter((c) => c.id === id).sort((a, b) => b.version - a.version));
  }
  async put(c: Composition) { this.items.set(this.key(c.id, c.version), clone(c)); }
  async delete(id: string, version: number) { this.items.delete(this.key(id, version)); }
}

export class MemoryProfileRepository implements ProfileRepository {
  private items = new Map<string, PresentationProfile>();
  async list() { return clone([...this.items.values()]); }
  async get(id: string) { return clone(this.items.get(id) ?? null); }
  async put(p: PresentationProfile) { this.items.set(p.id, clone(p)); }
  async delete(id: string) { this.items.delete(id); }
}
