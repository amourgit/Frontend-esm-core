import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';

// =============================================================================
//  ESM ANNUAIRE APP — Point d'entrée
//  Application « Annuaire » : annuaire des collaborateurs (cartes, liste,
//  galerie), organigramme, structures et fiche détaillée d'un collaborateur.
//  Rendue dans le contenu de la SPA (route 'annuaire') sous la TopBar de
//  @egen-civitas/esm-primary-navigation-app.
// =============================================================================

const moduleName = '@egen-civitas/esm-annuaire-app';

const options = {
  featureName: 'annuaire',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getSyncLifecycle(rootComponent, options);
