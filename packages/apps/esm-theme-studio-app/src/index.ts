import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import rootComponent from './root.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'theme-studio',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Page : EGEN Theme Studio (route `theme-studio`)
export const root = getSyncLifecycle(rootComponent, options);

// Entrée de navigation (slot `topbar-nav-slot`, voir routes.json) : le rendu est assuré par la TopBar à partir de `meta`.
export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'theme-studio-nav-entry' });
