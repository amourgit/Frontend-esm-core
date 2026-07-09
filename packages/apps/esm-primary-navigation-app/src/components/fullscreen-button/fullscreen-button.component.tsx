import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HeaderGlobalAction } from '@carbon/react';
import styles from './fullscreen-button.scss';

const ExpandIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M6 2H2v4M10 2h4v4M14 10v4h-4M2 10v4h4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CollapseIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M2 6h4V2M14 6h-4V2M14 10h-4v4M2 10h4v4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Bouton de bascule plein écran, branché directement sur la Fullscreen API. */
const FullscreenButton: React.FC = () => {
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
    <HeaderGlobalAction
      aria-label={isFullscreen ? t('exitFullscreen', 'Quitter le plein écran') : t('enterFullscreen', 'Plein écran')}
      className={styles.actionButton}
      onClick={handleToggle}
      tooltipAlignment="end"
    >
      {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
    </HeaderGlobalAction>
  );
};

export default FullscreenButton;
