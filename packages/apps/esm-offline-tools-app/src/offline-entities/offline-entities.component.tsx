import React from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import OfflineEntitySyncDetails from './offline-entity-sync-details.component';
import OfflineEntityTable from './offline-entity-table.component';
import SharedPageLayout from '../components/shared-page-layout.component';
import styles from './offline-entities.styles.scss';

export interface OfflineEntitiesProps {
  basePath: string;
}

const OfflineEntities: React.FC<OfflineEntitiesProps> = ({ basePath }) => {
  const { t } = useTranslation();

  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        <Route
          path="/"
          element={
            <SharedPageLayout header={t('offlineEntitiesHeader', 'Offline entities')}>
              <div className={styles.contentContainer}>
                <OfflineEntityTable isInteractive showHeader={false} />
              </div>
            </SharedPageLayout>
          }
        />
        <Route path="/:entityUuid/offline-data" element={<OfflineEntitySyncDetails />} />
      </Routes>
    </BrowserRouter>
  );
};

export default OfflineEntities;
