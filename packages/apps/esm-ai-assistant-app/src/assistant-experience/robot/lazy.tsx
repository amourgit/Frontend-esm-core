'use client';

import React, { Suspense, lazy } from 'react';
import type { RobotStageProps } from './RobotStage.js';

// `three` et `@react-three/fiber` pèsent plusieurs centaines de Ko : on ne les télécharge qu'au
// premier affichage du robot. Importer ce module ne doit JAMAIS déclencher ce chargement.
const RobotStage = lazy(() => import('./RobotStage.js').then((m) => ({ default: m.RobotStage })));

/** Préchauffe le module 3D (à appeler à la première intention d'ouverture : survol, focus…). */
export function preloadAssistantRobot(): void {
  // Un échec de chargement ici n'est pas grave : il sera signalé (et géré) à l'affichage réel.
  import('./RobotStage.js').catch(() => undefined);
}

/** Affiché à la place du robot quand le rendu 3D est impossible (pas de WebGL, GPU perdu, module introuvable…). */
function RobotUnavailable() {
  return (
    <div
      role="status"
      aria-label="Robot 3D indisponible"
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <p className="text-sm text-white/60">Robot 3D indisponible — la conversation reste utilisable.</p>
    </div>
  );
}

interface RobotErrorBoundaryProps {
  children: React.ReactNode;
  /** Remplace le message par défaut. */
  fallback?: React.ReactNode;
  /** Appelé avec l'erreur capturée (journalisation, télémétrie…). */
  onError?: (error: unknown) => void;
}

/**
 * Isole le robot : une erreur de rendu 3D (WebGL absent, perte de contexte GPU, chargement du module
 * échoué…) ne doit jamais faire tomber la page ni la conversation qui l'entoure.
 */
export class RobotErrorBoundary extends React.Component<RobotErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[assistant-robot] Le rendu 3D a échoué ; le reste de la page reste utilisable.', error);
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? <RobotUnavailable />) : this.props.children;
  }
}

/** Scène 3D du robot assistant, chargée à la demande et isolée des erreurs. Mêmes props que `RobotStage`. */
export function AssistantRobotScene(props: RobotStageProps) {
  return (
    <RobotErrorBoundary>
      <Suspense
        fallback={
          <div
            role="status"
            aria-label="Chargement du robot"
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <RobotStage {...props} />
      </Suspense>
    </RobotErrorBoundary>
  );
}

export default AssistantRobotScene;
