import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HeaderPanel, type HeaderPanelProps, Switcher, SwitcherDivider } from '@carbon/react';
import { ExtensionSlot, useSession } from '@egen/esm-framework';
import styles from './user-menu-panel.scss';

interface UserMenuPanelProps extends HeaderPanelProps {
  expanded: boolean;
  hidePanel: () => void;
}

/**
 * Extensions attaching to `user-panel-slot` or `user-panel-bottom-slot` should in
 * general be wrapped in the `SwitcherItem` Carbon component.
 */
const UserMenuPanel: React.FC<UserMenuPanelProps> = ({ expanded, hidePanel }) => {
  const { t } = useTranslation();
  const session = useSession();

  const displayName = session?.user?.person?.display ?? session?.user?.display ?? '';
  const systemId = session?.user?.systemId ?? session?.user?.username ?? '';
  const initial = useMemo(() => (displayName ? displayName.trim().charAt(0).toUpperCase() : '?'), [displayName]);

  return (
    <div style={{ display: 'inline' }}>
      <HeaderPanel className={styles.headerPanel} expanded={expanded} aria-label={t('userMenu', 'User menu')}>
        {/* En-tête profil : avatar + nom + identifiant système */}
        <div className={styles.profileHeader}>
          <span className={styles.profileAvatar} aria-hidden="true">
            {initial}
          </span>
          <span className={styles.profileInfo}>
            <span className={styles.profileName}>{displayName}</span>
            {systemId && <span className={styles.profileSystemId}>{systemId}</span>}
          </span>
        </div>

        <Switcher className={styles.userPanelSwitcher} aria-label={t('userMenuOptions', 'User menu options')}>
          <ExtensionSlot className={styles.fullWidth} name="user-panel-slot" />
          <SwitcherDivider className={styles.divider} aria-hidden="true" />
          <ExtensionSlot className={styles.fullWidth} name="user-panel-bottom-slot" />
        </Switcher>
      </HeaderPanel>
    </div>
  );
};

export default UserMenuPanel;
