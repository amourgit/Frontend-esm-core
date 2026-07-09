import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HeaderGlobalAction } from '@carbon/react';
import { getThemeEngine, getThemeState, toggleThemeMode, type ThemeMode } from '@egen/esm-theme';
import styles from './theme-toggle.scss';

const SunIcon: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.25" />
    <path
      d="M8 1.5v1.4M8 13.1v1.4M14.5 8h-1.4M2.9 8H1.5M12.5 3.5l-1 1M4.5 11.5l-1 1M12.5 12.5l-1-1M4.5 4.5l-1-1"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M13.8 9.7A6 6 0 016.3 2.2a6 6 0 106 6 6 6 0 001.5 1.5z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Bouton de bascule clair/sombre, branché directement sur le moteur de
 * thème EGEN (`@egen/esm-theme`). Réactif : se met à jour si le mode
 * change depuis n'importe où (autre onglet, préférence tenant, etc.),
 * via `ThemeEngine.subscribe`.
 */
const ThemeToggleButton: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ThemeMode>(() => getThemeState()?.mode ?? 'dark');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = getThemeEngine().subscribe((state) => setMode(state.mode));
    } catch {
      // Moteur pas encore initialisé (ex: rendu isolé en test) — on garde l'état initial.
    }
    return () => unsubscribe?.();
  }, []);

  const isDark = mode === 'dark';

  return (
    <HeaderGlobalAction
      aria-label={isDark ? t('switchToLightMode', 'Passer en mode clair') : t('switchToDarkMode', 'Passer en mode sombre')}
      className={styles.actionButton}
      onClick={() => toggleThemeMode()}
      tooltipAlignment="end"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </HeaderGlobalAction>
  );
};

export default ThemeToggleButton;
