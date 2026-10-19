import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';

// =============================================================================
//  ESM HOME APP — Point d'entrée
//  Écran d'accueil de l'espace authentifié (route 'home'), rendue dans le
//  contenu de la SPA pendant que @egen-civitas/esm-primary-navigation-app
//  affiche sa TopBar au-dessus. L'ancienne vitrine de test des composants
//  @egen-civitas/esm-styleguide reste disponible, mise de côté sous la route
//  'home/showcase' — voir root.component.tsx.
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

// Extension de navigation (slot `topbar-level2-nav`) : ne rend rien. Seule sa `meta` (déclarée dans
// routes.json) est lue par la TopBar du niveau 2 — c'est le bouton « Accueil » de la navigation.
export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'home-nav-entry' });
