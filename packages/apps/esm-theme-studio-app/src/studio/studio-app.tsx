import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ControlsPanel } from './controls-panel';
import { JsonPanel } from './json-panel';
import { Nav } from './nav';
import { Preview } from './preview';
import { StudioProvider, useStudio, type StudioServices } from './studio-context';
import { Toolbar } from './toolbar';
import styles from './studio.scss';

const Layout: React.FC = () => {
  const { level } = useStudio();
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  return (
    <div className={styles.studio} data-testid="theme-studio">
      <Toolbar onMessage={setMessage} />
      <div className={styles.status} role="status" aria-live="polite">
        {message}
      </div>
      <div className={styles.body}>
        <Nav />
        <div className={styles.controls}>
          <ControlsPanel />
          {level === 'expert' && <JsonPanel />}
        </div>
        <div className={styles.previewPane} aria-label={t('preview', 'Prévisualisation')}>
          <Preview />
        </div>
      </div>
    </div>
  );
};

export const StudioApp: React.FC<{ services: StudioServices }> = ({ services }) => (
  <StudioProvider services={services}>
    <Layout />
  </StudioProvider>
);
