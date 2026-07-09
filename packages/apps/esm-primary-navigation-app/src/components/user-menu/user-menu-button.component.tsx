import React, { useMemo } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { HeaderGlobalAction } from '@carbon/react';
import { CloseIcon, UserAvatarIcon, useAssignedExtensions, useOnClickOutside, useSession } from '@egen/esm-framework';
import UserMenuPanel from './user-menu-panel.component';
import { type MenuButtonProps } from '../topbar/types';
import styles from './user-menu.scss';

const UserMenuButton: React.FC<MenuButtonProps> = ({ isActivePanel, togglePanel, hidePanel }) => {
  const { t } = useTranslation();
  const session = useSession();
  const userMenuItems = useAssignedExtensions('user-panel-slot');
  const showUserMenu = useMemo(() => userMenuItems.length > 0, [userMenuItems.length]);
  const isOpen = isActivePanel('userMenu');
  const wrapperRef = useOnClickOutside<HTMLDivElement>(hidePanel('userMenu'), isOpen);

  const displayName = session?.user?.person?.display ?? session?.user?.display ?? '';
  const initial = displayName ? displayName.trim().charAt(0).toUpperCase() : null;

  if (!showUserMenu) return null;

  return (
    <div ref={wrapperRef} className={styles.panelWrapper}>
      <HeaderGlobalAction
        aria-label={t('userMenuTooltip', 'Mon compte')}
        aria-labelledby="Users Avatar Icon"
        className={classNames(styles.actionButton, { [styles.actionButtonActive]: isOpen })}
        data-tutorial-target="user-settings"
        isActive={isOpen}
        onClick={() => togglePanel('userMenu')}
      >
        {isOpen ? (
          <CloseIcon size={18} />
        ) : initial ? (
          <span className={styles.avatarInitial}>{initial}</span>
        ) : (
          <UserAvatarIcon size={18} />
        )}
      </HeaderGlobalAction>
      <UserMenuPanel expanded={isOpen} />
    </div>
  );
};

export default UserMenuButton;
