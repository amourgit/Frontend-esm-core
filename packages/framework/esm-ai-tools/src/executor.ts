// =============================================================================
//  @eigen/esm-ai-tools — Pipeline d'exécution
//
//  Ordre d'exécution pour chaque demande de tool :
//    1. Résoudre le tool dans le registre
//    2. Valider les arguments (schéma + coercion)
//    3. Vérifier les permissions (privilèges utilisateur)
//    4. Appliquer les décorateurs (chaîne)
//    5. Exécuter la fonction principale avec timeout
//    6. Émettre les événements (TOOL_EXECUTED | TOOL_FAILED)
//    7. Retourner AIToolResult
// =============================================================================

import { dispatchAIEvent, AI_EVENTS } from '@eigen/esm-ai-events';
import { getAIConfig } from '@eigen/esm-ai-config';
import { sessionStore } from '@eigen/esm-api';
import { getTool } from './registry';
import { validateToolArgs, checkToolPermissions } from './validation';
import type { AIToolRequest, AIToolResult, AIToolExecutionContext, AIToolDecorator } from './types';

let _executionCounter = 0;

function generateExecutionId(): string {
  return `exec-${Date.now()}-${++_executionCounter}`;
}

/**
 * Exécute un tool avec le pipeline complet de validation → permissions → exécution.
 *
 * @example
 * ```ts
 * const result = await executeTool({ tool: 'navigate', arguments: { route: '/students' } });
 * if (result.success) console.log('Navigué avec succès');
 * else console.error(result.error);
 * ```
 */
export async function executeTool(
  request: AIToolRequest,
  aiContext?: import('@eigen/esm-ai-context').AIContext | null,
): Promise<AIToolResult> {
  const startTime = performance.now();
  const executionId = generateExecutionId();
  const config = getAIConfig();

  // ── 1. Résoudre le tool ──────────────────────────────────────────────────────
  const entry = getTool(request.tool);
  if (!entry) {
    return fail(`Tool inconnu : "${request.tool}"`, startTime);
  }

  const { definition, decorators } = entry;

  dispatchAIEvent(AI_EVENTS.TOOL_EXECUTING, {
    toolId: definition.id,
    toolName: definition.name,
    executionId,
    args: sanitizeForLog(request.arguments),
  });

  // ── 2. Valider les arguments ─────────────────────────────────────────────────
  if (config.security.validateToolsClient) {
    const validation = validateToolArgs(request.arguments, definition.parameters);
    if (!validation.valid) {
      const error = `Arguments invalides pour "${definition.id}" : ${validation.errors.join(' | ')}`;
      dispatchAIEvent(AI_EVENTS.TOOL_FAILED, {
        toolId: definition.id,
        toolName: definition.name,
        executionId,
        error,
        durationMs: elapsed(startTime),
      });
      return fail(error, startTime);
    }
    request = { ...request, arguments: validation.coercedArgs ?? request.arguments };
  }

  // ── 3. Vérifier les permissions ──────────────────────────────────────────────
  const sessionState = sessionStore.getState();
  const session = sessionState.loaded ? sessionState.session : null;
  const userPrivileges = session?.user?.privileges?.map((p) => p.display) ?? [];

  const permCheck = checkToolPermissions(definition.requiredPrivileges ?? [], userPrivileges);
  if (!permCheck.allowed) {
    dispatchAIEvent(AI_EVENTS.TOOL_PERMISSION_DENIED, {
      toolId: definition.id,
      requiredPrivileges: definition.requiredPrivileges ?? [],
      userPrivileges,
    });
    const error = `Permission refusée pour "${definition.id}". Privilèges manquants : ${permCheck.missing.join(', ')}`;
    return fail(error, startTime);
  }

  // ── 4. Construire le contexte d'exécution ────────────────────────────────────
  const ctx: AIToolExecutionContext = {
    executionId,
    args: request.arguments,
    aiContext,
    session,
  };

  // ── 5. Appliquer les décorateurs + exécuter avec timeout ─────────────────────
  try {
    const timeoutMs = config.security.toolTimeoutMs;
    const result = await withTimeout(
      executeWithDecorators(definition.execute, decorators, ctx),
      timeoutMs,
      definition.id,
      executionId,
      startTime,
    );

    const durationMs = elapsed(startTime);

    dispatchAIEvent(AI_EVENTS.TOOL_EXECUTED, {
      toolId: definition.id,
      toolName: definition.name,
      executionId,
      durationMs,
      success: result.success,
    });

    return { ...result, durationMs };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const durationMs = elapsed(startTime);

    dispatchAIEvent(AI_EVENTS.TOOL_FAILED, {
      toolId: definition.id,
      toolName: definition.name,
      executionId,
      error,
      durationMs,
    });

    return { success: false, error, durationMs };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elapsed(start: number): number {
  return Math.round(performance.now() - start);
}

function fail(error: string, start: number): AIToolResult {
  return { success: false, error, durationMs: elapsed(start) };
}

/** Supprime les données sensibles des logs */
function sanitizeForLog(args: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE = new Set(['password', 'token', 'secret', 'key', 'credential']);
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    sanitized[k] = SENSITIVE.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return sanitized;
}

/** Compose la chaîne de décorateurs autour de la fonction d'exécution principale */
async function executeWithDecorators(
  execute: AIToolExecutionContext['args'] extends infer _ ? (ctx: AIToolExecutionContext) => Promise<AIToolResult> : never,
  decorators: AIToolDecorator[],
  ctx: AIToolExecutionContext,
): Promise<AIToolResult> {
  if (decorators.length === 0) return execute(ctx);

  // Composer les décorateurs : chaque décorateur reçoit le suivant comme "execute"
  let composed: (ctx: AIToolExecutionContext) => Promise<AIToolResult> = execute;
  for (const decorator of [...decorators].reverse()) {
    const next = composed;
    composed = (c) => decorator(next, c);
  }
  return composed(ctx);
}

/** Enveloppe une Promise avec un timeout */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  toolId: string,
  executionId: string,
  start: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      dispatchAIEvent(AI_EVENTS.TOOL_TIMEOUT, {
        toolId,
        toolName: toolId,
        executionId,
        timeoutMs,
      });
      reject(new Error(`Tool "${toolId}" a dépassé le timeout de ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (result) => { clearTimeout(timer); resolve(result); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}
