// =============================================================================
//  @egen/esm-ai-assistant-app — useAIChat
//
//  Orchestre un tour de conversation complet :
//    1. Envoie le message utilisateur + historique + contexte EGEN + schéma
//       des tools disponibles (déjà filtré par privilèges, voir
//       useAvailableToolsSchema()) au backend IA.
//    2. Si le backend (le LLM, via function-calling) demande l'exécution
//       d'un ou plusieurs tools, les exécute ICI via useExecuteTool() —
//       qui passe par le pipeline complet de @egen/esm-ai-tools
//       (validation d'arguments + vérification de permissions + timeout),
//       jamais en confiance aveugle du LLM.
//    3. Renvoie le(s) résultat(s) de tool au backend pour que le LLM
//       poursuive son raisonnement, jusqu'à une réponse finale (done: true).
//
//  Le tool "navigate" suit exactement ce chemin — aucun traitement spécial :
//  c'est la preuve que le pipeline générique de la Couche 1 fonctionne pour
//  n'importe quel tool natif ou déclaré par un microfrontend.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAIContextJson,
  useAvailableToolsSchema,
  useExecuteTool,
  getAIConfig,
  dispatchAIEvent,
  AI_EVENTS,
} from '@egen/esm-ai-framework';
import { loadPersistedMessages, persistMessages, clearPersistedMessages } from '../services/conversation-memory';
import * as backendTransport from '../services/ai-backend-client';
import * as directTransport from '../services/gemini-direct-client';
import type { ChatMessageDTO, StreamEvent, ToolCallRequest } from '../services/ai-backend-client';

/**
 * Sélectionne le transport à utiliser pour parler au LLM :
 *   - EGEN_AI_DIRECT_MODE=true (ou EGEN_AI_API_KEY renseignée) → appel direct
 *     du provider depuis le navigateur (voir gemini-direct-client.ts et son
 *     avertissement de sécurité).
 *   - Sinon → backend proxy (EGEN_AI_BACKEND_URL), le chemin recommandé en
 *     production.
 * Résolu à CHAQUE appel (pas une fois au chargement du module) pour rester
 * cohérent avec un changement de config à chaud (ex. tests, multi-tenant).
 */
function resolveTransport() {
  const { provider } = getAIConfig();
  return provider.directMode || provider.apiKey ? directTransport : backendTransport;
}

export interface AssistantToolCall {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'success' | 'error';
  /** Court résumé lisible du résultat (jamais la sortie brute — juste ce qui aide l'utilisateur à suivre) */
  resultSummary?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  toolCalls?: AssistantToolCall[];
  status?: 'streaming' | 'done' | 'error';
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Libellé court et lisible pour un appel de tool, affiché pendant/après son exécution */
function describeToolCall(tool: string, args: Record<string, unknown>): string {
  switch (tool) {
    case 'navigate':
      return `Navigation vers ${String(args.route ?? '')}`;
    case 'search':
      return `Recherche « ${String(args.query ?? '')} »`;
    case 'switch_tenant':
      return `Changement d'établissement vers ${String(args.tenantSlug ?? '')}`;
    case 'show_notification':
    case 'show_snackbar':
      return `Affichage d'un message à l'écran`;
    case 'fetch_data':
      return `Lecture de ${String(args.endpoint ?? '')}`;
    case 'refresh_data':
      return `Rafraîchissement des données`;
    case 'download_file':
      return `Téléchargement de ${String(args.filename ?? 'un fichier')}`;
    case 'copy_to_clipboard':
      return `Copie dans le presse-papier`;
    case 'open_modal':
      return `Ouverture de « ${String(args.name ?? '')} »`;
    default:
      return `Exécution de « ${tool} »`;
  }
}

export interface UseAIChatResult {
  messages: AssistantMessage[];
  sending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
  stop: () => void;
}

export function useAIChat(): UseAIChatResult {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => loadPersistedMessages());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contextJson = useAIContextJson();
  const toolsSchema = useAvailableToolsSchema();
  const { execute: executeTool } = useExecuteTool();

  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>(`egen-ai-assistant-${Date.now()}`);

  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  const updateAssistantMessage = useCallback((id: string, updater: (m: AssistantMessage) => AssistantMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  }, []);

  const runToolCalls = useCallback(
    async (assistantMessageId: string, toolCalls: ToolCallRequest[]): Promise<ChatMessageDTO[]> => {
      const results: ChatMessageDTO[] = [];

      // Marquer tous les appels comme "pending" d'un coup pour un feedback immédiat.
      updateAssistantMessage(assistantMessageId, (m) => ({
        ...m,
        toolCalls: [
          ...(m.toolCalls ?? []),
          ...toolCalls.map((tc) => ({
            id: tc.id,
            tool: tc.tool,
            arguments: tc.arguments,
            status: 'pending' as const,
          })),
        ],
      }));

      for (const call of toolCalls) {
        const result = await executeTool({ tool: call.tool, arguments: call.arguments, messageId: call.id });

        updateAssistantMessage(assistantMessageId, (m) => ({
          ...m,
          toolCalls: (m.toolCalls ?? []).map((tc) =>
            tc.id === call.id
              ? {
                  ...tc,
                  status: result.success ? 'success' : 'error',
                  resultSummary: result.success
                    ? describeToolCall(call.tool, call.arguments)
                    : (result.error ?? 'Échec inconnu'),
                }
              : tc,
          ),
        }));

        results.push({
          role: 'tool',
          content: JSON.stringify(result.success ? (result.data ?? { success: true }) : { error: result.error }),
          toolCallId: call.id,
          toolName: call.tool,
          toolArguments: call.arguments,
          toolThoughtSignature: call.thoughtSignature,
        });
      }

      return results;
    },
    [executeTool, updateAssistantMessage],
  );

