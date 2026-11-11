import { defineConfigSchema, getAsyncLifecycle, getConfig, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import { initializeSpaces } from './store/spaces-sites.store';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export const moduleName = '@egen-civitas/esm-spaces-sites-app';

const options = {
  featureName: 'spaces and sites',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
  // L'Espace actif est connu dès le chargement de l'app, avant même que la TopBar monte les sélecteurs : la navigation
  // n'a pas à attendre pour filtrer ses entrées.
  getConfig(moduleName)
    .then((config) => initializeSpaces(config?.spaces ?? [], config?.defaultSpaceId))
    .catch((error) => console.warn('[spaces-sites] configuration indisponible au démarrage :', error));
}

// Sélecteurs d'Espace et de Site : extension du slot neutre `topbar-slot` (placement dans `meta.topbar`, routes.json).
export const contextSelectors = getAsyncLifecycle(() => import('./context-selectors/context-selectors.component'), options);

// Choix de l'Espace dans le panneau latéral (sur mobile, le sélecteur de la TopBar est masqué).
export const spaceMenu = getAsyncLifecycle(() => import('./spaces/space-menu.component'), options);
