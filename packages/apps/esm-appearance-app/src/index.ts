import { getSyncLifecycle } from '@egen-civitas/esm-framework';
import { applyLocalTheme } from './appearance/local-theme';
import FullscreenToggleComponent from './appearance/fullscreen-toggle.component';
import ThemeToggleComponent from './appearance/theme-toggle.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

applyLocalTheme();

export const moduleName = '@egen-civitas/esm-appearance-app';

const options = {
  featureName: 'appearance',
  moduleName,
};

// Bascule clair/sombre et plein écran : extensions du slot neutre `topbar-slot` (placement dans `meta.topbar`, routes.json).
export const themeToggle = getSyncLifecycle(ThemeToggleComponent, options);
export const fullscreenToggle = getSyncLifecycle(FullscreenToggleComponent, options);
