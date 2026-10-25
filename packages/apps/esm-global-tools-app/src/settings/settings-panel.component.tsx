import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExtensionSlot } from '@egen-civitas/esm-framework';
import { GLOBAL_SETTINGS_SLOT } from '../constants';
import styles from './settings.scss';

// Contenu de la zone droite « Paramètres » : une pile de sections, chacune étant une extension
// du slot `global-settings-slot` (celles de cette app et celles que les autres apps y injectent).
const SettingsPanel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.panel} aria-label={t('settings', 'Paramètres')}>
      <ExtensionSlot name={GLOBAL_SETTINGS_SLOT} className={styles.sections} />
    </div>
  );
};

export default SettingsPanel;
