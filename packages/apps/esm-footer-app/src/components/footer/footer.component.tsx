import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@egen-civitas/esm-framework';
import civitasLogoFull from '../../../../../../branding/civitas-logo-full.png';
import { type ConfigSchema } from '../../config-schema';

/**
 * Pied de page global : utilise le même design que le LoginFooter
 * Ce footer est affiché partout (login, logout, pages authentifiées)
 */
const FooterContent: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const { civitas } = config;
  const additionalLogos = config.additionalLogos ?? [];
  const civitasWebsite = 'https://civitas-africa.vercel.app/';

  const handleImageLoadError = useCallback((error: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Failed to load image', error);
  }, []);

  return (
    <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-3 py-2 text-[11px] text-muted-foreground">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span>{t('builtBy', 'Built by')}</span>
        <a
          aria-label={t('civitasLinkLabel', 'Visit the CIVITAS website (opens in a new tab)')}
          className="inline-flex items-center rounded-md transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          href={civitasWebsite}
          rel="noopener noreferrer"
          target="_blank"
        >
          <img alt={t('civitasLogo', 'CIVITAS logo')} className="h-6 w-auto object-contain" src={civitasLogoFull} />
        </a>
        <span className="hidden sm:inline">
          {t('poweredBySubtext', 'Solutions numériques et IA pour entreprises et particuliers')}
        </span>
      </div>

      {additionalLogos.length > 0 && (
        <div className="flex items-center gap-4">
          {additionalLogos.map((logo) => (
            <img
              alt={logo.alt ? t(logo.alt) : t('footerlogo', 'Footer Logo')}
              className="h-6 w-auto object-contain"
              key={logo.src}
              onError={handleImageLoadError}
              src={logo.src}
            />
          ))}
        </div>
      )}
    </footer>
  );
};

export default FooterContent;
