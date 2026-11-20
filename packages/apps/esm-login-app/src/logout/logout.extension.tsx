import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, navigate } from '@egen-civitas/esm-framework';
import styles from './logout.module.css';

const Logout: React.FC = () => {
  const { t } = useTranslation();

  const handleLogout = useCallback(() => {
    navigate({ to: '${egenSpaBase}/logout' });
  }, []);

  return (
    <li role="none" aria-label={t('logout', 'Logout')} className="flex items-center justify-between gap-2 px-4 py-1 text-sm">
      <Button className={styles.logout} onClick={handleLogout} variant="ghost">
        {t('logout', 'Logout')}
      </Button>
    </li>
  );
};

export default Logout;
