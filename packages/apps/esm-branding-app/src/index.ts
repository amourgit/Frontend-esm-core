import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import BrandLogoComponent from './brand-logo/brand-logo.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const moduleName = '@egen-civitas/esm-branding-app';

const options = {
  featureName: 'branding',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Logo de l'entreprise : extension du slot de la TopBar `topbar-l1-left-slot` (voir routes.json). Le placement est
// l'affaire de cette app et de la configuration du déploiement, jamais de la TopBar.
export const brandLogo = getSyncLifecycle(BrandLogoComponent, options);
