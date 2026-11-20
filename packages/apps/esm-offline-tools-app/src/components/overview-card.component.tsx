import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, Button, Layer, navigate, Tile } from '@egen-civitas/esm-framework';
import styles from './overview-card.styles.module.css';

export interface OverviewCardProps {
  header: string;
  viewLink: string;
  children?: React.ReactNode;
}

const OverviewCard: React.FC<OverviewCardProps> = ({ header, viewLink, children }) => {
  const { t } = useTranslation();

  return (
    <Layer>
      <Tile className={styles.overviewCard}>
        <div className={styles.headerContainer}>
          <h3 className={styles.heading}>{header}</h3>
          <Button className={styles.viewButton} variant="ghost" size="sm" onClick={() => navigate({ to: `\${egenSpaBase}/${viewLink}` })}>
<ArrowRightIcon size={16} />
            {t('homeOverviewCardView', 'View')}
          </Button>
        </div>
        <div className={styles.contentContainer}>{children}</div>
      </Tile>
    </Layer>
  );
};

export default OverviewCard;
