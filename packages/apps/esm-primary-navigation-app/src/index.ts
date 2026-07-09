import {
  defineConfigSchema,
  defineExtensionConfigSchema,
  getAsyncLifecycle,
  getSyncLifecycle,
} from '@egen/esm-framework';
import { type Application } from 'single-spa';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import primaryNavRootComponent from './root.component';
import userPanelComponent from './components/user-panel-switcher/user-panel-switcher.component';
import changeLanguageLinkComponent from './components/change-language/change-language-link.extension';
import { NavGroup, navGroupConfigSchema } from './components/nav-group/nav-group.component';
import { dashboardConfigSchema } from './components/dashboard/dashboard.component';
import genericLinkComponent, { genericLinkConfigSchema } from './components/generic-link/generic-link.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'primary navigation',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
  defineExtensionConfigSchema('link', genericLinkConfigSchema);
  defineExtensionConfigSchema('nav-group', navGroupConfigSchema);
  defineExtensionConfigSchema('dashboard', dashboardConfigSchema);
}

// ─── Page : la TopBar (elle gère elle-même la garde d'authentification) ──────
export const root = getSyncLifecycle(primaryNavRootComponent, options);

export const redirect: Application = async () => ({
  // À la racine : TopBar gère la vérification de session → /login si absente
  bootstrap: async () => {},
  mount: async () => undefined,
  unmount: async () => undefined,
});

// ─── NOTE ARCHITECTURE ───────────────────────────────────────────────────────
// userMenuButton, appMenuButton, notificationsMenuButton et breadcrumbNav ne
// sont PLUS enregistrés comme extensions auto-injectées dans un slot que
// cette app rend elle-même (ancienne indirection `top-nav-actions-slot` /
// `top-nav-app-menu-slot` / `notifications-menu-button-slot`, jamais
// alimentée par personne pour les notifications → bouton invisible en prod).
// Ils sont désormais importés et composés directement dans
// `topbar.component.tsx`. Les slots `top-nav-actions-slot` et
// `top-nav-app-menu-slot` restent ouverts pour que D'AUTRES apps y injectent
// des boutons additionnels (aide, raccourcis, etc.) — voir routes.json.
// ──────────────────────────────────────────────────────────────────────────

export const userPanel = getSyncLifecycle(userPanelComponent, options);

export const changeLanguageLink = getSyncLifecycle(changeLanguageLinkComponent, options);

export const changeLanguageModal = getAsyncLifecycle(
  () => import('./components/change-language/change-language.modal'),
  options,
);

export const linkComponent = getSyncLifecycle(genericLinkComponent, {
  featureName: 'Link',
  moduleName,
});

export const navGroup = getSyncLifecycle(NavGroup, options);

export const dashboard = getAsyncLifecycle(() => import('./components/dashboard/dashboard.component'), options);
