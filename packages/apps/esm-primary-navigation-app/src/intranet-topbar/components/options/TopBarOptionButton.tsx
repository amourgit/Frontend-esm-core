import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
//  Bouton d'option de la TopBar — design GED (icône libre, sans fond, accent
//  teal au survol) + pastille de compteur optionnelle. Remplace
//  `TopBarIconButton` du framework : la TopBar n'en dépend plus.
// =============================================================================

export interface TopBarOptionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: React.ReactNode;
  /** Libellé accessible ET infobulle. */
  label: string;
  badge?: number | string;
  active?: boolean;
}

export const TopBarOptionButton = forwardRef<HTMLButtonElement, TopBarOptionButtonProps>(function TopBarOptionButton(
  { icon, label, badge, active = false, className, type = 'button', ...rest },
  ref,
) {
  const showBadge = badge !== undefined && badge !== null && badge !== '' && badge !== 0;
  return (
    <button
      ref={ref}
      type={type}
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      className={cn(
        'relative p-1 transition-colors cursor-pointer bg-transparent border-none flex items-center justify-center overflow-visible',
        active ? 'text-teal-400' : 'text-slate-300 hover:text-teal-400',
        className,
      )}
      {...rest}
    >
      {icon}
      {showBadge ? (
        <span className="absolute -top-1.5 -right-2 bg-[#E41E3F] text-white text-[9px] sm:text-[10px] font-bold min-w-[16px] sm:min-w-[17px] h-[16px] sm:h-[17px] px-1 rounded-full flex items-center justify-center shadow-md ring-2 ring-slate-900 leading-none pointer-events-none z-30">
          {badge}
        </span>
      ) : null}
    </button>
  );
});

/** Position commune des panneaux "verre" des options (mobile : plein écran ; desktop : sous le bouton). */
export const OPTION_PANEL_CLASS =
  'fixed sm:absolute top-14 sm:top-10 left-2 right-2 sm:left-auto sm:right-0 max-w-sm z-[9999]';

/** Props communes des options pilotant un panneau (état porté par la TopBar). */
export interface OptionPanelProps {
  open: boolean;
  onToggle: () => void;
  /** Classes de visibilité (ex. masquage quand la recherche est ouverte en mobile). */
  className?: string;
}
