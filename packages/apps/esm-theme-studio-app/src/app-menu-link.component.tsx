import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigurableLink } from '@egen-civitas/esm-framework';

// Tuile de la grille « Applications » de la TopBar (slot `app-menu-slot`).
export default function ThemeStudioAppMenuLink() {
  const { t } = useTranslation();
  return <ConfigurableLink to="${egenSpaBase}/theme-studio">{t('themeStudio', 'Theme Studio')}</ConfigurableLink>;
}
