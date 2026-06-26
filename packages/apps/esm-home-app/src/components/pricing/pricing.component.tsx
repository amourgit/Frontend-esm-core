import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@egen/esm-framework';
import { type ConfigSchema } from '../../config-schema';
import { type PricingTier } from '../../types';
import styles from './pricing.scss';

// =============================================================================
//  PRICING — Grille de tarifs avec toggle mensuel / annuel
// =============================================================================

const TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'pricingStarterName',
    price: 0,
    currency: 'XAF',
    period: 'pricingPeriodFree',
    description: 'pricingStarterDesc',
    features: ['pricingStarterF1', 'pricingStarterF2', 'pricingStarterF3', 'pricingStarterF4'],
    highlighted: false,
    cta: 'pricingStarterCta',
  },
  {
    id: 'institution',
    name: 'pricingInstitutionName',
    price: 150000,
    currency: 'XAF',
    period: 'pricingPeriodMonth',
    description: 'pricingInstitutionDesc',
    features: [
      'pricingInstitutionF1',
      'pricingInstitutionF2',
      'pricingInstitutionF3',
      'pricingInstitutionF4',
      'pricingInstitutionF5',
    ],
    highlighted: true,
    cta: 'pricingInstitutionCta',
    badge: 'pricingPopularBadge',
  },
  {
    id: 'national',
    name: 'pricingNationalName',
    price: null,
    currency: 'XAF',
    period: 'pricingPeriodCustom',
    description: 'pricingNationalDesc',
    features: [
      'pricingNationalF1',
      'pricingNationalF2',
      'pricingNationalF3',
      'pricingNationalF4',
      'pricingNationalF5',
      'pricingNationalF6',
    ],
    highlighted: false,
    cta: 'pricingNationalCta',
  },
];

// Formatage FCFA
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-GA', { maximumFractionDigits: 0 }).format(price);
};

const PricingCard: React.FC<PricingTier & { annual: boolean; contactUrl: string }> = ({
  name,
  price,
  currency,
  period,
  description,
  features,
  highlighted,
  cta,
  badge,
  annual,
  contactUrl,
}) => {
  const { t } = useTranslation();

  const displayPrice = price !== null && annual ? Math.round(price * 10) : price;

  return (
    <div className={`${styles.card} ${highlighted ? styles.cardHighlighted : ''}`}>
      {badge && <div className={styles.cardBadge}>{t(badge, badge)}</div>}

      <div className={styles.cardHeader}>
        <h3 className={styles.cardName}>{t(name, name)}</h3>
        <p className={styles.cardDescription}>{t(description, description)}</p>
      </div>

      <div className={styles.priceBlock}>
        {displayPrice === null ? (
          <span className={styles.priceCustom}>{t('pricingCustomLabel', 'Sur devis')}</span>
        ) : displayPrice === 0 ? (
          <span className={styles.priceValue}>{t('pricingFree', 'Gratuit')}</span>
        ) : (
          <>
            <span className={styles.priceValue}>{formatPrice(displayPrice)}</span>
            <span className={styles.priceCurrency}>{currency}</span>
            <span className={styles.pricePeriod}>/ {t(period, period)}{annual ? ' (×10)' : ''}</span>
          </>
        )}
      </div>

      <ul className={styles.featureList} aria-label={t('pricingFeaturesLabel', 'Inclus dans ce plan')}>
        {features.map((feat, i) => (
          <li key={i} className={styles.featureItem}>
            <span className={styles.featureCheck} aria-hidden="true">✓</span>
            {t(feat, feat)}
          </li>
        ))}
      </ul>

      <a
        href={displayPrice === null || highlighted ? contactUrl : '#'}
        className={`${styles.ctaBtn} ${highlighted ? styles.ctaBtnHighlighted : ''}`}
      >
        {t(cta, cta)}
      </a>
    </div>
  );
};

const Pricing: React.FC = () => {
  const { t } = useTranslation();
  const { contactUrl } = useConfig<ConfigSchema>();
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className={styles.section} aria-labelledby="pricing-heading">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>{t('pricingSectionLabel', 'Tarifs')}</span>
          <h2 id="pricing-heading" className={styles.sectionTitle}>
            {t('pricingSectionTitle', 'Des offres adaptées à chaque structure')}
          </h2>
          <p className={styles.sectionSubtitle}>
            {t('pricingSectionSubtitle', 'Commencez gratuitement, évoluez à votre rythme. Toutes les offres incluent mises à jour et sécurité incluses.')}
          </p>

          {/* Toggle mensuel / annuel */}
          <div className={styles.toggle} role="group" aria-label={t('pricingToggleLabel', 'Fréquence de facturation')}>
            <span className={!annual ? styles.toggleLabelActive : styles.toggleLabel}>
              {t('pricingMonthly', 'Mensuel')}
            </span>
            <button
              className={`${styles.toggleBtn} ${annual ? styles.toggleBtnOn : ''}`}
              aria-checked={annual}
              role="switch"
              onClick={() => setAnnual((v) => !v)}
              aria-label={t('pricingAnnualToggle', 'Facturation annuelle')}
            >
              <span className={styles.toggleThumb} />
            </button>
            <span className={annual ? styles.toggleLabelActive : styles.toggleLabel}>
              {t('pricingAnnual', 'Annuel')}
              <span className={styles.toggleDiscount}>{t('pricingDiscount', '−17 %')}</span>
            </span>
          </div>
        </div>

        {/* Grille */}
        <div className={styles.grid}>
          {TIERS.map((tier) => (
            <PricingCard key={tier.id} {...tier} annual={annual} contactUrl={contactUrl} />
          ))}
        </div>

        {/* Note bas de page */}
        <p className={styles.footnote}>
          {t('pricingFootnote', '* Tarifs en Francs CFA (XAF). TVA et taxes applicables non incluses. Contactez-nous pour un devis personnalisé pour le déploiement national.')}
        </p>
      </div>
    </section>
  );
};

export default Pricing;
