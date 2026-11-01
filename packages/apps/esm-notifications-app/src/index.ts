import { getSyncLifecycle } from '@egen-civitas/esm-framework';
import { moduleName } from './constants';
import rootComponent from './root.component';
import NotificationsPanel from './notifications/notifications-panel.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'notifications',
  moduleName,
};

// Page : racine permanente (pastille du bouton Notifications du rail droit)
export const root = getSyncLifecycle(rootComponent, options);

// Fenêtre d'outils du rail droit : contenu de la zone droite « Notifications »
export const notificationsPanel = getSyncLifecycle(NotificationsPanel, options);
