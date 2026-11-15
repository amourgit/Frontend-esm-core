// =============================================================================
//  Domaine EGEN Character Factory — contrats de la feuille de route (§4)
//  AUCUN import de react, three, ni du Core : types et invariants purs.
// =============================================================================

export const RESOURCE_KINDS = [
  'character',
  'part', // élément modulaire issu d'un manifeste CharacterStudio : le manifeste historique ne distingue pas corps / vêtement / accessoire
  'garment',
  'accessory',
  'animation',
  'expression',
  'texture',
  'environment',
] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export const PUBLICATION_STATUSES = ['draft', 'validated', 'published', 'deprecated'] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const FILE_ROLES = ['original', 'optimized', 'preview'] as const;
export type FileRole = (typeof FILE_ROLES)[number];

export interface ResourceFile {
  role: FileRole;
  uri: string;
  format: string;
  sizeBytes?: number;
  hash?: string;
}

export interface ResourceCompatibility {
  skeleton?: string;
  slots: string[];
  attachmentPoints: string[];
  constraints: string[];
}

export type ResourceOrigin = 'legacy-manifest' | 'import' | 'library';

export interface Resource {
  id: string;
  kind: ResourceKind;
  name: string;
  description?: string;
  tags: string[];
  collections: string[];
  version: string;
  status: PublicationStatus;
  files: ResourceFile[];
  /** Éléments assemblés par défaut pour ce personnage (ex. traits initiaux d'un manifeste historique) : sert à l'aperçu. */
  defaults?: VersionRef[];
  compatibility: ResourceCompatibility;
  source: { origin: ResourceOrigin; reference?: string; license?: string; author?: string };
  scope?: { tenantId?: string; organizationId?: string };
}

/** Référence épinglée à une version précise d'une ressource. */
export interface VersionRef {
  id: string;
  version: string;
}

export interface CompositionItem {
  slot: string;
  ref: VersionRef;
  overrides?: { color?: string; texture?: VersionRef; blendshapes?: Record<string, number> };
}

export interface Composition {
  id: string;
  name: string;
  version: number;
  status: PublicationStatus;
  variantOf?: { id: string; version: number };
  base: VersionRef;
  items: CompositionItem[];
  appearance: { blendshapes: Record<string, number>; colors: Record<string, string> };
  defaultState?: StateSet;
  createdAt: string;
  updatedAt: string;
}

export const INSTRUCTION_TYPES = [
  'setState',
  'playAnimation',
  'setExpression',
  'setGaze',
  'setLipSync',
  'swapItem',
  'reset',
] as const;
export type InstructionType = (typeof INSTRUCTION_TYPES)[number];

export type GazeTarget = 'user' | 'camera' | 'point' | 'mouse' | 'none';

/** États par couches indépendantes. */
export interface StateSet {
  body?: { animationId?: string; loop?: boolean; weight?: number };
  expression?: { id?: string; intensity?: number };
  emotion?: { id?: string; intensity?: number };
  gaze?: { target: GazeTarget; point?: [number, number, number] };
  blink?: { enabled: boolean };
  lipsync?: { enabled: boolean; source?: 'audio' | 'visemes' };
  macro?: string;
}

/** Version d'une composition dans un profil : un numéro précis, ou « dernière publiée » (profil uniquement). */
export type CompositionRef = { id: string; version: number | 'latest-published' };

export interface PresentationProfile {
  id: string;
  composition: CompositionRef;
  context: string;
  camera?: { distance?: number; height?: number; fov?: number };
  framing?: 'full' | 'bust' | 'face';
  background?: string;
  size?: { width?: number; height?: number };
  initialState: StateSet;
  allowedCapabilities: InstructionType[];
}

export interface Instruction {
  id: string;
  instanceId: string;
  type: InstructionType;
  params: Record<string, unknown>;
  issuedAt: string;
  ttl?: number;
}

export interface InstructionReport {
  instructionId: string;
  status: 'applied' | 'rejected' | 'failed';
  reason?: string;
}

export type DomainErrorCode =
  | 'INVALID'
  | 'NOT_FOUND'
  | 'IMMUTABLE_VERSION'
  | 'MISSING_REFERENCE'
  | 'ALREADY_EXISTS';

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly details: unknown = undefined,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
