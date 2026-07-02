// =============================================================================
//  @eigen/esm-ai-context — Store et réactivité
//
//  Le store écoute tous les stores EIGEN pertinents et reconstruit
//  le contexte automatiquement à chaque changement.
// =============================================================================

import { createGlobalStore, subscribeTo } from '@eigen/esm-state';
import { sessionStore } from '@eigen/esm-api';
import { AI_EVENTS, dispatchAIEvent } from '@eigen/esm-ai-events';
import { buildAIContext } from './builder';
import { onProviderRegistryChange } from './provider-registry';
import type { AIContextStore } from './types';

const STORE_NAME = 'eigen:ai:context';

export const aiContextStore = createGlobalStore<AIContextStore>(STORE_NAME, {
  context: null,
  building: false,
  providerCount: 0,
  contextSize: 0,
  truncated: false,
});

// ─── Rebuild avec debounce ────────────────────────────────────────────────────

let _rebuildTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 150;

export function scheduleContextRebuild(): void {
  if (_rebuildTimer) clearTimeout(_rebuildTimer);
  _rebuildTimer = setTimeout(() => {
    _rebuildTimer = null;
    rebuildContext();
  }, DEBOUNCE_MS);
}

function rebuildContext(): void {
  aiContextStore.setState((s) => ({ ...s, building: true }));

  try {
    const { context, contextJson, truncated, size } = buildAIContext();
    aiContextStore.setState({
      context,
      building: false,
      contextSize: size,
      truncated,
      providerCount: Object.keys(context.appContext).length,
    });

    dispatchAIEvent(AI_EVENTS.CONTEXT_UPDATED, {
      contextSize: size,
      providerCount: Object.keys(context.appContext).length,
      truncated,
    });
  } catch (err) {
    console.error('[EIGEN AI Context] Erreur lors de la construction du contexte :', err);
    aiContextStore.setState((s) => ({ ...s, building: false }));
  }
}

// ─── Initialisation des subscriptions réactives ───────────────────────────────

let _initialized = false;
const _unsubscribers: Array<() => void> = [];

/**
 * Initialise le système de contexte réactif.
 * Doit être appelé UNE SEULE FOIS au démarrage (via startupAIContext()).
 * S'abonne aux stores EIGEN pertinents pour reconstruire le contexte automatiquement.
 */
export function initAIContextReactivity(): () => void {
  if (_initialized) {
    console.warn('[EIGEN AI Context] initAIContextReactivity() déjà appelé. Ignorer.');
    return () => {};
  }
  _initialized = true;

  // ── Session (auth, user, privileges) ────────────────────────────────────────
  _unsubscribers.push(
    sessionStore.subscribe(() => scheduleContextRebuild()),
  );

  // ── Navigation (Single-SPA routing events) ──────────────────────────────────
  if (typeof window !== 'undefined') {
    const onRouting = () => scheduleContextRebuild();
    window.addEventListener('single-spa:routing-event', onRouting);
    _unsubscribers.push(() => window.removeEventListener('single-spa:routing-event', onRouting));
  }

  // ── Context Providers ────────────────────────────────────────────────────────
  _unsubscribers.push(
    onProviderRegistryChange(() => scheduleContextRebuild()),
  );

  // Construction initiale
  scheduleContextRebuild();

  return cleanup;
}

export function cleanup(): void {
  _unsubscribers.forEach((unsub) => unsub());
  _unsubscribers.length = 0;
  _initialized = false;
  if (_rebuildTimer) {
    clearTimeout(_rebuildTimer);
    _rebuildTimer = null;
  }
}

// ─── API publique ─────────────────────────────────────────────────────────────

export function getAIContext() {
  return aiContextStore.getState().context;
}

export function getAIContextJson(): string {
  const state = aiContextStore.getState();
  return state.context ? JSON.stringify(state.context) : '{}';
}

export function subscribeToAIContext(callback: (store: AIContextStore) => void): () => void {
  return subscribeTo(aiContextStore, callback);
}
