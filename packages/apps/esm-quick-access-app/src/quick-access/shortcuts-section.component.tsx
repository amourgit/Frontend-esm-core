import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  CalendarDays,
  Files,
  Folder,
  Globe,
  GraduationCap,
  House,
  Info,
  LayoutGrid,
  Megaphone,
  Newspaper,
  Presentation,
  Star,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { interpolateUrl, navigate, useConfig } from '@egen-civitas/esm-framework';
import type { QuickAccessConfig } from '../config-schema';
import { QuickAccessSection } from './quick-access-section.component';
import styles from './quick-access.scss';

// Liste blanche des icônes de raccourcis (un nom inconnu retombe sur `Star`).
const ICONS: Readonly<Record<string, LucideIcon>> = {
  Briefcase,
  CalendarDays,
  Files,
  Folder,
  Globe,
  GraduationCap,
  House,
  Info,
  LayoutGrid,
  Megaphone,
  Newspaper,
  Presentation,
  Star,
  User,
  Users,
};

// Raccourcis : grille de boutons qui naviguent vers une page de l'espace, depuis n'importe quelle app.
const ShortcutsSection: React.FC = () => {
  const { t } = useTranslation();
  const { shortcuts } = useConfig<QuickAccessConfig>();

  return (
    <QuickAccessSection title={t('shortcuts', 'Raccourcis')}>
      {shortcuts.length === 0 ? (
        <p className={styles.empty}>{t('noShortcuts', 'Aucun raccourci configuré')}</p>
      ) : (
        <div className={styles.grid}>
          {shortcuts.map((item) => {
            const Icon = ICONS[item.icon] ?? Star;
            return (
              <button
                key={item.id}
                type="button"
                className={styles.tile}
                onClick={() => navigate({ to: interpolateUrl(item.to) })}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </QuickAccessSection>
  );
};

export default ShortcutsSection;
