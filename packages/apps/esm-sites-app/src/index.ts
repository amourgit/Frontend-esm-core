import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';

// =============================================================================
//  ESM SITES APP — Point d'entrée
//  Application « Sites » : sélection d'un site/direction (carrousel, recherche,
//  filtres) puis espace du site (applications, membres, ressources, tâches,
//  activité, paramètres). Rendue dans le contenu de la SPA (route 'sites')
//  sous la TopBar de @egen-civitas/esm-primary-navigation-app.
//  Tous les composants visuels viennent de la catégorie `sites` du styleguide.
// =============================================================================

const moduleName = '@egen-civitas/esm-sites-app';

const options = {
  featureName: 'sites',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getSyncLifecycle(rootComponent, options);

// Extension de navigation (slot `topbar-level2-nav`) : ne rend rien. Seule sa
// `meta` (déclarée dans routes.json) est lue par la TopBar du niveau 2.
export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'sites-nav-entry' });
