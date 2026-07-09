// =============================================================================
//  @egen/esm-api — Bypass d'authentification pour développement
//
//  ACTIVÉ via EGEN_DEV_NO_AUTH=true dans l'environnement de build.
//  Ne jamais utiliser en production.
//
//  STRATÉGIE :
//    La racine du problème est que getSessionStore() déclenche refetchCurrentUser()
//    qui fait un appel réseau vers /ws/rest/v1/session. Sans backend, cet appel
//    échoue (401 ou network error) et handleSessionResponse() écrase le store
//    avec { authenticated: false }.
//
//    Solution : intercepter window.fetch pour l'URL du session endpoint
//    et retourner directement la session fictive sans appel réseau.
//    Ainsi refetchCurrentUser() reçoit une réponse 200 valide, stocke la
//    session fictive, et les composants voient un utilisateur authentifié.
//
//    Cette approche ne modifie pas current-user.ts et est 100% compatible
//    avec le pipeline de fetchage existant.
// =============================================================================

import { sessionStore, type SessionStore } from './current-user';
import { sessionEndpoint } from './egen-fetch';

// ─── Vérification d'activation ────────────────────────────────────────────────

/**
 * Retourne true si EGEN_DEV_NO_AUTH=true dans l'environnement de build.
 * La variable est injectée par rspack DefinePlugin depuis process.env.EGEN_DEV_NO_AUTH.
 */
export function isDevAuthBypassEnabled(): boolean {
  try {
    return process.env.EGEN_DEV_NO_AUTH === 'true';
  } catch {
    return false;
  }
}

// ─── Session fictive partagée ─────────────────────────────────────────────────

/**
 * Session admin fictive utilisée par tous les mécanismes de bypass.
 * Correspond exactement à la forme Session attendue par handleSessionResponse.
 */
export const DEV_BYPASS_SESSION = {
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
      display: 'Administrateur Dev',
      links: [],
    },
    privileges: [
      { uuid: 'p1', name: 'Get Users', display: 'Get Users', links: [] },
      { uuid: 'p2', name: 'Edit Users', display: 'Edit Users', links: [] },
      { uuid: 'p3', name: 'Get Patients', display: 'Get Patients', links: [] },
      { uuid: 'p4', name: 'System Developer', display: 'System Developer', links: [] },
    ],
    roles: [
      { uuid: 'r1', display: 'System Developer', name: 'System Developer', links: [] },
      { uuid: 'r2', display: 'Administrator', name: 'Administrator', links: [] },
    ],
    retired: false,
    allRoles: [],
    allPrivileges: [],
  },
};

// ─── Interception fetch ───────────────────────────────────────────────────────

let _fetchIntercepted = false;

/**
 * Intercepte window.fetch pour retourner la session fictive quand
 * refetchCurrentUser() appelle le session endpoint.
 *
 * C'est la correction du bug fondamental : sans cette interception,
 * getSessionStore() déclenche un fetch → 401 → authenticated:false.
 * Avec cette interception, le fetch retourne 200 + session fictive.
 */
export function interceptSessionFetch(): void {
  if (_fetchIntercepted || typeof window === 'undefined') return;
  _fetchIntercepted = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function devBypassFetch(input, init) {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

    // Intercepter uniquement le session endpoint
    if (url.includes(sessionEndpoint) || url.includes('/ws/rest/v1/session')) {
      const responseBody = JSON.stringify(DEV_BYPASS_SESSION);
      return new Response(responseBody, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Bypass': 'true',
        },
      });
    }

    // Tous les autres appels passent normalement
    return originalFetch(input, init);
  };
}

/**
 * Retire l'interception fetch (pour les tests ou le cleanup).
 */
export function removeSessionFetchInterception(): void {
  _fetchIntercepted = false;
  // Note : on ne peut pas restaurer l'original ici car on n'a pas de ref directe.
  // Dans les tests, recharger le module suffit.
}

// ─── Initialisation complète du bypass ───────────────────────────────────────

/**
 * Applique le bypass complet :
 *   1. Intercepte window.fetch pour le session endpoint
 *   2. Injecte immédiatement la session fictive dans le sessionStore
 *
 * Doit être appelé UNE SEULE FOIS, au plus tôt dans run.ts (avant tout
 * composant React, avant tout appel à getSessionStore()).
 */
export function initDevAuthBypass(): void {
  if (!isDevAuthBypassEnabled()) return;

  console.warn('[EGEN] ⚠️  EGEN_DEV_NO_AUTH=true — Bypass dev actif. NE PAS utiliser en production.');

  // Intercepter window.fetch pour le session endpoint.
  // Cela évite que getSessionStore() → refetchCurrentUser() → 401
  // détruise une éventuelle session déjà présente dans le store.
  // La session fictive est injectée UNIQUEMENT à la soumission du formulaire
  // (via applyDevAuthBypassForLogin dans handleSubmit), pas au démarrage.
  // L'utilisateur doit pouvoir remplir le formulaire normalement.
  interceptSessionFetch();
}

// ─── Bypass pour la page de login ─────────────────────────────────────────────

/**
 * Utilisé dans le handleSubmit du login pour skiper l'appel réseau.
 * Retourne la SessionStore fictive si le bypass est actif, null sinon.
 *
 * NOTE : avec l'interception fetch active, ce wrapper n'est plus
 * strictement nécessaire (refetchCurrentUser retournerait déjà la bonne session).
 * Il est conservé comme couche de sécurité supplémentaire.
 */
export function applyDevAuthBypassForLogin(): SessionStore | null {
  if (!isDevAuthBypassEnabled()) return null;

  const bypassStore: SessionStore = {
    loaded: true,
    session: { ...DEV_BYPASS_SESSION },
  };

  // Mettre à jour le store pour que les autres composants voient la session
  sessionStore.setState(bypassStore);

  return bypassStore;
}
