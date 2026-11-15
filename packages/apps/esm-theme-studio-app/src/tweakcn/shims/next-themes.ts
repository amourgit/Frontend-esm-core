import { useEditorStore } from '../store/editor-store';

/** Remplace `next-themes` : le mode clair/sombre est celui de l'éditeur (jamais celui du shell). */
export function useTheme() {
  const mode = useEditorStore((s) => s.themeState.currentMode);
  const setThemeState = useEditorStore((s) => s.setThemeState);
  return {
    theme: mode,
    resolvedTheme: mode,
    setTheme: (next: string) =>
      setThemeState({ ...useEditorStore.getState().themeState, currentMode: next === 'dark' ? 'dark' : 'light' }),
  };
}
