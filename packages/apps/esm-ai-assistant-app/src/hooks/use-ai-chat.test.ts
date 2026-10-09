import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  streamAgentMessage: vi.fn(),
  resetRemoteConversation: vi.fn(),
  activityListeners: new Set<(a: any) => void>(),
  status: 'ready',
}));

vi.mock('../assistant-experience/services/agentConversationService', () => ({
  streamAgentMessage: mocks.streamAgentMessage,
  resetRemoteConversation: mocks.resetRemoteConversation,
}));

vi.mock('@egen-civitas/esm-ai-framework', () => ({
  useAIChannelState: () => ({ status: mocks.status }),
  onToolActivity: (l: (a: any) => void) => {
    mocks.activityListeners.add(l);
    return () => mocks.activityListeners.delete(l);
  },
  dispatchAIEvent: vi.fn(),
  AI_EVENTS: {
    MESSAGE_SENT: 'ai:message-sent',
    MESSAGE_RECEIVED: 'ai:message-received',
    MESSAGE_ERROR: 'ai:message-error',
    SESSION_CLEARED: 'ai:session-cleared',
  },
}));

import { useAIChat } from './use-ai-chat';

const emit = (activity: any) => act(() => mocks.activityListeners.forEach((l) => l(activity)));

describe('useAIChat (canal temps réel)', () => {
  beforeEach(() => {
    mocks.streamAgentMessage.mockReset();
    mocks.resetRemoteConversation.mockReset();
    mocks.activityListeners.clear();
    mocks.status = 'ready';
  });

  it('envoie le message au backend et affiche la réponse en streaming', async () => {
    mocks.streamAgentMessage.mockImplementation(async (_input, _mode, onChunk) => {
      onChunk('Bonjour, ');
      onChunk('comment puis-je vous aider ?');
      return { text: 'Bonjour, comment puis-je vous aider ?', mode: 'conversation' };
    });

    const { result } = renderHook(() => useAIChat());
    await act(async () => {
      await result.current.sendMessage('Salut');
    });
    await waitFor(() => expect(result.current.sending).toBe(false));

    expect(mocks.streamAgentMessage).toHaveBeenCalledWith(
      { type: 'text', text: 'Salut' },
      'conversation',
      expect.any(Function),
      undefined,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({ role: 'user', content: 'Salut' });
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Bonjour, comment puis-je vous aider ?',
      status: 'done',
    });
    expect(result.current.online).toBe(true);
  });

  it("affiche l'activité des tools frontend appelés par le backend pendant la réponse", async () => {
    let finish: () => void = () => undefined;
    mocks.streamAgentMessage.mockImplementation(async (_i, _m, onChunk, _t, handlers) => {
      handlers.onStreamId('stream-1');
      await new Promise<void>((r) => (finish = r));
      onChunk('Je vous emmène sur la page.');
      return { text: 'Je vous emmène sur la page.', mode: 'conversation' };
    });

    const { result } = renderHook(() => useAIChat());
    let pending: Promise<void>;
    act(() => {
      pending = result.current.sendMessage('Va sur la liste des élèves');
    });
    await waitFor(() => expect(result.current.sending).toBe(true));

    const base = { callId: 'c1', tool: 'navigate', arguments: { route: '/students' }, streamId: 'stream-1' };
    emit({ ...base, status: 'running' });
    expect(result.current.messages[1].toolCalls).toEqual([
      expect.objectContaining({ id: 'c1', tool: 'navigate', status: 'pending' }),
    ]);

    // appel d'un autre flux : ignoré
    emit({ ...base, callId: 'x', streamId: 'autre', status: 'running' });
    expect(result.current.messages[1].toolCalls).toHaveLength(1);

    emit({ ...base, status: 'success' });
    expect(result.current.messages[1].toolCalls?.[0]).toMatchObject({
      status: 'success',
      resultSummary: 'Navigation vers /students',
    });

    await act(async () => {
      finish();
      await pending;
    });
    expect(result.current.messages[1]).toMatchObject({ status: 'done', content: 'Je vous emmène sur la page.' });
  });

  it("affiche l'échec d'un tool avec son message d'erreur", async () => {
    let finish: () => void = () => undefined;
    mocks.streamAgentMessage.mockImplementation(async () => {
      await new Promise<void>((r) => (finish = r));
      return { text: 'Je n’ai pas pu.', mode: 'conversation' };
    });
    const { result } = renderHook(() => useAIChat());
    let pending: Promise<void>;
    act(() => {
      pending = result.current.sendMessage('Va sur /admin');
    });
    await waitFor(() => expect(result.current.sending).toBe(true));
    emit({ callId: 'c2', tool: 'navigate', arguments: { route: '/admin' }, status: 'error', error: 'Permission refusée' });
    expect(result.current.messages[1].toolCalls?.[0]).toMatchObject({ status: 'error', resultSummary: 'Permission refusée' });
    await act(async () => {
      finish();
      await pending;
    });
  });

  it("hors ligne : l'erreur explicite du service est affichée (aucune réponse inventée)", async () => {
    mocks.status = 'reconnecting';
    mocks.streamAgentMessage.mockRejectedValue(new Error("L'assistant est hors ligne. Reconnexion en cours — réessayez dans un instant."));
    const { result } = renderHook(() => useAIChat());
    await act(async () => {
      await result.current.sendMessage('Salut');
    });
    expect(result.current.online).toBe(false);
    expect(result.current.error).toMatch(/hors ligne/);
    expect(result.current.messages[1]).toMatchObject({ status: 'error', content: expect.stringMatching(/hors ligne/) });
  });

  it('stop() annule le flux sans le signaler comme une erreur', async () => {
    mocks.streamAgentMessage.mockImplementation(
      (_i, _m, _c, _t, handlers) =>
        new Promise((_, reject) => handlers.signal.addEventListener('abort', () => reject(new DOMException('annulé', 'AbortError')))),
    );
    const { result } = renderHook(() => useAIChat());
    let pending: Promise<void>;
    act(() => {
      pending = result.current.sendMessage('Long travail');
    });
    await waitFor(() => expect(result.current.sending).toBe(true));
    await act(async () => {
      result.current.stop();
      await pending;
    });
    expect(result.current.error).toBeNull();
    expect(result.current.messages[1].status).toBe('done');
  });

  it('clearConversation vide aussi la conversation côté backend', () => {
    const { result } = renderHook(() => useAIChat());
    act(() => result.current.clearConversation());
    expect(mocks.resetRemoteConversation).toHaveBeenCalledTimes(1);
    expect(result.current.messages).toEqual([]);
  });
});
