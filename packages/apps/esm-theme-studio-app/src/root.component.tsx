import React, { useMemo } from 'react';
import { useConfig, useSession, userHasAccess } from '@egen-civitas/esm-framework';
import { useTranslation } from 'react-i18next';
import { InlineNotification } from '@carbon/react';
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
      <InlineNotification
        kind="error"
        lowContrast
        hideCloseButton
        role="alert"
        title={t('accessDenied', 'Vous n’avez pas le droit d’utiliser le Theme Studio.')}
      />
    );
  }
  return <TweakcnStudio runtime={runtime} applyPriority={config.applyPriority} />;
};

export default Root;