  const runTurn = useCallback(
    async (history: ChatMessageDTO[], assistantMessageId: string, depth = 0): Promise<void> => {
      // Garde-fou : un LLM mal calibré pourrait boucler tool_call → tool_call
      // indéfiniment. 6 aller-retours est largement suffisant pour un usage
      // réel (navigation + lecture de données + confirmation, par exemple).
      if (depth > 6) {
        updateAssistantMessage(assistantMessageId, (m) => ({
          ...m,
          status: 'error',
          content: m.content || "Trop d'étapes enchaînées, j'ai arrêté ici. Pouvez-vous reformuler votre demande ?",
        }));
        return;
      }

      const config = getAIConfig();
      const transport = resolveTransport();
      const controller = new AbortController();
      abortRef.current = controller;

      const requestBody = {
        message: '',
        history,
        context: contextJson,
        tools: toolsSchema,
      };

      if (config.provider.stream) {
        let accumulated = '';
        const pendingToolCalls: ToolCallRequest[] = [];

        await transport.streamChatMessage(
          requestBody,
          (event: StreamEvent) => {
            if (event.type === 'token') {
              accumulated += event.text;
              updateAssistantMessage(assistantMessageId, (m) => ({ ...m, content: accumulated, status: 'streaming' }));
            } else if (event.type === 'tool_call') {
              pendingToolCalls.push({
                id: event.id,
                tool: event.tool,
                arguments: event.arguments,
                thoughtSignature: event.thoughtSignature,
              });
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          },
          controller.signal,
        );

        if (pendingToolCalls.length > 0) {
          const toolResults = await runToolCalls(assistantMessageId, pendingToolCalls);
          const nextHistory: ChatMessageDTO[] = [
            ...history,
            ...(accumulated ? [{ role: 'assistant' as const, content: accumulated }] : []),
            ...toolResults,
          ];
          await runTurn(nextHistory, assistantMessageId, depth + 1);
          return;
        }

        updateAssistantMessage(assistantMessageId, (m) => ({ ...m, status: 'done' }));
        return;
      }

      // ── Mode non-streaming (EGEN_AI_STREAM=false) ──────────────────────────
      const response = await transport.sendChatMessage(requestBody, controller.signal);
      updateAssistantMessage(assistantMessageId, (m) => ({
        ...m,
        content: m.content + response.message,
        status: response.done ? 'done' : 'streaming',
      }));

      if (response.toolCalls.length > 0) {
        const toolResults = await runToolCalls(assistantMessageId, response.toolCalls);
        const nextHistory: ChatMessageDTO[] = [
          ...history,
          ...(response.message ? [{ role: 'assistant' as const, content: response.message }] : []),
          ...toolResults,
        ];
        await runTurn(nextHistory, assistantMessageId, depth + 1);
      }
    },
    [contextJson, toolsSchema, runToolCalls, updateAssistantMessage],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setError(null);
      setSending(true);

      const userMessage: AssistantMessage = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const assistantMessage: AssistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'streaming',
      };

      const historyForBackend: ChatMessageDTO[] = [
        ...messages.map((m): ChatMessageDTO => ({ role: m.role, content: m.content })),
        { role: 'user', content: trimmed },
      ];

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      dispatchAIEvent(AI_EVENTS.MESSAGE_SENT, {
        sessionId: sessionIdRef.current,
        messageId: userMessage.id,
        role: 'user',
        contentLength: trimmed.length,
      });

      try {
        await runTurn(historyForBackend, assistantMessage.id);
        dispatchAIEvent(AI_EVENTS.MESSAGE_RECEIVED, {
          sessionId: sessionIdRef.current,
          messageId: assistantMessage.id,
          role: 'assistant',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        updateAssistantMessage(assistantMessage.id, (m) => ({
          ...m,
          status: 'error',
          content: m.content || "Désolé, une erreur est survenue en contactant l'assistant.",
        }));
        dispatchAIEvent(AI_EVENTS.MESSAGE_ERROR, {
          sessionId: sessionIdRef.current,
          messageId: assistantMessage.id,
          role: 'assistant',
          error: message,
        });
      } finally {
        setSending(false);
        abortRef.current = null;
      }
    },
    [messages, sending, runTurn, updateAssistantMessage],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    clearPersistedMessages();
    dispatchAIEvent(AI_EVENTS.SESSION_CLEARED, {});
  }, []);

  return { messages, sending, error, sendMessage, clearConversation, stop };
}
