/**
 * Service de Conversation Agent IA
 * - Gestion du contexte et de l'historique COMPLET des conversations dans le temps.
 * - Support multimodal : Entrée Texte et Entrée Vocale (WAV 16kHz).
 *
 * Deux chemins, dans cet ordre :
 *  1. le service agent (`assistant.agentApiBaseUrl`, SSE `/stream`, `/message`, `/transcribe`, `/tts`) ;
 *  2. si ce service est injoignable, le transport IA de l'app (backend EGEN ou Gemini direct, voir
 *     services/transport.ts) — le même que le chat historique. Texte uniquement : sans service
 *     agent, une entrée vocale n'est utilisable que si le navigateur a fourni la transcription.
 *
 * Aucune réponse n'est JAMAIS inventée : quand aucun chemin ne répond, une `AgentServiceError`
 * explicite est levée (affichée par l'UI) au lieu d'un faux message d'accueil qui masquait la panne.
 */

import { agentApiUrl, isAgentProxyUsable, markAgentProxyUnavailable } from './agentApiConfig';
import { resolveTransport } from '../../services/transport';
import type { ChatMessageDTO } from '../../services/ai-backend-client';
import { type AssistantMode, ASSISTANT_MODES } from '@egen-civitas/esm-styleguide';
import { loadSystemPrompt, appendContextMemory } from './promptManager';

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

/**
 * Construit les instructions système complètes en fusionnant le prompt actif et le mode sélectionné
 */
