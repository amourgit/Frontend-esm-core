import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { showModal, useSession } from '@egen-civitas/esm-framework';
import { SettingsSection } from './settings-section.component';
import styles from './settings.scss';

// Langue : ouvre `change-language-modal` (même service que le sélecteur de la TopBar).
const LanguageSection: React.FC = () => {
  const { t } = useTranslation();
  const session = useSession();
  const locale = session?.locale ?? 'en';

  const openChangeLanguageModal = useCallback(() => {
    const dispose = showModal('change-language-modal', { closeModal: () => dispose(), size: 'sm' });
  }, []);

  return (
    <SettingsSection title={t('language', 'Langue')}>
      <button type="button" className={styles.action} onClick={openChangeLanguageModal}>
        <Languages size={14} aria-hidden="true" />
        <span>{t('changeLanguage', 'Changer de langue')}</span>
        <span className={styles.actionValue}>{locale.toUpperCase()}</span>
      </button>
    </SettingsSection>
  );
};

export default LanguageSection;
