import React from 'react';
import { AssistantRobotButton } from './AssistantRobotButton';
import { useAssistantBridge } from '../assistant-bridge';

/**
 * Extension injectée dans le slot `top-nav-level2-end-slot` de la TopBar.
 * Pur adaptateur : l'état vient du pont global, les actions repartent en commandes.
 */
const AssistantRobotButtonExtension: React.FC = () => {
  const { isOverlayActive, toggleOverlay, openAudioSpace } = useAssistantBridge();
  return (
    <AssistantRobotButton
      isFullscreenActive={isOverlayActive}
      onToggleFullscreen={toggleOverlay}
      onOpenDedicatedVoice={openAudioSpace}
      className="ml-2"
    />
  );
};

export default AssistantRobotButtonExtension;
