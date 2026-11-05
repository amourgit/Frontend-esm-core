import { getGlobalStore, useStore } from '@egen-civitas/esm-framework';

// =============================================================================
//  NIVEAUX ÉPHÉMÈRES — bandeaux ajoutés à chaud, avec durée de vie
//
//  Une app qui veut afficher un message, un bandeau d'alerte ou un défilant (« flash info ») SANS savoir combien de
//  niveaux existent ouvre un niveau éphémère : il se place automatiquement APRÈS le dernier niveau actuel (si la
//  TopBar a 2 niveaux, il devient le 3e), apparaît et disparaît avec une animation. Plusieurs niveaux éphémères
//  s'empilent dans l'ordre d'ouverture, toujours sous les niveaux numérotés.
//
//  1. Déclarer le composant (une fois, `routes.json` de l'app) :
//       { "name": "flash-info", "slot": "topbar-transient-slot", "component": "flashInfo" }
//     Il reçoit en props : ses `props`, `levelId` et `close()`.
//  2. L'ouvrir quand on veut (store global, aucune dépendance de code) :
//       const store = getGlobalStore('egen-topbar-transient', { levels: [] });
//       store.setState((s) => ({ levels: [...s.levels, { id: 'flash-1', extension: 'flash-info', props: { text },
//         openedAt: Date.now(), expiresAt: Date.now() + 60_000, closing: false }] }));
//     (ou `openTopBarLevel({ extension, ttl, expiresAt, props, background })` depuis cette app)
//  3. La fermer : `closing: true` sur son entrée (ou `close()` depuis le composant) ; l'animation de sortie suit.
//
//  Durée de vie : illimitée par défaut. `ttl` (ms depuis l'ouverture) et/ou `expiresAt` (date/heure précise) ; si les
//  deux sont donnés, la plus proche gagne. Une valeur invalide ou ≤ 0 est ignorée (durée illimitée).
// =============================================================================

export const TOPBAR_TRANSIENT_STORE = 'egen-topbar-transient';
/** Slot où les apps attachent les composants de niveaux éphémères. */
export const TOPBAR_TRANSIENT_SLOT = 'topbar-transient-slot';

export interface TopBarTransientLevel {
  id: string;
  /** Nom de l'extension (attachée à `topbar-transient-slot`) qui rend le contenu du niveau. */
  extension: string;
  props?: Record<string, unknown>;
  openedAt: number;
  /** Échéance (ms epoch) ; `null` = illimitée. */
  expiresAt: number | null;
  /** Arrière-plan CSS du niveau ; transparent par défaut. */
  background?: string;
  /** `true` : sortie animée en cours, puis retrait. */
  closing: boolean;
}

export interface TopBarTransientState {
  levels: TopBarTransientLevel[];
}

export interface TopBarTransientOptions {
  /** Identifiant (ouvrir avec un id existant met à jour ce niveau). Défaut : généré. */
  id?: string;
  extension: string;
  props?: Record<string, unknown>;
  /** Durée de vie en ms depuis l'ouverture. */
  ttl?: number;
  /** Échéance précise. */
  expiresAt?: number | string | Date;
  background?: string;
}

export const getTopBarTransientStore = () =>
  getGlobalStore<TopBarTransientState>(TOPBAR_TRANSIENT_STORE, { levels: [] });

export const useTopBarTransientLevels = (): TopBarTransientLevel[] => useStore(getTopBarTransientStore()).levels;

/** Échéance effective (ms epoch) ou `null` si illimitée ; la plus proche de `ttl` et `expiresAt` gagne. */
export function resolveExpiry(now: number, ttl?: number, expiresAt?: number | string | Date): number | null {
  const candidates: number[] = [];
  if (typeof ttl === 'number' && Number.isFinite(ttl) && ttl > 0) candidates.push(now + ttl);
  if (expiresAt !== undefined) {
    const t = expiresAt instanceof Date ? expiresAt.getTime() : typeof expiresAt === 'number' ? expiresAt : Date.parse(expiresAt);
    if (Number.isFinite(t)) candidates.push(t);
  }
  return candidates.length ? Math.min(...candidates) : null;
}

let counter = 0;

/** Ouvre (ou met à jour) un niveau éphémère. Retourne son id, ou `null` si l'échéance est déjà passée. */
export function openTopBarLevel(options: TopBarTransientOptions): string | null {
  const now = Date.now();
  const expiresAt = resolveExpiry(now, options.ttl, options.expiresAt);
  if (expiresAt !== null && expiresAt <= now) return null;
  const id = options.id ?? `transient-${now}-${++counter}`;
  const level: TopBarTransientLevel = {
    id,
    extension: options.extension,
    props: options.props,
    openedAt: now,
    expiresAt,
    background: options.background,
    closing: false,
  };
  getTopBarTransientStore().setState((s) =>
    s.levels.some((l) => l.id === id)
      ? { levels: s.levels.map((l) => (l.id === id ? { ...level, openedAt: l.openedAt } : l)) }
      : { levels: [...s.levels, level] },
  );
  return id;
}

/** Ferme un niveau éphémère (sortie animée, puis retrait). */
export function closeTopBarLevel(id: string): void {
  getTopBarTransientStore().setState((s) => ({
    levels: s.levels.map((l) => (l.id === id && !l.closing ? { ...l, closing: true } : l)),
  }));
}

/** Retrait définitif (fin de l'animation de sortie). */
export function removeTopBarLevel(id: string): void {
  getTopBarTransientStore().setState((s) => ({ levels: s.levels.filter((l) => l.id !== id) }));
}
