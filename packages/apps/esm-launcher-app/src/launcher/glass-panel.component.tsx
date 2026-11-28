import React from 'react';

interface GlassPanelProps {
  children?: React.ReactNode;
  /** En-tête du panneau (séparé du contenu par un filet). */
  header?: React.ReactNode;
  /** Classes du conteneur (position comprise : `fixed` / `absolute`). */
  className?: string;
  /** Classes du bloc de contenu. */
  contentClassName?: string;
}

/**
 * Panneau « verre d'eau » : glassmorphism transparent, sans fond blanc opaque. Même rendu que celui qui vivait dans la
 * TopBar (`WaterGlassModal`), réduit à ce que le menu utilisateur utilise. Ne se positionne pas lui-même quand
 * `className` contient déjà `fixed` ou `absolute`.
 */
export const GlassPanel: React.FC<GlassPanelProps> = ({ children, header, className = '', contentClassName = '' }) => {
  const hasPosition = className.includes('fixed') || className.includes('absolute');
  const defaultPosition = hasPosition ? '' : 'absolute top-full mt-2';

  return (
    <div
      className={`${defaultPosition} z-[9999] text-xs text-(--foreground) select-none overflow-hidden
        bg-(--popover)/90 backdrop-blur-3xl rounded-2xl border border-(--border)
        shadow-(--shadow-2xl)
        before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-(--foreground)/12 before:to-transparent before:pointer-events-none
        animate-in fade-in zoom-in-95 duration-150
        ${className}
      `}
    >
      <div className={`relative z-10 p-1.5 ${contentClassName}`}>
        {header && <div className="pb-1.5 mb-1.5 border-b border-(--border) px-2 pt-1">{header}</div>}
        {children}
      </div>
    </div>
  );
};
