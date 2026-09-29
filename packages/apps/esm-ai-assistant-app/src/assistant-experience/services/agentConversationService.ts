/**
 * Service de Conversation Agent IA (Appels sécurisés via le Proxy Serveur)
 * - Gestion du contexte et de l'historique COMPLET des conversations dans le temps.
 * - Support multimodal : Entrée Texte et Entrée Vocale (WAV 16kHz).
 * - Streaming en temps réel avec SSE via `/api/agent/stream`.
 * - Zéro clé API exposée côté client.
 */

import { agentApiUrl } from './agentApiConfig';
import {
  type AssistantMode,
  ASSISTANT_MODES,
} from '@egen-civitas/esm-styleguide';
import {
  loadSystemPrompt,
  appendContextMemory,
} from './promptManager';

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

/**
 * Envoie un message texte ou audio en streaming via le proxy backend `/api/agent/stream`
 */
export async function streamAgentMessage(
  input: AgentInput,
  mode: AssistantMode = 'conversation',
  history: ConversationHistoryMessage[] = [],
  onChunk: (chunkText: string) => void,
  onTranscript?: (transcript: string) => void
): Promise<AgentResponse> {
  const systemInstruction = buildFullSystemInstruction(mode);

  const payload = {
    input: {
      type: input.type,
      text: input.text,
      base64Audio: input.base64Audio,
      mimeType: input.mimeType || input.audioBlob?.type || 'audio/wav',
      transcriptHint: input.transcriptHint,
    },
    systemInstruction,
    // Envoie TOUT l'historique complet sans coupure, en s'assurant que la transcription textuelle est prioritaire
    history: history.map((msg) => {
      let content = (msg.transcript || msg.content || '').trim();
      if (content.startsWith('🎤 Transcription en cours') || content === '🎤 [Message vocal]') {
        content = msg.transcript?.trim() || "[Message vocal de l'utilisateur]";
      }
      return {
        id: msg.id,
        role: msg.role,
        type: msg.type,
        content,
        transcript: msg.transcript,
      };
    }),
  };

  let fullResponseText = '';
  let receivedTranscript = input.transcriptHint || '';

  try {
    const response = await fetch(agentApiUrl('stream'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur serveur (${response.status}): ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Flux de réponse non disponible');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.transcript) {
              receivedTranscript = data.transcript;
              if (onTranscript) {
                onTranscript(data.transcript);
              }
            }
            if (data.text) {
              fullResponseText += data.text;
              onChunk(data.text);
            } else if (data.error) {
              console.warn('[AgentService] Message d\'erreur serveur:', data.error);
            }
          } catch {
            // Ignore parse errors on partial chunks
          }
        }
      }
    }

    const finalResponse = fullResponseText || "J'ai bien compris votre demande.";
    autoExtractAndSaveContext({ ...input, transcriptHint: receivedTranscript }, finalResponse);

    return {
      text: finalResponse,
      transcript: receivedTranscript || input.transcriptHint,
      mode,
    };
  } catch (err) {
    console.error('[AgentConversationService] Erreur stream:', err);
    // Fallback gracieux si le stream rencontre un souci
    const fallbackText = "Bonjour ! Je suis à votre écoute pour vous assister sur l'intranet EGEN.";
    onChunk(fallbackText);
    return {
      text: fallbackText,
      transcript: receivedTranscript || input.transcriptHint,
      mode,
    };
  }
}

/**
 * Transcrit directement un fichier audio vocal via l'endpoint dédié /api/agent/transcribe
 */
export async function transcribeAudioFile(base64Audio: string, mimeType?: string): Promise<string> {
  try {
    const res = await fetch(agentApiUrl('transcribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Audio, mimeType }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.transcript || '';
  } catch {
    return '';
  }
}

/**
 * Envoie un message texte ou audio à l'agent IA (appel non streamé)
 */
export async function sendAgentMessage(
  input: AgentInput,
  mode: AssistantMode = 'conversation',
  history: ConversationHistoryMessage[] = []
): Promise<AgentResponse> {
  const systemInstruction = buildFullSystemInstruction(mode);

  const payload = {
    input: {
      type: input.type,
      text: input.text,
      base64Audio: input.base64Audio,
      mimeType: input.mimeType || input.audioBlob?.type || 'audio/wav',
      transcriptHint: input.transcriptHint,
    },
    systemInstruction,
    history: history.map((msg) => {
      let content = (msg.transcript || msg.content || '').trim();
      if (content.startsWith('🎤 Transcription en cours') || content === '🎤 [Message vocal]') {
        content = msg.transcript?.trim() || "[Message vocal de l'utilisateur]";
      }
      return {
        id: msg.id,
        role: msg.role,
        type: msg.type,
        content,
        transcript: msg.transcript,
      };
    }),
  };

  try {
    const response = await fetch(agentApiUrl('message'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur serveur (${response.status})`);
    }

    const data = await response.json();
    const responseText = data.text || "J'ai bien reçu votre message.";
    const transcript = data.transcript || input.transcriptHint;
    autoExtractAndSaveContext({ ...input, transcriptHint: transcript }, responseText);

    return {
      text: responseText,
      transcript,
      mode,
    };
  } catch (err) {
    console.error('[AgentConversationService] Erreur appel:', err);
    return {
      text: "Je suis à votre disposition sur la plateforme EGEN.",
      mode,
    };
  }
}

/**
 * Génère un flux audio parlé via le serveur proxy Gemini TTS
 */
export async function generateSpeechAudio(
  text: string,
  voiceName: 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir' = 'Kore'
): Promise<string | null> {
  try {
    const response = await fetch(agentApiUrl('tts'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voiceName }),
    });

    if (!response.ok) return null;
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
      lower.includes('je m\'appelle') ||
      lower.includes('souviens-toi que')
    ) {
      const fact = `Préférence notée : "${userText}"`;
      appendContextMemory(fact);
    }
  } catch {
    // ignore
  }
}
