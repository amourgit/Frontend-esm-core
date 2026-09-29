import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { ExtensionSlot, useAssignedExtensions, useConfig } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../../../config-schema';
import { WaterGlassModal } from '../ui/WaterGlassModal';
import { OPTION_PANEL_CLASS, TopBarOptionButton, type OptionPanelProps } from './TopBarOptionButton';
import styles from './topbar-options.scss';

// Lanceur d'applications — service réel : extensions du slot "app-menu-slot"
// + liens externes de la config (`externalRefLinks`). Design GED (grille 2x2 + verre).

const GridGlyph: React.FC = () => (
  <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 flex flex-wrap gap-0.5 items-center justify-center p-0.5">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="w-1.5 h-1.5 rounded-[2px] bg-current" />
    ))}
  </div>
);

const AppsMenuOption: React.FC<OptionPanelProps> = ({ open, onToggle, className = '' }) => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const appMenuItems = useAssignedExtensions('app-menu-slot');
  const externalLinks = config?.externalRefLinks ?? [];
  const total = appMenuItems.length + externalLinks.length;

  if (total === 0) return null;

  return (
    <div className={`relative overflow-visible items-center ${className || 'flex'}`}>
      <TopBarOptionButton
        label={t('AppMenuTooltip', 'Applications')}
        active={open}
        badge={total > 9 ? '9+' : total}
        onClick={onToggle}
        icon={<GridGlyph />}
        className="text-teal-400 hover:text-teal-300"
      />
      {open && (
        <WaterGlassModal
          align="none"
          className={`${OPTION_PANEL_CLASS} w-[calc(100vw-16px)] sm:w-80`}
          contentClassName="p-3"
          header={<span className="font-semibold text-sm text-white tracking-tight">{t('applications', 'Applications')}</span>}
        >
          <div className={styles.grid} role="menu" aria-label={t('applications', 'Applications')}>
            <ExtensionSlot className={styles.gridSlot} name="app-menu-slot" />
            {externalLinks.map((link) => (
              <a
                key={link.redirect}
                target="_blank"
                rel="noopener noreferrer"
                href={link.redirect}
                className={styles.gridItem}
              >
                <span className={styles.gridItemIcon}>
                  <ExternalLink size={16} />
                </span>
                <span className={styles.gridItemLabel}>{t(link.title)}</span>
              </a>
            ))}
          </div>
        </WaterGlassModal>
      )}
    </div>
  );
};

export default AppsMenuOption;
