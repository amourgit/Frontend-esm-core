import { defineConfigSchema, getSyncLifecycle, registerBreadcrumbs } from '@egen-civitas/esm-framework';
import { routes } from './constants';
import { setupOffline } from './offline';
import { setupSynchronizingOfflineActionsNotifications } from './offline-actions/synchronizing-notification';
import offlineToolsComponent from './root.component';
import offlineToolsLinkComponent from './offline-tools-app-menu-link.component';
import offlineToolsConfirmationModalComponent from './components/confirmation.modal';
import offlineToolsEntitiesCardComponent from './offline-entities/entities-overview-card.component';
import offlineToolsActionsCardComponent from './offline-actions/offline-actions-overview-card.component';
import offlineToolsActionsComponent from './offline-actions/offline-actions.component';
import offlineToolsEntitiesComponent from './offline-entities/offline-entities.component';
import offlineToolsPageActionsComponent from './offline-actions/offline-actions-page.component';
import offlineToolsOptInButtonComponent from './offline-actions/offline-actions-mode-button.extension';
import RailPanel from './rail-panel.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const moduleName = '@egen-civitas/esm-offline-tools-app';
const options = {
  featureName: 'offline-tools',
  moduleName,
};

export const offlineTools = getSyncLifecycle(offlineToolsComponent, options);

export const offlineToolsLink = getSyncLifecycle(offlineToolsLinkComponent, options);

// Option du rail gauche (slot `shell-rail-left-slot`) : ses sous-options se chargent dans la zone gauche.
export const offlineToolsRail = getSyncLifecycle(RailPanel, { ...options, featureName: 'offline-tools-rail' });

// Entrées de navigation (slot `topbar-level2-nav`) et enregistrement des pages (slot `offline-tools-page-slot`) :
// ne rendent rien, seule leur `meta` (routes.json) est lue (sous-options du rail, TopBar niveau 2, page).
export const offlineToolsNavEntry = getSyncLifecycle(() => null, { ...options, featureName: 'offline-tools-nav-entry' });

export const offlineToolsConfirmationModal = getSyncLifecycle(offlineToolsConfirmationModalComponent, options);

/** Overview card for the entities section */
export const offlineToolsEntitiesCard = getSyncLifecycle(offlineToolsEntitiesCardComponent, options);

export const offlineToolsActionsCard = getSyncLifecycle(offlineToolsActionsCardComponent, options);

export const offlineToolsActions = getSyncLifecycle(offlineToolsActionsComponent, options);

/** Full entities page component */
export const offlineToolsEntities = getSyncLifecycle(offlineToolsEntitiesComponent, options);

export const offlineToolsPageActions = getSyncLifecycle(offlineToolsPageActionsComponent, options);

export const offlineToolsOptInButton = getSyncLifecycle(offlineToolsOptInButtonComponent, options);

export function startupApp() {
  defineConfigSchema(moduleName, {});
  setupOffline();
  setupSynchronizingOfflineActionsNotifications();

  registerBreadcrumbs([
    {
      path: `${window.spaBase}/${routes.offlineTools}`,
      title: 'Offline Tools',
      parent: `${window.spaBase}/${routes.home}`,
    },
    {
      path: `${window.spaBase}/${routes.offlineToolsEntities}`,
      title: 'Entities',
      parent: `${window.spaBase}/${routes.offlineTools}`,
    },
    {
      path: `${window.spaBase}/${routes.offlineToolsEntityOfflineData}`,
      title: 'Data',
      parent: `${window.spaBase}/${routes.offlineToolsEntities}`,
    },
    {
      path: `${window.spaBase}/${routes.offlineToolsActions}`,
      title: 'Actions',
      parent: `${window.spaBase}/${routes.offlineTools}`,
    },
  ]);
}
