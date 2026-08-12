import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';

// =============================================================================
//  ESM HOME APP — Point d'entrée
//  Écran d'accueil de l'espace authentifié : vitrine interne des composants
//  de base (@egen-civitas/esm-styleguide). Rendue dans le contenu de la SPA pendant
//  que @egen-civitas/esm-primary-navigation-app affiche sa TopBar au-dessus.
// =============================================================================

const moduleName = '@egen-civitas/esm-home-app';

const options = {
  featureName: 'home',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getSyncLifecycle(rootComponent, options);
