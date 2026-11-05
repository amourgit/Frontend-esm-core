import React from 'react';
import { setToolWindowBadge } from '@egen-civitas/esm-framework';
import ImportMap from './import-map.component';
import { DEVTOOLS_TOOL_WINDOW, overriddenBadge } from '../constants';
import styles from './devtools-panel.styles.scss';

/** Contenu de la zone du bas « Devtools » (rail droit, groupe bas) : surcharges de l'import map. */
export default function DevToolsPanel() {
  return (
    <div className={styles.panel}>
      <ImportMap toggleOverridden={(overridden) => setToolWindowBadge(DEVTOOLS_TOOL_WINDOW, overriddenBadge(overridden))} />
    </div>
  );
}
