import { defineConfigSchema, getAsyncLifecycle, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import AppMenuLink from './app-menu-link.component';
import RailPanel from './rail-panel.component';

// =============================================================================
//  ESM THEME STUDIO APP — éditeur de thèmes EGEN (base : expérience TweakCN)
//  Il PRODUIT le thème (JSON EGEN) ; son application runtime relève du moteur (esm-theme / TokiForge).
// =============================================================================

const options = { featureName: 'theme-studio', moduleName };

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Zone principale : pages d'édition (une route par page, voir src/pages.ts).
export const root = getAsyncLifecycle(() => import('./root.component'), options);

// Tuile de la grille « Applications » de la TopBar (slot `app-menu-slot`).
export const appMenuLink = getSyncLifecycle(AppMenuLink, { ...options, featureName: 'theme-studio-app-menu-link' });

// Option du rail gauche (zone gauche) : sous-options de la section `theme-studio`.
export const railPanel = getSyncLifecycle(RailPanel, { ...options, featureName: 'theme-studio-rail' });

// Entrées de navigation (slot `topbar-nav-slot`) : ne rendent rien, seule leur `meta` est lue.
export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'theme-studio-nav-entry' });
