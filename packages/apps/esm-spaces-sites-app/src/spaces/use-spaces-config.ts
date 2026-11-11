import { useEffect } from 'react';
import { useConfig } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../config-schema';
import { initializeSpaces } from '../store/spaces-sites.store';

/**
 * Publie les Espaces de la configuration dans le store partagé. `useConfig` est réactif : modifier la config du
 * déploiement met les sélecteurs à jour à chaud. Idempotent (voir `initializeSpaces`).
 */
export function useSpacesFromConfig(): void {
  const { spaces, defaultSpaceId } = useConfig<ConfigSchema>();
  useEffect(() => {
    initializeSpaces(spaces ?? [], defaultSpaceId);
  }, [spaces, defaultSpaceId]);
}
