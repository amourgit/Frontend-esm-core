import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  class ChannelNotReadyError extends Error {}
  class ChannelClosedError extends Error {}
  class ChannelTimeoutError extends Error {}
  class ChannelRemoteError extends Error {}
  return {
    ChannelNotReadyError,
    ChannelClosedError,
    ChannelTimeoutError,
    ChannelRemoteError,
    getConversationClient: vi.fn(),
  };
});

vi.mock('@egen-civitas/esm-ai-framework', () => mocks);

import {
  AgentServiceError,
  generateSpeechAudio,
  resetRemoteConversation,
  streamAgentMessage,
} from './agentConversationService';

const textInput = { type: 'text' as const, text: 'Bonjour, que peux-tu faire ?' };

function fakeClient(overrides: Record<string, unknown> = {}) {
  const client = {
    sendText: vi.fn(async (_text: string, o: any) => {
      o.onStreamId?.('s1');
      o.onTranscript?.('bonjour');
      o.onDelta?.('Voici ');
      o.onDelta?.('la réponse.');
      return { streamId: 's1', text: 'Voici la réponse.', transcript: 'bonjour' };
    }),
    sendAudio: vi.fn(async () => ({ streamId: 's2', text: 'ok audio', transcript: 'salut' })),
    requestSpeech: vi.fn(async () => 'UENN'),
    reset: vi.fn(),
    ...overrides,
  };
  mocks.getConversationClient.mockReturnValue(client);
  return client;
}

beforeEach(() => {
  mocks.getConversationClient.mockReset();
});

describe('streamAgentMessage — via le canal temps réel', () => {
  it('relaie le texte, le mode et les fragments ; renvoie texte + transcription', async () => {
    const client = fakeClient();
    const chunks: string[] = [];
    const ids: string[] = [];
    const res = await streamAgentMessage(textInput, 'conversation', (c) => chunks.push(c), undefined, {
      onStreamId: (id) => ids.push(id),
    });
    expect(res).toMatchObject({ text: 'Voici la réponse.', transcript: 'bonjour', mode: 'conversation' });
    expect(chunks).toEqual(['Voici ', 'la réponse.']);
    expect(ids).toEqual(['s1']);
    expect(client.sendText).toHaveBeenCalledWith(textInput.text, expect.objectContaining({ mode: 'conversation' }));
  });

  it("envoie l'audio encodé avec son type MIME", async () => {
    const client = fakeClient();
    const res = await streamAgentMessage(
      { type: 'audio', base64Audio: 'AAAA', mimeType: 'audio/webm', transcriptHint: 'hint' },
      'conversation',
      () => {},
    );
    expect(client.sendAudio).toHaveBeenCalledWith(
      { base64Audio: 'AAAA', mimeType: 'audio/webm', transcriptHint: 'hint' },
      expect.objectContaining({ mode: 'conversation' }),
    );
    expect(res.transcript).toBe('salut');
  });

  it('audio sans enregistrement → erreur explicite', async () => {
    fakeClient();
    await expect(streamAgentMessage({ type: 'audio' }, 'conversation', () => {})).rejects.toThrow(/enregistrement/);
  });

  it('canal non démarré (IA désactivée) → AgentServiceError explicite', async () => {
    mocks.getConversationClient.mockReturnValue(null);
    await expect(streamAgentMessage(textInput, 'conversation', () => {})).rejects.toThrow(/désactivé/);
  });

  it.each([
    ['hors ligne', new mocks.ChannelNotReadyError('x'), /hors ligne/],
    ['coupure en cours de réponse', new mocks.ChannelClosedError('x'), /interrompue/],
    ['délai dépassé', new mocks.ChannelTimeoutError('x'), /pas répondu/],
    ['erreur du backend', new mocks.ChannelRemoteError('quota dépassé'), /quota dépassé/],
  ])('%s → AgentServiceError lisible', async (_label, error, pattern) => {
    fakeClient({ sendText: vi.fn().mockRejectedValue(error) });
    const err = await streamAgentMessage(textInput, 'conversation', () => {}).catch((e) => e);
    expect(err).toBeInstanceOf(AgentServiceError);
    expect(err.message).toMatch(pattern);
  });

  it('réponse vide → AgentServiceError', async () => {
    fakeClient({ sendText: vi.fn(async () => ({ streamId: 's', text: '  ', transcript: '' })) });
    await expect(streamAgentMessage(textInput, 'conversation', () => {})).rejects.toThrow(/réponse vide/);
  });

  it("l'annulation reste une AbortError (pas une erreur d'assistant)", async () => {
    fakeClient({ sendText: vi.fn().mockRejectedValue(new DOMException('annulé', 'AbortError')) });
    const err = await streamAgentMessage(textInput, 'conversation', () => {}).catch((e) => e);
    expect(err).toBeInstanceOf(DOMException);
  });
});

describe('synthèse vocale et reset', () => {
  it('renvoie le PCM du backend, null en cas de panne (le navigateur prend le relais)', async () => {
    fakeClient();
    expect(await generateSpeechAudio('Bonjour')).toBe('UENN');
    fakeClient({ requestSpeech: vi.fn().mockRejectedValue(new mocks.ChannelNotReadyError('x')) });
    expect(await generateSpeechAudio('Bonjour')).toBeNull();
    mocks.getConversationClient.mockReturnValue(null);
    expect(await generateSpeechAudio('Bonjour')).toBeNull();
  });

  it('resetRemoteConversation transmet au backend et ignore un canal absent', () => {
    const client = fakeClient();
    resetRemoteConversation();
    expect(client.reset).toHaveBeenCalledTimes(1);
    mocks.getConversationClient.mockReturnValue(null);
    expect(() => resetRemoteConversation()).not.toThrow();
  });
});
