'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
import {
  type AssistantMode,
  getSavedAssistantMode,
  saveAssistantMode,
} from '@egen-civitas/esm-styleguide';
import { playXboxSound } from '@egen-civitas/esm-styleguide';

export type InteractionChannel = 'audio' | 'text';

export interface AssistantGlobalVoiceContextType {
  // Mode & Canal
  assistantMode: AssistantMode;
  setAssistantMode: (mode: AssistantMode) => void;
  setMode: (mode: AssistantMode) => void;
  interactionChannel: InteractionChannel;
  setInteractionChannel: (channel: InteractionChannel) => void;

  // États vocaux ambiants
  isVoiceActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isPausing: boolean;
  isAgentSpeaking: boolean;
  isProcessing: boolean;
  streamingText: string;
  audioVolume: number;
  outputVolume: number;
  silenceToleranceMs: number;
  setSilenceToleranceMs: (ms: number) => void;
  error: Error | null;

  // Messages & Prompt
  messages: ConversationHistoryMessage[];
  systemPrompt: string;
  promptMetadata: PromptMetadata | null;

  // Actions
  startVoiceSession: () => Promise<void>;
  stopVoiceSession: () => void;
  toggleVoiceSession: () => void;
  stopAgentSpeech: () => void;
  sendTextMessage: (text: string) => Promise<AgentResponse | null>;
  sendAudioMessage: (blob: Blob, base64: string, transcriptHint?: string) => Promise<AgentResponse | null>;
  updateSystemPrompt: (newPrompt: string) => void;
  appendMemory: (fact: string) => void;
  resetPrompt: () => void;
  clearHistory: () => void;
}

const STORAGE_KEY_VOICE_ACTIVE = 'egen_assistant_voice_active';
const STORAGE_KEY_CHANNEL = 'egen_assistant_channel';
const STORAGE_KEY_HISTORY = 'egen_agent_conversation_history';
const STORAGE_KEY_SILENCE_TOLERANCE = 'egen_assistant_silence_tolerance_ms';

const AssistantGlobalVoiceContext = createContext<AssistantGlobalVoiceContextType | null>(null);

