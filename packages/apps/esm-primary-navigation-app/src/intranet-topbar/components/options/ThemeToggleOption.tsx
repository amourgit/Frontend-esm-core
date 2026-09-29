import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { getThemeEngine, getThemeState, toggleThemeMode, type ThemeMode } from '@egen-civitas/esm-theme';
import { TopBarOptionButton } from './TopBarOptionButton';

/**
 * Bascule clair/sombre branchée sur le moteur de thème EGEN
 * (`@egen-civitas/esm-theme`). Réactive via `ThemeEngine.subscribe`.
 */
const ThemeToggleOption: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ThemeMode>(() => getThemeState()?.mode ?? 'dark');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = getThemeEngine().subscribe((state) => setMode(state.mode));
    } catch {
      // Moteur pas encore initialisé (ex. rendu isolé en test) — état initial conservé.
    }
    return () => unsubscribe?.();
  }, []);

  const isDark = mode === 'dark';

  return (
    <div className={`relative overflow-visible items-center ${className || 'flex'}`}>
      <TopBarOptionButton
        label={isDark ? t('switchToLightMode', 'Passer en mode clair') : t('switchToDarkMode', 'Passer en mode sombre')}
        onClick={() => toggleThemeMode()}
        icon={isDark ? <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
      />
    </div>
  );
};

export default ThemeToggleOption;
