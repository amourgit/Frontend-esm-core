import type { Composition, VersionRef } from '../domain/types';
import { checkPair, worstVerdict, type CompatibilityReport, type Verdict } from '../domain/compatibility';
import type { ResourceRepository } from '../ports';

export interface CompositionCompatibility {
  verdict: Verdict;
  /** Chaque élément contre le personnage de base. */
  items: { slot: string; ref: VersionRef; report: CompatibilityReport }[];
  /** Conflits entre éléments (même emplacement, restrictions déclarées). */
  conflicts: { a: VersionRef; b: VersionRef; report: CompatibilityReport }[];
  missing: VersionRef[];
}

/** Compatibilité d'une composition : éléments ↔ personnage de base, et éléments entre eux. */
export class CompatibilityService {
  constructor(private readonly resources: ResourceRepository) {}

  async checkComposition(composition: Composition): Promise<CompositionCompatibility> {
    const missing: VersionRef[] = [];
    const base = await this.resources.get(composition.base);
    if (!base) missing.push(composition.base);

    const loaded = [];
    for (const item of composition.items) {
      const resource = await this.resources.get(item.ref);
      if (!resource) missing.push(item.ref);
      else loaded.push({ item, resource });
    }

    const items = base ? loaded.map(({ item, resource }) => ({ slot: item.slot, ref: item.ref, report: checkPair(resource, base) })) : [];
    const conflicts: CompositionCompatibility['conflicts'] = [];
    for (let i = 0; i < loaded.length; i++) {
      for (let j = i + 1; j < loaded.length; j++) {
        const report = checkPair(loaded[i].resource, loaded[j].resource);
        if (report.verdict === 'incompatible') conflicts.push({ a: loaded[i].item.ref, b: loaded[j].item.ref, report });
      }
    }
    const verdict = missing.length ? 'incompatible' : worstVerdict([...items.map((i) => i.report.verdict), ...conflicts.map((c) => c.report.verdict)]);
    return { verdict, items, conflicts, missing };
  }
}
