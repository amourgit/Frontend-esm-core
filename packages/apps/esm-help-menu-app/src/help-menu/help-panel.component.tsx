import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExtensionSlot } from '@egen-civitas/esm-framework';
import styles from './help-panel.styles.scss';

/**
 * Contenu de la zone du bas « Aide » (rail droit, groupe bas).
 * Les sous-options (notes de version, docs, contact…) sont des extensions du slot `help-menu-slot` :
 * toute app peut y ajouter la sienne.
 */
export default function HelpPanel() {
  const { t } = useTranslation();

  return (
    <div className={styles.panel} role="menu" aria-label={t('helpMenu', 'Help menu')}>
      <ExtensionSlot className={styles.options} name="help-menu-slot" />
    </div>
  );
}
