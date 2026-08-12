import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';

// =============================================================================
//  ESM TENANT ROUTING APP — Point d'entrée Single-SPA
//
//  Cette app est entièrement invisible dans le DOM (le guard rend null).
//  Son rôle est purement comportemental : observer l'état du système
//  tenant + la session, et déclencher les navigations appropriées.
//
//  Refonte du 8 août 2026 : la page "/tenant-suspended" a été retirée avec
//  le reste du système de vérification de tenant côté frontend (registry,
//  statut suspendu) — voir @egen-civitas/esm-tenant/src/types.ts.
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

const moduleName = '@egen-civitas/esm-tenant-routing-app';

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
