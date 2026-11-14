import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigurableLink } from '@egen-civitas/esm-framework';

// Tuile de l'application dans la grille « Applications » de la TopBar (slot `app-menu-slot`),
// même patron que les autres apps (ex. esm-offline-tools-app).
export default function CharacterFactoryAppMenuLink() {
  const { t } = useTranslation();
  return (
    <ConfigurableLink to="${egenSpaBase}/character-factory">
      {t('characterFactoryAppMenuLink', 'Character Factory')}
    </ConfigurableLink>
  );
}
