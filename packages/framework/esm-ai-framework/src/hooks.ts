// =============================================================================
//  @eigen/esm-ai-framework — React hooks pour les consommateurs (Layer 2)
// =============================================================================

import { useSyncExternalStore, useCallback, useEffect, useRef } from 'react';
import { useAIConfig, useAIEnabled } from '@eigen/esm-ai-config';
import { aiContextStore, getAIContextJson } from '@eigen/esm-ai-context';
import { getAllTools, executeTool, getToolsSchemaForLLM } from '@eigen/esm-ai-tools';
import { sessionStore } from '@eigen/esm-api';
import type { AIToolRequest, AIToolResult } from '@eigen/esm-ai-tools';
import type { AIContext } from '@eigen/esm-ai-context';

export { useAIConfig, useAIEnabled } from '@eigen/esm-ai-config';

// ─── useAIContext ─────────────────────────────────────────────────────────────

/**
 * Hook React donnant accès au contexte IA courant (snapshot réactif).
 * Se met à jour automatiquement à chaque changement de session, tenant, route…
 */
export function useAIContext(): AIContext | null {
  return useSyncExternalStore(
    aiContextStore.subscribe,
    () => aiContextStore.getState().context,
    () => null,
  );
}

/**
 * Hook React pour le contexte IA sérialisé en JSON (pour l'envoi au backend).
 */
export function useAIContextJson(): string {
  return useSyncExternalStore(
    aiContextStore.subscribe,
    getAIContextJson,
    () => '{}',
  );
}

// ─── useExecuteTool ───────────────────────────────────────────────────────────

export interface UseExecuteToolResult {
  execute: (request: AIToolRequest) => Promise<AIToolResult>;
  executing: boolean;
  lastResult: AIToolResult | null;
  lastError: string | null;
}

/**
 * Hook pour exécuter des tools IA depuis un composant React.
 *
 * @example
 * ```tsx
 * const { execute, executing } = useExecuteTool();
 * await execute({ tool: 'navigate', arguments: { route: '/students' } });
 * ```
 */
export function useExecuteTool(): UseExecuteToolResult {
  const executingRef = useRef(false);
  const [state, setState] = useSyncExternalStoreShim<{
    executing: boolean;
    lastResult: AIToolResult | null;
    lastError: string | null;
  }>({
    executing: false,
    lastResult: null,
    lastError: null,
  });

  const context = useAIContext();

  const execute = useCallback(
    async (request: AIToolRequest): Promise<AIToolResult> => {
      if (executingRef.current) {
        return { success: false, error: 'Un tool est déjà en cours d\'exécution', durationMs: 0 };
      }

      executingRef.current = true;
      setState((s) => ({ ...s, executing: true, lastError: null }));

      try {
        const result = await executeTool(request, context);
        setState({ executing: false, lastResult: result, lastError: result.error ?? null });
        return result;
      } catch (err) {
        const error = String(err);
        setState({ executing: false, lastResult: null, lastError: error });
        return { success: false, error, durationMs: 0 };
      } finally {
        executingRef.current = false;
      }
    },
    [context],
  );

  return { execute, ...state };
}

// ─── useAvailableTools ────────────────────────────────────────────────────────

/**
 * Hook retournant la liste des tools disponibles pour l'utilisateur courant.
 * Filtré selon les privilèges de la session.
 */
export function useAvailableToolsSchema(): object[] {
  const sessionState = useSyncExternalStore(
    sessionStore.subscribe,
    () => sessionStore.getState(),
    () => sessionStore.getState(),
  );

  const privileges =
    sessionState.loaded && sessionState.session?.user
      ? (sessionState.session.user.privileges?.map((p) => p.display) ?? [])
      : [];

  return getToolsSchemaForLLM(privileges);
}

// ─── Shim helper ─────────────────────────────────────────────────────────────

/** Mini useState-like avec getter pour useSyncExternalStore */
function useSyncExternalStoreShim<T>(initial: T): [T, (updater: T | ((prev: T) => T)) => void] {
  const storeRef = useRef<{ value: T; listeners: Set<() => void> }>({
    value: initial,
    listeners: new Set(),
  });

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    const next = typeof updater === 'function' ? (updater as (p: T) => T)(storeRef.current.value) : updater;
    storeRef.current.value = next;
    storeRef.current.listeners.forEach((l) => l());
  }, []);

  const value = useSyncExternalStore(
    useCallback((listener) => {
      storeRef.current.listeners.add(listener);
      return () => storeRef.current.listeners.delete(listener);
    }, []),
    () => storeRef.current.value,
    () => initial,
  );

  return [value, setState];
}
