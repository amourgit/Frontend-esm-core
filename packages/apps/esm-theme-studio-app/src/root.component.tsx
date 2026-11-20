import React, { useMemo } from 'react';
import { NotificationBanner, useConfig, userHasAccess, useSession } from '@egen-civitas/esm-framework';
import { useTranslation } from 'react-i18next';
import { canUseStudio } from './access';
import type { StudioConfig } from './config-schema';
import { createRuntime } from './core/runtime-factory';
import TweakcnStudio from './studio/tweakcn-studio';

/** Zone principale : l'éditeur de thèmes (TweakCN intégré), réservé aux utilisateurs autorisés. */
const Root: React.FC = () => {
  const config = useConfig<StudioConfig>();
  const session = useSession();
  const { t } = useTranslation();
  const allowed = canUseStudio(config.requiredPrivilege, session?.user, userHasAccess as never);
  const runtime = useMemo(() => (allowed ? createRuntime(config.runtime) : null), [allowed, config.runtime]);

  if (!allowed || !runtime) {
    return (
      <NotificationBanner
        kind="error"
        title={t('accessDenied', 'Vous n’avez pas le droit d’utiliser le Theme Studio.')}
      />
    );
  }
  return <TweakcnStudio runtime={runtime} applyPriority={config.applyPriority} />;
};

export default Root;
