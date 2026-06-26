import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@egen/esm-framework';
import { type ConfigSchema } from '../../config-schema';
import styles from './cta.scss';

// =============================================================================
//  CTA — Section d'appel à l'action finale
//  Bande pleine largeur avec gradient, headline fort, deux CTA.
// =============================================================================

const Cta: React.FC = () => {
  const { t } = useTranslation();
  const { demoUrl, contactUrl } = useConfig<ConfigSchema>();

  return (
    <section className={styles.section} aria-labelledby="cta-heading">
      {/* Orbs décoratifs */}
      <div className={styles.orbLeft} aria-hidden="true" />
      <div className={styles.orbRight} aria-hidden="true" />

      <div className={styles.container}>
        <span className={styles.badge}>
          {t('ctaBadge', '🚀 Disponible maintenant')}
        </span>

        <h2 id="cta-heading" className={styles.headline}>
          {t('ctaHeadline', 'Prêt à transformer l\'éducation gabonaise ?')}
        </h2>

        <p className={styles.subtext}>
          {t(
            'ctaSubtext',
            'Rejoignez les établissements qui ont déjà fait le choix du numérique. Déploiement rapide, accompagnement complet, résultats mesurables.',
          )}
        </p>

        <div className={styles.actions}>
          <a href={demoUrl} className={styles.btnPrimary}>
            {t('ctaDemoBtn', 'Demander une démonstration')}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a href={contactUrl} className={styles.btnGhost}>
            {t('ctaContactBtn', 'Parler à un expert')}
          </a>
        </div>

        {/* Micro-garanties */}
        <div className={styles.guarantees}>
          {[
            t('ctaGuarantee1', '✓ Sans engagement'),
            t('ctaGuarantee2', '✓ Démo gratuite'),
            t('ctaGuarantee3', '✓ Accompagnement inclus'),
          ].map((g) => (
            <span key={g} className={styles.guaranteeItem}>{g}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Cta;
