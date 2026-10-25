import { getSyncLifecycle } from '@egen-civitas/esm-framework';
import { moduleName } from './constants';
import rootComponent from './root.component';
import NotificationsPanel from './notifications/notifications-panel.component';
import SettingsPanel from './settings/settings-panel.component';
import AppearanceSection from './settings/appearance-section.component';
import LanguageSection from './settings/language-section.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'global-tools',
  moduleName,
};

// ─── Page : racine permanente (pastille Notifications) ───────────────────────
export const root = getSyncLifecycle(rootComponent, options);

// ─── Fenêtres d'outils du rail droit (globales, visibles dans toutes les apps) ─
export const notificationsPanel = getSyncLifecycle(NotificationsPanel, options);
export const settingsPanel = getSyncLifecycle(SettingsPanel, options);

// ─── Sections du panneau Paramètres (slot `global-settings-slot`) ────────────
export const appearanceSection = getSyncLifecycle(AppearanceSection, options);
export const languageSection = getSyncLifecycle(LanguageSection, options);
