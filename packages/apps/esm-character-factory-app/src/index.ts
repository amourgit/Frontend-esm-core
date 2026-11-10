import { defineConfigSchema, getAsyncLifecycle, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import RailPanel from './rail-panel.component';

// =============================================================================
//  ESM CHARACTER FACTORY APP — Point d'entrée
//  Application native du Core EGEN, issue de CharacterStudio (M3-org, MIT).
//  Le moteur 3D est chargé à la demande (getAsyncLifecycle) : il est lourd.
// =============================================================================

const moduleName = '@egen-civitas/esm-character-factory-app';

const options = {
  featureName: 'character-factory',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getAsyncLifecycle(() => import('./root.component'), options);

// Option du rail gauche (zone gauche) : affiche les sous-options de la section `character-factory`.
export const railPanel = getSyncLifecycle(RailPanel, { ...options, featureName: 'character-factory-rail' });

// Entrée de navigation (slot `topbar-nav-slot`) : ne rend rien, seule sa `meta` est lue.
export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'character-factory-nav-entry' });
