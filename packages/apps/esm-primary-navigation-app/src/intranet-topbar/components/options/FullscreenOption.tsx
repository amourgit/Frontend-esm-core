import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2, Minimize2 } from 'lucide-react';
import { TopBarOptionButton } from './TopBarOptionButton';

/** Bascule plein écran, branchée directement sur la Fullscreen API. */
const FullscreenOption: React.FC<{ className?: string }> = ({ className = '' }) => {
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

  return (
    <div className={`relative overflow-visible items-center ${className || 'flex'}`}>
      <TopBarOptionButton
        label={isFullscreen ? t('exitFullscreen', 'Quitter le plein écran') : t('enterFullscreen', 'Plein écran')}
        onClick={handleToggle}
        icon={isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
      />
    </div>
  );
};

export default FullscreenOption;
