import React, { useCallback, useEffect, useState } from 'react';
import { useConfig } from '@egen-civitas/esm-framework';
import { playXboxSound } from '@egen-civitas/esm-styleguide';
import { setAgentApiBase } from './services/agentApiConfig';
import { AssistantGlobalVoiceProvider, useAssistantVoice } from './context/AssistantGlobalVoiceContext';
import { AssistantPageOverlay } from './components/AssistantPageOverlay';
import { DedicatedAudioVisualSpace } from './components/DedicatedAudioVisualSpace';
import {
  ASSISTANT_COMMAND_EVENT,
  assistantBridgeDefaults,
  assistantBridgeStore,
  type AssistantCommand,
} from './assistant-bridge';

// =============================================================================
//  ASSISTANT — expérience complète (overlay 3D + espace audio immersif)
//
//  Propriétaire UNIQUE du moteur vocal (VAD / streaming / TTS). Publie son état
//  dans le pont global et exécute les commandes émises par les extensions
//  (bouton robot dans la TopBar, etc.). Voir ./assistant-bridge.ts.
// =============================================================================

const Experience: React.FC = () => {
  const voice = useAssistantVoice();
  const [isOverlayActive, setOverlayActive] = useState(false);
  const [isAudioSpaceOpen, setAudioSpaceOpen] = useState(false);

  // ── Exécution des commandes venues des extensions ─────────────────────────
  const { setAssistantMode, toggleVoiceSession, stopAgentSpeech } = voice;
  useEffect(() => {
    const onCommand = (event: Event) => {
      const command = (event as CustomEvent<AssistantCommand>).detail;
      switch (command?.type) {
        case 'toggle-overlay':
          setOverlayActive((active) => !active);
          playXboxSound('toggle');
          break;
        case 'close-overlay':
          setOverlayActive(false);
          break;
        case 'open-audio-space':
          setAudioSpaceOpen(true);
          setOverlayActive(false);
          break;
        case 'close-audio-space':
          setAudioSpaceOpen(false);
          break;
        case 'set-mode':
          setAssistantMode(command.mode);
          break;
        case 'toggle-voice':
          toggleVoiceSession();
          break;
        case 'stop-speech':
          stopAgentSpeech();
          break;
      }
    };
    window.addEventListener(ASSISTANT_COMMAND_EVENT, onCommand);
    return () => window.removeEventListener(ASSISTANT_COMMAND_EVENT, onCommand);
  }, [setAssistantMode, toggleVoiceSession, stopAgentSpeech]);

  // ── Publication de l'état vers les extensions ─────────────────────────────
  useEffect(() => {
    assistantBridgeStore.setState({
      assistantMode: voice.assistantMode,
      isOverlayActive,
      isAudioSpaceOpen,
      isVoiceActive: voice.isVoiceActive,
      isListening: voice.isListening,
      isSpeaking: voice.isSpeaking,
      isAgentSpeaking: voice.isAgentSpeaking,
      audioVolume: voice.audioVolume,
      outputVolume: voice.outputVolume,
    });
  }, [
    voice.assistantMode,
    voice.isVoiceActive,
    voice.isListening,
    voice.isSpeaking,
    voice.isAgentSpeaking,
    voice.audioVolume,
    voice.outputVolume,
    isOverlayActive,
    isAudioSpaceOpen,
  ]);
  useEffect(() => () => assistantBridgeStore.setState(assistantBridgeDefaults), []);

  const closeOverlay = useCallback(() => setOverlayActive(false), []);
  const openAudioSpace = useCallback(() => {
    setAudioSpaceOpen(true);
    setOverlayActive(false);
  }, []);

  return (
    <>
      <AssistantPageOverlay
        isActive={isOverlayActive}
        mode={voice.assistantMode}
        onSelectMode={voice.setAssistantMode}
        onClose={closeOverlay}
        onOpenDedicatedVoice={openAudioSpace}
      />
      <DedicatedAudioVisualSpace isOpen={isAudioSpaceOpen} onClose={() => setAudioSpaceOpen(false)} />
    </>
  );
};

const AssistantExperience: React.FC = () => {
  const config = useConfig<{ assistant: { agentApiBaseUrl?: string } }>();
  setAgentApiBase(config?.assistant?.agentApiBaseUrl ?? '/api/agent');
  return (
    <AssistantGlobalVoiceProvider>
      <Experience />
    </AssistantGlobalVoiceProvider>
  );
};

export default AssistantExperience;
