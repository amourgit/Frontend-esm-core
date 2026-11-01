import React from 'react';
import { interpolateUrl, useConfig } from '@egen-civitas/esm-framework';
import { type TFunction } from 'i18next';
import { egenLogoFull } from './brand';
import { type ConfigSchema } from './config-schema';
import styles from './logo.scss';

/** Logo de la page « changer le mot de passe » : image configurée (`logo.src`) ou logo EGEN par défaut. */
const Logo: React.FC<{ t: TFunction }> = ({ t }) => {
  const { logo } = useConfig<ConfigSchema>();
  // `logo.alt` ne décrit que le logo personnalisé (`logo.src`) ; le logo EGEN par défaut a son propre libellé.
  const alt = logo.src && logo.alt ? t(logo.alt) : t('egenLogo', 'Egen logo');
  return <img alt={alt} className={styles.logoImg} src={logo.src ? interpolateUrl(logo.src) : egenLogoFull} />;
};

export default Logo;
