import { getSyncLifecycle } from '@egen-civitas/esm-framework';
import implementerToolsComponent from './implementer-tools.component';
import implementerToolsPanelComponent from './implementer-tools-panel.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const moduleName = '@egen-civitas/esm-implementer-tools-app';
const options = {
  featureName: 'Implementer Tools',
  moduleName,
};

export const implementerTools = getSyncLifecycle(implementerToolsComponent, options);

// Fenêtre d'outils du rail droit (groupe bas) : contenu de la zone basse « Implementer Tools »
export const implementerToolsPanel = getSyncLifecycle(implementerToolsPanelComponent, options);

export { default as ConfigEditButton } from './config-edit-button/config-edit-button.component';
