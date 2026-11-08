import { getConfig, getSessionStore, interpolateUrl, navigate } from '@egen-civitas/esm-framework';
import type { Application } from 'single-spa';
import type { ConfigSchema } from '../config-schema';

// =============================================================================
//  RACINE DU SPA (/) — redirection de l'utilisateur authentifié (logique préservée à l'identique)
//
//  Le garde de session (page `sessionGuard`) matche AUSSI la racine, et décide seul du renvoi vers la connexion.
//  Cette page, montée en parallèle uniquement sur le chemin exact « / », pousse l'utilisateur AUTHENTIFIÉ vers
//  `session.homeRoute` dès que la session est résolue — sans elle, la racine resterait vide pour un utilisateur
//  connecté (aucune app de contenu ne matche « / »). Si la session n'est pas (encore) authentifiée, elle ne fait
//  STRICTEMENT rien : ainsi, jamais deux navigations concurrentes.
// =============================================================================

const DEFAULT_HOME = '${egenSpaBase}/home';

export function createRootRedirect(moduleName: string): Application {
  return async () => {
    let unsubscribe: (() => void) | undefined;
    let homeRoute = DEFAULT_HOME;

    const redirectToHomeIfAuthenticated = (): boolean => {
      const state = getSessionStore().getState();
      if (state.loaded && state.session?.authenticated) {
        navigate({ to: interpolateUrl(homeRoute) });
        return true;
      }
      return false;
    };

    return {
      bootstrap: async () => {},
      mount: async () => {
        try {
          const config = (await getConfig(moduleName)) as ConfigSchema | undefined;
          homeRoute = config?.session?.homeRoute || DEFAULT_HOME;
        } catch {
          homeRoute = DEFAULT_HOME;
        }
        if (!redirectToHomeIfAuthenticated()) {
          unsubscribe = getSessionStore().subscribe(() => {
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
}
