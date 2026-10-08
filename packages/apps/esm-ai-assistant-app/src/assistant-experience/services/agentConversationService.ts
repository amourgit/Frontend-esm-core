/**
 * Service de conversation avec l'agent IA — client du backend, rien de plus.
 *
 * Tout le moteur (prompt système, mode, mémoire, LLM, STT, TTS) vit côté backend.
 * Ce service se contente de relayer au backend le message (texte ou audio), le mode
 * choisi par l'utilisateur et l'historique affiché, puis de restituer le flux de
 * réponse (SSE `/stream`, `/message`, `/transcribe`, `/tts` sous `assistant.agentApiBaseUrl`).
 *
 * Aucune réponse n'est JAMAIS inventée : si le backend ne répond pas, une
 * `AgentServiceError` explicite est levée (affichée par l'UI).
 */

import { agentApiUrl, isAgentProxyUsable, markAgentProxyUnavailable } from './agentApiConfig';
import { type AssistantMode } from '@egen-civitas/esm-styleguide';

export interface AgentInput {
  type: 'text' | 'audio';
  text?: string;
  audioBlob?: Blob;
  base64Audio?: string;
  mimeType?: string;
  transcriptHint?: string;
}

export interface AgentResponse {
  text: string;
  transcript?: string;
  mode: AssistantMode;
}

export interface ConversationHistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'audio';
  timestamp: string;
  mode?: AssistantMode;
  audioBlob?: Blob;
  transcript?: string;
}

/** Erreur explicite du service de conversation — son `message` est affiché tel quel à l'utilisateur. */
export class AgentServiceError extends Error {
  readonly status?: number;
  readonly cause?: unknown;

  constructor(message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message);
    this.name = 'AgentServiceError';
    this.status = options.status;
    this.cause = options.cause;
  }
}

const PROXY_UNAVAILABLE_STATUSES = new Set([404, 405, 501, 502, 503, 504]);

const UNAVAILABLE_HINT = 'Vérifiez que le backend IA est démarré et que assistant.agentApiBaseUrl est correct.';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Contenu d'un message d'historique : la transcription prime, les marqueurs d'attente sont remplacés. */
function historyContent(msg: ConversationHistoryMessage): string {
  let content = (msg.transcript || msg.content || '').trim();
  if (content.startsWith('🎤 Transcription en cours') || content === '🎤 [Message vocal]') {
    content = msg.transcript?.trim() || "[Message vocal de l'utilisateur]";
  }
  return content;
}

function buildPayload(input: AgentInput, mode: AssistantMode, history: ConversationHistoryMessage[]) {
  return {
    input: {
      type: input.type,
      text: input.text,
      base64Audio: input.base64Audio,
      mimeType: input.mimeType || input.audioBlob?.type || 'audio/wav',
      transcriptHint: input.transcriptHint,
    },
    // Le prompt est construit par le backend à partir du mode.
    mode,
    history: history.map((msg) => ({
      id: msg.id,
      role: msg.role,
      type: msg.type,
      content: historyContent(msg),
      transcript: msg.transcript,
    })),
  };
}

/**
 * Appel du backend. Lève AgentServiceError dans tous les cas d'échec (service désactivé,
 * injoignable, 404/502/503…, page HTML renvoyée par le serveur de la SPA à la place d'une API).
 * Un service constaté injoignable est marqué indisponible un moment pour ne pas retarder chaque envoi.
 */
async function backendFetch(path: string, payload: unknown, accept?: string): Promise<Response> {
  if (!isAgentProxyUsable()) {
    throw new AgentServiceError(`Le backend de l'assistant est indisponible. ${UNAVAILABLE_HINT}`);
  }

  let response: Response;
  try {
    response = await fetch(agentApiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accept ? { Accept: accept } : {}) },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    markAgentProxyUnavailable();
    throw new AgentServiceError(`Backend de l'assistant injoignable (${errorMessage(err)}). ${UNAVAILABLE_HINT}`, {
      cause: err,
    });
  }

  if (PROXY_UNAVAILABLE_STATUSES.has(response.status)) {
    markAgentProxyUnavailable();
    throw new AgentServiceError(
      `Backend de l'assistant indisponible (HTTP ${response.status}). ${UNAVAILABLE_HINT}`,
      { status: response.status },
    );
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).trim().slice(0, 200);
    throw new AgentServiceError(
      `Le service d'assistant a répondu ${response.status}${response.statusText ? ` ${response.statusText}` : ''}${
        detail ? ` — ${detail}` : ''
      }.`,
      { status: response.status },
    );
  }

  if ((response.headers.get('content-type') || '').toLowerCase().includes('text/html')) {
    markAgentProxyUnavailable();
    throw new AgentServiceError(
      `Backend de l'assistant absent (le serveur a renvoyé une page HTML). ${UNAVAILABLE_HINT}`,
    );
  }

  return response;
}

