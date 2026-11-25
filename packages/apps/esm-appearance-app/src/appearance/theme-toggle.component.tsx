import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { getTheme, getThemeMode, toggleThemeMode, type ThemeMode } from '@egen-civitas/esm-theme';
import { OptionButton } from './option-button.component';

/**
 * Bascule clair/sombre branchée sur le runtime de thème EGEN
 * (`@egen-civitas/esm-theme`). Réactive via `getTheme().subscribe`.
 */
/** Props transmises par la TopBar à ses extensions : en dessous du desktop, la place est laissée à la recherche. */
interface TopBarState {
  isDesktop?: boolean;
}

const ThemeToggle: React.FC<TopBarState> = ({ isDesktop }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ThemeMode>(() => getThemeMode() ?? 'dark');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = getTheme().subscribe((e) => {
        if (e.type === 'mode') setMode(e.mode);
      });
    } catch {
      // Thème pas encore initialisé (ex. rendu isolé en test) — état initial conservé.
    }
    return () => unsubscribe?.();
  }, []);

  const isDark = mode === 'dark';

  if (isDesktop === false) return null;

  return (
    <div className="relative flex items-center overflow-visible">
      <OptionButton
        label={isDark ? t('switchToLightMode', 'Passer en mode clair') : t('switchToDarkMode', 'Passer en mode sombre')}
        onClick={() => toggleThemeMode()}
        icon={isDark ? <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
      />
    </div>
  );
};

export default ThemeToggle;
