import React from 'react';
import { interpolateUrl, useConfig } from '@egen/esm-framework';
import { type TFunction } from 'i18next';
import { type ConfigSchema } from './config-schema';
import styles from './login/login.scss';

const Logo: React.FC<{ t: TFunction }> = ({ t }) => {
  const { logo } = useConfig<ConfigSchema>();
  return logo.src ? (
    <img
      alt={logo.alt ? t(logo.alt) : t('egenLogo', 'Egen logo')}
      className={styles.logoImg}
      src={interpolateUrl(logo.src)}
    />
  ) : (
    <svg role="img" className={styles.logo}>
      <title>{t('egenLogo', 'Egen logo')}</title>
      <use href="#egen-logo-full-color"></use>
    </svg>
  );
};

export default Logo;
