import { beforeEach, describe, expect, it, vi } from 'vitest';

const transport = vi.hoisted(() => ({ streamChatMessage: vi.fn(), sendChatMessage: vi.fn() }));
vi.mock('../../services/transport', () => ({ resolveTransport: () => transport }));

import { _resetAgentApi, AGENT_RETRY_AFTER_MS, markAgentProxyUnavailable, setAgentApiBase } from './agentApiConfig';
import {
  AgentServiceError,
  generateSpeechAudio,
  sendAgentMessage,
  streamAgentMessage,
  transcribeAudioFile,
  type ConversationHistoryMessage,
} from './agentConversationService';

const OLD_GREETING = "Bonjour ! Je suis à votre écoute pour vous assister sur l'intranet EGEN.";
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

/** Le transport de repli répond par des jetons. */
function transportAnswers(...tokens: string[]) {
  transport.streamChatMessage.mockImplementation(async (_body: unknown, onEvent: (e: unknown) => void) => {
    for (const text of tokens) onEvent({ type: 'token', text });
    onEvent({ type: 'done' });
  });
}

beforeEach(() => {
  _resetAgentApi();
  fetchMock.mockReset();
  transport.streamChatMessage.mockReset();
  transport.sendChatMessage.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('streamAgentMessage — service agent disponible', () => {
  it('relaie les morceaux, renvoie le texte complet et la transcription, sans toucher au repli', async () => {
    fetchMock.mockResolvedValue(sse([{ transcript: 'Bonjour' }, { text: 'Je peux ' }, { text: 'vous aider.' }]));
    const chunks: string[] = [];
    const transcripts: string[] = [];

    const res = await streamAgentMessage(
      textInput,
      'conversation',
      [],
      (c) => chunks.push(c),
      (t) => transcripts.push(t),
    );

    expect(chunks).toEqual(['Je peux ', 'vous aider.']);
    expect(res).toMatchObject({ text: 'Je peux vous aider.', transcript: 'Bonjour', mode: 'conversation' });
    expect(transcripts).toEqual(['Bonjour']);
    expect(fetchMock).toHaveBeenCalledWith('/api/agent/stream', expect.objectContaining({ method: 'POST' }));
    expect(transport.streamChatMessage).not.toHaveBeenCalled();
  });

  it('lit un flux dont les blocs sont séparés par CRLF', async () => {
    fetchMock.mockResolvedValue(sse([{ text: 'Réponse CRLF' }], '\r\n\r\n'));
    const res = await streamAgentMessage(textInput, 'conversation', [], () => {});
    expect(res.text).toBe('Réponse CRLF');
  });

  it("transmet le mode actif dans l'instruction système", async () => {
    fetchMock.mockResolvedValue(sse([{ text: 'ok' }]));
    await streamAgentMessage(textInput, 'recherche', [], () => {});
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.systemInstruction).toContain('Mode Recherche / Analyse');
  });
});

describe('streamAgentMessage — service agent injoignable : repli sur le transport IA', () => {
  it('HTTP 404 (cas réel : aucun serveur /api/agent dans le core) → la réponse vient du transport', async () => {
    fetchMock.mockResolvedValue(new Response('Not found', { status: 404 }));
    transportAnswers('Voici ', 'la réponse.');
    const chunks: string[] = [];

    const res = await streamAgentMessage(textInput, 'conversation', [], (c) => chunks.push(c));

    expect(res.text).toBe('Voici la réponse.');
    expect(chunks).toEqual(['Voici ', 'la réponse.']);
    expect(res.text).not.toBe(OLD_GREETING);
  });

  it.each([502, 503, 504, 405, 501])('HTTP %i → repli', async (status) => {
    fetchMock.mockResolvedValue(new Response('x', { status }));
    transportAnswers('ok');
    expect((await streamAgentMessage(textInput, 'conversation', [], () => {})).text).toBe('ok');
  });

  it('erreur réseau → repli', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    transportAnswers('via transport');
    expect((await streamAgentMessage(textInput, 'conversation', [], () => {})).text).toBe('via transport');
  });

  it("HTTP 200 mais page HTML (le serveur de la SPA répond à la place de l'API) → repli, pas de « réponse »", async () => {
    fetchMock.mockResolvedValue(
      new Response('<!doctype html><html></html>', { status: 200, headers: { 'content-type': 'text/html' } }),
    );
    transportAnswers('vraie réponse');
    expect((await streamAgentMessage(textInput, 'conversation', [], () => {})).text).toBe('vraie réponse');
  });

  it("n'insiste pas : après un échec, le service n'est plus appelé pendant un moment", async () => {
    fetchMock.mockResolvedValue(new Response('Not found', { status: 404 }));
    transportAnswers('a');
    await streamAgentMessage(textInput, 'conversation', [], () => {});
    await streamAgentMessage(textInput, 'conversation', [], () => {});
    await streamAgentMessage(textInput, 'conversation', [], () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(transport.streamChatMessage).toHaveBeenCalledTimes(3);
  });

  it('réessaie le service une fois le délai écoulé', async () => {
    vi.useFakeTimers();
    try {
      fetchMock.mockResolvedValueOnce(new Response('x', { status: 404 }));
      transportAnswers('a');
      await streamAgentMessage(textInput, 'conversation', [], () => {});

      vi.advanceTimersByTime(AGENT_RETRY_AFTER_MS + 1);
      fetchMock.mockResolvedValueOnce(sse([{ text: 'service revenu' }]));
      const res = await streamAgentMessage(textInput, 'conversation', [], () => {});

      expect(res.text).toBe('service revenu');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('assistant.agentApiBaseUrl vide → service agent désactivé : aucun appel réseau agent', async () => {
    setAgentApiBase('');
    transportAnswers('direct');
    const res = await streamAgentMessage(textInput, 'conversation', [], () => {});
    expect(res.text).toBe('direct');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envoie au transport : le message, l'historique (transcription prioritaire), le mode dans le contexte, aucun tool", async () => {
    setAgentApiBase('');
    transportAnswers('ok');
    const history: ConversationHistoryMessage[] = [
      {
        id: '1',
        role: 'user',
        content: '🎤 Transcription en cours...',
        transcript: 'ma question vocale',
        type: 'audio',
        timestamp: '10:00',
      },
      { id: '2', role: 'assistant', content: 'Ma réponse', type: 'text', timestamp: '10:01' },
      { id: '3', role: 'user', content: '🎤 [Message vocal]', type: 'audio', timestamp: '10:02' },
    ];

    await streamAgentMessage(textInput, 'action', history, () => {});

    const [body] = transport.streamChatMessage.mock.calls[0];
    expect(body.message).toBe('Bonjour, que peux-tu faire ?');
    expect(body.tools).toEqual([]);
    expect(body.history).toEqual([
      { role: 'user', content: 'ma question vocale' },
      { role: 'assistant', content: 'Ma réponse' },
      { role: 'user', content: "[Message vocal de l'utilisateur]" },
    ]);
    expect(body.context).toContain('CONTEXTE OPÉRATIONNEL ACTIF');
  });

  it('entrée vocale AVEC transcription du navigateur → utilisable via le transport', async () => {
    setAgentApiBase('');
    transportAnswers('compris');
    const res = await streamAgentMessage(
      { type: 'audio', base64Audio: 'AAAA', transcriptHint: 'ouvre la page accueil' },
      'conversation',
      [],
      () => {},
    );
    expect(res.text).toBe('compris');
    expect(transport.streamChatMessage.mock.calls[0][0].message).toBe('ouvre la page accueil');
  });
});

describe('streamAgentMessage — les pannes restent VISIBLES (plus de faux message)', () => {
  it("erreur serveur réelle (HTTP 500) : AgentServiceError avec le code, pas de repli, pas de message d'accueil", async () => {
    fetchMock.mockResolvedValue(
      new Response('clé API manquante', { status: 500, statusText: 'Internal Server Error' }),
    );

    const err = await streamAgentMessage(textInput, 'conversation', [], () => {}).catch((e) => e);

    expect(err).toBeInstanceOf(AgentServiceError);
    expect(err.message).toContain('500');
    expect(err.message).toContain('clé API manquante');
    expect(err.status).toBe(500);
    expect(err.message).not.toContain('Bonjour');
    expect(transport.streamChatMessage).not.toHaveBeenCalled();
  });

  it('flux contenant seulement un évènement error → AgentServiceError avec ce message', async () => {
    fetchMock.mockResolvedValue(sse([{ error: 'quota dépassé' }]));
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toThrow(/quota dépassé/);
  });

  it("flux vide → AgentServiceError « réponse vide » (et non « J'ai bien compris votre demande »)", async () => {
    fetchMock.mockResolvedValue(sse([]));
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toThrow(/réponse vide/);
  });

  it('service agent ET transport en échec → erreur explicite avec la cause et la piste de configuration', async () => {
    fetchMock.mockResolvedValue(new Response('x', { status: 404 }));
    transport.streamChatMessage.mockRejectedValue(new Error('Le backend IA a répondu 404 Not Found'));

    const err = await streamAgentMessage(textInput, 'conversation', [], () => {}).catch((e) => e);

    expect(err).toBeInstanceOf(AgentServiceError);
    expect(err.message).toContain('404');
    expect(err.message).toContain('EGEN_AI_BACKEND_URL');
    expect(err.message).not.toBe(OLD_GREETING);
  });

  it('le transport répond sans texte → erreur explicite', async () => {
    setAgentApiBase('');
    transportAnswers();
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toThrow(/réponse vide/);
  });

  it('le transport signale une erreur de flux → erreur explicite', async () => {
    setAgentApiBase('');
    transport.streamChatMessage.mockImplementation(async (_b: unknown, onEvent: (e: unknown) => void) =>
      onEvent({ type: 'error', error: 'clé invalide' }),
    );
    await expect(streamAgentMessage(textInput, 'conversation', [], () => {})).rejects.toThrow(/clé invalide/);
  });

  it('entrée vocale sans transcription et sans service agent → erreur claire (pas de réponse inventée)', async () => {
    setAgentApiBase('');
    const err = await streamAgentMessage({ type: 'audio', base64Audio: 'AAAA' }, 'conversation', [], () => {}).catch(
      (e) => e,
    );
    expect(err).toBeInstanceOf(AgentServiceError);
    expect(err.message).toMatch(/transcription vocale/i);
    expect(transport.streamChatMessage).not.toHaveBeenCalled();
  });
});

describe('sendAgentMessage (appel non streamé)', () => {
  it('service agent disponible → son texte', async () => {
    fetchMock.mockResolvedValue(json({ text: 'Réponse /message', transcript: 'salut' }));
    const res = await sendAgentMessage(textInput, 'conversation', []);
    expect(res).toMatchObject({ text: 'Réponse /message', transcript: 'salut' });
    expect(fetchMock).toHaveBeenCalledWith('/api/agent/message', expect.anything());
  });

  it('service agent absent (404) → transport.sendChatMessage', async () => {
    fetchMock.mockResolvedValue(new Response('x', { status: 404 }));
    transport.sendChatMessage.mockResolvedValue({ message: 'Réponse du transport', toolCalls: [], done: true });
    expect((await sendAgentMessage(textInput, 'conversation', [])).text).toBe('Réponse du transport');
  });

  it('erreur réelle du service (500) → AgentServiceError', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));
    await expect(sendAgentMessage(textInput, 'conversation', [])).rejects.toThrow(/500/);
  });

  it("réponse vide → AgentServiceError (plus de « J'ai bien reçu votre message »)", async () => {
    fetchMock.mockResolvedValue(json({ text: '' }));
    await expect(sendAgentMessage(textInput, 'conversation', [])).rejects.toThrow(/réponse vide/);
  });

  it('transport en échec → AgentServiceError (plus de « Je suis à votre disposition »)', async () => {
    setAgentApiBase('');
    transport.sendChatMessage.mockRejectedValue(new Error('réseau coupé'));
    await expect(sendAgentMessage(textInput, 'conversation', [])).rejects.toThrow(/réseau coupé/);
  });
});

describe('voix : transcription et synthèse', () => {
  it('sans service agent utilisable : aucun appel réseau, valeurs neutres (le navigateur prend le relais)', async () => {
    markAgentProxyUnavailable();
    expect(await transcribeAudioFile('AAAA', 'audio/wav')).toBe('');
    expect(await generateSpeechAudio('Bonjour')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('service agent disponible : transcription et audio renvoyés', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ transcript: 'texte transcrit' }))
      .mockResolvedValueOnce(json({ audioBase64: 'UENN' }));
    expect(await transcribeAudioFile('AAAA')).toBe('texte transcrit');
    expect(await generateSpeechAudio('Bonjour')).toBe('UENN');
  });

  it('service agent absent (404) : valeurs neutres ET service marqué indisponible', async () => {
    fetchMock.mockResolvedValue(new Response('x', { status: 404 }));
    expect(await generateSpeechAudio('Bonjour')).toBeNull();
    expect(await generateSpeechAudio('Encore')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
