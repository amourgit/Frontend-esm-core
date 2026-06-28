import { defineConfigSchema, getSyncLifecycle } from '@egen/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';

// =============================================================================
//  ESM HOME APP — Point d'entrée
//  Application publique SaaS : page d'accueil EGEN.
//  Aucune résolution d'authentification n'est nécessaire ici — cette app
//  est volontairement autonome et ne dépend pas de la navigation primaire.
// =============================================================================

const moduleName = '@egen/esm-home-app';

const options = {
  featureName: 'home',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getSyncLifecycle(rootComponent, options);
