/** @module @category API */
import { egenObservableFetch, restBaseUrl } from '@egen/esm-api';
import type { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators/index.js';
import { type SessionType } from './types';

export function toSessionTypeObject(egenRestForm: any): SessionType {
  return {
    uuid: egenRestForm.uuid,
    display: egenRestForm.display,
    name: egenRestForm.name,
  };
}

/**
 * Fetches all available session types from the REST API.
 *
 * @returns An Observable that emits an array of SessionType objects and then completes.
 *
 * @example
 * ```ts
 * import { getSessionTypes } from '@eigen/esm-framework';
 * getSessionTypes().subscribe((sessionTypes) => {
 *   console.log('Available session types:', sessionTypes);
 * });
 * ```
 */
export function getSessionTypes(): Observable<Array<SessionType>> {
  return egenObservableFetch<any>(`${restBaseUrl}/sessiontype`)
    .pipe(
      map((results) => {
        const sessionTypes: Array<SessionType> = results.data.results.map(toSessionTypeObject);
        return sessionTypes;
      }),
    )
    .pipe(take(1));
}
