import { getCurrentUser, egenObservableFetch, restBaseUrl } from '@egen/esm-framework/src/internal';

export function getCurrentSession() {
  return egenObservableFetch(`${restBaseUrl}/session`);
}

/**
 * Returns an observable producing the current user, but also applies any unsynchronized user property
 * changes to that user.
 */
export function getSynchronizedCurrentUser() {
  return getCurrentUser({ includeAuthStatus: true });
}
