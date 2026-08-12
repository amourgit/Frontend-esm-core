import React from 'react';
import { useTranslation } from 'react-i18next';
import { LocationIcon, navigate, useSession } from '@egen-civitas/esm-framework';
import styles from './change-location-link.scss';

// =============================================================================
//  CHANGE LOCATION LINK — Accès à la page de sélection d'espace/localisation
//
//  RÉUTILISATION EXACTE : même route, même service, même comportement
//  qu'auparavant. Seul le point d'entrée utilisateur a changé : ce bouton
//  n'est plus injecté dans la topbar (slot `top-nav-info-slot`) mais dans
//  le pied de la modal du sélecteur d'établissement/espace, via le slot
//  `context-switcher-footer-slot` (voir routes.json de esm-login-app).
// =============================================================================

const ChangeLocationLink: React.FC = () => {
  const { t } = useTranslation();
  const session = useSession();
  const currentLocation = session?.sessionLocation?.display;

  const changeLocation = () => {
    // update=true is passed as a query param for updating the location preference,
    // The location picker won't redirect with default location on finding the update=true param.
    navigate({
      to: `\${egenSpaBase}/login/location?returnToUrl=${window.location.pathname}&update=true`,
    });
  };

  return (
    <button type="button" className={styles.changeLocationButton} onClick={changeLocation}>
      <span className={styles.icon} aria-hidden="true">
        <LocationIcon size={16} />
      </span>
      <span className={styles.textGroup}>
        <span className={styles.label}>{t('searchEstablishment', 'Rechercher un espace')}</span>
        {currentLocation && (
          <span className={styles.currentLocation}>
            {t('currentLocation', 'Actuel')} : {currentLocation}
          </span>
        )}
      </span>
    </button>
  );
};

export default ChangeLocationLink;

