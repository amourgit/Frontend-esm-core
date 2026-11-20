import React, { type ReactNode } from 'react';
import { Skeleton } from '@egen-civitas/esm-framework';
import styles from './headered-quick-info.styles.module.css';

export interface HeaderedQuickInfoProps {
  header: string;
  content: ReactNode;
  isLoading?: boolean;
}

const HeaderedQuickInfo: React.FC<HeaderedQuickInfoProps> = ({ header, content, isLoading = false }) => {
  return (
    <div>
      <h4 className={styles.label01}>{header}</h4>
      {isLoading ? <Skeleton className="h-6 w-24" /> : <span className={styles.productiveHeading04}>{content}</span>}
    </div>
  );
};

export default HeaderedQuickInfo;
