import type { AIRouteDefinition } from '@egen/esm-ai-framework';

// =============================================================================
//  Routes de base EGEN — connues de TOUT déploiement (shell + apps publiques),
//  déclarées ici pour que le LLM les consulte au lieu de les deviner.
//
//  C'est exactement la même liste que les routes publiques exclues dans
//  root.component.tsx et src/routes.json (login, logout, home,
//  change-password, tenant-suspended) — dupliquée intentionnellement,
//  comme le reste du monorepo (voir root.component.tsx), pour ne créer
//  aucun couplage de build avec les autres apps.
//
//  Toute app métier (@school/esm-grades-app, etc.) devrait déclarer SES
//  PROPRES routes de la même façon, via defineAIModule({ routes: [...] })
//  dans son propre startupApp() — voir @egen/esm-ai-extensions.
// =============================================================================

export const BASE_EGEN_ROUTES: AIRouteDefinition[] = [
  {
    path: '/login',
    description: "Page de connexion. Utilisée pour se connecter à l'application.",
  },
  {
    path: '/logout',
    description: "Déconnecte l'utilisateur courant et le redirige vers la page de connexion.",
  },
  {
    path: '/home',
    description: "Page d'accueil publique EGEN (landing page SaaS), avant connexion.",
  },
  {
    path: '/change-password',
    description: 'Formulaire de changement de mot de passe.',
  },
  {
    path: '/tenant-suspended',
    description: "Page affichée quand l'établissement (tenant) de l'utilisateur est suspendu.",
  },
];
