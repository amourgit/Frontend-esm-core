import React from 'react';
import { Spinner } from '@egen-civitas/esm-framework';
import styles from './loading.module.css';

const LoadingIcon: React.FC = () => (
  <div className={styles['centerLoadingSVG']}>
    <Spinner aria-label="Active loading indicator" role="progressbar" />
  </div>
);

export default LoadingIcon;
