import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetAgentApi, AGENT_RETRY_AFTER_MS, markAgentProxyUnavailable, setAgentApiBase } from './agentApiConfig';
import {
  AgentServiceError,
  generateSpeechAudio,
  sendAgentMessage,
  streamAgentMessage,
  transcribeAudioFile,
  type ConversationHistoryMessage,
} from './agentConversationService';

const fetchMock = vi.fn();

const sse = (frames: Array<Record<string, unknown>>, sep = '\n\n') =>
  new Response(
    new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        for (const f of frames) controller.enqueue(enc.encode(`data: ${JSON.stringify(f)}${sep}`));
        controller.close();
      },
    }),
    { status: 200, headers: { 'content-type': 'text/event-stream' } },
  );

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const textInput = { type: 'text' as const, text: 'Bonjour, que peux-tu faire ?' };

beforeEach(() => {
  _resetAgentApi();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('streamAgentMessage — backend disponible', () => {
  it('relaie les morceaux, renvoie le texte complet et la transcription', async () => {
    fetchMock.mockResolvedValue(sse([{ transcript: 'bonjour' }, { text: 'Voici ' }, { text: 'la réponse.' }]));
    const chunks: string[] = [];
    const transcripts: string[] = [];
    const res = await streamAgentMessage(
      textInput,
      'conversation',
      [],
      (c) => chunks.push(c),
      (t) => transcripts.push(t),
    );
    expect(res).toMatchObject({ text: 'Voici la réponse.', transcript: 'bonjour', mode: 'conversation' });
    expect(chunks).toEqual(['Voici ', 'la réponse.']);
    expect(transcripts).toEqual(['bonjour']);
    expect(fetchMock).toHaveBeenCalledWith('/api/agent/stream', expect.objectContaining({ credentials: 'include' }));
  });

  it('lit un flux dont les blocs sont séparés par CRLF', async () => {
    fetchMock.mockResolvedValue(sse([{ text: 'ok' }], '\r\n\r\n'));
    expect((await streamAgentMessage(textInput, 'conversation', [], () => {})).text).toBe('ok');
  });

  it("envoie le mode et l'historique, jamais de prompt système (construit par le backend)", async () => {
    fetchMock.mockResolvedValue(sse([{ text: 'ok' }]));
    const history: ConversationHistoryMessage[] = [
      { id: '1', role: 'user', type: 'audio', content: '🎤 [Message vocal]', transcript: 'salut', timestamp: '10:00' },
    ];
    await streamAgentMessage(textInput, 'recherche' as never, history, () => {});
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.mode).toBe('recherche');
    expect(payload.systemInstruction).toBeUndefined();
    expect(payload.history[0]).toMatchObject({ id: '1', content: 'salut', transcript: 'salut' });
  });
});

describe('streamAgentMessage — les pannes restent VISIBLES', () => {
  it.each([404, 502, 503])('HTTP %i → AgentServiceError, plus aucun repli', async (status) => {
    fetchMock.mockResolvedValue(new Response('x', { status }));
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toBeInstanceOf(
      AgentServiceError,
    );
  });

  it('erreur réseau → AgentServiceError', async () => {
    fetchMock.mockRejectedValue(new Error('réseau coupé'));
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toThrow(/réseau coupé/);
  });

  it('HTTP 200 mais page HTML → AgentServiceError', async () => {
    fetchMock.mockResolvedValue(new Response('<html/>', { status: 200, headers: { 'content-type': 'text/html' } }));
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toThrow(/HTML/);
  });

  it('erreur serveur réelle (500) → AgentServiceError avec le code', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));
    const err = await streamAgentMessage(textInput, 'conversation', [], () => {}).catch((e) => e);
    expect(err).toBeInstanceOf(AgentServiceError);
    expect(err.status).toBe(500);
  });

  it('flux contenant seulement un évènement error → AgentServiceError avec ce message', async () => {
    fetchMock.mockResolvedValue(sse([{ error: 'quota dépassé' }]));
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toThrow(/quota dépassé/);
  });

  it('flux vide → AgentServiceError « réponse vide »', async () => {
    fetchMock.mockResolvedValue(sse([]));
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toThrow(/réponse vide/);
  });

  it("n'insiste pas : après un échec, le backend n'est plus appelé pendant un moment", async () => {
    fetchMock.mockResolvedValue(new Response('x', { status: 503 }));
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toThrow();
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toThrow(/indisponible/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('réessaie le backend une fois le délai écoulé', async () => {
    vi.useFakeTimers();
    try {
      fetchMock.mockResolvedValueOnce(new Response('x', { status: 503 }));
      await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toThrow();
      vi.advanceTimersByTime(AGENT_RETRY_AFTER_MS + 1);
      fetchMock.mockResolvedValueOnce(sse([{ text: 'revenu' }]));
      expect((await streamAgentMessage(textInput, 'conversation', [], () => {})).text).toBe('revenu');
    } finally {
      vi.useRealTimers();
    }
  });

  it('assistant.agentApiBaseUrl vide → backend désactivé : aucun appel réseau', async () => {
    setAgentApiBase('');
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toBeInstanceOf(
      AgentServiceError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('sendAgentMessage (appel non streamé)', () => {
  it('backend disponible → son texte', async () => {
    fetchMock.mockResolvedValue(json({ text: 'Réponse /message', transcript: 'salut' }));
    const res = await sendAgentMessage(textInput, 'conversation', []);
    expect(res).toMatchObject({ text: 'Réponse /message', transcript: 'salut' });
    expect(fetchMock).toHaveBeenCalledWith('/api/agent/message', expect.anything());
  });

  it('erreur réelle (500) → AgentServiceError', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));
    await expect(sendAgentMessage(textInput, 'conversation', [])).rejects.toThrow(/500/);
  });

  it('réponse vide → AgentServiceError', async () => {
    fetchMock.mockResolvedValue(json({ text: '' }));
    await expect(sendAgentMessage(textInput, 'conversation', [])).rejects.toThrow(/réponse vide/);
  });
});

describe('voix : transcription et synthèse (assurées par le backend)', () => {
  it('backend inutilisable : aucun appel réseau, valeurs neutres (le navigateur prend le relais)', async () => {
    markAgentProxyUnavailable();
    expect(await transcribeAudioFile('AAAA', 'audio/wav')).toBe('');
    expect(await generateSpeechAudio('Bonjour')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('backend disponible : transcription et audio renvoyés', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ transcript: 'texte transcrit' }))
      .mockResolvedValueOnce(json({ audioBase64: 'UENN' }));
    expect(await transcribeAudioFile('AAAA')).toBe('texte transcrit');
    expect(await generateSpeechAudio('Bonjour')).toBe('UENN');
  });

  it('backend absent (404) : valeurs neutres ET backend marqué indisponible', async () => {
    fetchMock.mockResolvedValue(new Response('x', { status: 404 }));
    expect(await generateSpeechAudio('Bonjour')).toBeNull();
    expect(await generateSpeechAudio('Encore')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
