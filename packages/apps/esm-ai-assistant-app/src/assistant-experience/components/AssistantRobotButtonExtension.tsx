import React, { useRef } from 'react';
import { preloadSplineScene } from '@egen-civitas/esm-styleguide';
import { AssistantRobotButton } from './AssistantRobotButton';
import { useAssistantBridge } from '../assistant-bridge';
import { ASSISTANT_SPLINE_SCENE_URL } from '../constants';

/**
 * Extension injectée dans le slot `top-nav-level2-end-slot` de la TopBar.
 * Pur adaptateur : l'état vient du pont global, les actions repartent en commandes.
 * La scène 3D (~1,3 Mo) n'est préchargée qu'à la première intention d'ouverture (survol/focus).
 */
const AssistantRobotButtonExtension: React.FC = () => {
  const { isOverlayActive, toggleOverlay, openAudioSpace } = useAssistantBridge();
  const preloadedRef = useRef(false);
  const preloadOnce = () => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    preloadSplineScene(ASSISTANT_SPLINE_SCENE_URL);
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
