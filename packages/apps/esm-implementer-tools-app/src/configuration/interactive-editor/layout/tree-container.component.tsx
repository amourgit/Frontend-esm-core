import React, { type ReactNode } from 'react';
import { StructuredList, StructuredListBody } from '@egen-civitas/esm-framework';
import styles from './layout.styles.module.css';

export interface TreeContainerProps {
  children: ReactNode;
}

export function TreeContainer({ children }: TreeContainerProps) {
  return (
    <StructuredList className={styles.structuredList}>
      <StructuredListBody>{children}</StructuredListBody>
    </StructuredList>
  );
}
