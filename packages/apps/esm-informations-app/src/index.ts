import { defineConfigSchema, getAsyncLifecycle, getSyncLifecycle } from '@egen-civitas/esm-framework';
import { configSchema } from './config-schema';
import rootComponent from './root.component';
import RailPanel from './rail-panel.component';

// =============================================================================
//  ESM INFORMATIONS APP — Point d'entrée
//  Application « Informations » : News & Publications, Annonces & Flash Info et
//  Agenda. Regroupe l'information interne, extranet et publique. Rendue dans le
//  contenu de la SPA (route 'informations') sous la TopBar de
//  @egen-civitas/esm-primary-navigation-app.
// =============================================================================

const moduleName = '@egen-civitas/esm-informations-app';

const options = {
  featureName: 'informations',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getSyncLifecycle(rootComponent, options);

// Extension de navigation (slot `topbar-level2-nav`) : ne rend rien. Seule sa
// `meta` (déclarée dans routes.json) est lue par la TopBar du niveau 2.
export const navEntry = getSyncLifecycle(() => null, { ...options, featureName: 'informations-nav-entry' });

// Option globale du rail gauche (slot `shell-rail-left-slot`, `meta.global`) : toujours visible,
// quelle que soit l'app active ; ses sous-options se chargent dans la zone gauche.
export const railPanel = getSyncLifecycle(RailPanel, { ...options, featureName: 'informations-rail' });

// Sections du slot `home-sections` (page d'accueil) : chaque extension rend sa propre `Section`.
// Le composant est chargé à la demande, donc seulement quand la page qui expose le slot est affichée.
export const homeHeroSection = getAsyncLifecycle(() => import('./home-sections/hero/hero-section.extension'), {
  ...options,
  featureName: 'informations-home-hero',
});
export const homeNewsSection = getAsyncLifecycle(() => import('./home-sections/news/news-section.extension'), {
  ...options,
  featureName: 'informations-home-news',
});
export const homeAnnouncementsSection = getAsyncLifecycle(
  () => import('./home-sections/announcements/announcements-section.extension'),
  { ...options, featureName: 'informations-home-announcements' },
);
export const homeEventsSection = getAsyncLifecycle(() => import('./home-sections/events/events-section.extension'), {
  ...options,
  featureName: 'informations-home-events',
});