function buildFullSystemInstruction(mode: AssistantMode): string {
  const basePrompt = loadSystemPrompt();
  const modeConfig = ASSISTANT_MODES[mode] || ASSISTANT_MODES.conversation;

  return `${basePrompt}

---
CONTEXTE OPÉRATIONNEL ACTIF : Mode « ${modeConfig.name} » (${modeConfig.tagline})
Directives pour ce mode :
- Rôle : ${modeConfig.principle}
- Exigences : ${modeConfig.bullets.join(' ; ')}
- ÉLOCUTION & STYLE VOCAL : Réponds toujours en français de manière directe, posée, fluide et intelligible (1 à 3 phrases claires pour un échange oral agréable). Conserve la mémoire et la continuité logique avec tous les échanges précédents sans exception.`;
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

/** Le service agent n'existe pas / ne répond pas (≠ il a répondu par une erreur). Déclenche le repli. */
class AgentProxyUnavailableError extends Error {
  constructor(
    reason: string,
    readonly cause?: unknown,
  ) {
    super(reason);
    this.name = 'AgentProxyUnavailableError';
  }
}

const PROXY_UNAVAILABLE_STATUSES = new Set([404, 405, 501, 502, 503, 504]);

const FALLBACK_HINT =
  'Vérifiez le backend IA (EGEN_AI_BACKEND_URL), le mode direct Gemini (EGEN_AI_DIRECT_MODE / EGEN_AI_API_KEY) ' +
  'ou le service agent (assistant.agentApiBaseUrl).';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Contenu d'un message d'historique envoyé au LLM : la transcription prime, les marqueurs d'attente sont remplacés. */
function historyContent(msg: ConversationHistoryMessage): string {
  let content = (msg.transcript || msg.content || '').trim();
  if (content.startsWith('🎤 Transcription en cours') || content === '🎤 [Message vocal]') {
    content = msg.transcript?.trim() || "[Message vocal de l'utilisateur]";
  }
  return content;
}

function buildProxyPayload(input: AgentInput, systemInstruction: string, history: ConversationHistoryMessage[]) {
  return {
    input: {
      type: input.type,
      text: input.text,
      base64Audio: input.base64Audio,
      mimeType: input.mimeType || input.audioBlob?.type || 'audio/wav',
      transcriptHint: input.transcriptHint,
    },
    systemInstruction,
    // Envoie TOUT l'historique complet sans coupure, en s'assurant que la transcription textuelle est prioritaire
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
 * Appel du service agent. Lève AgentProxyUnavailableError s'il est injoignable (réseau, 404/502/503…,
 * ou page HTML renvoyée par le serveur de la SPA à la place d'une API) et marque alors le service
 * indisponible pour un moment. Toute autre réponse d'erreur est une vraie erreur (AgentServiceError).
 */
async function proxyFetch(path: string, payload: unknown, accept?: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(agentApiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accept ? { Accept: accept } : {}) },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    markAgentProxyUnavailable();
    throw new AgentProxyUnavailableError(`Service agent injoignable (${errorMessage(err)})`, err);
  }

  if (PROXY_UNAVAILABLE_STATUSES.has(response.status)) {
    markAgentProxyUnavailable();
    throw new AgentProxyUnavailableError(`Service agent indisponible (HTTP ${response.status})`);
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

  // 200 mais HTML : le serveur de la SPA a répondu à la place d'une API absente.
  if ((response.headers.get('content-type') || '').toLowerCase().includes('text/html')) {
    markAgentProxyUnavailable();
    throw new AgentProxyUnavailableError('Service agent absent (le serveur a renvoyé une page HTML)');
  }

  return response;
}

async function streamViaProxy(
  payload: ReturnType<typeof buildProxyPayload>,
  onChunk: (chunkText: string) => void,
  onTranscript: ((transcript: string) => void) | undefined,
  initialTranscript: string,
): Promise<{ text: string; transcript: string }> {
  const response = await proxyFetch('stream', payload);
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

/** Texte à envoyer au transport IA historique (texte uniquement). */
function userTextForTransport(input: AgentInput): string {
  const text = (input.text || input.transcriptHint || '').trim();
  if (!text) {
    throw new AgentServiceError(
      "Le service d'assistant (transcription vocale) est injoignable : impossible de comprendre ce message vocal. " +
        'Utilisez la saisie au clavier, ou configurez assistant.agentApiBaseUrl.',
    );
  }
  return text;
}

function historyForTransport(history: ConversationHistoryMessage[]): ChatMessageDTO[] {
  return history
    .map((msg) => ({ role: msg.role, content: historyContent(msg) }) as ChatMessageDTO)
    .filter((m) => m.content !== '');
}

async function streamViaTransport(
  input: AgentInput,
  systemInstruction: string,
  history: ConversationHistoryMessage[],
  onChunk: (chunkText: string) => void,
): Promise<string> {
  const message = userTextForTransport(input);
  let text = '';
  let streamError = '';
  try {
    await resolveTransport().streamChatMessage(
      { message, history: historyForTransport(history), context: systemInstruction, tools: [] },
      (event) => {
        if (event.type === 'token') {
          text += event.text;
          onChunk(event.text);
        } else if (event.type === 'error') {
          streamError = event.error;
        }
      },
    );
  } catch (err) {
    throw new AgentServiceError(`L'assistant n'a pas pu répondre : ${errorMessage(err)}. ${FALLBACK_HINT}`, {
      cause: err,
    });
  }
  if (!text.trim()) {
    throw new AgentServiceError(
      streamError
        ? `L'assistant a signalé une erreur : ${streamError}. ${FALLBACK_HINT}`
        : `L'assistant a renvoyé une réponse vide. ${FALLBACK_HINT}`,
    );
  }
  return text;
}

/**
 * Envoie un message texte ou audio en streaming : service agent `/stream` si disponible, sinon
 * transport IA de l'app. Lève une AgentServiceError explicite si aucun chemin ne répond.
 */
export async function streamAgentMessage(
  input: AgentInput,
  mode: AssistantMode = 'conversation',
  history: ConversationHistoryMessage[] = [],
  onChunk: (chunkText: string) => void,
  onTranscript?: (transcript: string) => void,
): Promise<AgentResponse> {
  const systemInstruction = buildFullSystemInstruction(mode);
  let transcript = input.transcriptHint || '';
  let text: string | null = null;

  if (isAgentProxyUsable()) {
    try {
      const result = await streamViaProxy(
        buildProxyPayload(input, systemInstruction, history),
        onChunk,
        onTranscript,
        transcript,
      );
      text = result.text;
      transcript = result.transcript;
    } catch (err) {
      if (!(err instanceof AgentProxyUnavailableError)) {
        console.error('[AgentConversationService] Erreur stream:', err);
        throw err;
      }
      console.warn(`[AgentConversationService] ${err.message} — repli sur le transport IA de l'app.`);
    }
  }

  if (text === null) {
    text = await streamViaTransport(input, systemInstruction, history, onChunk);
  }

  autoExtractAndSaveContext({ ...input, transcriptHint: transcript }, text);
  return { text, transcript: transcript || input.transcriptHint, mode };
}

/**
 * Transcrit directement un fichier audio vocal via l'endpoint dédié /api/agent/transcribe.
 * Renvoie '' si le service agent n'est pas disponible (l'appelant retombe sur la transcription du navigateur).
 */
export async function transcribeAudioFile(base64Audio: string, mimeType?: string): Promise<string> {
  if (!isAgentProxyUsable()) return '';
  try {
    const res = await proxyFetch('transcribe', { base64Audio, mimeType });
    const data = await res.json();
    return data.transcript || '';
  } catch {
    return '';
  }
}

/**
 * Envoie un message texte ou audio à l'agent IA (appel non streamé) : service agent `/message` si
 * disponible, sinon transport IA de l'app. Lève une AgentServiceError explicite en cas d'échec.
 */
export async function sendAgentMessage(
  input: AgentInput,
  mode: AssistantMode = 'conversation',
  history: ConversationHistoryMessage[] = [],
): Promise<AgentResponse> {
  const systemInstruction = buildFullSystemInstruction(mode);

  if (isAgentProxyUsable()) {
    try {
      const response = await proxyFetch('message', buildProxyPayload(input, systemInstruction, history));
      const data = await response.json();
      const responseText = typeof data.text === 'string' ? data.text.trim() : '';
      if (!responseText) {
        throw new AgentServiceError("Le service d'assistant a renvoyé une réponse vide.");
      }
      const transcript = data.transcript || input.transcriptHint;
      autoExtractAndSaveContext({ ...input, transcriptHint: transcript }, responseText);
      return { text: responseText, transcript, mode };
    } catch (err) {
      if (!(err instanceof AgentProxyUnavailableError)) {
        console.error('[AgentConversationService] Erreur appel:', err);
        throw err;
      }
      console.warn(`[AgentConversationService] ${err.message} — repli sur le transport IA de l'app.`);
    }
  }

  const message = userTextForTransport(input);
  let responseText = '';
  try {
    const dto = await resolveTransport().sendChatMessage({
      message,
      history: historyForTransport(history),
      context: systemInstruction,
      tools: [],
    });
    responseText = (dto.message || '').trim();
  } catch (err) {
    throw new AgentServiceError(`L'assistant n'a pas pu répondre : ${errorMessage(err)}. ${FALLBACK_HINT}`, {
      cause: err,
    });
  }
  if (!responseText) {
    throw new AgentServiceError(`L'assistant a renvoyé une réponse vide. ${FALLBACK_HINT}`);
  }
  autoExtractAndSaveContext({ ...input, transcriptHint: input.transcriptHint }, responseText);
  return { text: responseText, transcript: input.transcriptHint, mode };
}

/**
 * Génère un flux audio parlé via le service agent (Gemini TTS).
 * Renvoie null si indisponible : l'appelant retombe sur la synthèse vocale du navigateur.
 */
export async function generateSpeechAudio(
  text: string,
  voiceName: 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir' = 'Kore',
): Promise<string | null> {
  if (!isAgentProxyUsable()) return null;
  try {
    const response = await proxyFetch('tts', { text, voiceName });
    const data = await response.json();
    return data.audioBase64 || null;
  } catch {
    return null;
  }
}

/**
 * Analyse automatique des échanges pour enrichir la mémoire locale
 */
function autoExtractAndSaveContext(input: AgentInput, responseText: string) {
  try {
    const userText = input.text || input.transcriptHint || '';
    if (!userText) return;

    const lower = userText.toLowerCase();

    if (
      lower.includes('je préfère') ||
      lower.includes('mon rôle est') ||
      lower.includes("je m'appelle") ||
      lower.includes('souviens-toi que')
    ) {
      const fact = `Préférence notée : "${userText}"`;
      appendContextMemory(fact);
    }
  } catch {
    // ignore
  }
}
