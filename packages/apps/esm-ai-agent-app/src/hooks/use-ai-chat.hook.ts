import { useCallback, useRef, useState } from 'react';
import { getAIConfig } from '@egen/esm-ai-config';
import { getAIContext, getAIContextJson } from '@egen/esm-ai-context';
import { AI_EVENTS, dispatchAIEvent } from '@egen/esm-ai-events';
import { executeTool } from '@egen/esm-ai-tools';
import { callGemini, getGeminiFunctionDeclarations, type GeminiContent } from '../services/gemini-client';
import type { ChatMessage, ChatToolCall } from '../types';

const MAX_TOOL_CALL_ROUNDS = 5;

let _messageCounter = 0;
function generateMessageId(): string {
  return `agent-msg-${Date.now()}-${++_messageCounter}`;
}

interface UseAIChatOptions {
  assistantName: string;
  /** Privilèges EGEN de l'utilisateur courant (filtre les tools exposés au LLM) */
  userPrivileges: string[];
}

function buildSystemInstruction(assistantName: string, contextJson: string): string {
  return [
    `Tu es "${assistantName}", l'assistant IA intégré à la plateforme EGEN.`,
    "Tu aides l'utilisateur en conversant naturellement et, quand c'est utile, en appelant les tools mis à ta disposition (navigation, notifications, recherche, ...).",
    "N'invente jamais de résultat de tool : si tu appelles un tool, attends sa réponse avant de conclure.",
    'Réponds dans la langue utilisée par l\'utilisateur.',
    '',
    "Contexte applicatif courant (utilisateur, route active, permissions) au format JSON :",
    contextJson,
  ].join('\n');
}

function messagesToGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  return messages
    .filter((m) => m.role !== 'system' && m.text.trim() !== '')
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));
}

export function useAIChat({ assistantName, userPrivileges }: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const abortRef = useRef(false);
  const sessionIdRef = useRef(`agent-chat-${Date.now()}`);

  const updateMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const config = getAIConfig();

      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      const assistantMessageId = generateMessageId();
      const assistantPlaceholder: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        text: '',
        createdAt: new Date().toISOString(),
        pending: true,
        toolCalls: [],
      };

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setSending(true);
      abortRef.current = false;

      dispatchAIEvent(AI_EVENTS.MESSAGE_SENT, {
        sessionId: sessionIdRef.current,
        messageId: userMessage.id,
        role: 'user',
        contentLength: userMessage.text.length,
      });

      try {
        const history = messagesToGeminiContents([...messages, userMessage]);
        const tools = getGeminiFunctionDeclarations(userPrivileges);
        const systemInstruction = buildSystemInstruction(assistantName, getAIContextJson());

        const contents: GeminiContent[] = [...history];
        const collectedToolCalls: ChatToolCall[] = [];
        let finalText = '';

        for (let round = 0; round < MAX_TOOL_CALL_ROUNDS; round++) {
          if (abortRef.current) break;

          const result = await callGemini({
            apiKey: config.provider.apiKey,
            apiEndpoint: config.provider.apiEndpoint,
            model: config.provider.model,
            systemInstruction,
            contents,
            tools,
            generationConfig: {
              temperature: config.provider.temperature,
              topP: config.provider.topP,
              topK: config.provider.topK,
              maxOutputTokens: config.provider.maxTokens,
            },
          });

          const functionCalls = result.parts.filter(
            (p): p is { functionCall: { name: string; args: Record<string, unknown> } } => 'functionCall' in p,
          );
          const textParts = result.parts.filter((p): p is { text: string } => 'text' in p);
          finalText = textParts.map((p) => p.text).join('\n');

          if (functionCalls.length === 0) {
            // Pas d'appel de tool : le tour de conversation est terminé.
            break;
          }

          // Le modèle a demandé un/des appel(s) de tool — les exécuter via le Layer 1.
          contents.push({ role: 'model', parts: functionCalls.map((fc) => ({ functionCall: fc.functionCall })) });

          const aiContext = getAIContext();
          const functionResponseParts: GeminiContent['parts'] = [];

          for (const fc of functionCalls) {
            const toolCallId = generateMessageId();
            const toolCall: ChatToolCall = {
              id: toolCallId,
              toolId: fc.functionCall.name,
              args: fc.functionCall.args ?? {},
              status: 'running',
            };
            collectedToolCalls.push(toolCall);
            updateMessage(assistantMessageId, { toolCalls: [...collectedToolCalls] });

            const execResult = await executeTool(
              { tool: fc.functionCall.name, arguments: fc.functionCall.args ?? {} },
              aiContext,
            );

            toolCall.status = execResult.success ? 'success' : 'error';
            toolCall.durationMs = execResult.durationMs;
            toolCall.resultSummary = execResult.success
              ? summarizeToolResult(execResult.data)
              : (execResult.error ?? 'Erreur inconnue');
            updateMessage(assistantMessageId, { toolCalls: [...collectedToolCalls] });

            functionResponseParts.push({
              functionResponse: {
                name: fc.functionCall.name,
                response: execResult.success
                  ? { success: true, data: (execResult.data ?? {}) as Record<string, unknown> }
                  : { success: false, error: execResult.error },
              },
            });
          }

          contents.push({ role: 'user', parts: functionResponseParts });
        }

        const finalAssistantText =
          finalText || (collectedToolCalls.length > 0 ? '' : "Je n'ai pas pu générer de réponse.");

        updateMessage(assistantMessageId, {
          text: finalAssistantText,
          pending: false,
          toolCalls: collectedToolCalls,
        });

        dispatchAIEvent(AI_EVENTS.MESSAGE_RECEIVED, {
          sessionId: sessionIdRef.current,
          messageId: assistantMessageId,
          role: 'assistant',
          contentLength: finalAssistantText.length,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        updateMessage(assistantMessageId, { pending: false, error: message, text: '' });
        dispatchAIEvent(AI_EVENTS.MESSAGE_ERROR, {
          sessionId: sessionIdRef.current,
          messageId: assistantMessageId,
          role: 'assistant',
          error: message,
        });
      } finally {
        setSending(false);
      }
    },
    [messages, sending, assistantName, userPrivileges, updateMessage],
  );

  return { messages, sendMessage, sending };
}

function summarizeToolResult(data: unknown): string {
  if (data === undefined || data === null) return 'OK';
  try {
    const json = JSON.stringify(data);
    return json.length > 200 ? `${json.slice(0, 200)}…` : json;
  } catch {
    return 'OK';
  }
}
