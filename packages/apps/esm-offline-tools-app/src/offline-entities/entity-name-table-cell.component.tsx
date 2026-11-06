import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Tag } from '@carbon/react';
import { navigate } from '@egen-civitas/esm-framework';
import styles from './entity-name-table-cell.scss';
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
      <Link
        onClick={() =>
          navigate({
            to: `${window.getEgenSpaBase()}entity/${entity.id}/detail`,
          })
        }
      >
        {name}
      </Link>
      {isNewlyRegistered && <Tag type="magenta">{t('offlineEntitiesTableNameNewlyRegistered', 'New')}</Tag>}
    </div>
  );
};

export default EntityNameTableCell;
