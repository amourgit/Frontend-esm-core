import React, { useEffect, useMemo, useState } from 'react';
import { ExtensionSlot, type AssignedExtension } from '@egen-civitas/esm-framework';
import { useTopBarUi } from './context';
import {
  TOPBAR_TRANSIENT_SLOT,
  closeTopBarLevel,
  removeTopBarLevel,
  useTopBarTransientLevels,
  type TopBarTransientLevel,
} from './transient-store';

// =============================================================================
//  <TransientLevels> — niveaux éphémères, sous les niveaux numérotés (neutre)
//
//  Chaque niveau entre et sort avec une animation de hauteur + fondu (`grid-template-rows` 0fr ↔ 1fr) : la hauteur de
//  la TopBar varie en continu, et le shell (qui la mesure en direct) fait suivre le contenu des apps sans à-coup.
//  Respecte `prefers-reduced-motion`. L'échéance est surveillée ici : à l'heure dite, la sortie animée démarre.
// =============================================================================

/** Durée de l'animation (ms) : doit rester ≥ à `duration-500` ci-dessous. */
const LEAVE_MS = 520;
/** Plus long délai d'un setTimeout (≈ 24,8 jours) : au-delà, on réarme. */
const MAX_TIMEOUT = 2 ** 31 - 1;

const Row: React.FC<{ level: TopBarTransientLevel }> = ({ level }) => {
  const ui = useTopBarUi();
  const [entered, setEntered] = useState(false);

  // Entrée : monté fermé, puis ouvert à la frame suivante pour déclencher la transition.
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Échéance : à l'heure dite (réévaluée au retour d'onglet), la sortie démarre.
  const { id, expiresAt, closing } = level;
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

export const TransientLevels: React.FC = () => {
  const levels = useTopBarTransientLevels();
  if (levels.length === 0) return null;
  return (
    <div data-slot="topbar-transient" className="flex w-full flex-col">
      {levels.map((level) => (
        <Row key={level.id} level={level} />
      ))}
    </div>
  );
};
