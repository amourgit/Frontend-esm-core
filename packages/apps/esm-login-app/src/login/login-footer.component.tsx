import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { useConfig } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../config-schema';

/** Pied de page de la connexion : « Built with EGEN », lien d'info et logos additionnels (`footer.additionalLogos`). */
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
        <span>{t('builtWith', 'Built with')}</span>
        <svg aria-label={t('egenLogo', 'EGEN Logo')} className="h-5 w-24 brightness-0 invert" role="img">
          <use href="#egen-logo-full-color"></use>
        </svg>
        <span className="hidden sm:inline">{t('poweredBySubtext', 'La plateforme éducative nationale du Gabon')}</span>
        <a
          className="inline-flex items-center gap-1 font-semibold text-foreground/80 transition-colors hover:text-foreground"
          href="https://egen.alpha.vercel.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          {t('learnMore', 'Learn more')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
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
