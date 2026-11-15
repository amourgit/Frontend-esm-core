'use client';

import { createContext, useContext, useEffect } from 'react';
import { useEditorStore } from '../store/editor-store';
import { getThemeRoot } from '../lib/theme-root';
import { applyThemeToElement } from '../utils/apply-theme';
import { useThemePresetFromUrl } from '../hooks/use-theme-preset-from-url';

type Theme = 'dark' | 'light';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type Coords = { x: number; y: number };

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: (coords?: Coords) => void;
};

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { themeState, setThemeState } = useEditorStore();

  // Handle theme preset from URL
  useThemePresetFromUrl();

  useEffect(() => {
    const root = getThemeRoot();
    if (!root) return;

    applyThemeToElement(themeState, root);
  }, [themeState]);

  const handleThemeChange = (newMode: Theme) => {
    setThemeState({ ...themeState, currentMode: newMode });
  };

  // Pas de View Transition : elle animerait toute la page du shell, pas seulement le Studio.
  const handleThemeToggle = (_coords?: Coords) => {
    handleThemeChange(themeState.currentMode === 'light' ? 'dark' : 'light');
  };

  const value: ThemeProviderState = {
    theme: themeState.currentMode,
    setTheme: handleThemeChange,
    toggleTheme: handleThemeToggle,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
