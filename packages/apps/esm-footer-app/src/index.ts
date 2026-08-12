import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import footerRootComponent from './root.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'footer',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// ─── Page : le Footer (garde sa propre logique de garde d'authentification) ──
export const root = getSyncLifecycle(footerRootComponent, options);
