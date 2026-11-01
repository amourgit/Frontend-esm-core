import { getSyncLifecycle } from '@egen-civitas/esm-framework';
import { moduleName } from './constants';
import SettingsPanel from './settings/settings-panel.component';
import AppearanceSection from './settings/appearance-section.component';
import LanguageSection from './settings/language-section.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'settings',
  moduleName,
};

// Fenêtre d'outils du rail droit : contenu de la zone droite « Paramètres »
export const settingsPanel = getSyncLifecycle(SettingsPanel, options);

// Sections par défaut du panneau (slot `global-settings-slot`)
export const appearanceSection = getSyncLifecycle(AppearanceSection, options);
export const languageSection = getSyncLifecycle(LanguageSection, options);
