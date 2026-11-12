import type { Resource } from './types';

// =============================================================================
//  Moteur de compatibilité (phase 9) — règles pures, sans I/O.
//  Trois verdicts, toujours accompagnés de raisons :
//    compatible  : aucun obstacle connu
//    adaptation  : utilisable moyennant une adaptation réalisable (ex. recalage d'une animation FBX sur l'humanoïde VRM)
//    incompatible: au moins un obstacle bloquant
//  Ce qui n'est pas vérifiable (squelette inconnu, collection d'origine différente…) est signalé en `info`
//  sans changer le verdict : on ne déclare pas « compatible » ce qu'on n'a pas pu vérifier sans le dire.
// =============================================================================

export type Verdict = 'compatible' | 'adaptation' | 'incompatible';
export type Severity = 'blocking' | 'adaptable' | 'info';

export interface Reason {
  code: string;
  severity: Severity;
  message: string;
}
export interface Adaptation {
  type: 'retarget';
  description: string;
}
export interface CompatibilityReport {
  verdict: Verdict;
  reasons: Reason[];
  adaptations: Adaptation[];
}

const MODULAR = new Set(['part', 'garment', 'accessory']);
const reason = (code: string, severity: Severity, message: string): Reason => ({ code, severity, message });

function conflictsWith(a: Resource, b: Resource): boolean {
  // `conflicts-with:<id>` est symétrique (cf. manifestRestrictions.js) : A→B ou B→A suffit.
  const declares = (x: Resource, y: Resource) => x.compatibility.constraints.includes(`conflicts-with:${y.id}`);
  return declares(a, b) || declares(b, a);
}

function skeletonReasons(subject: Resource, target: Resource, out: Reason[]) {
  const s = subject.compatibility.skeleton;
  const t = target.compatibility.skeleton;
  if (s && t && s !== t) out.push(reason('skeleton-mismatch', 'blocking', `Squelettes différents (${s} ≠ ${t}).`));
  else if (!s || !t) out.push(reason('skeleton-unknown', 'info', 'Squelette non renseigné : compatibilité non vérifiable.'));
}

/** Verdict de « `subject` peut-il être utilisé avec `target` ? » (élément sur un personnage, animation sur un personnage, etc.) */
export function checkPair(subject: Resource, target: Resource): CompatibilityReport {
  const reasons: Reason[] = [];
  const adaptations: Adaptation[] = [];

  if (subject.status === 'deprecated') reasons.push(reason('deprecated', 'info', 'Cette ressource est dépréciée.'));

  if (MODULAR.has(subject.kind) && target.kind === 'character') {
    skeletonReasons(subject, target, reasons);
    const available = target.compatibility.slots;
    if (!available.length) reasons.push(reason('slots-unknown', 'info', 'Emplacements du personnage non renseignés.'));
    else {
      const missing = subject.compatibility.slots.filter((s) => !available.includes(s));
      if (missing.length) reasons.push(reason('slot-unavailable', 'blocking', `Emplacement(s) absent(s) du personnage : ${missing.join(', ')}.`));
    }
    if (subject.collections.length && target.collections.length && !subject.collections.some((c) => target.collections.includes(c))) {
      reasons.push(reason('different-collection', 'info', "Ressource d'une autre collection que le personnage : assemblage non vérifié."));
    }
  } else if (subject.kind === 'texture' && (MODULAR.has(target.kind) || target.kind === 'character')) {
    if (!subject.compatibility.slots.some((s) => target.compatibility.slots.includes(s))) {
      reasons.push(reason('slot-mismatch', 'blocking', "La texture ne vise pas l'emplacement de cet élément."));
    }
  } else if (subject.kind === 'animation' && target.kind === 'character') {
    skeletonReasons(subject, target, reasons);
    const blocked = reasons.some((r) => r.severity === 'blocking');
    const format = subject.files.find((f) => f.role === 'original')?.format;
    if (!blocked && format === 'fbx') {
      reasons.push(reason('retarget-required', 'adaptable', 'Animation FBX : recalage sur le squelette humanoïde requis (réalisé automatiquement).'));
      adaptations.push({ type: 'retarget', description: 'Recalage de l\'animation FBX (Mixamo) sur le squelette humanoïde VRM.' });
    } else if (!blocked && format && format !== 'fbx') {
      reasons.push(reason('animation-format-unknown', 'info', `Format d'animation « ${format} » : recalage non vérifié.`));
    }
  } else if (MODULAR.has(subject.kind) && MODULAR.has(target.kind)) {
    const shared = subject.compatibility.slots.filter((s) => target.compatibility.slots.includes(s));
    if (shared.length) reasons.push(reason('slot-conflict', 'blocking', `Même emplacement : ${shared.join(', ')}.`));
    if (conflictsWith(subject, target)) reasons.push(reason('declared-conflict', 'blocking', 'Conflit déclaré par le manifeste : ne peuvent pas être portés ensemble.'));
  } else {
    reasons.push(reason('unsupported-pair', 'blocking', `Association « ${subject.kind} » / « ${target.kind} » non prise en charge.`));
  }

  const verdict: Verdict = reasons.some((r) => r.severity === 'blocking') ? 'incompatible' : reasons.some((r) => r.severity === 'adaptable') ? 'adaptation' : 'compatible';
  return { verdict, reasons, adaptations };
}

const rank: Record<Verdict, number> = { compatible: 0, adaptation: 1, incompatible: 2 };
export const worstVerdict = (verdicts: Verdict[]): Verdict => verdicts.reduce<Verdict>((w, v) => (rank[v] > rank[w] ? v : w), 'compatible');
