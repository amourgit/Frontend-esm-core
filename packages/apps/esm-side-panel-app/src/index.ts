import { getSyncLifecycle } from '@egen-civitas/esm-framework';
import SidePanelComponent from './side-panel/side-panel.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const moduleName = '@egen-civitas/esm-side-panel-app';

const options = {
  featureName: 'side-panel',
  moduleName,
};

export function startupApp() {}

// Panneau latéral : extension du slot neutre `topbar-slot` (placement dans `meta.topbar`, routes.json).
// Son contenu vient du slot `staggered-menu-slot`, alimenté par les apps.
export const sidePanel = getSyncLifecycle(SidePanelComponent, options);
