import { defineConfigSchema, getAsyncLifecycle, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import changePasswordLinkComponent from './change-password/change-password-link.extension';
import logoutButtonComponent from './logout/logout.extension';
import rootComponent from './root.component';

const moduleName = '@egen-civitas/esm-login-app';

const options = {
  featureName: 'login',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getSyncLifecycle(rootComponent, options);
export const logoutButton = getSyncLifecycle(logoutButtonComponent, options);
export const changePasswordLink = getSyncLifecycle(changePasswordLinkComponent, options);
export const changePasswordModal = getAsyncLifecycle(() => import('./change-password/change-password.modal'), options);
