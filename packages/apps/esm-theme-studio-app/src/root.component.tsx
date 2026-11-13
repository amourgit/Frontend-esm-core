import React from 'react';
import { useTranslation } from 'react-i18next';

const Root: React.FC = () => {
  const { t } = useTranslation();
  return (
    <main data-testid="theme-studio-root">
      <h1>{t('themeStudio', 'Theme Studio')}</h1>
    </main>
  );
};

export default Root;
