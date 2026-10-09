/**
 * Service de conversation avec l'agent IA — simple façade sur le canal temps réel.
 *
 * Tout le moteur (prompt système, mode, mémoire/historique, LLM, STT, TTS) vit côté
 * backend. Ce service relaie ce que dit ou écrit l'utilisateur au backend via le canal
 * `@egen-civitas/esm-ai-framework` (WebSocket), restitue le flux de réponse et demande la
 * synthèse vocale. Les appels de tools demandés par le backend sont exécutés par le
 * canal lui-même (module tool-dispatcher), pas ici.
 *
 * Aucune réponse n'est JAMAIS inventée : si le backend est injoignable, une
 * `AgentServiceError` explicite est levée (affichée par l'UI).
 */

import {
  ChannelClosedError,
  ChannelNotReadyError,
  ChannelRemoteError,
  ChannelTimeoutError,
  getConversationClient,
  type ConversationClient,
} from '@egen-civitas/esm-ai-framework';
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

/** Message tel qu'affiché par l'UI (l'historique de référence est tenu par le backend). */
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
  readonly cause?: unknown;

  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message);
    this.name = 'AgentServiceError';
    this.cause = options.cause;
  }
}

export interface StreamHandlers {
  signal?: AbortSignal;
  /** Fragment audio PCM 16 bits LE mono (base64) envoyé par le backend pendant la réponse */
  onAudioChunk?: (chunk: { base64: string; seq: number; sampleRate?: number; final?: boolean }) => void;
  /** Identifiant du flux dès l'envoi (pour associer les appels de tools à la réponse) */
  onStreamId?: (streamId: string) => void;
}

function conversationClient(): ConversationClient {
  const client = getConversationClient();
  if (!client) {
    throw new AgentServiceError("L'assistant est désactivé : le canal temps réel n'est pas démarré.");
  }
  return client;
}

function toServiceError(err: unknown): Error {
  if (err instanceof AgentServiceError) return err;
  if (err instanceof DOMException && err.name === 'AbortError') return err;
  if (err instanceof ChannelNotReadyError) {
    return new AgentServiceError("L'assistant est hors ligne. Reconnexion en cours — réessayez dans un instant.", {
      cause: err,
    });
  }
  if (err instanceof ChannelClosedError) {
    return new AgentServiceError('La connexion avec l\'assistant a été interrompue. Réessayez.', { cause: err });
  }
  if (err instanceof ChannelTimeoutError) {
    return new AgentServiceError("L'assistant n'a pas répondu à temps.", { cause: err });
  }
  if (err instanceof ChannelRemoteError) {
    return new AgentServiceError(`L'assistant a signalé une erreur : ${err.message}`, { cause: err });
  }
  return new AgentServiceError(err instanceof Error ? err.message : String(err), { cause: err });
}

/**
 * Envoie un message texte ou audio et restitue la réponse en streaming.
 * Lève une AgentServiceError explicite en cas d'échec (hors ligne, interrompu, erreur backend, réponse vide).
 */
export async function streamAgentMessage(
  input: AgentInput,
  mode: AssistantMode = 'conversation',
  onChunk: (chunkText: string) => void,
  onTranscript?: (transcript: string) => void,
  handlers: StreamHandlers = {},
): Promise<AgentResponse> {
  try {
    const client = conversationClient();
    const common = {
      mode,
      onDelta: onChunk,
      onTranscript,
      onAudioChunk: handlers.onAudioChunk,
      onStreamId: handlers.onStreamId,
      signal: handlers.signal,
    };

    let result;
    if (input.type === 'audio') {
      if (!input.base64Audio) throw new AgentServiceError('Aucun enregistrement audio à envoyer.');
      result = await client.sendAudio(
        {
          base64Audio: input.base64Audio,
          mimeType: input.mimeType || input.audioBlob?.type || 'audio/wav',
          transcriptHint: input.transcriptHint,
        },
        common,
      );
    } else {
      result = await client.sendText(input.text ?? '', common);
    }

    if (!result.text.trim()) {
      throw new AgentServiceError("L'assistant a renvoyé une réponse vide.");
    }
    return { text: result.text, transcript: result.transcript || input.transcriptHint, mode };
  } catch (err) {
    throw toServiceError(err);
  }
}

/**
 * Demande au backend la synthèse vocale d'un texte.
 * Renvoie null si indisponible : l'appelant retombe sur la synthèse vocale du navigateur.
 */
export async function generateSpeechAudio(
  text: string,
  voiceName: 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir' = 'Kore',
): Promise<string | null> {
  try {
    return await conversationClient().requestSpeech(text, voiceName);
  } catch {
    return null;
  }
}

/** Efface la conversation côté backend (nouvelle conversation). */
export function resetRemoteConversation(): void {
  try {
    conversationClient().reset();
  } catch {
    // canal indisponible : la conversation locale est de toute façon vidée par l'appelant
  }
}
