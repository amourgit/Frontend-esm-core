import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';

// =============================================================================
//  ESM NOT FOUND APP — Point d'entrée
//  Page 404 globale : montée sur toute route qui n'est reconnue par AUCUNE
//  autre app du système (voir le routeRegex négatif dans routes.json, qui
//  exclut explicitement toutes les routes déjà déclarées ailleurs dans le
//  monorepo — login, logout, change-password, home,
//  offline-tools — et la racine vide, gérée par son propre redirect).
//  Rendue en plein écran, SANS TopBar : la page pose html[data-public-route]
//  à son montage (mécanisme du shell, comme esm-login-app) ce qui masque la
//  TopBar, le left-nav et le footer.
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
