import { getGlobalStore } from '@egen-civitas/esm-framework';

// =============================================================================
//  ANNONCE EN NIVEAU ÉPHÉMÈRE DE LA TOPBAR
//
//  L'annuaire ne connaît pas le nombre de niveaux de la TopBar : il dépose une entrée dans le store global
//  `egen-topbar-transient` (contrat public de esm-primary-navigation-app, aucune dépendance de code) ; la TopBar
//  place le niveau après le dernier niveau actuel, l'anime et le retire à l'échéance.
//  Le composant rendu est l'extension `ANNOUNCEMENT_EXTENSION`, attachée au slot `topbar-transient-slot` (routes.json).
// =============================================================================

export const TOPBAR_TRANSIENT_STORE = 'egen-topbar-transient';
export const ANNOUNCEMENT_EXTENSION = 'annuaire-welcome-banner';
export const ANNOUNCEMENT_LEVEL_ID = 'annuaire-welcome';

interface TransientLevel {
  id: string;
  extension: string;
  props?: Record<string, unknown>;
  openedAt: number;
  expiresAt: number | null;
  background?: string;
  closing: boolean;
}

export interface AnnouncementOptions {
  /** Texte de l'annonce (déjà interpolé). */
  text: string;
  /** Durée de vie en ms depuis l'ouverture. */
  ttl?: number;
  /** Échéance précise (date/heure) ; si `ttl` est aussi donné, la plus proche gagne. */
  expiresAt?: number | string | Date;
  background?: string;
  textColor?: string;
  /** Défaut : `ANNOUNCEMENT_LEVEL_ID` (rouvrir met à jour le même niveau au lieu d'en empiler un second). */
  id?: string;
}

/** Remplace `{name}` et `{role}` ; une variable vide retire aussi la ponctuation qui la précède (« , {role} »). */
export function formatAnnouncement(template: string, vars: { name: string; role: string }): string {
  return template
    .replace(/\s*,\s*\{role\}/g, vars.role ? `, ${vars.role}` : '')
    .replace(/\{name\}/g, vars.name)
    .replace(/\{role\}/g, vars.role)
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function resolveExpiry(now: number, ttl?: number, expiresAt?: number | string | Date): number | null {
  const candidates: number[] = [];
  if (typeof ttl === 'number' && Number.isFinite(ttl) && ttl > 0) candidates.push(now + ttl);
  if (expiresAt !== undefined) {
    const t = expiresAt instanceof Date ? expiresAt.getTime() : typeof expiresAt === 'number' ? expiresAt : Date.parse(expiresAt);
    if (Number.isFinite(t)) candidates.push(t);
  }
  return candidates.length ? Math.min(...candidates) : null;
}

/** Ouvre (ou met à jour) le niveau d'annonce. Retourne son id, ou `null` si l'échéance est déjà passée. */
export function openAnnouncementLevel(options: AnnouncementOptions): string | null {
  const now = Date.now();
  const expiresAt = resolveExpiry(now, options.ttl, options.expiresAt);
  if (expiresAt !== null && expiresAt <= now) return null;

  const id = options.id ?? ANNOUNCEMENT_LEVEL_ID;
  const level: TransientLevel = {
    id,
    extension: ANNOUNCEMENT_EXTENSION,
    props: { text: options.text, textColor: options.textColor },
    openedAt: now,
    expiresAt,
    background: options.background,
    closing: false,
  };
  getGlobalStore<{ levels: TransientLevel[] }>(TOPBAR_TRANSIENT_STORE, { levels: [] }).setState((s) =>
    s.levels.some((l) => l.id === id)
      ? { levels: s.levels.map((l) => (l.id === id ? { ...level, openedAt: l.openedAt } : l)) }
      : { levels: [...s.levels, level] },
  );
  return id;
}
