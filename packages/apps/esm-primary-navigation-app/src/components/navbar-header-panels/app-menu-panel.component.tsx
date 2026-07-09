import React, { useEffect } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { HeaderPanel } from '@carbon/react';
import { Launch } from '@carbon/react/icons';
import { ExtensionSlot, useAssignedExtensions, useConfig } from '@egen/esm-framework';
import styles from './app-menu-panel.scss';

interface AppMenuProps {
  expanded: boolean;
  hidePanel: () => void;
}

const GridIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="4.5" height="4.5" rx="1" fill="currentColor" />
    <rect x="9.5" y="2" width="4.5" height="4.5" rx="1" fill="currentColor" />
    <rect x="2" y="9.5" width="4.5" height="4.5" rx="1" fill="currentColor" />
    <rect x="9.5" y="9.5" width="4.5" height="4.5" rx="1" fill="currentColor" />
  </svg>
);

const AppMenuPanel: React.FC<AppMenuProps> = ({ expanded, hidePanel }) => {
  const config = useConfig();
  const { t } = useTranslation();
  const appMenuItems = useAssignedExtensions('app-menu-slot');
  const isEmpty = appMenuItems.length === 0 && !(config?.externalRefLinks?.length > 0);

  useEffect(() => {
    window.addEventListener('popstate', hidePanel);
    return () => window.removeEventListener('popstate', hidePanel);
  }, [hidePanel]);

  return (
    expanded && (
      <div style={{ display: 'inline' }}>
        <HeaderPanel
          className={classNames({ [styles.headerPanel]: expanded })}
          aria-label="App Menu Panel"
          expanded={expanded}
        >
          <div className={styles.dropdownHeader}>
            <GridIcon />
            <span>{t('applications', 'Applications')}</span>
          </div>

          <ExtensionSlot className={styles.menuLink} name="app-menu-slot" />

          {config?.externalRefLinks?.length > 0 && (
            <div className={classNames(styles.menuLink, styles.externalLinks)}>
              {config?.externalRefLinks?.map((link) => (
                <a target="_blank" rel="noopener noreferrer" href={link?.redirect}>
                  {t(link?.title)}
                  <Launch size={16} className={styles.launchIcon} />
                </a>
              ))}
            </div>
          )}

          {isEmpty && <p className={styles.emptyState}>{t('noApplicationsAvailable', 'Aucune application disponible')}</p>}
        </HeaderPanel>
      </div>
    )
  );
};

export default AppMenuPanel;
