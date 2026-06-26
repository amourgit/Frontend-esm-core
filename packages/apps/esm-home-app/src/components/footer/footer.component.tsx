import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@egen/esm-framework';
import { type ConfigSchema } from '../../config-schema';
import styles from './footer.scss';

// =============================================================================
//  FOOTER — Pied de page complet : nav, légal, réseaux
// =============================================================================

const FOOTER_LINKS = {
  product: [
    { label: 'footerFeaturesLink', href: '#features' },
    { label: 'footerUseCasesLink', href: '#use-cases' },
    { label: 'footerPricingLink', href: '#pricing' },
    { label: 'footerRoadmapLink', href: '#' },
  ],
  company: [
    { label: 'footerAboutLink', href: '#' },
    { label: 'footerBlogLink', href: '#' },
    { label: 'footerCareersLink', href: '#' },
    { label: 'footerPressLink', href: '#' },
  ],
  legal: [
    { label: 'footerPrivacyLink', href: '#' },
    { label: 'footerTermsLink', href: '#' },
    { label: 'footerCookiesLink', href: '#' },
  ],
};

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { productName, footer } = useConfig<ConfigSchema>();
  const year = new Date().getFullYear();

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#') && href.length > 1) {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        {/* ── Colonne marque ── */}
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <svg role="img" className={styles.brandSvg} aria-hidden="true">
              <use href="#egen-logo-full-color" />
            </svg>
            <span className={styles.brandName}>{productName}</span>
          </div>
          <p className={styles.brandTagline}>
            {t('footerTagline', "L'Écosystème Numérique de l'Éducation du Gabon. Une initiative CIVITAS pour la transformation numérique africaine.")}
          </p>
          {/* Réseaux sociaux */}
          <div className={styles.socials} aria-label={t('socialsLabel', 'Réseaux sociaux')}>
            <a href="#" className={styles.socialLink} aria-label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a href="#" className={styles.socialLink} aria-label="Twitter / X">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              </svg>
            </a>
            <a href="#" className={styles.socialLink} aria-label="GitHub">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
              </svg>
            </a>
          </div>
        </div>

        {/* ── Colonnes nav ── */}
        <div className={styles.navColumns}>
          <div className={styles.navColumn}>
            <h3 className={styles.navColumnTitle}>{t('footerProductTitle', 'Produit')}</h3>
            <ul className={styles.navList}>
              {FOOTER_LINKS.product.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className={styles.navLink}
                    onClick={(e) => handleAnchorClick(e, href)}
                  >
                    {t(label, label)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.navColumn}>
            <h3 className={styles.navColumnTitle}>{t('footerCompanyTitle', 'Société')}</h3>
            <ul className={styles.navList}>
              {FOOTER_LINKS.company.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className={styles.navLink}>{t(label, label)}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.navColumn}>
            <h3 className={styles.navColumnTitle}>{t('footerLegalTitle', 'Légal')}</h3>
            <ul className={styles.navList}>
              {FOOTER_LINKS.legal.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className={styles.navLink}>{t(label, label)}</a>
                </li>
              ))}
            </ul>
            {footer.links?.map(({ label, href }) => (
              <li key={label} className={styles.navList}>
                <a href={href} className={styles.navLink}>{label}</a>
              </li>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          <span className={styles.copyright}>
            © {year} {footer.copyrightHolder} · {productName}. {t('footerAllRights', 'Tous droits réservés.')}
          </span>
          <span className={styles.madeWith}>
            {t('footerMadeWith', 'Fait avec ❤️ au Gabon par')}
            <a href="https://civitas-gabon.com" className={styles.civitasLink} target="_blank" rel="noopener noreferrer">
              &nbsp;CIVITAS
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
