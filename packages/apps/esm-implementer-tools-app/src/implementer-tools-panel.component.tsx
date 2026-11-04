import React from 'react';
import { UserHasAccess, useStore } from '@egen-civitas/esm-framework';
import { useFrontendModules } from './hooks';
import { useBackendDependencies } from './backend-dependencies/useBackendDependencies';
import { implementerToolsStore } from './store';
import Popup from './popup/popup.component';
import styles from './implementer-tools.styles.scss';

/**
 * Contenu de la zone basse « Implementer Tools » (rail droit, groupe bas).
 * Le shell gère l'ouverture, la fermeture et le redimensionnement ; ce composant n'affiche que les onglets.
 */
export default function ImplementerToolsPanel() {
  const frontendModules = useFrontendModules();
  const backendDependencies = useBackendDependencies();
  const { openTabIndex } = useStore(implementerToolsStore);

  return (
    <UserHasAccess privilege="O3 Implementer Tools">
      <div className={styles.darkTheme} style={{ height: '100%' }}>
        <Popup
          frontendModules={frontendModules}
          backendDependencies={backendDependencies}
          visibleTabIndex={openTabIndex}
        />
      </div>
    </UserHasAccess>
  );
}
