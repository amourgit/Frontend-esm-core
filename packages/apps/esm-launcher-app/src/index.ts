import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import DividerComponent from './launcher/divider.component';
import LauncherComponent from './launcher/launcher.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const moduleName = '@egen-civitas/esm-launcher-app';

const options = {
  featureName: 'launcher',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Lanceur et séparateur : extensions du slot neutre `topbar-slot` (placement dans `meta.topbar`, routes.json).
// Le contenu du panneau vient du slot `app-menu-slot`, alimenté par les apps.
export const launcher = getSyncLifecycle(LauncherComponent, options);
export const divider = getSyncLifecycle(DividerComponent, options);
