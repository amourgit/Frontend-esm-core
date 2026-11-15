import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import SearchComponent from './search/search.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const moduleName = '@egen-civitas/esm-search-app';

const options = {
  featureName: 'search',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Recherche : extension du slot neutre `topbar-slot` (placement dans `meta.topbar`, routes.json).
export const search = getSyncLifecycle(SearchComponent, options);
