// Ports : ce dont l'application a besoin, sans dire comment c'est stocké ni transporté.
// Les adaptateurs (src/adapters) les implémentent ; le backend EGEN fournira les siens (cf. BACKEND-CONTRATS.md).
import type {
  Composition,
  Instruction,
  InstructionReport,
  PresentationProfile,
  Resource,
  ResourceKind,
} from '../domain/types';

export interface ResourceFilter {
  kind?: ResourceKind;
  text?: string;
  tags?: string[];
  collection?: string;
}

export interface ResourceRepository {
  list(filter?: ResourceFilter): Promise<Resource[]>;
  /** Sans `version` : la version la plus récente non dépréciée. */
  get(ref: { id: string; version?: string }): Promise<Resource | null>;
  listVersions(id: string): Promise<Resource[]>;
}

export interface CompositionRepository {
  list(): Promise<Composition[]>;
  /** Sans `version` : la version la plus élevée. */
  get(id: string, version?: number): Promise<Composition | null>;
  listVersions(id: string): Promise<Composition[]>;
  /** Enregistre exactement (id, version) ; l'immutabilité est garantie par CompositionService, pas par le stockage. */
  put(composition: Composition): Promise<void>;
  delete(id: string, version: number): Promise<void>;
}

export interface ProfileRepository {
  list(): Promise<PresentationProfile[]>;
  get(id: string): Promise<PresentationProfile | null>;
  put(profile: PresentationProfile): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface PermissionPort {
  can(action: string, subject?: { kind: string; id?: string }): boolean | Promise<boolean>;
}

export type Unsubscribe = () => void;

/** Canal entre le backend (qui décide) et le runtime (qui exécute). Transport abstrait. */
export interface RuntimeChannel {
  onInstruction(handler: (instruction: Instruction) => void): Unsubscribe;
  report(report: InstructionReport): void;
}
