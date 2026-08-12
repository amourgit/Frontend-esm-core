import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLayoutType } from '@egen-civitas/esm-framework';
import OfflineActions from './offline-actions.component';
import styles from './offline-actions-entity-widget.styles.scss';

export interface OfflineActionsEntityWidgetProps {
  entityUuid: string;
}

const OfflineActionsEntityWidget: React.FC<OfflineActionsEntityWidgetProps> = ({ entityUuid }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.widgetCard}>
      <CardHeader title={t('offlineActions', 'Offline actions')} />
      <OfflineActions entityUuid={entityUuid} />
    </div>
  );
};

const CardHeader: React.FC<{
  children?: React.ReactNode;
  title: string;
}> = ({ title, children }) => {
  const isTablet = useLayoutType() === 'tablet';

  return (
    <div className={isTablet ? styles.tabletHeader : styles.desktopHeader}>
      <h4>{title}</h4>
      {children}
    </div>
  );
};

export default OfflineActionsEntityWidget;
