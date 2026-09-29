import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { type AssistantMode, getSavedAssistantMode, saveAssistantMode } from '../components/assistant/assistantModes';

// =============================================================================
//  ASSISTANT — état local de la TopBar (mode de l'assistant)
//
//  Version allégée du contexte vocal de Civitas-GED : le pipeline voix
//  (Gemini / VAD / TTS) dépend d'un backend `/api/agent/*` qui n'existe pas
//  dans le core. La TopBar n'a besoin que du MODE courant ; les champs vocaux
//  restent exposés (valeurs inertes, `voiceAvailable: false`) pour conserver
//  le contrat de `AssistantRobotButton`, qui masque alors le canal vocal.
// =============================================================================

export interface AssistantVoiceState {
  assistantMode: AssistantMode;
  setAssistantMode: (mode: AssistantMode) => void;
  voiceAvailable: boolean;
  isVoiceActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isAgentSpeaking: boolean;
  audioVolume: number;
  outputVolume: number;
  toggleVoiceSession: () => void;
  stopAgentSpeech: () => void;
}

const noop = () => {};

const AssistantVoiceContext = createContext<AssistantVoiceState | null>(null);

export function AssistantVoiceProvider({ children }: { children: React.ReactNode }) {
  const [assistantMode, setMode] = useState<AssistantMode>(getSavedAssistantMode);

  const setAssistantMode = useCallback((mode: AssistantMode) => {
    setMode(mode);
    saveAssistantMode(mode);
  }, []);

  const value = useMemo<AssistantVoiceState>(
    () => ({
      assistantMode,
      setAssistantMode,
      voiceAvailable: false,
      isVoiceActive: false,
      isListening: false,
      isSpeaking: false,
      isAgentSpeaking: false,
      audioVolume: 0,
      outputVolume: 0,
      toggleVoiceSession: noop,
      stopAgentSpeech: noop,
    }),
    [assistantMode, setAssistantMode],
  );

  return <AssistantVoiceContext.Provider value={value}>{children}</AssistantVoiceContext.Provider>;
}

export function useAssistantVoice(): AssistantVoiceState {
  const ctx = useContext(AssistantVoiceContext);
  if (!ctx) throw new Error('useAssistantVoice doit être utilisé dans <AssistantVoiceProvider>');
  return ctx;
}
