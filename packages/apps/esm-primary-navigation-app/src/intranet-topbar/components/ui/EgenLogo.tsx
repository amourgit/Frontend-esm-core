import React from 'react';
import { egenLogoFull, egenLogoIcon } from '../../../brand';

interface EgenLogoProps {
  className?: string;
  /** `full` : logo + « EGEN » écrit (défaut) · `icon` : logo seul. */
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'nav' | 'lg' | 'xl';
}

const logoByVariant = {
  full: egenLogoFull,
  icon: egenLogoIcon,
} as const;

// Hauteurs responsives du logo : la largeur suit (h-full w-auto), quelle que soit la variante.
const sizeMap = {
  sm: 'h-8 sm:h-9',
  md: 'h-9 sm:h-11',
  nav: 'h-8 sm:h-11',
  lg: 'h-12 sm:h-14',
  xl: 'h-16 sm:h-20',
} as const;

export const EgenLogo: React.FC<EgenLogoProps> = ({ className = '', variant = 'full', size = 'md' }) => {
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <div className={`relative flex items-center shrink-0 ${sizeMap[size]} transition-transform hover:scale-[1.02]`}>
        <img
          src={logoByVariant[variant]}
          alt="EGEN — Écosystème Gouvernemental de l’Économie Numérique"
          className="h-full w-auto object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

export default EgenLogo;
