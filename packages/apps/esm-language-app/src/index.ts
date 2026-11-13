import { getAsyncLifecycle, getSyncLifecycle } from '@egen-civitas/esm-framework';
import ChangeLanguageLinkComponent from './change-language/change-language-link.extension';
import LanguageSwitcherComponent from './language-switcher/language-switcher.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export const moduleName = '@egen-civitas/esm-language-app';

const options = {
  featureName: 'language',
  moduleName,
};

// Bouton de langue : extension du slot neutre `topbar-slot` (placement dans `meta.topbar`, voir routes.json).
export const languageSwitcher = getSyncLifecycle(LanguageSwitcherComponent, options);

// Lien « Changer de langue » du menu utilisateur (slot `user-panel-slot`, alimenté par @egen/esm-user-profile-app).
export const changeLanguageLink = getSyncLifecycle(ChangeLanguageLinkComponent, options);

// Fenêtre de choix de la langue, ouverte par le bouton et par le lien.
export const changeLanguageModal = getAsyncLifecycle(() => import('./change-language/change-language.modal'), options);
