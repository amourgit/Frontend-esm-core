import { useEffect, useState } from 'react';
import type { ResolvedDependenciesModule } from './egen-backend-dependencies';
import { checkModules } from './egen-backend-dependencies';

export function useBackendDependencies() {
  const [modulesWithMissingBackendModules, setModulesWithMissingBackendModules] = useState<
    Array<ResolvedDependenciesModule>
  >([]);

  useEffect(() => {
    // loading missing modules
    checkModules().then(setModulesWithMissingBackendModules);
  }, []);

  return modulesWithMissingBackendModules;
}
