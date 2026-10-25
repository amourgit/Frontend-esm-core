import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { getThemeEngine, getThemeState, toggleThemeMode, type ThemeMode } from '@egen-civitas/esm-theme';
import { SettingsSection } from './settings-section.component';
import styles from './settings.scss';

// Apparence : choix clair/sombre branché sur le moteur de thème EGEN (`@egen-civitas/esm-theme`).
const AppearanceSection: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ThemeMode>(() => getThemeState()?.mode ?? 'dark');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = getThemeEngine().subscribe((state) => setMode(state.mode));
    } catch {
      // Moteur pas encore initialisé (rendu isolé) : état initial conservé.
    }
    return () => unsubscribe?.();
  }, []);

  const choose = (target: ThemeMode) => {
    if (target !== mode) toggleThemeMode();
  };

  return (
    <SettingsSection title={t('appearance', 'Apparence')}>
      <div className={styles.segmented} role="group" aria-label={t('appearance', 'Apparence')}>
        <button
          type="button"
          className={styles.segment}
          aria-pressed={mode === 'light'}
          onClick={() => choose('light')}
        >
          <Sun size={14} aria-hidden="true" />
          {t('lightMode', 'Clair')}
        </button>
        <button type="button" className={styles.segment} aria-pressed={mode === 'dark'} onClick={() => choose('dark')}>
          <Moon size={14} aria-hidden="true" />
          {t('darkMode', 'Sombre')}
        </button>
      </div>
    </SettingsSection>
  );
};

export default AppearanceSection;
