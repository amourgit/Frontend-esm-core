import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, navigate, TextLink } from '@egen-civitas/esm-framework';
import styles from './entity-name-table-cell.module.css';
import type { OfflineEntity } from '../types';

export interface EntityNameTableCellProps {
  entity: OfflineEntity;
  isNewlyRegistered?: boolean;
}

const EntityNameTableCell: React.FC<EntityNameTableCellProps> = ({ entity, isNewlyRegistered = false }) => {
  const { t } = useTranslation();
  const name = entity.name ?? entity.id;

  return (
    <div className={styles.cellContainer}>
      <TextLink
        onClick={() =>
          navigate({
            to: `${window.getEgenSpaBase()}entity/${entity.id}/detail`,
          })
        }
      >
        {name}
      </TextLink>
      {isNewlyRegistered && <Badge variant="secondary" className="bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200">{t('offlineEntitiesTableNameNewlyRegistered', 'New')}</Badge>}
    </div>
  );
};

export default EntityNameTableCell;
