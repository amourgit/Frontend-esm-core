import React from 'react';
import { interpolateUrl, useConfig } from '@egen/esm-framework';
import { type ConfigSchema } from '../../config-schema';
import styles from './logo.scss';

const Logo: React.FC = () => {
  const { logo } = useConfig<ConfigSchema>();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Failed to load logo image:', e);
  };

  return (
    <>
      {logo?.src ? (
        <img alt={logo.alt} className={styles.logo} onError={handleImageError} src={interpolateUrl(logo.src)} />
      ) : logo?.name ? (
        <span className={styles.logoName}>{logo.name}</span>
      ) : (
        <svg aria-label="Egen Logo" role="img" width={110} height={40}>
          <use href="#egen-logo-white" />
        </svg>
      )}
    </>
  );
};

export default Logo;
