import React from 'react';
import { useTranslation } from 'react-i18next';
import HeaderedQuickInfo from '../components/headered-quick-info.component';
import OverviewCard from '../components/overview-card.component';
import { routes } from '../constants';
import { useOfflineEntityStats } from '../hooks/offline-entity-data-hooks';

const EntitiesOverviewCard: React.FC = () => {
  const { t } = useTranslation();
  const { data } = useOfflineEntityStats();

  return (
    <OverviewCard header={t('homeOverviewCardEntitiesHeader', 'Entities')} viewLink={routes.offlineToolsEntities}>
      <HeaderedQuickInfo
        header={t('homeOverviewCardEntitiesDownloaded', 'Downloaded')}
        content={data?.downloadedCount}
        isLoading={!data}
      />
      <HeaderedQuickInfo
        header={t('homeOverviewCardEntitiesNewlyRegistered', 'Newly registered')}
        content={data?.registeredCount}
        isLoading={!data}
      />
    </OverviewCard>
  );
};

export default EntitiesOverviewCard;
