'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  type AgentInput,
  type AgentResponse,
  type ConversationHistoryMessage,
  sendAgentMessage,
  streamAgentMessage,
  generateSpeechAudio,
} from '../services/agentConversationService';
import {
  VoiceActivityDetector,
  type VadConfig,
  DEFAULT_VAD_CONFIG,
} from '../services/vadService';
import { AudioPlayerService } from '../services/audioPlayerService';
import {
  loadSystemPrompt,
  saveSystemPrompt,
  appendContextMemory,
  resetSystemPrompt as resetSystemPromptStorage,
  getPromptMetadata,
  type PromptMetadata,
} from '../services/promptManager';
import { type AssistantMode } from '@egen-civitas/esm-styleguide';

export interface AgentConversationContextValue {
  // Messages & Conversation State
  messages: ConversationHistoryMessage[];
  isListening: boolean;
  isSpeaking: boolean;
  isPausing?: boolean;
  isProcessing: boolean;
  isAgentSpeaking: boolean;
  streamingText: string;
  audioVolume: number;
  outputVolume: number;
  error: Error | null;

  // Options Voix & Duplex
  isAudioOutputEnabled: boolean;
  isContinuousVoiceMode: boolean;
  setIsAudioOutputEnabled: (enabled: boolean) => void;
  setIsContinuousVoiceMode: (enabled: boolean) => void;
  stopAgentSpeech: () => void;

  // Mode Assistant Actif
  mode: AssistantMode;
  setMode: (mode: AssistantMode) => void;

  // Prompt Système & Métadonnées
  systemPrompt: string;
  promptMetadata: PromptMetadata | null;
  updateSystemPrompt: (newPrompt: string) => void;
  appendMemory: (fact: string) => void;
  resetPrompt: () => void;

  // Actions
  sendTextMessage: (text: string) => Promise<AgentResponse | null>;
  sendAudioMessage: (audioBlob: Blob, base64Audio: string, transcriptHint?: string) => Promise<AgentResponse | null>;
  startVoiceListening: () => Promise<void>;
  stopVoiceListening: () => Promise<void>;
  toggleVoiceListening: () => Promise<void>;
  cancelVoiceListening: () => void;
  clearHistory: () => void;
}

const STORAGE_KEY_HISTORY = 'egen_agent_conversation_history';
const STORAGE_KEY_VOICE_ACTIVE = 'egen_agent_voice_active';
const STORAGE_KEY_VOICE_OUTPUT = 'egen_agent_voice_output';
const STORAGE_KEY_CONTINUOUS = 'egen_agent_continuous_voice';

const AgentConversationContext = createContext<AgentConversationContextValue | null>(null);

interface AgentConversationProviderProps {
  children: React.ReactNode;
  initialMode?: AssistantMode;
  vadConfig?: Partial<VadConfig>;
}

