import React from 'react';

// =============================================================================
//  Bandeau « nouveau collaborateur » — rendu dans le niveau éphémère de la TopBar
//
//  Le fond (rouge plein) est porté par le niveau lui-même (`background`) ; ce composant ne rend que le texte,
//  centré, comme un panneau d'information. Props reçues de la TopBar : `text`, `textColor`, `levelId`, `close()`.
// =============================================================================

interface WelcomeBannerProps {
  text?: string;
  textColor?: string;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ text, textColor }) => {
  if (!text) return null;
  return (
    <p
      data-testid="annuaire-welcome-banner"
      className="w-full py-1.5 text-center text-sm font-semibold leading-snug sm:text-base"
      style={{ color: textColor || '#ffffff' }}
    >
      {text}
    </p>
  );
};

export default WelcomeBanner;
