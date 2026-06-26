import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type FeatureItem } from '../../types';
import styles from './features.scss';

// =============================================================================
//  FEATURES — Grille de fonctionnalités clés de la plateforme
// =============================================================================

const FEATURES: FeatureItem[] = [
  {
    id: 'iam',
    icon: '🔐',
    title: 'featuresIamTitle',
    description: 'featuresIamDesc',
    tag: 'featuresTagSecurity',
  },
  {
    id: 'multitenant',
    icon: '🏗️',
    title: 'featuresMultitenantTitle',
    description: 'featuresMultitenantDesc',
    tag: 'featuresTagArchitecture',
  },
  {
    id: 'permissions',
    icon: '🛡️',
    title: 'featuresPermissionsTitle',
    description: 'featuresPermissionsDesc',
    tag: 'featuresTagGovernance',
  },
  {
    id: 'analytics',
    icon: '📊',
    title: 'featuresAnalyticsTitle',
    description: 'featuresAnalyticsDesc',
    tag: 'featuresTagInsights',
  },
  {
    id: 'mobile',
    icon: '📱',
    title: 'featuresMobileTitle',
    description: 'featuresMobileDesc',
    tag: 'featuresTagUX',
  },
  {
    id: 'api',
    icon: '⚡',
    title: 'featuresApiTitle',
    description: 'featuresApiDesc',
    tag: 'featuresTagIntegration',
  },
  {
    id: 'offline',
    icon: '🌍',
    title: 'featuresOfflineTitle',
    description: 'featuresOfflineDesc',
    tag: 'featuresTagResilience',
  },
  {
    id: 'ai',
    icon: '🤖',
    title: 'featuresAiTitle',
    description: 'featuresAiDesc',
    tag: 'featuresTagAI',
  },
];

const FeatureCard: React.FC<FeatureItem & { index: number; visible: boolean }> = ({
  icon,
  title,
  description,
  tag,
  index,
  visible,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={`${styles.card} ${visible ? styles.cardVisible : ''}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className={styles.cardIcon} aria-hidden="true">
        {icon}
      </div>
      {tag && <span className={styles.cardTag}>{t(tag, tag)}</span>}
      <h3 className={styles.cardTitle}>{t(title, title)}</h3>
      <p className={styles.cardDescription}>{t(description, description)}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" ref={sectionRef} className={styles.section} aria-labelledby="features-heading">
      <div className={styles.container}>
        {/* En-tête de section */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>{t('featuresSectionLabel', 'Fonctionnalités')}</span>
          <h2 id="features-heading" className={styles.sectionTitle}>
            {t('featuresSectionTitle', 'Tout ce dont vous avez besoin pour digitaliser l\'éducation')}
          </h2>
          <p className={styles.sectionSubtitle}>
            {t(
              'featuresSectionSubtitle',
              'EIGEN regroupe l\'ensemble des outils nécessaires à la gestion, au suivi et à l\'amélioration de l\'enseignement à l\'échelle nationale.',
            )}
          </p>
        </div>

        {/* Grille de fonctionnalités */}
        <div className={styles.grid}>
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.id} {...feature} index={index} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
