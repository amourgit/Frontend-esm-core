import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CloseIcon,
  SwitcherIcon,
  TopBarIconButton,
  useAssignedExtensions,
  useOnClickOutside,
} from '@egen-civitas/esm-framework';
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
      <TopBarIconButton
        label={t('AppMenuTooltip', 'Applications')}
        active={isOpen}
        onClick={() => togglePanel('appMenu')}
        icon={isOpen ? <CloseIcon size={18} /> : <SwitcherIcon size={18} />}
      />
      <AppsMenuPanel expanded={isOpen} />
    </div>
  );
};

export default AppsMenuButton;
