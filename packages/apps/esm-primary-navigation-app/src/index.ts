import {
  defineConfigSchema,
  defineExtensionConfigSchema,
  getAsyncLifecycle,
  getSessionStore,
  getSyncLifecycle,
  interpolateUrl,
  navigate,
  sessionStore,
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

// ─── Racine du SPA (/) — démarre sur l'écran d'accueil (@egen/esm-home-app) ──
// La TopBar (page 'root' ci-dessus) matche AUSSI la racine ("" ne commence
// par aucun des préfixes exclus du routeRegex) et gère elle-même la garde de
// session (→ /login si absente). Cette page 'redirect', montée en parallèle
// uniquement sur le chemin exact "/", pousse l'utilisateur AUTHENTIFIÉ vers
// /home dès que la session est résolue — sans elle, la racine resterait
// vide pour un utilisateur connecté (aucune app de contenu ne matche "/" par
// défaut). Si la session n'est pas (encore) authentifiée, cette page ne fait
// STRICTEMENT rien : c'est la TopBar qui décide seule du redirect vers
// /login, pour ne jamais avoir deux navigations concurrentes.
export const redirect: Application = async () => {
  let unsubscribe: (() => void) | undefined;

  const redirectToHomeIfAuthenticated = (): boolean => {
    const state = getSessionStore();
    if (state.loaded && state.session?.authenticated) {
      navigate({ to: interpolateUrl('${egenSpaBase}/home') });
      return true;
    }
    return false;
  };

  return {
    bootstrap: async () => {},
    mount: async () => {
      if (!redirectToHomeIfAuthenticated()) {
        unsubscribe = sessionStore.subscribe(() => {
          if (redirectToHomeIfAuthenticated()) {
            unsubscribe?.();
            unsubscribe = undefined;
          }
        });
      }
    },
    unmount: async () => {
      unsubscribe?.();
      unsubscribe = undefined;
    },
  };
};

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
