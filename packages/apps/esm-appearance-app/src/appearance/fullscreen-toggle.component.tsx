import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2, Minimize2 } from 'lucide-react';
import { OptionButton } from './option-button.component';

/** Bascule plein écran, branchée directement sur la Fullscreen API. */
/** Props transmises par la TopBar à ses extensions : en dessous du desktop, la place est laissée à la recherche. */
interface TopBarState {
  isDesktop?: boolean;
}

const FullscreenToggle: React.FC<TopBarState> = ({ isDesktop }) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const handleToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  if (isDesktop === false) return null;

  return (
    <div className="relative flex items-center overflow-visible">
      <OptionButton
        label={isFullscreen ? t('exitFullscreen', 'Quitter le plein écran') : t('enterFullscreen', 'Plein écran')}
        onClick={handleToggle}
        icon={isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
      />
    </div>
  );
};

export default FullscreenToggle;
