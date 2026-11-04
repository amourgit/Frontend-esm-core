import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { showToast, UserHasAccess, useStore } from '@egen-civitas/esm-framework';
import { implementerToolsStore, showModuleDiagnostics } from './store';
import { hasInvalidDependencies } from './backend-dependencies/egen-backend-dependencies';
import { useBackendDependencies } from './backend-dependencies/useBackendDependencies';
import styles from './implementer-tools.styles.scss';

const UiEditor = React.lazy(() => import('./ui-editor/ui-editor'));

function PopupHandler() {
  const backendDependencies = useBackendDependencies();
  const [shouldShowNotification, setShouldShowNotification] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // displaying actionable notification if backend modules have missing dependencies
    setShouldShowNotification((alreadyShowing) => alreadyShowing || hasInvalidDependencies(backendDependencies));
  }, [backendDependencies]);

  useEffect(() => {
    // only show notification max. 1 time
    if (shouldShowNotification) {
      showToast({
        critical: false,
        kind: 'error',
        description: t(
          'checkImplementerToolsMessage',
          'Check the Backend Modules tab in the Implementer Tools for more details',
        ),
        title: t('modulesWithMissingDependenciesWarning', 'Some modules have unresolved backend dependencies'),
        actionButtonLabel: t('viewModules', 'View modules'),
        onActionButtonClick: showModuleDiagnostics,
      });
    }
  }, [t, shouldShowNotification]);

  const { isUIEditorEnabled } = useStore(implementerToolsStore);

  return (
    <div className={styles.darkTheme}>
      {isUIEditorEnabled ? <UiEditor /> : null}
    </div>
  );
}

export default function ImplementerTools() {
  return (
    <UserHasAccess privilege="O3 Implementer Tools">
      <PopupHandler />
    </UserHasAccess>
  );
}
