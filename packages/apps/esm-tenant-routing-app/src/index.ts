import { defineConfigSchema, getSyncLifecycle, getAsyncLifecycle } from '@egen/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';

// =============================================================================
//  ESM TENANT ROUTING APP — Point d'entrée Single-SPA
//
//  Cette app est entièrement invisible dans le DOM (le guard rend null,
//  sauf la page /tenant-suspended). Son rôle est purement comportemental :
//  observer l'état du système tenant + la session, et déclencher les
//  navigations appropriées.
//
//  ENREGISTREMENT RECOMMANDÉ dans routes.json (ou le spa-config du shell) :
//
//    {
//      "component": "root",
//      "routeRegex": "^(?!(?:home)/?)",   ← toutes routes sauf /home
//      "online": true,
//      "offline": false
//    }
//
//  Cela garantit que le guard est actif partout où une redirection pourrait
//  être nécessaire, mais pas sur /home (landing publique déjà accessible).
// =============================================================================

const moduleName = '@egen/esm-tenant-routing-app';

const options = {
  featureName: 'tenant-routing',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

/** Composant racine — monte uniquement le guard invisible (TenantRoutingGuard) */
export const root = getSyncLifecycle(rootComponent, options);

/** Page de suspension tenant — enregistrée et montée indépendamment (route exacte "tenant-suspended") */
export const suspendedPage = getAsyncLifecycle(
  () => import('./screens/suspended.component'),
  options,
);
