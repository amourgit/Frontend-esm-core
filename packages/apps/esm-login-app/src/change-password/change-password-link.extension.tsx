import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, PasswordIcon, showModal } from '@egen-civitas/esm-framework';
import styles from './change-password.module.css';

const ChangePasswordLink: React.FC = () => {
  const { t } = useTranslation();

  const launchChangePasswordModal = useCallback(() => {
    const dispose = showModal('change-password-modal', {
      closeModal: () => dispose(),
      size: 'sm',
    });
  }, []);

  return (
    <li role="none" aria-label={t('changePassword', 'ChangePassword')} className={`${styles.panelItemContainer} flex items-center justify-between gap-2 px-4 py-1 text-sm`}>
      <div>
        <PasswordIcon size={20} />
        <p>{t('password', 'Password')}</p>
      </div>
      <Button variant="ghost" onClick={launchChangePasswordModal}>
        {t('change', 'Change')}
      </Button>
    </li>
  );
};

export default ChangePasswordLink;