export function AgentConversationProvider({
  children,
  initialMode = 'conversation',
  vadConfig = {},
}: AgentConversationProviderProps) {
  // Mode assistant
  const [mode, setMode] = useState<AssistantMode>(initialMode);
  const activeModeRef = useRef<AssistantMode>(mode);
  activeModeRef.current = mode;

  // Messages persistants (historique complet sans coupure)
  const [messages, setMessages] = useState<ConversationHistoryMessage[]>(() => {
    if (typeof window === 'undefined') return [];
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

  // États conversationnels
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [audioVolume, setAudioVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Configuration Audio Duplex persistée
  const [isAudioOutputEnabled, setIsAudioOutputEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEY_VOICE_OUTPUT);
    return saved !== null ? saved === 'true' : true;
  });

  const [isContinuousVoiceMode, setIsContinuousVoiceModeState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEY_CONTINUOUS);
    return saved !== null ? saved === 'true' : true;
  });

  const setIsAudioOutputEnabled = (enabled: boolean) => {
    setIsAudioOutputEnabledState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_VOICE_OUTPUT, String(enabled));
    }
  };

  const setIsContinuousVoiceMode = (enabled: boolean) => {
    setIsContinuousVoiceModeState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CONTINUOUS, String(enabled));
    }
  };

  // État du prompt système actif
  const [systemPrompt, setSystemPrompt] = useState<string>(() => loadSystemPrompt());
  const [promptMetadata, setPromptMetadata] = useState<PromptMetadata | null>(() => getPromptMetadata());

  // Références d'instances VAD et Audio Player
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const playerRef = useRef<AudioPlayerService | null>(null);

  const continuousRef = useRef(isContinuousVoiceMode);
  continuousRef.current = isContinuousVoiceMode;

  const audioOutputRef = useRef(isAudioOutputEnabled);
  audioOutputRef.current = isAudioOutputEnabled;

  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  // Sauvegarde automatique de l'INTÉGRALITÉ de l'historique sans coupure
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const textOnlyHistory = messages.map(({ id, role, content, type, timestamp, mode, transcript }) => ({
          id,
          role,
          content: transcript || content,
          type,
          timestamp,
          mode,
          transcript: transcript || (type === 'audio' ? content : undefined),
        }));
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(textOnlyHistory));
      } catch {
        // ignore quota
      }
    }
  }, [messages]);

  // Synchronisation du prompt système si modifié par un autre onglet
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

  // Déclaration du startVoiceListening pour le cycle duplex
  const startVoiceListeningRef = useRef<() => Promise<void>>(async () => {});

  // Initialisation du player audio permanent
  useEffect(() => {
    playerRef.current = new AudioPlayerService({
      onStart: () => {
        setIsAgentSpeaking(true);
      },
      onEnd: () => {
        setIsAgentSpeaking(false);
        setOutputVolume(0);
        // Si le mode continu est actif, relance automatiquement l'écoute VAD
        if (continuousRef.current) {
          setTimeout(() => {
            startVoiceListeningRef.current();
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

  // Joue la réponse en audio (TTS Gemini ou Synthèse Vocale locale)
  const playAgentResponse = useCallback(async (responseText: string) => {
    if (!audioOutputRef.current || !playerRef.current) return;

    try {
      const ttsAudio = await generateSpeechAudio(responseText);
      if (ttsAudio && playerRef.current) {
        await playerRef.current.playBase64Pcm(ttsAudio, 24000);
      } else if (playerRef.current) {
        playerRef.current.speakTextFallback(responseText);
      }
    } catch {
      if (playerRef.current) {
        playerRef.current.speakTextFallback(responseText);
      }
    }
  }, []);

  // Envoi générique d'un input (Texte ou Audio)
  const executeSendMessage = useCallback(
    async (input: AgentInput, userDisplayContent: string): Promise<AgentResponse | null> => {
      if (playerRef.current) {
        playerRef.current.stop();
      }

      setIsProcessing(true);
      setError(null);
      setStreamingText('');

      const userMsgId = 'msg-' + Date.now() + '-u';
      const assistantMsgId = 'msg-' + (Date.now() + 1) + '-a';

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

      try {
        const response: AgentResponse = await streamAgentMessage(
          input,
          activeModeRef.current,
          priorHistory,
          (chunk) => {
            setStreamingText((prev) => prev + chunk);
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

        // Lecture vocale automatique de la réponse
        if (response.text) {
          playAgentResponse(response.text);
        }

        return response;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [playAgentResponse]
  );

  // Envoi de message texte
  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) return null;
      return executeSendMessage({ type: 'text', text: text.trim() }, text.trim());
    },
    [executeSendMessage]
  );

  // Envoi de message audio avec gestion de la transcription
  const sendAudioMessage = useCallback(
    async (audioBlob: Blob, base64Audio: string, transcriptHint?: string) => {
      const displayLabel = transcriptHint?.trim() ? transcriptHint.trim() : '🎤 Transcription en cours...';
      return executeSendMessage(
        {
          type: 'audio',
          audioBlob,
          base64Audio,
          mimeType: audioBlob.type || 'audio/wav',
          transcriptHint: transcriptHint?.trim() || undefined,
        },
        displayLabel
      );
    },
    [executeSendMessage]
  );

  // Gestion du Voice Activity Detection (VAD)
  const startVoiceListening = useCallback(async () => {
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
            setIsPausing(false);
            if (playerRef.current) playerRef.current.stop();
          },
          onSpeechPause: (pausing) => {
            setIsPausing(pausing);
          },
          onSpeechEnd: (blob, base64) => {
            setIsSpeaking(false);
            setIsPausing(false);
            setIsListening(false);
            setAudioVolume(0);
            sendAudioMessage(blob, base64);
          },
          onVolumeChange: (vol) => {
            setAudioVolume(vol);
          },
          onError: (err) => {
            setError(err);
            setIsListening(false);
            setIsSpeaking(false);
            setIsPausing(false);
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
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_VOICE_ACTIVE, 'true');
      }
    } catch {
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [vadConfig, sendAudioMessage]);

  startVoiceListeningRef.current = startVoiceListening;

  const stopVoiceListening = useCallback(async () => {
    if (vadRef.current && isListeningRef.current) {
      await vadRef.current.stop();
      setIsListening(false);
      setIsSpeaking(false);
      setAudioVolume(0);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_VOICE_ACTIVE, 'false');
      }
    }
  }, []);

  const toggleVoiceListening = useCallback(async () => {
    if (isListeningRef.current) {
      await stopVoiceListening();
    } else {
      await startVoiceListening();
    }
  }, [startVoiceListening, stopVoiceListening]);

  const cancelVoiceListening = useCallback(() => {
    if (vadRef.current) {
      vadRef.current.cancel();
    }
    setIsListening(false);
    setIsSpeaking(false);
    setAudioVolume(0);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_VOICE_ACTIVE, 'false');
    }
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

  // Restauration de session après refresh : si la session vocale était active
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasVoiceActive = localStorage.getItem(STORAGE_KEY_VOICE_ACTIVE) === 'true';
      if (wasVoiceActive) {
        // Démarre l'écoute après interaction ou dès le montage
        const handleInitialClick = () => {
          startVoiceListening();
          window.removeEventListener('click', handleInitialClick);
        };
        window.addEventListener('click', handleInitialClick, { once: true });
      }
    }
  }, [startVoiceListening]);

  const value: AgentConversationContextValue = {
    messages,
    isListening,
    isSpeaking,
    isPausing,
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
    mode,
    setMode,
    systemPrompt,
    promptMetadata,
    updateSystemPrompt: updateSystemPromptHandler,
    appendMemory: appendMemoryHandler,
    resetPrompt: resetPromptHandler,
    sendTextMessage,
    sendAudioMessage,
    startVoiceListening,
    stopVoiceListening,
    toggleVoiceListening,
    cancelVoiceListening,
    clearHistory,
  };

  return (
    <AgentConversationContext.Provider value={value}>
      {children}
    </AgentConversationContext.Provider>
  );
}

export function useAgentConversationContext(): AgentConversationContextValue {
  const context = useContext(AgentConversationContext);
  if (!context) {
    throw new Error('useAgentConversationContext must be used within an AgentConversationProvider');
  }
  return context;
}
