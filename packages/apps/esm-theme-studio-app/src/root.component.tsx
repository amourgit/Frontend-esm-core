import React, { useMemo } from 'react';
import { useConfig, useSession, userHasAccess } from '@egen-civitas/esm-framework';
import { useTranslation } from 'react-i18next';
import { InlineNotification } from '@carbon/react';
import { canUseStudio } from './access';
import type { StudioConfig } from './config-schema';
import { createRuntime } from './core/runtime-factory';
import { getStudioServices } from './services';
import { StudioApp } from './studio/studio-app';
import { useRoutedPage } from './use-routed-page';

/** Zone principale : la page d'édition correspondant à l'URL (`theme-studio/<segment>`), voir src/pages.ts. */
const Root: React.FC = () => {
  const config = useConfig<StudioConfig>();
  const session = useSession();
  const { t } = useTranslation();
  const page = useRoutedPage();
  const allowed = canUseStudio(config.requiredPrivilege, session?.user, userHasAccess as never);
  const services = useMemo(() => (allowed ? getStudioServices(config, { runtime: createRuntime(config.runtime) }) : null), [allowed, config]);

  if (!allowed || !services) {
    return <InlineNotification kind="error" lowContrast hideCloseButton role="alert" title={t('accessDenied', 'Vous n’avez pas le droit d’utiliser le Theme Studio.')} />;
  }
  const notice =
    services.startedFrom === 'empty' ? t('startedEmpty', 'Aucun thème actif trouvé : le Studio démarre d’un thème vide.') : services.startedFrom === 'draft' ? t('startedDraft', 'Brouillon précédent restauré.') : undefined;
  return <StudioApp services={services} page={page} notice={notice} />;
};

export default Root;