export function AssistantGlobalVoiceProvider({ children }: { children: React.ReactNode }) {
  // Mode IA (1: Conversation, 2: Recherche, 3: Action, 4: Autonome)
  const [assistantMode, setAssistantModeState] = useState<AssistantMode>(() => getSavedAssistantMode());

  // Canal d'interaction (Option: audio ou écrit)
  const [interactionChannel, setInteractionChannelState] = useState<InteractionChannel>(() => {
    if (typeof window === 'undefined') return 'audio';
    const saved = localStorage.getItem(STORAGE_KEY_CHANNEL);
    return saved === 'text' ? 'text' : 'audio';
  });

  // Session vocale globale active (persiste même après refresh)
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY_VOICE_ACTIVE) === 'true';
  });

  // Tolérance de silence en ms (1600ms = 1.6s par défaut, pour respirer et faire des pauses sans être coupé)
  const [silenceToleranceMs, setSilenceToleranceMsState] = useState<number>(() => {
    if (typeof window === 'undefined') return 1600;
    const saved = localStorage.getItem(STORAGE_KEY_SILENCE_TOLERANCE);
    const parsed = saved ? parseInt(saved, 10) : 1600;
    return isNaN(parsed) || parsed < 800 ? 1600 : parsed;
  });
  const silenceToleranceRef = useRef(silenceToleranceMs);
  silenceToleranceRef.current = silenceToleranceMs;

  const setSilenceToleranceMs = useCallback((newMs: number) => {
    const val = Math.max(800, Math.min(4000, newMs));
    setSilenceToleranceMsState(val);
    silenceToleranceRef.current = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SILENCE_TOLERANCE, String(val));
    }
    if (vadRef.current) {
      vadRef.current.updateConfig({ silenceDurationMs: val });
    }
  }, []);

  // États en direct du VAD & Synthèse
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [audioVolume, setAudioVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Historique complet (chargé depuis le début sans troncature ni altération)
  const [messages, setMessages] = useState<ConversationHistoryMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (!saved) return [];
      const parsed: ConversationHistoryMessage[] = JSON.parse(saved);
      // Rétablit et assainit les transcriptions sur les anciens messages
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

  // Prompt Système dynamique
  const [systemPrompt, setSystemPrompt] = useState<string>(() => loadSystemPrompt());
  const [promptMetadata, setPromptMetadata] = useState<PromptMetadata | null>(() => getPromptMetadata());

  // Références d'instances persistantes (VAD & Audio Player & Reconnaissance vocale client)
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const playerRef = useRef<AudioPlayerService | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const speechTranscriptRef = useRef<string>('');
  const isVoiceActiveRef = useRef(isVoiceActive);
  isVoiceActiveRef.current = isVoiceActive;

  const modeRef = useRef(assistantMode);
  modeRef.current = assistantMode;

  const setAssistantMode = useCallback((newMode: AssistantMode) => {
    setAssistantModeState(newMode);
    saveAssistantMode(newMode);
  }, []);

  const setInteractionChannel = useCallback((newChannel: InteractionChannel) => {
    setInteractionChannelState(newChannel);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CHANNEL, newChannel);
    }
  }, []);

  // Sauvegarde de l'INTÉGRALITÉ de l'historique sans coupure ni limitation arbitraire
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
        // ignore
      }
    }
  }, [messages]);

  // Synchronisation du prompt système si modifié
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

  // Initialisation du player audio
  useEffect(() => {
    playerRef.current = new AudioPlayerService({
      onStart: () => {
        setIsAgentSpeaking(true);
      },
      onEnd: () => {
        setIsAgentSpeaking(false);
        setOutputVolume(0);
        // Boucle continue : si la voix est toujours active, relancer l'écoute VAD
        if (isVoiceActiveRef.current) {
          setTimeout(() => {
            if (isVoiceActiveRef.current) {
              startVoiceListening();
            }
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

  // Joue la réponse en audio
  const playAgentResponse = useCallback(async (responseText: string) => {
    if (!playerRef.current) return;

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

  // Envoi générique
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
        mode: modeRef.current,
      };

      // Historique complet garanti depuis le tout premier jour
      const priorHistory = [...messagesRef.current];

      // Mise à jour synchrone de la référence et du state
      setMessages((prev) => [...prev, userMsg]);
      messagesRef.current = [...messagesRef.current, userMsg];

      const shouldPlayVoice = isVoiceActiveRef.current;

      if (shouldPlayVoice && playerRef.current) {
        playerRef.current.startStreamingSession();
      }

      let sentenceBuffer = '';

      try {
        const response = await streamAgentMessage(
          input,
          modeRef.current,
          priorHistory,
          (chunk) => {
            setStreamingText((prev) => prev + chunk);

            if (shouldPlayVoice && playerRef.current) {
              sentenceBuffer += chunk;

              // Détecte les fins de phrases ou de clauses pour synthétiser immédiatement
              const splitMatch = sentenceBuffer.match(/^(.*?[.!?:\n])\s*([\s\S]*)$/);
              if (splitMatch) {
                const completeSentence = splitMatch[1].trim();
                sentenceBuffer = splitMatch[2] || '';
                if (completeSentence) {
                  playerRef.current.enqueueSentence(completeSentence);
                }
              } else if (sentenceBuffer.length > 90 && sentenceBuffer.includes(',')) {
                // Pour les phrases très longues avec virgule, découpe pour éviter tout temps mort
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

        // Si la réponse finale apporte la transcription vocale, enregistre-la définitivement
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
          // Évite de laisser "Transcription en cours..." si aucun son reconnaissable
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

        // Vide le reste du buffer s'il reste du texte
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
    [playAgentResponse]
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) return null;
      return executeSendMessage({ type: 'text', text: text.trim() }, text.trim());
    },
    [executeSendMessage]
  );

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

  // VAD Listen avec écoute micro & reconnaissance speech en temps réel
  const startVoiceListening = useCallback(async () => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    setError(null);

    // Initialisation optionnelle de SpeechRecognition pour pré-capturer le texte vocal
    if (typeof window !== 'undefined' && !speechRecognitionRef.current) {
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          const rec = new SpeechRec();
          rec.lang = 'fr-FR';
          rec.continuous = true;
          rec.interimResults = true;
          speechTranscriptRef.current = '';
          rec.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; ++i) {
              const res = event.results[i];
              if (res && res[0]) {
                fullText += res[0].transcript + ' ';
              }
            }
            if (fullText.trim()) {
              speechTranscriptRef.current = fullText.trim();
            }
          };
          rec.onerror = () => {};
          rec.onend = () => {};
          rec.start();
          speechRecognitionRef.current = rec;
        }
      } catch {
        // SpeechRecognition non disponible ou refusé
      }
    }

    if (!vadRef.current) {
      vadRef.current = new VoiceActivityDetector(
        {
          ...DEFAULT_VAD_CONFIG,
          silenceDurationMs: silenceToleranceRef.current,
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

            const capturedTranscript = speechTranscriptRef.current;
            speechTranscriptRef.current = '';
            if (speechRecognitionRef.current) {
              try {
                speechRecognitionRef.current.stop();
              } catch {}
              speechRecognitionRef.current = null;
            }

            if (!base64 || base64.length < 300) {
              if (isVoiceActiveRef.current) {
                setTimeout(() => {
                  if (isVoiceActiveRef.current) {
                    startVoiceListening();
                  }
                }, 100);
              }
              return;
            }

            sendAudioMessage(blob, base64, capturedTranscript);
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
      vadRef.current.updateConfig({ silenceDurationMs: silenceToleranceRef.current });
    }

    try {
      await vadRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [sendAudioMessage]);

  const startVoiceSession = useCallback(async () => {
    setIsVoiceActive(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_VOICE_ACTIVE, 'true');
    }
    await startVoiceListening();
  }, [startVoiceListening]);

  const stopVoiceSession = useCallback(() => {
    setIsVoiceActive(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_VOICE_ACTIVE, 'false');
    }
    if (vadRef.current) {
      vadRef.current.cancel();
    }
    if (playerRef.current) {
      playerRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    speechTranscriptRef.current = '';
    setIsListening(false);
    setIsSpeaking(false);
    setIsAgentSpeaking(false);
    setAudioVolume(0);
    setOutputVolume(0);
  }, []);

  const toggleVoiceSession = useCallback(() => {
    playXboxSound('toggle');
    if (isVoiceActive) {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  }, [isVoiceActive, startVoiceSession, stopVoiceSession]);

  const stopAgentSpeech = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    setIsAgentSpeaking(false);
    setOutputVolume(0);
  }, []);

  // Reprise automatique de la session vocale au rafraîchissement dès la première interaction utilisateur
  useEffect(() => {
    if (isVoiceActive && !isListening && !isAgentSpeaking && !isProcessing) {
      const handleFirstInteraction = () => {
        if (isVoiceActiveRef.current) {
          startVoiceListening();
        }
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      };

      window.addEventListener('click', handleFirstInteraction, { once: true });
      window.addEventListener('keydown', handleFirstInteraction, { once: true });

      return () => {
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      };
    }
  }, [isVoiceActive, isListening, isAgentSpeaking, isProcessing, startVoiceListening]);

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

  return (
    <AssistantGlobalVoiceContext.Provider
      value={{
        assistantMode,
        setAssistantMode,
        setMode: setAssistantMode,
        interactionChannel,
        setInteractionChannel,
        isVoiceActive,
        isListening,
        isSpeaking,
        isPausing,
        isAgentSpeaking,
        isProcessing,
        streamingText,
        audioVolume,
        outputVolume,
        silenceToleranceMs,
        setSilenceToleranceMs,
        error,
        messages,
        systemPrompt,
        promptMetadata,
        startVoiceSession,
        stopVoiceSession,
        toggleVoiceSession,
        stopAgentSpeech,
        sendTextMessage,
        sendAudioMessage,
        updateSystemPrompt: updateSystemPromptHandler,
        appendMemory: appendMemoryHandler,
        resetPrompt: resetPromptHandler,
        clearHistory,
      }}
    >
      {children}
    </AssistantGlobalVoiceContext.Provider>
  );
}

export function useAssistantVoice() {
  const context = useContext(AssistantGlobalVoiceContext);
  if (!context) {
    throw new Error('useAssistantVoice must be used within an AssistantGlobalVoiceProvider');
  }
  return context;
}
