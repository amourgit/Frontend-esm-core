import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import QuickAccessPanel from './quick-access/quick-access-panel.component';
import ShortcutsSection from './quick-access/shortcuts-section.component';
import GlanceSection from './quick-access/glance-section.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'quick-access',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Fenêtre d'outils du rail droit : contenu de la zone droite « Accès rapide »
export const quickAccessPanel = getSyncLifecycle(QuickAccessPanel, options);

// Sections par défaut du panneau (slot `quick-access-section-slot`)
export const shortcutsSection = getSyncLifecycle(ShortcutsSection, options);
export const glanceSection = getSyncLifecycle(GlanceSection, options);
