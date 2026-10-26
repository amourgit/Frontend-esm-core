import { getSyncLifecycle } from '@egen-civitas/esm-framework';
import { moduleName } from './constants';
import rootComponent from './root.component';
import LogsPanel from './logs/logs-panel.component';
import { startLogCapture } from './logs/log-store';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'logs',
  moduleName,
};

// Capture dès le chargement de l'app (console du navigateur + flux du terminal), zone fermée comprise
startLogCapture();

// Page : racine permanente (pastille d'erreurs du bouton Logs du rail gauche)
export const root = getSyncLifecycle(rootComponent, options);

// Fenêtre d'outils du rail gauche (groupe bas) : contenu de la zone basse « Logs système »
export const logsPanel = getSyncLifecycle(LogsPanel, options);
