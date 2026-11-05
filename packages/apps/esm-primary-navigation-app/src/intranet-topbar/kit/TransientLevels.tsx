import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ExtensionSlot, type AssignedExtension } from '@egen-civitas/esm-framework';
import { useTopBarUi } from './context';
import {
  TOPBAR_TRANSIENT_SLOT,
  closeTopBarLevel,
  describeWindowError,
  removeTopBarLevel,
  setTransientDateRules,
  useTopBarTransientLevels,
  type TopBarTransientLevel,
} from './transient-store';
import {
  DEFAULT_TRANSIENT_DATE_RULES,
  isWindowFailure,
  resolveWindow,
  type TransientDateRules,
  type TransientWindowFailure,
} from './transient-time';

// =============================================================================
//  <TransientLevels> — niveaux éphémères, sous les niveaux numérotés (neutre)
//
//  Chaque niveau entre et sort avec une animation de hauteur + fondu (`grid-template-rows` 0fr ↔ 1fr) : la hauteur de
//  la TopBar varie en continu, et le shell (qui la mesure en direct) fait suivre le contenu des apps sans à-coup.
//  Respecte `prefers-reduced-motion`. L'échéance est surveillée ici : à l'heure dite, la sortie animée démarre.
//
//  Programmation : un niveau avec `startsAt` futur n'est PAS rendu (aucune hauteur) tant que l'heure n'est pas venue ;
//  un minuteur unique est armé sur le prochain début (et réévalué au retour d'onglet). Un niveau dont la fin est déjà
//  passée avant son affichage, ou annulé (`closing`) avant son début, est simplement retiré, sans animation parasite.
//  Les entrées invalides (date illisible, sans décalage alors qu'il est exigé, fin ≤ début) sont retirées avec un
//  avertissement console : ainsi une app qui écrit directement dans le store est soumise aux mêmes règles que `openTopBarLevel`.
// =============================================================================

/** Durée de l'animation (ms) : doit rester ≥ à `duration-500` ci-dessous. */
const LEAVE_MS = 520;
/** Plus long délai d'un setTimeout (≈ 24,8 jours) : au-delà, on réarme. */
const MAX_TIMEOUT = 2 ** 31 - 1;

const Row: React.FC<{ level: TopBarTransientLevel; expiresAt: number | null }> = ({ level, expiresAt }) => {
  const ui = useTopBarUi();
  const [entered, setEntered] = useState(false);

  // Entrée : monté fermé, puis ouvert à la frame suivante pour déclencher la transition.
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Échéance : à l'heure dite (réévaluée au retour d'onglet), la sortie démarre.
  const { id, closing } = level;
  useEffect(() => {
    if (expiresAt === null || closing) return;
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      const left = expiresAt - Date.now();
      if (left <= 0) closeTopBarLevel(id);
      else timer = setTimeout(arm, Math.min(left, MAX_TIMEOUT));
    };
    arm();
    document.addEventListener('visibilitychange', arm);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', arm);
    };
  }, [id, expiresAt, closing]);

  // Sortie : retrait définitif une fois l'animation terminée.
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => removeTopBarLevel(id), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [id, closing]);

  const select = useMemo(
    () => (extensions: AssignedExtension[]) => extensions.filter((e) => e.name === level.extension),
    [level.extension],
  );
  const state = useMemo(
    () => ({ ...ui, ...level.props, levelId: id, close: () => closeTopBarLevel(id) }),
    [ui, level.props, id],
  );
  const open = entered && !closing;

  return (
    <div
      data-transient={id}
      data-state={closing ? 'leaving' : entered ? 'open' : 'entering'}
      role="status"
      aria-live="polite"
      className={`grid w-full transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className="relative flex min-h-8 w-full items-center px-2 sm:px-4 md:px-6 lg:px-7"
          style={level.background ? { background: level.background } : undefined}
        >
          <ExtensionSlot name={TOPBAR_TRANSIENT_SLOT} state={state} select={select} className="flex w-full items-center" />
        </div>
      </div>
    </div>
  );
};

type Status = 'visible' | 'pending' | 'drop';
interface Planned {
  level: TopBarTransientLevel;
  status: Status;
  start: number;
  end: number | null;
  invalid?: TransientWindowFailure;
}

export const TransientLevels: React.FC<{ dateRules?: Partial<TransientDateRules> }> = ({ dateRules }) => {
  const levels = useTopBarTransientLevels();
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const shown = useRef(new Set<string>());

  const requireOffset = dateRules?.requireOffset ?? DEFAULT_TRANSIENT_DATE_RULES.requireOffset;
  const defaultOffset = dateRules?.defaultOffset ?? DEFAULT_TRANSIENT_DATE_RULES.defaultOffset;
  const rules = useMemo(() => ({ requireOffset, defaultOffset }), [requireOffset, defaultOffset]);
  // `openTopBarLevel` (appelé hors React) lit les mêmes règles que celles appliquées ici aux écritures directes.
  useEffect(() => setTransientDateRules(rules), [rules]);

  const now = Date.now();
  const plan: Planned[] = levels.map((level) => {
    const w = resolveWindow(level, rules);
    if (isWindowFailure(w)) return { level, status: 'drop', start: 0, end: null, invalid: w };
    const wasShown = shown.current.has(level.id);
    if (!wasShown && ((w.end !== null && w.end <= now) || level.closing)) return { level, status: 'drop', start: w.start, end: w.end };
    return { level, status: w.start > now ? 'pending' : 'visible', start: w.start, end: w.end };
  });

  // Mémorise ce qui a été affiché, oublie ce qui n'existe plus ; retire les niveaux invalides ou périmés avant affichage.
  const planRef = useRef(plan);
  planRef.current = plan;
  const planKey = plan.map((p) => `${p.level.id}:${p.status}`).join('|');
  useEffect(() => {
    const ids = new Set(levels.map((l) => l.id));
    shown.current.forEach((id) => ids.has(id) || shown.current.delete(id));
    for (const p of planRef.current) {
      if (p.status === 'visible') shown.current.add(p.level.id);
      if (p.status === 'drop') {
        if (p.invalid) console.warn(describeWindowError(p.level.id, p.invalid));
        removeTopBarLevel(p.level.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey]);

  // Un seul minuteur, armé sur le prochain début programmé ; réévalué au retour d'onglet (les minuteurs y sont ralentis).
  const nextStart = plan.reduce<number | null>(
    (min, p) => (p.status === 'pending' && (min === null || p.start < min) ? p.start : min),
    null,
  );
  useEffect(() => {
    if (nextStart === null) return;
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      const left = nextStart - Date.now();
      if (left <= 0) tick();
      else timer = setTimeout(arm, Math.min(left, MAX_TIMEOUT));
    };
    arm();
    document.addEventListener('visibilitychange', arm);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', arm);
    };
  }, [nextStart]);

  const visible = plan.filter((p) => p.status === 'visible');
  if (visible.length === 0) return null;
  return (
    <div data-slot="topbar-transient" className="flex w-full flex-col">
      {visible.map(({ level, end }) => (
        <Row key={level.id} level={level} expiresAt={end} />
      ))}
    </div>
  );
};
