import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';
import RailPanel from './rail-panel.component';

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

// Extension de navigation (slot `topbar-level2-nav`) : ne rend rien. Seule sa
// `meta` (déclarée dans routes.json) est lue par la TopBar du niveau 2.
export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'annuaire-nav-entry' });

// Option globale du rail gauche (slot `shell-rail-left-slot`, `meta.global`) : toujours visible,
// quelle que soit l'app active ; ses sous-options se chargent dans la zone gauche.
export const railPanel = getSyncLifecycle(RailPanel, { ...options, featureName: 'annuaire-rail' });
