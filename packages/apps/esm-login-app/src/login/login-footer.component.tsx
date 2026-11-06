import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@egen-civitas/esm-framework';
import { civitasLogoWordmark, civitasWebsite } from '../brand';
import { type ConfigSchema } from '../config-schema';

/**
 * Pied de page de la connexion : crédit de l'éditeur (logo CIVITAS, lien vers son site) et logos additionnels
 * (`footer.additionalLogos`). EGEN est le produit, CIVITAS l'entreprise qui l'a créé : c'est elle qui est créditée ici.
 *
 * Le logo CIVITAS est argenté : il est posé sur une pastille sombre pour rester lisible quel que soit le thème.
 */
export const LoginFooter: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const logos = config.footer?.additionalLogos ?? [];

  const handleImageLoadError = useCallback((error: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Failed to load image', error);
  }, []);

  return (
    <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-border/40 bg-card/60 px-4 py-3 text-xs text-muted-foreground backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span>{t('builtBy', 'Built by')}</span>
        <a
          aria-label={t('civitasLinkLabel', 'Visit the CIVITAS website (opens in a new tab)')}
          className="inline-flex items-center rounded-md bg-[#0e0e11] px-3 py-1.5 shadow-sm ring-1 ring-black/10 transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          href={civitasWebsite}
          rel="noopener noreferrer"
          target="_blank"
        >
          <img alt={t('civitasLogo', 'CIVITAS logo')} className="h-5 w-auto object-contain" src={civitasLogoWordmark} />
        </a>
        <span className="hidden sm:inline">{t('poweredBySubtext', 'La plateforme éducative nationale du Gabon')}</span>
      </div>

      {logos.length > 0 && (
        <div className="flex items-center gap-4">
          {logos.map((logo) => (
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
