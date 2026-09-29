/**
 * React Hook : useAgentConversation (Duplex Audio-Audio & Text)
 * Supporte la conversation fluide bilatérale :
 * - Entrée Vocale (VAD automatique ultra-rapide)
 * - Sortie Vocale (Lecture automatique des réponses IA avec synthèse vocale / TTS)
 * - Mode Duplex Continu (l'écoute se relance automatiquement dès que l'agent a fini de parler)
 * - Gestion dynamique du Prompt Système avec persistance localStorage
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AgentInput,
  AgentResponse,
  ConversationHistoryMessage,
  sendAgentMessage,
  streamAgentMessage,
  generateSpeechAudio,
} from '../services/agentConversationService';
import {
  VoiceActivityDetector,
  VadConfig,
  DEFAULT_VAD_CONFIG,
} from '../services/vadService';
import {
  AudioPlayerService,
} from '../services/audioPlayerService';
import {
  loadSystemPrompt,
  saveSystemPrompt,
  appendContextMemory,
  resetSystemPrompt as resetSystemPromptStorage,
  getPromptMetadata,
  PromptMetadata,
} from '../services/promptManager';
import { type AssistantMode } from '@egen-civitas/esm-styleguide';

export interface UseAgentConversationOptions {
  mode?: AssistantMode;
  vadConfig?: Partial<VadConfig>;
  enableStreaming?: boolean;
  autoSaveHistory?: boolean;
  enableAudioOutput?: boolean;
  enableContinuousVoice?: boolean;
}

export interface UseAgentConversationReturn {
  // État de la conversation
  messages: ConversationHistoryMessage[];
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isAgentSpeaking: boolean;
  streamingText: string;
  audioVolume: number;
  outputVolume: number;
  error: Error | null;

  // Options audio & mode continu
  isAudioOutputEnabled: boolean;
  isContinuousVoiceMode: boolean;
  setIsAudioOutputEnabled: (enabled: boolean) => void;
  setIsContinuousVoiceMode: (enabled: boolean) => void;
  stopAgentSpeech: () => void;

  // Prompt Système & Métadonnées
  systemPrompt: string;
  promptMetadata: PromptMetadata | null;
  updateSystemPrompt: (newPrompt: string) => void;
  appendMemory: (fact: string) => void;
  resetPrompt: () => void;

  // Actions de communication
  sendTextMessage: (text: string) => Promise<AgentResponse | null>;
  sendAudioMessage: (audioBlob: Blob, base64Audio: string, transcriptHint?: string) => Promise<AgentResponse | null>;
  startVoiceListening: () => Promise<void>;
  stopVoiceListening: () => Promise<void>;
  cancelVoiceListening: () => void;
  clearHistory: () => void;
}

const STORAGE_KEY_HISTORY = 'egen_agent_conversation_history';

export function useAgentConversation(
  options: UseAgentConversationOptions = {}
): UseAgentConversationReturn {
  const {
    mode = 'conversation',
    vadConfig = {},
    enableStreaming = true,
    autoSaveHistory = true,
    enableAudioOutput = true,
    enableContinuousVoice = true,
  } = options;

  // États conversationnels
  const [messages, setMessages] = useState<ConversationHistoryMessage[]>(() => {
    if (typeof window === 'undefined' || !autoSaveHistory) return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (!saved) return [];
      const parsed: ConversationHistoryMessage[] = JSON.parse(saved);
      return parsed.map((m) => {
        let content = m.content || '';
        const transcript = m.transcript || '';
        if (transcript) {
          content = transcript;
        } else if (content.startsWith('🎤 Transcription en cours')) {
          content = '🎤 [Message vocal]';
        }
        return {
          ...m,
          content,
          transcript: transcript || (content !== '🎤 [Message vocal]' && m.type === 'audio' ? content : undefined),
        };
      });
    } catch {
      return [];
    }
  });

  const messagesRef = useRef<ConversationHistoryMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [audioVolume, setAudioVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Configuration Audio Duplex
  const [isAudioOutputEnabled, setIsAudioOutputEnabled] = useState(enableAudioOutput);
  const [isContinuousVoiceMode, setIsContinuousVoiceMode] = useState(enableContinuousVoice);

  // État du prompt système actif
  const [systemPrompt, setSystemPrompt] = useState<string>(() => loadSystemPrompt());
  const [promptMetadata, setPromptMetadata] = useState<PromptMetadata | null>(() => getPromptMetadata());

  // Références d'instances VAD, Audio Player et état
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const playerRef = useRef<AudioPlayerService | null>(null);
  const activeModeRef = useRef<AssistantMode>(mode);
  activeModeRef.current = mode;

  const continuousRef = useRef(isContinuousVoiceMode);
  continuousRef.current = isContinuousVoiceMode;

  const audioOutputRef = useRef(isAudioOutputEnabled);
  audioOutputRef.current = isAudioOutputEnabled;

  // Initialisation du player audio
  useEffect(() => {
    playerRef.current = new AudioPlayerService({
      onStart: () => {
        setIsAgentSpeaking(true);
      },
      onEnd: () => {
        setIsAgentSpeaking(false);
        setOutputVolume(0);
        // Si le mode continu duplex est activé, on relance automatiquement l'écoute VAD
        if (continuousRef.current) {
          setTimeout(() => {
            startVoiceListening();
          }, 350);
        }
      },
      onVolumeChange: (vol) => {
        setOutputVolume(vol);
      },
      onError: () => {
        setIsAgentSpeaking(false);
        setOutputVolume(0);
      },
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current = null;
      }
    };
  }, []);

  // Sauvegarde automatique de l'historique
  useEffect(() => {
    if (autoSaveHistory && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(messages.slice(-30)));
      } catch {
        // ignore quota
      }
    }
  }, [messages, autoSaveHistory]);

  // Synchronisation du prompt système si modifié par un autre onglet/composant
  useEffect(() => {
    const handlePromptUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.prompt) {
        setSystemPrompt(detail.prompt);
        setPromptMetadata(detail.meta);
      }
    };
    window.addEventListener('egen_system_prompt_updated', handlePromptUpdate);
    return () => window.removeEventListener('egen_system_prompt_updated', handlePromptUpdate);
  }, []);

  // Nettoyage complet au démontage (libération micro et VAD)
  useEffect(() => {
    return () => {
      if (vadRef.current) {
        vadRef.current.cancel();
        vadRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.stop();
      }
    };
  }, []);

  // Joue la réponse en audio (TTS Gemini ou Synthèse Vocale locale)
  const playAgentResponse = useCallback(async (responseText: string) => {
    if (!audioOutputRef.current || !playerRef.current) return;

    try {
      // 1. Tente d'obtenir le flux TTS Gemini haute fidélité
      const ttsAudio = await generateSpeechAudio(responseText);
      if (ttsAudio && playerRef.current) {
        await playerRef.current.playBase64Pcm(ttsAudio, 24000);
      } else if (playerRef.current) {
        // 2. Fallback immédiat vers la synthèse vocale du navigateur
        playerRef.current.speakTextFallback(responseText);
      }
    } catch (err) {
      if (playerRef.current) {
        playerRef.current.speakTextFallback(responseText);
      }
    }
  }, []);

  // Envoi générique d'un input (Texte ou Audio)
  const executeSendMessage = useCallback(
    async (input: AgentInput, userDisplayContent: string): Promise<AgentResponse | null> => {
      // Si l'agent parlait, on coupe son audio dès que l'utilisateur envoie un message
      if (playerRef.current) {
        playerRef.current.stop();
      }

      setIsProcessing(true);
      setError(null);
      setStreamingText('');

      const userMsgId = 'msg-' + Date.now() + '-u';
      const assistantMsgId = 'msg-' + Date.now() + '-a';

      const userMsg: ConversationHistoryMessage = {
        id: userMsgId,
        role: 'user',
        content: userDisplayContent,
        type: input.type,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        audioBlob: input.type === 'audio' ? input.audioBlob : undefined,
        transcript: input.transcriptHint,
        mode: activeModeRef.current,
      };

      const priorHistory = [...messagesRef.current];
      setMessages((prev) => [...prev, userMsg]);
      messagesRef.current = [...messagesRef.current, userMsg];

      const shouldPlayVoice = audioOutputRef.current;
      if (shouldPlayVoice && playerRef.current) {
        playerRef.current.startStreamingSession();
      }

      let sentenceBuffer = '';

      try {
        let response: AgentResponse;

        if (enableStreaming) {
          response = await streamAgentMessage(
            input,
            activeModeRef.current,
            priorHistory,
            (chunk) => {
              setStreamingText((prev) => prev + chunk);

              if (shouldPlayVoice && playerRef.current) {
                sentenceBuffer += chunk;
                const splitMatch = sentenceBuffer.match(/^(.*?[.!?:\n])\s*([\s\S]*)$/);
                if (splitMatch) {
                  const completeSentence = splitMatch[1].trim();
                  sentenceBuffer = splitMatch[2] || '';
                  if (completeSentence) {
                    playerRef.current.enqueueSentence(completeSentence);
                  }
                } else if (sentenceBuffer.length > 90 && sentenceBuffer.includes(',')) {
                  const commaIndex = sentenceBuffer.lastIndexOf(',');
                  const clause = sentenceBuffer.slice(0, commaIndex + 1).trim();
                  sentenceBuffer = sentenceBuffer.slice(commaIndex + 1).trim();
                  if (clause) {
                    playerRef.current.enqueueSentence(clause);
                  }
                }
              }
            },
            (liveTranscript) => {
              if (liveTranscript) {
                const cleaned = liveTranscript.trim();
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === userMsgId
                      ? {
                          ...m,
                          content: cleaned,
                          transcript: cleaned,
                        }
                      : m
                  )
                );
                messagesRef.current = messagesRef.current.map((m) =>
                  m.id === userMsgId
                    ? {
                        ...m,
                        content: cleaned,
                        transcript: cleaned,
                      }
                    : m
                );
              }
            }
          );
        } else {
          response = await sendAgentMessage(input, activeModeRef.current, priorHistory);
        }

        const finalTranscript = (response.transcript || '').trim();
        if (finalTranscript) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsgId
                ? {
                    ...m,
                    content: finalTranscript,
                    transcript: finalTranscript,
                  }
                : m
            )
          );
          messagesRef.current = messagesRef.current.map((m) =>
            m.id === userMsgId
              ? {
                  ...m,
                  content: finalTranscript,
                  transcript: finalTranscript,
                }
              : m
          );
        } else if (input.type === 'audio') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsgId && m.content.startsWith('🎤 Transcription')
                ? { ...m, content: '🎤 [Message vocal]' }
                : m
            )
          );
          messagesRef.current = messagesRef.current.map((m) =>
            m.id === userMsgId && m.content.startsWith('🎤 Transcription')
              ? { ...m, content: '🎤 [Message vocal]' }
              : m
          );
        }

        if (shouldPlayVoice && playerRef.current) {
          if (sentenceBuffer.trim()) {
            playerRef.current.enqueueSentence(sentenceBuffer.trim());
          }
          playerRef.current.finishStreamingSession();
        }

        const assistantMsg: ConversationHistoryMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: response.text,
          type: 'text',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          mode: response.mode,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        messagesRef.current = [...messagesRef.current, assistantMsg];
        setStreamingText('');
        setSystemPrompt(loadSystemPrompt());
        setPromptMetadata(getPromptMetadata());

        return response;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [enableStreaming, playAgentResponse]
  );

  // Envoi de message texte
  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) return null;
      return executeSendMessage({ type: 'text', text: text.trim() }, text.trim());
    },
    [executeSendMessage]
  );

  // Envoi de message audio
  const sendAudioMessage = useCallback(
    async (audioBlob: Blob, base64Audio: string, transcriptHint?: string) => {
      const displayLabel = transcriptHint || '🎤 Message vocal (' + Math.round(audioBlob.size / 1024) + ' KB)';
      return executeSendMessage(
        {
          type: 'audio',
          audioBlob,
          base64Audio,
          mimeType: audioBlob.type || 'audio/webm',
          transcriptHint,
        },
        displayLabel
      );
    },
    [executeSendMessage]
  );

  // Gestion du Voice Activity Detection (VAD)
  const startVoiceListening = useCallback(async () => {
    // Si l'agent parlait, interruption immédiate (Barge-in naturel)
    if (playerRef.current) {
      playerRef.current.stop();
    }

    setError(null);

    if (!vadRef.current) {
      vadRef.current = new VoiceActivityDetector(
        {
          ...DEFAULT_VAD_CONFIG,
          ...vadConfig,
        },
        {
          onSpeechStart: () => {
            setIsSpeaking(true);
            if (playerRef.current) playerRef.current.stop();
          },
          onSpeechEnd: (blob, base64) => {
            setIsSpeaking(false);
            setIsListening(false);
            setAudioVolume(0);
            if (!base64 || base64.length < 300) {
              return;
            }
            sendAudioMessage(blob, base64);
          },
          onVolumeChange: (vol) => {
            setAudioVolume(vol);
          },
          onError: (err) => {
            setError(err);
            setIsListening(false);
            setIsSpeaking(false);
            setAudioVolume(0);
          },
        }
      );
    } else {
      vadRef.current.updateConfig(vadConfig);
    }

    try {
      await vadRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [vadConfig, sendAudioMessage]);

  const stopVoiceListening = useCallback(async () => {
    if (vadRef.current && isListening) {
      await vadRef.current.stop();
      setIsListening(false);
      setIsSpeaking(false);
      setAudioVolume(0);
    }
  }, [isListening]);

  const cancelVoiceListening = useCallback(() => {
    if (vadRef.current) {
      vadRef.current.cancel();
    }
    setIsListening(false);
    setIsSpeaking(false);
    setAudioVolume(0);
  }, []);

  const stopAgentSpeech = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    setIsAgentSpeaking(false);
    setOutputVolume(0);
  }, []);

  // Gestion du prompt système
  const updateSystemPromptHandler = useCallback((newPrompt: string) => {
    saveSystemPrompt(newPrompt, 'user_custom');
    setSystemPrompt(newPrompt);
    setPromptMetadata(getPromptMetadata());
  }, []);

  const appendMemoryHandler = useCallback((fact: string) => {
    const updated = appendContextMemory(fact);
    setSystemPrompt(updated);
    setPromptMetadata(getPromptMetadata());
  }, []);

  const resetPromptHandler = useCallback(() => {
    const initial = resetSystemPromptStorage();
    setSystemPrompt(initial);
    setPromptMetadata(getPromptMetadata());
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY_HISTORY);
      } catch {
        // ignore
      }
    }
  }, []);

  return {
    messages,
    isListening,
    isSpeaking,
    isProcessing,
    isAgentSpeaking,
    streamingText,
    audioVolume,
    outputVolume,
    error,
    isAudioOutputEnabled,
    isContinuousVoiceMode,
    setIsAudioOutputEnabled,
    setIsContinuousVoiceMode,
    stopAgentSpeech,
    systemPrompt,
    promptMetadata,
    updateSystemPrompt: updateSystemPromptHandler,
    appendMemory: appendMemoryHandler,
    resetPrompt: resetPromptHandler,
    sendTextMessage,
    sendAudioMessage,
    startVoiceListening,
    stopVoiceListening,
    cancelVoiceListening,
    clearHistory,
  };
}
