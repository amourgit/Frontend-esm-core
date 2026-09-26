import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssignedExtensions, useOnClickOutside, useSession } from '@egen-civitas/esm-framework';
import UserMenuPanel from './user-menu-panel.component';
import { type MenuButtonProps } from '../topbar/types';
import styles from './user-menu.scss';

const UserMenuButton: React.FC<MenuButtonProps> = ({ isActivePanel, togglePanel, hidePanel }) => {
  const { t } = useTranslation();
  const session = useSession();
  const userMenuItems = useAssignedExtensions('user-panel-slot');
  const userMenuBottomItems = useAssignedExtensions('user-panel-bottom-slot');
  // Le panneau (UserMenuPanel) rend aussi bien user-panel-slot que
  // user-panel-bottom-slot : le bouton ne doit se cacher que si les DEUX
  // sont vides, sinon un contenu enregistré uniquement dans le slot du bas
  // deviendrait invisible (le bouton disparaissant avant de pouvoir l'ouvrir).
  const showUserMenu = useMemo(
    () => userMenuItems.length > 0 || userMenuBottomItems.length > 0,
    [userMenuItems.length, userMenuBottomItems.length],
  );
  const isOpen = isActivePanel('userMenu');
  const wrapperRef = useOnClickOutside<HTMLDivElement>(hidePanel('userMenu'), isOpen);

  const displayName = session?.user?.person?.display ?? session?.user?.display ?? '';
  const initial = displayName ? displayName.trim().charAt(0).toUpperCase() : '?';
  const roleLabel = session?.user?.roles?.[0]?.display ?? '';

  if (!showUserMenu) return null;

  return (
    <div ref={wrapperRef} className={styles.panelWrapper}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => togglePanel('userMenu')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('userMenuTooltip', 'Mon compte : {{name}}', { name: displayName })}
        data-tutorial-target="user-settings"
      >
        <span className={styles.avatarInitial} aria-hidden="true">
          {initial}
        </span>
        <span className={styles.triggerLabel}>
          <span className={styles.triggerName}>{displayName}</span>
          {roleLabel && <span className={styles.triggerRole}>{roleLabel}</span>}
        </span>
      </button>
      <UserMenuPanel expanded={isOpen} />
    </div>
  );
};

export default UserMenuButton;
