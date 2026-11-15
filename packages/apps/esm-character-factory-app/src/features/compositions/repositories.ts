import { MemoryCompositionRepository } from '../../adapters/memory';
import { BrowserCompositionRepository } from '../../adapters/browser-storage';
import type { CompositionRepository } from '../../ports';

/**
 * Persistance locale des compositions (décision D5, en attendant le backend) : IndexedDB si disponible, sinon mémoire
 * (les compositions sont alors perdues au rechargement — à signaler à l'utilisateur).
 */
export function createCompositionRepository(): { repository: CompositionRepository; persistent: boolean } {
  if (typeof indexedDB !== 'undefined') return { repository: new BrowserCompositionRepository(), persistent: true };
  return { repository: new MemoryCompositionRepository(), persistent: false };
}
