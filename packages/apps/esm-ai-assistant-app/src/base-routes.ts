import type { AIRouteDefinition } from '@egen-civitas/esm-ai-framework';

// =============================================================================
//  Routes de base EGEN — connues de TOUT déploiement (shell + apps publiques),
//  déclarées ici pour que le LLM les consulte au lieu de les deviner.
//
//  Deux catégories :
//    • Routes publiques (login, logout, home, change-password) — exactement
//      la même liste que les routes exclues dans root.component.tsx et
//      src/routes.json, dupliquée intentionnellement (comme le reste du
//      monorepo), pour ne créer aucun couplage de build avec les autres
//      apps.
//    • Autres apps de base présentes par défaut dans le monorepo
//      (ex: offline-tools) — authentifiées, mais suffisamment "cœur de
//      plateforme" pour être déclarées ici plutôt que de dépendre de
//      chaque app pour s'auto-déclarer.
//
//  Toute app métier (@school/esm-grades-app, etc.) devrait déclarer SES
//  PROPRES routes de la même façon, via defineAIModule({ routes: [...] })
//  dans son propre startupApp() — voir @egen-civitas/esm-ai-extensions.
//
//  Refonte du 8 août 2026 : "/tenant-suspended" retirée — cette route
//  n'existe plus (suppression du système de vérification de tenant côté
//  frontend, voir @egen-civitas/esm-tenant/src/types.ts).
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
    path: '/offline-tools',
    description:
      "Page de gestion du mode hors-ligne : opt-in/opt-out du mode offline, liste des patients " +
      'synchronisés localement et des actions en attente de synchronisation.',
  },
];
