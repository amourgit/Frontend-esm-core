// =============================================================================
//  @egen-civitas/esm-ai-assistant-app — useAIChat
//
//  Interface de chat texte. Le moteur IA est ENTIÈREMENT côté backend : ce hook
//  se contente d'envoyer le message de l'utilisateur sur le canal temps réel et
//  d'afficher le flux de réponse.
//
//  Quand le backend décide d'une action frontend (navigation, lecture d'écran,
//  clic…), il envoie un `tool.call` sur le canal ; l'exécution (validation
//  d'arguments, permissions, timeout) est assurée par le framework
//  (`@egen-civitas/esm-ai-channel` → pipeline `esm-ai-tools`). Ce hook ne fait
//  qu'AFFICHER l'activité de ces tools via `onToolActivity`.
//
//  L'historique de référence et le contexte sont tenus/poussés par le canal :
//  rien n'est conservé ni renvoyé ici.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { onToolActivity, useAIChannelState, dispatchAIEvent, AI_EVENTS, type ToolActivity } from '@egen-civitas/esm-ai-framework';
import { resetRemoteConversation, streamAgentMessage } from '../assistant-experience/services/agentConversationService';

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
    case 'click_element':
      return `Clic sur « ${String(args.actionId ?? '')} »`;
    case 'fill_field':
      return `Remplissage de « ${String(args.actionId ?? '')} »`;
    case 'list_ui_actions':
      return `Consultation des actions disponibles à l'écran`;
    case 'list_routes':
      return `Consultation des routes disponibles`;
    case 'list_observables':
      return `Consultation du contenu affiché à l'écran`;
    case 'describe_screen':
      return `Analyse de l'écran courant`;
    case 'get_page_state':
      return `Vérification de l'état de la page`;
    case 'read_page':
      return args.ref || args.selector || args.actionId
        ? `Lecture d'une zone de la page`
        : `Lecture du contenu de la page`;
    case 'read_component':
      return `Lecture d'un composant de la page`;
    case 'read_table':
      return `Lecture d'un tableau`;
    case 'find_in_page':
      return `Recherche de « ${String(args.query ?? '')} » dans la page`;
    case 'discover_components':
      return `Inventaire des composants de la page`;
    case 'get_dom_tree':
      return `Analyse de la structure de la page`;
    case 'scroll_to':
      return `Défilement de la page`;
    case 'inspect_element':
      return `Inspection d'un élément de la page`;
    case 'inspect_interface':
      return `Inspection de l'interface`;
    case 'navigate_and_inspect':
      return `Inspection de ${String(args.route ?? 'la page')}`;
    case 'navigate_and_read':
      return `Lecture de ${String(args.route ?? 'la page')}`;
    default:
      return `Exécution de « ${tool} »`;
  }
}

export interface UseAIChatResult {
  messages: AssistantMessage[];
  sending: boolean;
  error: string | null;
  /** `true` quand le canal temps réel est établi avec le backend */
  online: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
  stop: () => void;
}

export function useAIChat(): UseAIChatResult {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { status } = useAIChannelState();

  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>(`egen-ai-assistant-${Date.now()}`);
  const activeRef = useRef<{ assistantMessageId: string; streamId: string | null } | null>(null);

  const updateAssistantMessage = useCallback((id: string, updater: (m: AssistantMessage) => AssistantMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  }, []);

  // Affichage de l'activité des tools frontend appelés par le backend pour le tour en cours.
  useEffect(
    () =>
      onToolActivity((activity: ToolActivity) => {
        const active = activeRef.current;
        if (!active) return;
        if (activity.streamId && active.streamId && activity.streamId !== active.streamId) return;

        updateAssistantMessage(active.assistantMessageId, (m) => {
          const others = (m.toolCalls ?? []).filter((tc) => tc.id !== activity.callId);
          if (activity.status === 'cancelled') return { ...m, toolCalls: others };
          const call: AssistantToolCall = {
            id: activity.callId,
            tool: activity.tool,
            arguments: activity.arguments,
            status: activity.status === 'running' ? 'pending' : activity.status,
            resultSummary:
              activity.status === 'success'
                ? describeToolCall(activity.tool, activity.arguments)
                : activity.status === 'error'
                  ? (activity.error ?? 'Échec inconnu')
                  : undefined,
          };
          const existing = (m.toolCalls ?? []).findIndex((tc) => tc.id === activity.callId);
          const toolCalls =
            existing >= 0
              ? (m.toolCalls ?? []).map((tc, i) => (i === existing ? call : tc))
              : [...(m.toolCalls ?? []), call];
          return { ...m, toolCalls };
        });
      }),
    [updateAssistantMessage],
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

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      const controller = new AbortController();
      abortRef.current = controller;
      activeRef.current = { assistantMessageId: assistantMessage.id, streamId: null };

      dispatchAIEvent(AI_EVENTS.MESSAGE_SENT, {
        sessionId: sessionIdRef.current,
        messageId: userMessage.id,
        role: 'user',
        contentLength: trimmed.length,
      });

      try {
        let accumulated = '';
        await streamAgentMessage(
          { type: 'text', text: trimmed },
          'conversation',
          (chunk) => {
            accumulated += chunk;
            updateAssistantMessage(assistantMessage.id, (m) => ({ ...m, content: accumulated, status: 'streaming' }));
          },
          undefined,
          {
            signal: controller.signal,
            onStreamId: (streamId) => {
              if (activeRef.current) activeRef.current.streamId = streamId;
            },
          },
        );
        updateAssistantMessage(assistantMessage.id, (m) => ({ ...m, status: 'done' }));
        dispatchAIEvent(AI_EVENTS.MESSAGE_RECEIVED, {
          sessionId: sessionIdRef.current,
          messageId: assistantMessage.id,
          role: 'assistant',
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          updateAssistantMessage(assistantMessage.id, (m) => ({ ...m, status: 'done' }));
        } else {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          updateAssistantMessage(assistantMessage.id, (m) => ({
            ...m,
            status: 'error',
            content: m.content || message,
          }));
          dispatchAIEvent(AI_EVENTS.MESSAGE_ERROR, {
            sessionId: sessionIdRef.current,
            messageId: assistantMessage.id,
            role: 'assistant',
            error: message,
          });
        }
      } finally {
        setSending(false);
        abortRef.current = null;
        activeRef.current = null;
      }
    },
    [sending, updateAssistantMessage],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    resetRemoteConversation();
    dispatchAIEvent(AI_EVENTS.SESSION_CLEARED, {});
  }, []);

  return { messages, sending, error, online: status === 'ready', sendMessage, clearConversation, stop };
}