async function readStream(
  response: Response,
  onChunk: (chunkText: string) => void,
  onTranscript: ((transcript: string) => void) | undefined,
  initialTranscript: string,
): Promise<{ text: string; transcript: string }> {
  if (!response.body) {
    throw new AgentServiceError("Le service d'assistant n'a renvoyé aucun flux de réponse.");
  }

  let fullResponseText = '';
  let transcript = initialTranscript;
  let serverError = '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    // CRLF → LF : sur un flux terminé en « \r\n\r\n », « \n\n » n'apparaît jamais et rien n'est traité.
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(trimmed.slice(6));
        if (data.transcript) {
          transcript = data.transcript;
          onTranscript?.(data.transcript);
        }
        if (data.text) {
          fullResponseText += data.text;
          onChunk(data.text);
        } else if (data.error) {
          serverError = String(data.error);
          console.warn("[AgentService] Message d'erreur serveur:", data.error);
        }
      } catch {
        // Bloc partiel / non JSON : ignoré
      }
    }
  }

  if (!fullResponseText.trim()) {
    throw new AgentServiceError(
      serverError
        ? `Le service d'assistant a signalé une erreur : ${serverError}`
        : "Le service d'assistant a renvoyé une réponse vide.",
    );
  }
  return { text: fullResponseText, transcript };
}

/** Envoie un message texte ou audio en streaming. Lève une AgentServiceError explicite en cas d'échec. */
export async function streamAgentMessage(
  input: AgentInput,
  mode: AssistantMode = 'conversation',
  history: ConversationHistoryMessage[] = [],
  onChunk: (chunkText: string) => void,
  onTranscript?: (transcript: string) => void,
): Promise<AgentResponse> {
  const response = await backendFetch('stream', buildPayload(input, mode, history));
  const { text, transcript } = await readStream(response, onChunk, onTranscript, input.transcriptHint || '');
  return { text, transcript: transcript || input.transcriptHint, mode };
}

/**
 * Transcrit un fichier audio via le backend (/transcribe).
 * Renvoie '' si le backend n'est pas disponible (l'appelant retombe sur la transcription du navigateur).
 */
export async function transcribeAudioFile(base64Audio: string, mimeType?: string): Promise<string> {
  if (!isAgentProxyUsable()) return '';
  try {
    const res = await backendFetch('transcribe', { base64Audio, mimeType });
    const data = await res.json();
    return data.transcript || '';
  } catch {
    return '';
  }
}

/** Envoie un message texte ou audio (appel non streamé, /message). */
export async function sendAgentMessage(
  input: AgentInput,
  mode: AssistantMode = 'conversation',
  history: ConversationHistoryMessage[] = [],
): Promise<AgentResponse> {
  const response = await backendFetch('message', buildPayload(input, mode, history));
  const data = await response.json();
  const responseText = typeof data.text === 'string' ? data.text.trim() : '';
  if (!responseText) {
    throw new AgentServiceError("Le service d'assistant a renvoyé une réponse vide.");
  }
  return { text: responseText, transcript: data.transcript || input.transcriptHint, mode };
}

/**
 * Demande au backend un flux audio parlé (TTS, /tts).
 * Renvoie null si indisponible : l'appelant retombe sur la synthèse vocale du navigateur.
 */
export async function generateSpeechAudio(
  text: string,
  voiceName: 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir' = 'Kore',
): Promise<string | null> {
  if (!isAgentProxyUsable()) return null;
  try {
    const response = await backendFetch('tts', { text, voiceName });
    const data = await response.json();
    return data.audioBase64 || null;
  } catch {
    return null;
  }
}
