import { getGlobalStore, useStore } from '@egen-civitas/esm-framework';
import {
  DEFAULT_TRANSIENT_DATE_RULES,
  isWindowFailure,
  resolveWindow,
  type TransientDateRules,
  type TransientWindowFailure,
} from './transient-time';

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
//  Fenêtre d'affichage : un niveau s'affiche tout de suite et dure indéfiniment par défaut.
//    • `startsAt`  : début programmé (date/heure précise) — le niveau reste invisible (et ne prend aucune hauteur)
//                    jusqu'à l'heure dite, puis entre avec l'animation ;
//    • `expiresAt` : fin (date/heure précise) ;  `ttl` (ms) : durée comptée à partir du DÉBUT d'affichage ;
//    • si `expiresAt` et `ttl` sont donnés, la plus proche gagne.
//  Dates : nombre (epoch ms), Date, ou chaîne ISO 8601 AVEC heure et décalage (`2026-11-06T09:00:00+01:00`). Une chaîne sans
//  décalage est refusée (réglage `topbar.announcements`, voir transient-time.ts). Une valeur invalide n'ouvre rien
//  (et une entrée invalide écrite directement dans le store est retirée avec un avertissement console).
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
  /** Début d'affichage programmé (ms epoch, ou chaîne ISO 8601 avec décalage) ; absent/`null` = immédiat. */
  startsAt?: number | string | null;
  /** Fin d'affichage (ms epoch, ou chaîne ISO 8601 avec décalage) ; `null` = illimitée. */
  expiresAt: number | string | null;
  /** Durée de vie en ms comptée à partir du début d'affichage (pour les écrivains directs du store). */
  ttl?: number;
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
  /** Début programmé (date/heure précise) : le niveau n'apparaît qu'à ce moment-là. Défaut : immédiat. */
  startsAt?: number | string | Date;
  /** Durée de vie en ms, comptée à partir du début d'affichage (`startsAt`, ou l'ouverture). */
  ttl?: number;
  /** Fin précise (date/heure). */
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

let dateRules: TransientDateRules = DEFAULT_TRANSIENT_DATE_RULES;
/** Règles de lecture des dates (publiées depuis la config `topbar.announcements` par la TopBar). */
export const setTransientDateRules = (rules: TransientDateRules): void => {
  dateRules = rules;
};
export const getTransientDateRules = (): TransientDateRules => dateRules;

/** Message d'avertissement lisible pour une fenêtre invalide. */
export function describeWindowError(id: string, w: TransientWindowFailure): string {
  const hint =
    w.reason === 'offset-required'
      ? 'décalage horaire manquant (ex. 2026-11-06T09:00:00+01:00)'
      : w.reason === 'ends-before-start'
        ? 'la fin est antérieure ou égale au début'
        : w.reason === 'invalid-offset'
          ? 'décalage horaire invalide'
          : w.reason === 'invalid-date'
            ? 'date ou heure inexistante'
            : 'format attendu : ISO 8601 avec heure et décalage';
  return `[topbar] niveau éphémère « ${id} » ignoré (${w.field}) : ${hint}.`;
}

/** Ouvre (ou met à jour) un niveau éphémère. Retourne son id, ou `null` si les dates sont invalides ou la fin déjà passée. */
export function openTopBarLevel(options: TopBarTransientOptions): string | null {
  const now = Date.now();
  const id = options.id ?? `transient-${now}-${++counter}`;
  const w = resolveWindow(
    { openedAt: now, startsAt: options.startsAt, expiresAt: options.expiresAt, ttl: options.ttl },
    dateRules,
  );
  if (isWindowFailure(w)) {
    console.warn(describeWindowError(id, w));
    return null;
  }
  if (w.end !== null && w.end <= now) return null;
  // Dates normalisées en epoch : la TopBar n'a plus à les relire.
  const level: TopBarTransientLevel = {
    id,
    extension: options.extension,
    props: options.props,
    openedAt: now,
    startsAt: w.start > now ? w.start : null,
    expiresAt: w.end,
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
