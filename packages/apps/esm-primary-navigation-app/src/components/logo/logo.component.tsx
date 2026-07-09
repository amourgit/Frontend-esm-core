import React, { useCallback } from 'react';
import { interpolateUrl, useConfig } from '@egen/esm-framework';
import { type ConfigSchema } from '../../config-schema';
import styles from './logo.scss';

// =============================================================================
//  LOGO — Marque affichée dans la zone gauche de la topbar
//
//  Deux modes, pilotés par la config schema (`logo.*`) :
//    1. logo.src défini → lockup image complet fourni par le tenant (seul)
//    2. sinon → pictogramme carré dégradé (sprite EGEN) + wordmark texte
//       (logo.name, ou "EGEN" par défaut)
// =============================================================================

const Logo: React.FC = () => {
  const { logo } = useConfig<ConfigSchema>();

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('[esm-primary-navigation-app] Échec du chargement du logo :', e);
  }, []);

  if (logo?.src) {
    return <img alt={logo.alt} className={styles.logoImage} onError={handleImageError} src={interpolateUrl(logo.src)} />;
  }

  return (
    <span className={styles.logo}>
      <span className={styles.logoMark} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 1.5l7 3.5v8L9 16.5 2 13V5l7-3.5z"
            stroke="white"
            strokeWidth="1.4"
            strokeLinejoin="round"
            fill="none"
          />
          <path d="M9 1.5v15M2 5l7 3.5 7-3.5M2 13l7-3.5 7 3.5" stroke="white" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={styles.logoName}>{logo?.name || 'EGEN'}</span>
    </span>
  );
};

export default Logo;

