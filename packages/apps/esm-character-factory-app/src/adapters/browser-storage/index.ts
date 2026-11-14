import type { Composition, PresentationProfile } from '../../domain/types';
import type { CompositionRepository, ProfileRepository } from '../../ports';

// Persistance locale TEMPORAIRE (décision D5) en attendant le backend EGEN : IndexedDB, API du navigateur, sans dépendance.
// ATTENTION : non couvert par les tests automatiques (jsdom n'a pas IndexedDB) -> à valider en navigateur (F7.4).

const DB_NAME = 'egen-character-factory';
const DB_VERSION = 1;
const STORES = { compositions: 'compositions', profiles: 'profiles' } as const;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.compositions)) db.createObjectStore(STORES.compositions, { keyPath: ['id', 'version'] });
      if (!db.objectStoreNames.contains(STORES.profiles)) db.createObjectStore(STORES.profiles, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(store: string, mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const request = op(tx.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onabort = () => db.close();
      }),
  );
}

export class BrowserCompositionRepository implements CompositionRepository {
  list(): Promise<Composition[]> { return run(STORES.compositions, 'readonly', (s) => s.getAll()); }
  async listVersions(id: string): Promise<Composition[]> {
    return (await this.list()).filter((c) => c.id === id).sort((a, b) => b.version - a.version);
  }
  async get(id: string, version?: number): Promise<Composition | null> {
    if (version !== undefined) return (await run(STORES.compositions, 'readonly', (s) => s.get([id, version]))) ?? null;
    return (await this.listVersions(id))[0] ?? null;
  }
  async put(c: Composition): Promise<void> { await run(STORES.compositions, 'readwrite', (s) => s.put(c)); }
  async delete(id: string, version: number): Promise<void> { await run(STORES.compositions, 'readwrite', (s) => s.delete([id, version])); }
}

export class BrowserProfileRepository implements ProfileRepository {
  list(): Promise<PresentationProfile[]> { return run(STORES.profiles, 'readonly', (s) => s.getAll()); }
  async get(id: string): Promise<PresentationProfile | null> { return (await run(STORES.profiles, 'readonly', (s) => s.get(id))) ?? null; }
  async put(p: PresentationProfile): Promise<void> { await run(STORES.profiles, 'readwrite', (s) => s.put(p)); }
  async delete(id: string): Promise<void> { await run(STORES.profiles, 'readwrite', (s) => s.delete(id)); }
}
