import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExtensionSlot } from '@egen-civitas/esm-framework';
import { QUICK_ACCESS_SECTION_SLOT } from '../constants';
import styles from './quick-access.scss';

// Contenu de la zone droite « Accès rapide » : une pile de sections, chacune étant une extension
// du slot `quick-access-section-slot` (celles de cette app et celles que les autres apps y injectent).
const QuickAccessPanel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.panel} aria-label={t('quickAccess', 'Accès rapide')}>
      <ExtensionSlot name={QUICK_ACCESS_SECTION_SLOT} className={styles.sections} />
    </div>
  );
};

export default QuickAccessPanel;
