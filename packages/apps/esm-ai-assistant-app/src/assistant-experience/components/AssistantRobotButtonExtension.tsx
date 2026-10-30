import React, { useRef } from 'react';
import { preloadAssistantRobot } from '@egen-civitas/esm-styleguide';
import { AssistantRobotButton } from './AssistantRobotButton';
import { useAssistantBridge } from '../assistant-bridge';

/**
 * Extension injectée dans le slot `top-nav-level2-end-slot` de la TopBar.
 * Pur adaptateur : l'état vient du pont global, les actions repartent en commandes.
 * Le module 3D du robot n'est préchargé qu'à la première intention d'ouverture (survol/focus).
 */
const AssistantRobotButtonExtension: React.FC = () => {
  const { isOverlayActive, toggleOverlay, openAudioSpace } = useAssistantBridge();
  const preloadedRef = useRef(false);
  const preloadOnce = () => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    preloadAssistantRobot();
  };

  return (
    <div className="flex items-center" onPointerEnter={preloadOnce} onFocus={preloadOnce}>
      <AssistantRobotButton
        isFullscreenActive={isOverlayActive}
        onToggleFullscreen={toggleOverlay}
        onOpenDedicatedVoice={openAudioSpace}
        className="ml-2"
      />
    </div>
  );
};

export default AssistantRobotButtonExtension;
