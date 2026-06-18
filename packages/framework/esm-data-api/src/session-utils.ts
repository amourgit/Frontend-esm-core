/** @module @category API */
import { egenFetch, restBaseUrl, type FetchResponse } from '@egen/esm-api';
import { getGlobalStore } from '@egen/esm-state';
import { BehaviorSubject } from 'rxjs';
import { type NewSessionPayload, type UpdateSessionPayload, type Session } from './types';

export interface SessionItem {
  mode: SessionMode;
  sessionData?: Session;
  status: SessionStatus;
  anythingElse?: any;
}

export enum SessionMode {
  NEW = 'startSession',
  EDIT = 'editSession',
  LOADING = 'loadingSession',
}

export enum SessionStatus {
  NOTSTARTED = 'notStarted',
  ONGOING = 'ongoing',
}

export interface SessionStoreState {
  entityUuid: string | null;
  manuallySetSessionUuid: string | null;

  /**
   * Stores a record of SWR mutate callbacks that should be called when
   * the Session with the specified uuid is modified. The callbacks are keyed
   * by unique component IDs.
   */
  mutateSessionCallbacks: {
    [componentId: string]: () => void;
  };
}

/**
 * The default custom representation string for fetching session data from the REST API.
 */
export const defaultSessionCustomRepresentation =
  'custom:(uuid,display,voided,indication,startDatetime,stopDatetime,' +
  'interactions:(uuid,display,interactionDatetime,' +
  'form:(uuid,name),location:ref,' +
  'interactionType:ref,' +
  'interactionHandlers:(uuid,display,' +
  'handler:(uuid,display))),' +
  'entity:(uuid,display),' +
  'sessionType:(uuid,name,display),' +
  'attributes:(uuid,display,attributeType:(name,datatypeClassname,uuid),value),' +
  'location:(uuid,name,display))';

const initialState: SessionStoreState = getSessionSessionStorage() || {
  entityUuid: null,
  manuallySetSessionUuid: null,
  mutateSessionCallbacks: {},
};

/**
 * Returns the global session store that manages the current session state.
 *
 * @example
 * ```ts
 * import { getSessionStore } from '@egen/esm-framework';
 * const store = getSessionStore();
 * const unsubscribe = store.subscribe((state) => {
 *   console.log('Current entity:', state.entityUuid);
 * });
 * ```
 */
export function getSessionStore() {
  return getGlobalStore<SessionStoreState>('session', initialState);
}

/**
 * Sets the current session for an entity in the global session store.
 *
 * @param entityUuid The UUID of the entity.
 * @param sessionUuid The UUID of the session to set as current.
 */
export function setCurrentSession(entityUuid: string, sessionUuid: string) {
  getSessionStore().setState({ entityUuid, manuallySetSessionUuid: sessionUuid });
}

getSessionStore().subscribe((state) => {
  setSessionSessionStorage(state);
});

function setSessionSessionStorage(value: SessionStoreState) {
  sessionStorage.setItem('egen:sessionStoreState', JSON.stringify(value));
}

function getSessionSessionStorage(): SessionStoreState | null {
  try {
    return JSON.parse(sessionStorage.getItem('egen:sessionStoreState') || 'null');
  } catch (e) {
    return null;
  }
}

/**
 * Creates a new session by sending a POST request to the REST API.
 *
 * @param payload The session data to create.
 * @param abortController An AbortController to allow cancellation of the request.
 */
export function saveSession(payload: NewSessionPayload, abortController: AbortController): Promise<FetchResponse<Session>> {
  return egenFetch(`${restBaseUrl}/session`, {
    signal: abortController.signal,
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: payload,
  });
}

/**
 * Updates an existing session by sending a POST request to the REST API.
 *
 * @param uuid The UUID of the session to update.
 * @param payload The session data to update.
 * @param abortController An AbortController to allow cancellation of the request.
 */
export function updateSession(
  uuid: string,
  payload: UpdateSessionPayload,
  abortController: AbortController,
): Promise<FetchResponse<Session>> {
  return egenFetch(`${restBaseUrl}/session/${uuid}`, {
    signal: abortController.signal,
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: payload,
  });
}

/**
 * @deprecated Use the `useSession` hook instead.
 */
export function getSessionsForEntity(
  entityUuid: string,
  abortController: AbortController,
  v?: string,
): Promise<FetchResponse<{ results: Array<Session> }>> {
  const custom = v ?? defaultSessionCustomRepresentation;

  return egenFetch(`${restBaseUrl}/session?entity=${entityUuid}&v=${custom}`, {
    signal: abortController.signal,
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
    },
  });
}

/** @deprecated */
export const getStartedSession = new BehaviorSubject<SessionItem | null>(null);
