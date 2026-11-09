import './tailwind.tw.css';
import {
  defineConfigSchema,
  defineExtensionConfigSchema,
  getAsyncLifecycle,
  getSyncLifecycle,
} from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import primaryNavRootComponent from './root.component';
import changeLanguageLinkComponent from './components/change-language/change-language-link.extension';
import workspaceSelectorMenuComponent from './components/workspace-selector-menu/workspace-selector-menu.extension';
import genericLinkComponent, { genericLinkConfigSchema } from './components/generic-link/generic-link.component';
import breadcrumbItemComponent, { breadcrumbItemConfigSchema } from './components/breadcrumb/breadcrumb-item.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'primary navigation',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
  defineExtensionConfigSchema('link', genericLinkConfigSchema);
  defineExtensionConfigSchema('breadcrumb-item', breadcrumbItemConfigSchema);
}

// Page : la TopBar. Squelette neutre : elle ne connaît ni la session ni l'authentification (garde et redirection
// racine : @egen/esm-user-profile-app), ni le logo (@egen/esm-branding-app).
export const root = getSyncLifecycle(primaryNavRootComponent, options);

// ─── NOTE ARCHITECTURE ───────────────────────────────────────────────────────
// La TopBar est un squelette neutre : un seul slot d'extension, `topbar-slot`.
// Chaque app y attache ses composants et DÉCLARE leur niveau, leur région et
// leur position dans `meta.topbar` de son routes.json (voir README, section
// « Architecture »). Les menus (applications, raccourcis, plein écran…) sont
// importés et composés directement par cette app (`intranet-topbar/global`).
// ──────────────────────────────────────────────────────────────────────────

export const changeLanguageLink = getSyncLifecycle(changeLanguageLinkComponent, options);

// Choix de l'Espace dans le StaggeredMenuPanel (slot `staggered-menu-slot`, permanent : `meta.global`).
export const workspaceSelectorMenu = getSyncLifecycle(workspaceSelectorMenuComponent, options);

export const changeLanguageModal = getAsyncLifecycle(
  () => import('./components/change-language/change-language.modal'),
  options,
);

export const linkComponent = getSyncLifecycle(genericLinkComponent, {
  featureName: 'Link',
  moduleName,
});

// ─── Item de fil d'Ariane (navigation de la topbar) ────────────────────────────
// Composant générique déclaratif pour peupler "top-nav-breadcrumb-slot" —
// voir breadcrumb-item.component.tsx pour le contrat et un exemple d'usage.
export const breadcrumbItem = getSyncLifecycle(breadcrumbItemComponent, options);
