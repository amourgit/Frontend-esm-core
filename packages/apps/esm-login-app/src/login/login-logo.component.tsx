import React from 'react';
import { type TFunction } from 'i18next';
import { interpolateUrl, useConfig } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../config-schema';

/** Logo de la page de connexion : image configurée (`logo.src`) ou sprite SVG EGEN par défaut. */
export const LoginLogo: React.FC<{ t: TFunction }> = ({ t }) => {
  const { logo } = useConfig<ConfigSchema>();

  return logo.src ? (
    <img
      alt={logo.alt ? t(logo.alt) : t('egenLogo', 'Egen logo')}
      className="max-h-10 max-w-40 object-contain brightness-0 invert"
      src={interpolateUrl(logo.src)}
    />
  ) : (
    <svg role="img" className="h-8 w-40 brightness-0 invert">
      <title>{t('egenLogo', 'Egen logo')}</title>
      <use href="#egen-logo-full-color"></use>
    </svg>
  );
};
