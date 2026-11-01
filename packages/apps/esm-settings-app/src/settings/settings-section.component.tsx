import React from 'react';
import styles from './settings.scss';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

/** Cadre commun des sections du panneau Paramètres (titre + contrôles). */
export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <section className={styles.section} aria-label={title}>
    <h3 className={styles.sectionTitle}>{title}</h3>
    {children}
  </section>
);
