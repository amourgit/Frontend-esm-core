import React from 'react';
import { useTranslation } from 'react-i18next';
import { Launch } from '@carbon/react/icons';
import { ExtensionSlot, useAssignedExtensions, useConfig } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../../config-schema';
import styles from './apps-menu.scss';

interface AppsMenuPanelProps {
  expanded: boolean;
}

const GridIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="4.5" height="4.5" rx="1" fill="currentColor" />
    <rect x="9.5" y="2" width="4.5" height="4.5" rx="1" fill="currentColor" />
    <rect x="2" y="9.5" width="4.5" height="4.5" rx="1" fill="currentColor" />
    <rect x="9.5" y="9.5" width="4.5" height="4.5" rx="1" fill="currentColor" />
  </svg>
);

const AppsMenuPanel: React.FC<AppsMenuPanelProps> = ({ expanded }) => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const appMenuItems = useAssignedExtensions('app-menu-slot');
  const externalLinks = config?.externalRefLinks ?? [];
  const isEmpty = appMenuItems.length === 0 && externalLinks.length === 0;

  if (!expanded) return null;

  return (
    <div className={styles.dropdown} role="menu" aria-label={t('applications', 'Applications')}>
      <div className={styles.dropdownHeader}>
        <GridIcon />
        <span>{t('applications', 'Applications')}</span>
      </div>

      <div className={styles.grid}>
        <ExtensionSlot className={styles.gridSlot} name="app-menu-slot" />

        {externalLinks.map((link) => (
          <a
            key={link.redirect}
            target="_blank"
            rel="noopener noreferrer"
            href={link.redirect}
            className={styles.gridItem}
          >
            <span className={styles.gridItemIcon}>
              <Launch size={16} />
            </span>
            <span className={styles.gridItemLabel}>{t(link.title)}</span>
          </a>
        ))}
      </div>

      {isEmpty && <p className={styles.emptyState}>{t('noApplicationsAvailable', 'Aucune application disponible')}</p>}
    </div>
  );
};

export default AppsMenuPanel;
