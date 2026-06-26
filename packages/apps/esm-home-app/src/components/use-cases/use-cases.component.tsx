import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type UseCaseItem } from '../../types';
import styles from './use-cases.scss';

// =============================================================================
//  USE CASES — Cas d'usages par profil utilisateur (tab switcher)
// =============================================================================

const USE_CASES: UseCaseItem[] = [
  {
    id: 'ministry',
    icon: '🏛️',
    title: 'ucMinistryTitle',
    description: 'ucMinistryDesc',
    audience: 'ucMinistryAudience',
    features: ['ucMinistryF1', 'ucMinistryF2', 'ucMinistryF3', 'ucMinistryF4'],
  },
  {
    id: 'director',
    icon: '🏫',
    title: 'ucDirectorTitle',
    description: 'ucDirectorDesc',
    audience: 'ucDirectorAudience',
    features: ['ucDirectorF1', 'ucDirectorF2', 'ucDirectorF3', 'ucDirectorF4'],
  },
  {
    id: 'teacher',
    icon: '👩‍🏫',
    title: 'ucTeacherTitle',
    description: 'ucTeacherDesc',
    audience: 'ucTeacherAudience',
    features: ['ucTeacherF1', 'ucTeacherF2', 'ucTeacherF3', 'ucTeacherF4'],
  },
  {
    id: 'student',
    icon: '🎓',
    title: 'ucStudentTitle',
    description: 'ucStudentDesc',
    audience: 'ucStudentAudience',
    features: ['ucStudentF1', 'ucStudentF2', 'ucStudentF3', 'ucStudentF4'],
  },
  {
    id: 'parent',
    icon: '👨‍👩‍👧',
    title: 'ucParentTitle',
    description: 'ucParentDesc',
    audience: 'ucParentAudience',
    features: ['ucParentF1', 'ucParentF2', 'ucParentF3', 'ucParentF4'],
  },
];

const UseCases: React.FC = () => {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string>(USE_CASES[0].id);
  const active = USE_CASES.find((uc) => uc.id === activeId) ?? USE_CASES[0];

  return (
    <section id="use-cases" className={styles.section} aria-labelledby="usecases-heading">
      <div className={styles.container}>
        {/* En-tête */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>{t('ucSectionLabel', 'Cas d\'usages')}</span>
          <h2 id="usecases-heading" className={styles.sectionTitle}>
            {t('ucSectionTitle', 'Une plateforme pour chaque acteur de l\'éducation')}
          </h2>
          <p className={styles.sectionSubtitle}>
            {t('ucSectionSubtitle', 'EIGEN s\'adapte aux rôles et aux besoins de toutes les parties prenantes du système éducatif gabonais.')}
          </p>
        </div>

        {/* Tabs de profils */}
        <div className={styles.tabs} role="tablist" aria-label={t('ucTabsLabel', 'Sélectionner un profil')}>
          {USE_CASES.map((uc) => (
            <button
              key={uc.id}
              role="tab"
              aria-selected={uc.id === activeId}
              aria-controls={`panel-${uc.id}`}
              className={`${styles.tab} ${uc.id === activeId ? styles.tabActive : ''}`}
              onClick={() => setActiveId(uc.id)}
            >
              <span className={styles.tabIcon}>{uc.icon}</span>
              <span className={styles.tabLabel}>{t(uc.audience, uc.audience)}</span>
            </button>
          ))}
        </div>

        {/* Panneau actif */}
        <div
          id={`panel-${active.id}`}
          role="tabpanel"
          className={styles.panel}
          key={active.id}
          aria-labelledby={`tab-${active.id}`}
        >
          <div className={styles.panelLeft}>
            <div className={styles.panelIcon} aria-hidden="true">{active.icon}</div>
            <h3 className={styles.panelTitle}>{t(active.title, active.title)}</h3>
            <p className={styles.panelDescription}>{t(active.description, active.description)}</p>
          </div>
          <div className={styles.panelRight}>
            <ul className={styles.featureList} aria-label={t('ucFeatureListLabel', 'Fonctionnalités incluses')}>
              {active.features.map((feat, i) => (
                <li key={i} className={styles.featureItem}>
                  <span className={styles.featureCheck} aria-hidden="true">✓</span>
                  <span>{t(feat, feat)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;
