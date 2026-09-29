import { useCallback } from 'react';
import { getGlobalStore, useStore } from '@egen-civitas/esm-framework';
import { type AssistantMode } from '@egen-civitas/esm-styleguide';

// =============================================================================
//  PONT D'ÉTAT ASSISTANT (store global + commandes)
//
//  Le bouton robot vit dans la TopBar (esm-primary-navigation-app, via le slot
//  `top-nav-level2-end-slot`) alors que le moteur vocal, l'overlay 3D et
//  l'espace audio vivent dans la racine de CETTE app : ce sont deux racines
//  React distinctes, un contexte React ne peut donc pas les relier.
//
//    • état    : `assistantBridgeStore` (store global du framework) — publié
//                par <AssistantBridgeSync/>, lu par le bouton via useStore.
//    • actions : événements `egen:assistant-command` — émis par le bouton,
//                exécutés par <AssistantBridgeSync/> (seul propriétaire du
//                moteur vocal). Aucun couplage de build entre les apps.
// =============================================================================

export const ASSISTANT_BRIDGE_STORE = 'egen-assistant-bridge';
export const ASSISTANT_COMMAND_EVENT = 'egen:assistant-command';

export type AssistantCommand =
  | { type: 'toggle-overlay' }
  | { type: 'close-overlay' }
  | { type: 'open-audio-space' }
  | { type: 'close-audio-space' }
  | { type: 'set-mode'; mode: AssistantMode }
  | { type: 'toggle-voice' }
  | { type: 'stop-speech' };

export interface AssistantBridgeState {
  assistantMode: AssistantMode;
  isOverlayActive: boolean;
  isAudioSpaceOpen: boolean;
  isVoiceActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isAgentSpeaking: boolean;
  audioVolume: number;
  outputVolume: number;
}

export const assistantBridgeDefaults: AssistantBridgeState = {
  assistantMode: 'conversation',
  isOverlayActive: false,
  isAudioSpaceOpen: false,
  isVoiceActive: false,
  isListening: false,
  isSpeaking: false,
  isAgentSpeaking: false,
  audioVolume: 0,
  outputVolume: 0,
};

/** `getGlobalStore` : idempotent, sûr même si plusieurs bundles importent ce module. */
export const assistantBridgeStore = getGlobalStore<AssistantBridgeState>(
  ASSISTANT_BRIDGE_STORE,
  assistantBridgeDefaults,
);

export function dispatchAssistantCommand(command: AssistantCommand) {
  window.dispatchEvent(new CustomEvent<AssistantCommand>(ASSISTANT_COMMAND_EVENT, { detail: command }));
}

/** Hook consommé par les composants qui ne vivent PAS dans la racine de l'app assistant. */
export function useAssistantBridge() {
  const state = useStore(assistantBridgeStore);
  return {
    ...state,
    setAssistantMode: useCallback((mode: AssistantMode) => dispatchAssistantCommand({ type: 'set-mode', mode }), []),
    toggleVoiceSession: useCallback(() => dispatchAssistantCommand({ type: 'toggle-voice' }), []),
    stopAgentSpeech: useCallback(() => dispatchAssistantCommand({ type: 'stop-speech' }), []),
    toggleOverlay: useCallback(() => dispatchAssistantCommand({ type: 'toggle-overlay' }), []),
    openAudioSpace: useCallback(() => dispatchAssistantCommand({ type: 'open-audio-space' }), []),
  };
}
