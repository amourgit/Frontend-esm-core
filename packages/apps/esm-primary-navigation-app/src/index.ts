import './tailwind.tw.css';
import {
  defineConfigSchema,
  getAsyncLifecycle,
  getSyncLifecycle,
} from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import primaryNavRootComponent from './root.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'primary navigation',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Page : la TopBar. Squelette neutre : elle ne connaît ni la session ni l'authentification (garde et redirection
// racine : @egen/esm-user-profile-app), ni le logo (@egen/esm-branding-app).
export const root = getSyncLifecycle(primaryNavRootComponent, options);

// ─── NOTE ARCHITECTURE ───────────────────────────────────────────────────────
// La TopBar est un squelette neutre : un seul slot d'extension, `topbar-slot`.
// Chaque app y attache ses composants et DÉCLARE leur niveau, leur région et
// leur position dans `meta.topbar` de son routes.json (voir README, section
// « Architecture »). Cette app ne contient plus aucun élément : navigation,
// lanceur, recherche, thème… vivent dans leurs apps.
// ──────────────────────────────────────────────────────────────────────────
