import React from 'react';
import { ExtensionSlot } from '@egen-civitas/esm-framework';
import { useTranslation } from 'react-i18next';
import OfflineToolsNavLink from './offline-tools-nav-link.component';

const OfflineToolsNavMenu: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <OfflineToolsNavLink title={t('home', 'Home')} />
      <ExtensionSlot name="offline-tools-page-slot" />
    </>
  );
};

export default OfflineToolsNavMenu;
