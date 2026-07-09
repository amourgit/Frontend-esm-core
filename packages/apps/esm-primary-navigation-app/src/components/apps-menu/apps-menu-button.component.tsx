import React, { useMemo } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { HeaderGlobalAction } from '@carbon/react';
import { CloseIcon, SwitcherIcon, useAssignedExtensions, useOnClickOutside } from '@egen/esm-framework';
import AppsMenuPanel from './apps-menu-panel.component';
import { type MenuButtonProps } from '../topbar/types';
import styles from './apps-menu.scss';

const AppsMenuButton: React.FC<MenuButtonProps> = ({ isActivePanel, togglePanel, hidePanel }) => {
  const { t } = useTranslation();
  const appMenuItems = useAssignedExtensions('app-menu-slot');
  const showAppMenu = useMemo(() => appMenuItems.length > 0, [appMenuItems.length]);
  const isOpen = isActivePanel('appMenu');
  const wrapperRef = useOnClickOutside<HTMLDivElement>(hidePanel('appMenu'), isOpen);

  if (!showAppMenu) return null;

  return (
    <div ref={wrapperRef} className={styles.panelWrapper}>
      <HeaderGlobalAction
        aria-label={t('AppMenuTooltip', 'Applications')}
        aria-labelledby="App Menu"
        className={classNames(styles.actionButton, { [styles.actionButtonActive]: isOpen })}
        isActive={isOpen}
        onClick={() => togglePanel('appMenu')}
        tooltipAlignment="end"
      >
        {isOpen ? <CloseIcon size={18} /> : <SwitcherIcon size={18} />}
      </HeaderGlobalAction>
      <AppsMenuPanel expanded={isOpen} />
    </div>
  );
};

export default AppsMenuButton;
