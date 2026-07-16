import { defineConfigSchema, getSyncLifecycle } from '@egen/esm-framework';
import {
  initAIFramework,
  defineAIModule,
  getRoutesCatalogForLLM,
  getVisibleUIActions,
  subscribeToUIActions,
  getObservablesCatalogForLLM,
  subscribeToObservables,
} from '@egen/esm-ai-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import { BASE_EGEN_ROUTES } from './base-routes';
import assistantRootComponent from './root.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const options = {
  featureName: 'ai-assistant',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);

  // Point d'initialisation unique de la Couche 1 IA (@egen/esm-ai-framework).
  // Avant cette app, rien dans le monorepo n'appelait initAIFramework() —
  // les packages esm-ai-* existaient mais n'étaient jamais branchés au
  // reste de l'application (voir orchestrator.ts, qui documente déjà que
  // cet appel peut venir de run.ts du shell OU du startupApp() d'une app
  // hôte — c'est cette seconde option qui est utilisée ici, pour garder
  // la Couche 1 optionnelle : si cette app n'est pas déployée, l'IA reste
  // totalement inerte, sans toucher au shell).
  // No-op silencieux si EGEN_AI_ENABLED=false (voir orchestrator.ts).
  initAIFramework();

  // Déclare les routes de base EGEN (login, home, ...) et expose le
  // catalogue COMPLET des routes déclarées (natives + apps métier) dans le
  // contexte IA envoyé à chaque message — pour que le LLM les consulte au
  // lieu de deviner un chemin de navigation (voir base-routes.ts et
  // @egen/esm-ai-tools/routes.ts). Le tool `list_routes` reste disponible
  // en complément si le contexte est tronqué ou incomplet.
  defineAIModule({
    moduleName,
    routes: BASE_EGEN_ROUTES,
    contextProviders: [
      {
        id: 'ai-assistant:available-routes',
        name: 'Catalogue des routes disponibles',
        priority: 5,
        provide: () => ({ availableRoutes: getRoutesCatalogForLLM() }),
      },
      {
        id: 'ai-assistant:available-ui-actions',
        name: "Catalogue des actions UI visibles à l'écran",
        priority: 5,
        // Un bouton/champ apparaît ou disparaît en permanence (montage/
        // démontage de composants React à chaque navigation) — sans ce
        // `subscribe`, le contexte IA resterait figé sur l'état de l'écran
        // au moment du premier calcul, au lieu de refléter l'écran courant.
        provide: () => ({ availableUIActions: getVisibleUIActions() }),
        subscribe: (onChange) => subscribeToUIActions(onChange),
      },
      {
        id: 'ai-assistant:available-observables',
        name: "Catalogue du contenu descriptif visible à l'écran",
        priority: 5,
        // Voir @egen/esm-ai-tools/observables.ts — position et données sont
        // recalculées à chaque lecture, jamais mises en cache ici non plus.
        provide: () => ({ availableObservables: getObservablesCatalogForLLM() }),
        subscribe: (onChange) => subscribeToObservables(onChange),
      },
    ],
  });
}

// ─── Page : le widget assistant IA (garde sa propre logique de garde d'authentification) ──
export const root = getSyncLifecycle(assistantRootComponent, options);
