/** @module @category API */
import { getSessionTypes, type SessionType } from '@egen/esm-data-api';
import { useEffect, useState } from 'react';

/**
 * A React hook that fetches and returns all available session types from the
 * server. The data is fetched once when the component mounts.
 *
 * @returns An array of SessionType objects. Returns an empty array while loading
 *   or if an error occurs.
 *
 * @example
 * ```tsx
 * import { useSessionTypes } from '@egen/esm-framework';
 * function SessionTypeSelector() {
 *   const sessionTypes = useSessionTypes();
 *   return (
 *     <select>
 *       {sessionTypes.map((st) => (
 *         <option key={st.uuid} value={st.uuid}>{st.display}</option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useSessionTypes() {
  const [sessionTypes, setSessionTypes] = useState<Array<SessionType>>([]);

  useEffect(() => {
    const sub = getSessionTypes().subscribe(
      (types) => setSessionTypes(types),
      (error) => console.error(error),
    );
    return () => sub.unsubscribe();
  }, []);

  return sessionTypes;
}
