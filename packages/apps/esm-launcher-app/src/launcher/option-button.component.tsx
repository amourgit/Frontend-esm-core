import React, { forwardRef } from 'react';

// Bouton d'option de la TopBar : icône libre, sans fond, accent teal au survol, pastille de compteur optionnelle.
// Même rendu que celui qui vivait dans la TopBar (`TopBarOptionButton`).

interface OptionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: React.ReactNode;
  /** Libellé accessible ET infobulle. */
  label: string;
  badge?: number | string;
  active?: boolean;
}

export const OptionButton = forwardRef<HTMLButtonElement, OptionButtonProps>(function OptionButton(
  { icon, label, badge, active = false, className = '', type = 'button', ...rest },
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
      className={`relative p-1 transition-colors cursor-pointer bg-transparent border-none flex items-center justify-center overflow-visible ${
        active ? 'text-teal-400' : 'text-slate-300 hover:text-teal-400'
      } ${className}`}
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
