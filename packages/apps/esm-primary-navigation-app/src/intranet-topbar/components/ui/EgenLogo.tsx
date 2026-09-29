import React from 'react';
import egenLogoUrl from '../../assets/egen_logo_official.png';

interface EgenLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'horizontal' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const EgenLogo: React.FC<EgenLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  // Size metrics for the image logo container
  const sizeMap = {
    sm: 'h-8 sm:h-9',
    md: 'h-9 sm:h-11',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20',
  };

  const currentHeight = sizeMap[size];

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* Official Uploaded EGEN Logo Image (Transparent) */}
      <div className={`relative flex items-center shrink-0 ${currentHeight} transition-transform hover:scale-[1.02]`}>
        <img
          src={egenLogoUrl}
          alt="EGEN — Écosystème Gouvernemental de l’Économie Numérique"
          className="h-full w-auto object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

export default EgenLogo;
