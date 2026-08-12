import React, { useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { HeaderGlobalAction } from '@carbon/react';
import { ExtensionSlot, useAssignedExtensions, useOnClickOutside } from '@egen-civitas/esm-framework';
import styles from './quick-access-button.scss';

// =============================================================================
//  QUICK ACCESS — Icône "raccourcis" avec badge de compteur
//
//  Le badge affiche le nombre RÉEL d'éléments enregistrés par d'autres apps
//  dans le slot "quick-access-slot" (aucune valeur inventée). Le bouton
//  disparaît silencieusement tant qu'aucune app n'y injecte rien — même
//  logique de dégradation propre que AppsMenuButton / UserMenuButton.
// =============================================================================

const BagIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4.5 5.5h7l.6 8.5H3.9l.6-8.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    <path d="M6 5V4a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

const QuickAccessButton: React.FC = () => {
  const { t } = useTranslation();
  const items = useAssignedExtensions('quick-access-slot');
  const [open, setOpen] = useState(false);
  const wrapperRef = useOnClickOutside<HTMLDivElement>(() => setOpen(false), open);

  if (items.length === 0) return null;

  return (
    <div ref={wrapperRef} className={styles.panelWrapper}>
      <HeaderGlobalAction
        aria-label={t('quickAccess', 'Raccourcis')}
        className={classNames(styles.actionButton, { [styles.actionButtonActive]: open })}
        isActive={open}
        onClick={() => setOpen((v) => !v)}
        tooltipAlignment="end"
      >
        <span className={styles.badgeWrapper}>
          <BagIcon />
          <span className={styles.badge}>{items.length > 9 ? '9+' : items.length}</span>
        </span>
      </HeaderGlobalAction>

      {open && (
        <div className={styles.dropdown} role="menu" aria-label={t('quickAccess', 'Raccourcis')}>
          <div className={styles.dropdownHeader}>
            <span>{t('quickAccess', 'Raccourcis')}</span>
          </div>
          <div className={styles.list}>
            <ExtensionSlot name="quick-access-slot" />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickAccessButton;
