import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';

// =============================================================================
//  ESM INFORMATIONS APP — Point d'entrée
//  Application « Informations » : News & Publications, Annonces & Flash Info et
//  Agenda. Regroupe l'information interne, extranet et publique. Rendue dans le
//  contenu de la SPA (route 'informations') sous la TopBar de
//  @egen-civitas/esm-primary-navigation-app.
// =============================================================================

const moduleName = '@egen-civitas/esm-informations-app';

const options = {
  featureName: 'informations',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getSyncLifecycle(rootComponent, options);

// Extension de navigation (slot `topbar-level2-nav`) : ne rend rien. Seule sa
// `meta` (déclarée dans routes.json) est lue par la TopBar du niveau 2.
export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'informations-nav-entry' });
