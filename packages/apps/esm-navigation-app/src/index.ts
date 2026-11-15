import { defineExtensionConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import breadcrumbItemComponent, { breadcrumbItemConfigSchema } from './components/breadcrumb/breadcrumb-item.component';
import genericLinkComponent, { genericLinkConfigSchema } from './components/generic-link/generic-link.component';
import NavigationComponent from './navigation-item.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const moduleName = '@egen-civitas/esm-navigation-app';

const options = {
  featureName: 'navigation',
  moduleName,
};

export function startupApp() {
  defineExtensionConfigSchema('link', genericLinkConfigSchema);
  defineExtensionConfigSchema('breadcrumb-item', breadcrumbItemConfigSchema);
}

// Navigation : extension du slot neutre `topbar-slot` (placement dans `meta.topbar`, routes.json).
export const navigation = getSyncLifecycle(NavigationComponent, options);

// Lien générique (slots de navigation) et maillon déclaratif du fil d'Ariane (slot `top-nav-breadcrumb-slot`).
export const linkComponent = getSyncLifecycle(genericLinkComponent, { featureName: 'Link', moduleName });
export const breadcrumbItem = getSyncLifecycle(breadcrumbItemComponent, options);
