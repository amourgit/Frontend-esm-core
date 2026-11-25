import { getAsyncLifecycle, getSyncLifecycle } from '@egen-civitas/esm-framework';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export const moduleName = '@egen-civitas/esm-embed-app';

const options = { featureName: 'embed', moduleName };

// Page d'une app embarquée. Les pages (une par app) et leurs entrées de navigation sont fusionnées par serve-prod
// depuis external-apps.json (kind: "embed") : routes.json reste donc vide à dessein.
export const root = getAsyncLifecycle(() => import('./root.component'), options);

// Entrée de navigation (slot `topbar-nav-slot`) : ne rend rien, seule sa `meta` (générée par serve-prod) est lue par la TopBar.
export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'embed-nav-entry' });
