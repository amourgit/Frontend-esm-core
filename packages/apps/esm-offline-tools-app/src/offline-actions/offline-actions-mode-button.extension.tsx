import React from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@egen-civitas/esm-framework';
import { NetworkIcon as Network_3 } from 'lucide-react';
import { getCurrentOfflineMode, setCurrentOfflineMode } from '@egen-civitas/esm-framework/src/internal';
import styles from './offline-actions-mode-button.module.css';

function doNotCloseMenu(ev: React.SyntheticEvent) {
  ev.stopPropagation();
}

const OfflineActionsModeButton: React.FC = () => {
  const { t } = useTranslation();
  const [active, setActive] = React.useState(() => getCurrentOfflineMode().active);
  const toggle = React.useCallback(() => {
    setActive((value) => {
      const active = !value;
      setCurrentOfflineMode(active ? 'on' : 'off');
      return active;
    });
  }, []);

  return (
    <li
      role="none"
      className={`${styles.panelItemContainer} flex items-center justify-between gap-2 px-4 py-1 text-sm`}
      aria-label="Offline mode"
    >
      <div>
        <Network_3 size={20} />
        <p onClick={doNotCloseMenu} role="none">
          {t('offlineReady', 'Offline Ready')}
        </p>
      </div>
      <Switch
        className={styles.toggle}
        id="offlineModeSwitch"
        aria-label={t('offlineReady', 'Offline Ready')}
        checked={active}
        onCheckedChange={toggle}
      />
    </li>
  );
};

export default OfflineActionsModeButton;
