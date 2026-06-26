import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type StatItem } from '../../types';
import styles from './stats.scss';

// =============================================================================
//  STATS — Bande de chiffres clés avec animation count-up
// =============================================================================

const STATS: StatItem[] = [
  { id: 'schools', value: '340', suffix: '+', label: 'statsSchools' },
  { id: 'learners', value: '12 480', suffix: '+', label: 'statsLearners' },
  { id: 'teachers', value: '2 800', suffix: '+', label: 'statsTeachers' },
  { id: 'uptime', value: '99,9', suffix: ' %', label: 'statsUptime' },
];

const StatCard: React.FC<StatItem & { visible: boolean }> = ({ value, suffix, label, visible }) => {
  const { t } = useTranslation();
  return (
    <div className={`${styles.statCard} ${visible ? styles.statCardVisible : ''}`}>
      <div className={styles.statValue}>
        {value}
        <span className={styles.statSuffix}>{suffix}</span>
      </div>
      <div className={styles.statLabel}>{t(label, label)}</div>
    </div>
  );
};

const Stats: React.FC = () => {
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
      { threshold: 0.3 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.statsSection} aria-label="Chiffres clés">
      <div className={styles.inner}>
        {STATS.map((stat) => (
          <StatCard key={stat.id} {...stat} visible={visible} />
        ))}
      </div>
    </section>
  );
};

export default Stats;
