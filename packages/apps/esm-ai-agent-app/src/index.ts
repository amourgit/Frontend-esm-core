import { defineConfigSchema, getSyncLifecycle } from '@egen/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import agentRootComponent from './root.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'ai-agent',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// ─── Page : le widget IA (garde sa propre logique de garde d'authentification/activation) ──
export const root = getSyncLifecycle(agentRootComponent, options);
