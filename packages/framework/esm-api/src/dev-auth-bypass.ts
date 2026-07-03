// =============================================================================
//  @egen/esm-api — Bypass d'authentification pour développement
//
//  Ce module fournit des utilitaires pour le mode développement sans backend.
//  Activé via EGEN_DEV_NO_AUTH=true dans l'environnement de build.
// =============================================================================

import { sessionStore, type SessionStore } from './current-user';

/**
 * Vérifie si le bypass d'authentification est activé.
 * @returns true si EGEN_DEV_NO_AUTH=true, false sinon.
 */
export function isDevAuthBypassEnabled(): boolean {
  // La variable est injectée au build time par rspack dans le shell
  // On utilise (process as any) pour éviter l'erreur TypeScript
  return (
    typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.EGEN_DEV_NO_AUTH === 'true'
  );
}

/**
 * Applique le bypass d'authentification pour le login.
 * Cette fonction est utilisée par l'app de login pour skipper l'appel réseau
 * quand le bypass est activé.
 *
 * @returns La sessionStore avec une session admin fictive si le bypass est activé,
 *          null sinon.
 */
export function applyDevAuthBypassForLogin(): SessionStore | null {
  if (!isDevAuthBypassEnabled()) {
    return null;
  }

  console.warn(
    "[EGEN] ⚠️  EGEN_DEV_NO_AUTH=true — Bypass d'authentification activé pour le login. " +
      'NE PAS utiliser en production réelle.',
  );

  // Session admin fictive identique à celle injectée par le shell
  const bypassSession: SessionStore = {
    loaded: true,
    session: {
      authenticated: true,
      sessionId: 'dev-bypass-session',
      locale: 'fr',
      allowedLocales: ['fr', 'en'],
      user: {
        uuid: 'dev-user-uuid',
        display: 'Administrateur (Dev)',
        username: 'dev-admin',
        systemId: 'dev-admin',
        locale: 'fr',
        allowedLocales: ['fr', 'en'],
        userProperties: { defaultLocale: 'fr' },
        person: {
          uuid: 'dev-person-uuid',
          display: 'Administrateur',
          links: [],
        },
        privileges: [
          { uuid: 'p1', name: 'Get Users', display: 'Get Users', links: [] },
          { uuid: 'p4', name: 'System Developer', display: 'System Developer', links: [] },
        ],
        roles: [
          { uuid: 'r1', display: 'System Developer', name: 'System Developer', links: [] },
          { uuid: 'r2', display: 'Administrator', name: 'Administrator', links: [] },
        ],
        retired: false,
      },
    },
  };

  // Mettre à jour le store global pour que les autres apps voient la session
  sessionStore.setState(bypassSession);

  return bypassSession;
}
