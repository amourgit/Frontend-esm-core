// =============================================================================
//  @egen/esm-ai-assistant-app — Client du backend IA
//
//  Parle au backend proxy IA (baseUrl/chatEndpoint, baseUrl/streamEndpoint —
//  voir @egen/esm-ai-config, résolu depuis EGEN_AI_BACKEND_URL / civitas-core
//  en développement). C'est CE backend qui détient la clé API du provider
//  (Gemini) et l'appelle avec function-calling — jamais le frontend.
//
//  Pourquoi jamais le frontend : la clé API Gemini ne doit jamais transiter
//  ni résider côté navigateur (voir docs/theme-system-status.md n/a — cf.
//  l'audit de sécurité de esm-ai-tools, qui documente déjà ce principe pour
//  les tools). Le frontend envoie uniquement : le message, l'historique,
//  le contexte EGEN sérialisé (déjà tronqué, voir esm-ai-context) et le
//  schéma des tools disponibles pour l'utilisateur courant. Le backend
//  décide, appelle le LLM, et renvoie soit du texte, soit des demandes
//  d'exécution de tool — exécutées ICI, côté client, via l'executor de
//  @egen/esm-ai-tools (qui revalide lui-même permissions et arguments).
// =============================================================================

import { getAIConfig } from '@egen/esm-ai-framework';

export interface ChatMessageDTO {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  /** Présent uniquement pour role: 'tool' — résultat d'exécution renvoyé au LLM */
  toolCallId?: string;
  toolName?: string;
  /**
   * Arguments exacts avec lesquels le tool a été appelé — nécessaire pour
   * reconstruire, côté provider, le tour "functionCall" qui doit précéder un
   * tour "functionResponse" (voir @egen/esm-ai-assistant-app/services/
   * gemini-direct-client.ts). Absent pour les rôles user/assistant.
   */
  toolArguments?: Record<string, unknown>;
}

export interface ToolCallRequest {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
}

export interface ChatRequestBody {
  message: string;
  history: ChatMessageDTO[];
  context: string;
  tools: object[];
}

export interface ChatResponseDTO {
  /** Réponse texte finale du LLM (peut être vide si toolCalls est non-vide) */
  message: string;
  /** Appels de tool demandés par le LLM, à exécuter côté client */
  toolCalls: ToolCallRequest[];
  /** false si le LLM attend le résultat des toolCalls avant de conclure */
  done: boolean;
}

/** Événements du flux SSE de streaming */
export type StreamEvent =
  | { type: 'token'; text: string }
  | { type: 'tool_call'; id: string; tool: string; arguments: Record<string, unknown> }
  | { type: 'done' }
  | { type: 'error'; error: string };

function resolveUrl(path: string): string {
  const { backend } = getAIConfig();
  // '${egenBase}' peut être injecté comme valeur littérale par défaut (voir
  // esm-ai-config/defaults.ts) — on la résout depuis window.egenBase si présente.
  const base = backend.baseUrl.replace('${egenBase}', (window as any).egenBase ?? '');
  return `${base.replace(/\/$/, '')}${path}`;
}

/**
 * Envoie un message en mode non-streaming (fallback si EGEN_AI_STREAM=false
 * ou si le navigateur ne supporte pas ReadableStream sur fetch).
 */
export async function sendChatMessage(body: ChatRequestBody, signal?: AbortSignal): Promise<ChatResponseDTO> {
  const { backend } = getAIConfig();
  const response = await fetch(resolveUrl(backend.chatEndpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Le backend IA a répondu ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as ChatResponseDTO;
}

/**
 * Envoie un message en streaming (Server-Sent Events) et invoque `onEvent`
 * pour chaque événement reçu au fil de l'eau (tokens texte, demandes de
 * tool_call, fin de flux, erreur).
 */
export async function streamChatMessage(
  body: ChatRequestBody,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { backend } = getAIConfig();
  const response = await fetch(resolveUrl(backend.streamEndpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Le backend IA a répondu ${response.status} ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      // La dernière "frame" peut être incomplète — on la remet en buffer.
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        // Voir gemini-direct-client.ts : un bloc SSE peut étaler le JSON
        // d'un même évènement sur plusieurs lignes physiques sans répéter
        // le préfixe "data:". On traite donc le bloc entier comme un seul
        // JSON plutôt que de ne lire que sa première ligne.
        const trimmedFrame = frame.trim();
        if (!trimmedFrame.startsWith('data:')) continue;
        const raw = trimmedFrame.slice(5).trim();
        if (!raw) continue;

        try {
          const event = JSON.parse(raw) as StreamEvent;
          onEvent(event);
        } catch {
          // Ligne non-JSON (commentaire SSE, keep-alive) — ignorée silencieusement.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
