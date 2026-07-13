import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIChat } from './use-ai-chat';
import { sendChatMessage, streamChatMessage } from '../services/ai-backend-client';

vi.mock('../services/ai-backend-client', () => ({
  sendChatMessage: vi.fn(),
  streamChatMessage: vi.fn(),
}));

vi.mock('../services/conversation-memory', () => ({
  loadPersistedMessages: () => [],
  persistMessages: vi.fn(),
  clearPersistedMessages: vi.fn(),
}));

const mockExecute = vi.fn();

vi.mock('@egen/esm-ai-framework', () => ({
  useAIContextJson: () => '{"user":{}}',
  useAvailableToolsSchema: () => [{ name: 'navigate', description: 'Navigue', parameters: {} }],
  useExecuteTool: () => ({ execute: mockExecute, executing: false, lastResult: null, lastError: null }),
  getAIConfig: () => ({
    provider: { stream: false },
  }),
  dispatchAIEvent: vi.fn(),
  AI_EVENTS: {
    MESSAGE_SENT: 'ai:message-sent',
    MESSAGE_RECEIVED: 'ai:message-received',
    MESSAGE_ERROR: 'ai:message-error',
    SESSION_CLEARED: 'ai:session-cleared',
  },
}));

const mockedSendChatMessage = vi.mocked(sendChatMessage);

describe('useAIChat', () => {
  beforeEach(() => {
    mockedSendChatMessage.mockReset();
    mockExecute.mockReset();
  });

  it('sends a message and appends the assistant reply when no tool is needed', async () => {
    mockedSendChatMessage.mockResolvedValueOnce({
      message: 'Bonjour, comment puis-je vous aider ?',
      toolCalls: [],
      done: true,
    });

    const { result } = renderHook(() => useAIChat());

    await act(async () => {
      await result.current.sendMessage('Salut');
    });

    await waitFor(() => expect(result.current.sending).toBe(false));

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({ role: 'user', content: 'Salut' });
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Bonjour, comment puis-je vous aider ?',
      status: 'done',
    });
  });

  it('executes the navigate tool requested by the LLM and reports it in the message', async () => {
    mockedSendChatMessage
      .mockResolvedValueOnce({
        message: '',
        toolCalls: [{ id: 'call-1', tool: 'navigate', arguments: { route: '/students' } }],
        done: false,
      })
      .mockResolvedValueOnce({
        message: 'Vous êtes maintenant sur la page des étudiants.',
        toolCalls: [],
        done: true,
      });

    mockExecute.mockResolvedValueOnce({ success: true, data: { navigated: true }, durationMs: 4 });

    const { result } = renderHook(() => useAIChat());

    await act(async () => {
      await result.current.sendMessage('Emmène-moi sur la page des étudiants');
    });

    await waitFor(() => expect(result.current.sending).toBe(false));

    // Le tool a bien été exécuté via le pipeline de @egen/esm-ai-tools,
    // avec les arguments exacts fournis par le LLM — jamais réinterprétés.
    expect(mockExecute).toHaveBeenCalledWith({
      tool: 'navigate',
      arguments: { route: '/students' },
      messageId: 'call-1',
    });

    // Deux tours d'échange avec le backend : la demande de tool, puis la
    // conclusion une fois le résultat du tool renvoyé.
    expect(mockedSendChatMessage).toHaveBeenCalledTimes(2);

    const assistantMessage = result.current.messages[1];
    expect(assistantMessage.toolCalls).toHaveLength(1);
    expect(assistantMessage.toolCalls?.[0]).toMatchObject({
      tool: 'navigate',
      status: 'success',
      resultSummary: 'Navigation vers /students',
    });
    expect(assistantMessage.content).toBe('Vous êtes maintenant sur la page des étudiants.');
    expect(assistantMessage.status).toBe('done');
  });

  it('marks the tool call as failed when execution is denied or errors out', async () => {
    mockedSendChatMessage
      .mockResolvedValueOnce({
        message: '',
        toolCalls: [{ id: 'call-2', tool: 'navigate', arguments: { route: '/admin' } }],
        done: false,
      })
      .mockResolvedValueOnce({ message: 'Je ne peux pas faire cela.', toolCalls: [], done: true });

    mockExecute.mockResolvedValueOnce({ success: false, error: 'Privilèges insuffisants', durationMs: 2 });

    const { result } = renderHook(() => useAIChat());

    await act(async () => {
      await result.current.sendMessage("Va sur la page d'administration");
    });

    await waitFor(() => expect(result.current.sending).toBe(false));

    const assistantMessage = result.current.messages[1];
    expect(assistantMessage.toolCalls?.[0]).toMatchObject({
      status: 'error',
      resultSummary: 'Privilèges insuffisants',
    });
  });
});
