import React from 'react';
import styles from './quick-access.scss';

interface QuickAccessSectionProps {
  title: string;
  children: React.ReactNode;
}

/** Cadre commun des sections du panneau Accès rapide (titre + contenu). */
export const QuickAccessSection: React.FC<QuickAccessSectionProps> = ({ title, children }) => (
  <section className={styles.section} aria-label={title}>
    <h3 className={styles.sectionTitle}>{title}</h3>
    {children}
  </section>
);
