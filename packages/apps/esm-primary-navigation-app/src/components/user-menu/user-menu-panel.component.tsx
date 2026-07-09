import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Switcher, SwitcherDivider } from '@carbon/react';
import { ExtensionSlot, useSession } from '@egen/esm-framework';
import styles from './user-menu.scss';

interface UserMenuPanelProps {
  expanded: boolean;
}

/**
 * Les extensions attachées à `user-panel-slot` / `user-panel-bottom-slot`
 * doivent en général être enveloppées dans le composant Carbon `SwitcherItem`.
 */
const UserMenuPanel: React.FC<UserMenuPanelProps> = ({ expanded }) => {
  const { t } = useTranslation();
  const session = useSession();

  const displayName = session?.user?.person?.display ?? session?.user?.display ?? '';
  const systemId = session?.user?.systemId ?? session?.user?.username ?? '';
  const initial = useMemo(() => (displayName ? displayName.trim().charAt(0).toUpperCase() : '?'), [displayName]);

  if (!expanded) return null;

  return (
    <div className={styles.dropdown} role="menu" aria-label={t('userMenu', 'Menu utilisateur')}>
      <div className={styles.profileHeader}>
        <span className={styles.profileAvatar} aria-hidden="true">
          {initial}
        </span>
        <span className={styles.profileInfo}>
          <span className={styles.profileName}>{displayName}</span>
          {systemId && <span className={styles.profileSystemId}>{systemId}</span>}
        </span>
      </div>

      <Switcher className={styles.switcher} aria-label={t('userMenuOptions', "Options du menu utilisateur")}>
        <ExtensionSlot className={styles.fullWidth} name="user-panel-slot" />
        <SwitcherDivider className={styles.divider} aria-hidden="true" />
        <ExtensionSlot className={styles.fullWidth} name="user-panel-bottom-slot" />
      </Switcher>
    </div>
  );
};

export default UserMenuPanel;
