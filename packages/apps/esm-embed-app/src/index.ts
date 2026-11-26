import { getAsyncLifecycle, getSyncLifecycle } from '@egen-civitas/esm-framework';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export const moduleName = '@egen-civitas/esm-embed-app';

const options = { featureName: 'embed', moduleName };

// Page d'une app embarquée. Les pages (une par app) et leurs entrées de navigation sont fusionnées par serve-prod
// depuis external-apps.json (kind: "embed") : routes.json reste donc vide à dessein.
export const root = getAsyncLifecycle(() => import('./root.component'), options);

// Vue d'extension : une page de l'app embarquée affichée DANS un slot du Core (contribution `view` du manifeste).
export const extensionView = getAsyncLifecycle(() => import('./extension-view.component'), { ...options, featureName: 'embed-extension-view' });

// Panneau de rail : sous-options de la section de l'app (comme les apps internes) ; la section vient de la `meta` de l'extension.
export const railPanel = getAsyncLifecycle(() => import('./rail-panel.component'), { ...options, featureName: 'embed-rail-panel' });

// Contribution déclarative (ex. entrée de TopBar) : ne rend rien, seule sa `meta` (générée par serve-prod) est lue par le slot.
export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'embed-nav-entry' });
