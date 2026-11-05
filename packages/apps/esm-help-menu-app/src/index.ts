import { getSyncLifecycle } from '@egen-civitas/esm-framework';
import ContactUsComponent from './help-menu/components/contact-us.component';
import DocsComponent from './help-menu/components/docs.component';
import HelpPanelComponent from './help-menu/help-panel.component';
import ReleaseNotesComponent from './help-menu/components/release-notes.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'help-menu',
  moduleName: '@egen-civitas/esm-help-menu-app',
};

// Option du rail droit (bas) : contenu de la zone du bas. Remplace l'ancien bouton « ? » flottant.
export const helpPanel = getSyncLifecycle(HelpPanelComponent, options);

export const releaseNotes = getSyncLifecycle(ReleaseNotesComponent, options);
export const docs = getSyncLifecycle(DocsComponent, options);
export const contact = getSyncLifecycle(ContactUsComponent, options);
