import { getAsyncLifecycle, registerToolWindow, setToolWindowBadge } from '@egen-civitas/esm-framework';
import { DEVTOOLS_ICON_URL, DEVTOOLS_TOOL_WINDOW, overriddenBadge } from './constants';
import { importMapOverridden } from './devtools/import-map.component';

const options = {
  featureName: 'devtools',
  moduleName: '@egen-civitas/esm-devtools-app',
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

// Contenu de la zone du bas (surcharges de l'import map).
export const devtoolsPanel = getAsyncLifecycle(() => import('./devtools/devtools-panel.component'), options);

export const importmapOverrideModal = getAsyncLifecycle(
  () => import('./devtools/import-map-list/import-map.modal'),
  options,
);

/**
 * Option du rail droit (bas), UNIQUEMENT en développement (`window.spaEnv === 'development'`) : en production le
 * bouton n'existe tout simplement pas. Remplace l'ancien bouton « {···} » flottant.
 */
export function startupApp() {
  if (window.spaEnv !== 'development') return;

  registerToolWindow({
    moduleName: options.moduleName,
    name: DEVTOOLS_TOOL_WINDOW,
    anchor: 'bottom',
    meta: { title: 'Devtools', iconUrl: DEVTOOLS_ICON_URL, order: 80, global: true, rail: 'right' },
    load: devtoolsPanel,
  });

  // Pastille « ! » tant que l'import map est surchargée, même zone fermée.
  const refreshBadge = () => setToolWindowBadge(DEVTOOLS_TOOL_WINDOW, overriddenBadge(importMapOverridden()));
  window.addEventListener('import-map-overrides:change', refreshBadge);
  refreshBadge();
}
