import React, { useMemo } from 'react';
import { useConfig, useSession, userHasAccess } from '@egen-civitas/esm-framework';
import { useTranslation } from 'react-i18next';
import { canUseStudio } from './access';
import { createStudioStore } from './core/store';
import { createThemeLibrary } from './core/library';
import { createRuntime } from './core/runtime-factory';
import type { StudioConfig } from './config-schema';
import { StudioApp } from './studio/studio-app';
import type { StudioServices } from './studio/studio-context';

/** Page `theme-studio` : assemble le runtime (esm-theme/TokiForge), la bibliothèque (localStorage) et le store. */
const Root: React.FC = () => {
  const config = useConfig<StudioConfig>();
  const session = useSession();
  const { t } = useTranslation();
  const allowed = canUseStudio(config.requiredPrivilege, session?.user, userHasAccess as never);
  const services = useMemo<StudioServices>(() => {
    const runtime = createRuntime(config.runtime);
    const active = runtime.getActiveTheme() ?? { priority: 1, meta: { name: 'Thème actif' } };
    const store = createStudioStore(active as Record<string, unknown>);
    store.setMode(runtime.getMode());
    const library = createThemeLibrary(window.localStorage, config.storageKey);
    return { store, runtime, library, applyPriority: config.applyPriority };
  }, [config.runtime, config.storageKey, config.applyPriority]);

  if (!allowed) return <p role="alert">{t('accessDenied', 'Vous n’avez pas le droit d’utiliser le Theme Studio.')}</p>;
  return <StudioApp services={services} />;
};

export default Root;
