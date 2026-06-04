import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigurableLink } from '@egen/esm-framework';

export default function OfflineToolsAppMenuLink() {
  const { t } = useTranslation();
  return (
    <ConfigurableLink to="${egenSpaBase}/offline-tools">
      {t('offlineToolsAppMenuLink', 'Offline tools')}
    </ConfigurableLink>
  );
}
