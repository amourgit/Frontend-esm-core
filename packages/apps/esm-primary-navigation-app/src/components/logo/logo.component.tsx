import React, { useCallback } from 'react';
import { interpolateUrl, useConfig } from '@egen/esm-framework';
import { type ConfigSchema } from '../../config-schema';
import styles from './logo.scss';

// =============================================================================
//  LOGO — Marque affichée dans la zone gauche de la topbar
//
//  Priorité de rendu, pilotée par la config schema (`logo.*`) :
//    1. logo.src  → image fournie par le tenant
//    2. logo.name → wordmark texte (dégradé sur le texte, style "steex")
//    3. fallback  → sprite SVG EGEN par défaut
// =============================================================================

const Logo: React.FC = () => {
  const { logo } = useConfig<ConfigSchema>();

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('[esm-primary-navigation-app] Échec du chargement du logo :', e);
  }, []);

  if (logo?.src) {
    return <img alt={logo.alt} className={styles.logo} onError={handleImageError} src={interpolateUrl(logo.src)} />;
  }

  if (logo?.name) {
    return <span className={styles.logoName}>{logo.name}</span>;
  }

  return (
    <svg aria-label="Egen Logo" role="img" width={110} height={40} className={styles.logo}>
      <use href="#egen-logo-white" />
    </svg>
  );
};

export default Logo;
