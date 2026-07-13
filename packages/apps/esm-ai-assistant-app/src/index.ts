import { defineConfigSchema, getSyncLifecycle } from '@egen/esm-framework';
import { initAIFramework } from '@egen/esm-ai-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import assistantRootComponent from './root.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'ai-assistant',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);

  // Point d'initialisation unique de la Couche 1 IA (@egen/esm-ai-framework).
  // Avant cette app, rien dans le monorepo n'appelait initAIFramework() —
  // les packages esm-ai-* existaient mais n'étaient jamais branchés au
  // reste de l'application (voir orchestrator.ts, qui documente déjà que
  // cet appel peut venir de run.ts du shell OU du startupApp() d'une app
  // hôte — c'est cette seconde option qui est utilisée ici, pour garder
  // la Couche 1 optionnelle : si cette app n'est pas déployée, l'IA reste
  // totalement inerte, sans toucher au shell).
  // No-op silencieux si EGEN_AI_ENABLED=false (voir orchestrator.ts).
  initAIFramework();
}

// ─── Page : le widget assistant IA (garde sa propre logique de garde d'authentification) ──
export const root = getSyncLifecycle(assistantRootComponent, options);
