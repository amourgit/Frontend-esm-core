import React from 'react';
import { ExtensionSlot } from '@egen-civitas/esm-framework';
import { GLOBAL_SETTINGS_SLOT } from '../constants';
import styles from './settings.scss';

// Contenu de la zone droite « Paramètres » : une pile de sections, chacune étant une extension
// du slot `global-settings-slot` (celles de cette app et celles que les autres apps y injectent).
const SettingsPanel: React.FC = () => (
  <div className={styles.panel}>
    <ExtensionSlot name={GLOBAL_SETTINGS_SLOT} className={styles.sections} />
  </div>
);

export default SettingsPanel;
