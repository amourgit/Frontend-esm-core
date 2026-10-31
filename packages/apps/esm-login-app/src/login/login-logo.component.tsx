import React from 'react';
import { type TFunction } from 'i18next';
import { interpolateUrl, useConfig } from '@egen-civitas/esm-framework';
import { egenLogoFull } from '../brand';
import { type ConfigSchema } from '../config-schema';

/** Logo de la page de connexion : image configurée (`logo.src`) ou logo EGEN par défaut. */
export const LoginLogo: React.FC<{ t: TFunction }> = ({ t }) => {
  const { logo } = useConfig<ConfigSchema>();
  // `logo.alt` ne décrit que le logo personnalisé (`logo.src`) ; le logo EGEN par défaut a son propre libellé.
  const alt = logo.src && logo.alt ? t(logo.alt) : t('egenLogo', 'Egen logo');

  return (
    <img
      alt={alt}
      className="h-10 w-auto max-w-40 object-contain"
      src={logo.src ? interpolateUrl(logo.src) : egenLogoFull}
    />
  );
};
