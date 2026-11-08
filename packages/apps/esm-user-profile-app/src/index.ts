import { defineConfigSchema, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import UserMenuComponent from './user-menu/user-menu.component';
import UserPanelComponent from './user-panel/user-panel.component';
import SessionGuardComponent from './session/session-guard.component';
import { createRootRedirect } from './session/root-redirect';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export const moduleName = '@egen-civitas/esm-user-profile-app';

const options = {
  featureName: 'user profile',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Menu utilisateur : extension du slot neutre `topbar-l1-right-slot` (voir routes.json). Il ouvre un panneau dont le contenu
// vient des slots `user-panel-slot` / `user-panel-bottom-slot`, que d'autres apps alimentent (déconnexion, langue…).
export const userMenu = getSyncLifecycle(UserMenuComponent, options);

// Identité de la session, première ligne du panneau (slot `user-panel-slot`).
export const userPanel = getSyncLifecycle(UserPanelComponent, options);

// Garde d'authentification : renvoie vers la connexion un utilisateur sans session. N'affiche rien.
export const sessionGuard = getSyncLifecycle(SessionGuardComponent, options);

// Racine du SPA (/) : envoie l'utilisateur authentifié vers l'accueil.
export const rootRedirect = createRootRedirect(moduleName);
