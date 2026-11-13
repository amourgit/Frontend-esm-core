import React, { forwardRef } from 'react';
import classNames from 'classnames';

// =============================================================================
//  Bouton d'option de la TopBar : icône libre, sans fond, accent teal au survol, pastille de compteur optionnelle.
//  Même rendu que celui qui vivait dans la TopBar (`TopBarOptionButton`).
// =============================================================================

interface OptionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: React.ReactNode;
  /** Libellé accessible ET infobulle. */
  label: string;
  active?: boolean;
}

export const OptionButton = forwardRef<HTMLButtonElement, OptionButtonProps>(function OptionButton(
  { icon, label, active = false, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      className={classNames(
        'relative p-1 transition-colors cursor-pointer bg-transparent border-none flex items-center justify-center overflow-visible',
        active ? 'text-teal-400' : 'text-slate-300 hover:text-teal-400',
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
});
