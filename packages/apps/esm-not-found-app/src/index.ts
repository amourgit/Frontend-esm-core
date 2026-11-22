import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';

// =============================================================================
//  ESM NOT FOUND APP — Point d'entrée
//  Page 404 globale : affichée quand AUCUNE autre page n'est enregistrée pour la route courante, qu'elle
//  vienne d'une app interne ou d'une app EXTERNE. La décision est dynamique (voir is-unknown-route.ts) : le
//  routeRegex de routes.json est un fourre-tout et il n'y a plus de liste de routes à maintenir.
//  Rendue en plein écran, SANS TopBar : la page pose html[data-public-route] à son montage (mécanisme du
//  shell, comme esm-login-app) ce qui masque la TopBar, les rails et le footer.
// =============================================================================

const moduleName = '@egen-civitas/esm-not-found-app';

const options = {
  featureName: 'not-found',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getSyncLifecycle(rootComponent, options);
