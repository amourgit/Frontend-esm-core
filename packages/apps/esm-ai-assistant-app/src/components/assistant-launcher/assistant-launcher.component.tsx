import React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@egen/esm-framework';
import type { ConfigSchema } from '../../config-schema';
import styles from './assistant-launcher.scss';

const SparkleIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.12"
    />
  </svg>
);

const CloseGlyph: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

interface AssistantLauncherProps {
  open: boolean;
  onToggle: () => void;
}

const AssistantLauncher: React.FC<AssistantLauncherProps> = ({ open, onToggle }) => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();

  return (
    <button
      type="button"
      className={classNames(styles.launcher, { [styles.launcherOpen]: open })}
      aria-label={
        open
          ? t('assistantClose', "Fermer l'assistant")
          : t('assistantOpen', "Ouvrir l'assistant — {{name}}", { name: config.assistant.name })
      }
      aria-expanded={open}
      onClick={onToggle}
    >
      {open ? <CloseGlyph /> : <SparkleIcon />}
    </button>
  );
};

export default AssistantLauncher;
