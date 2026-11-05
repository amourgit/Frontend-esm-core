import { useEffect } from 'react';
import { useConfig } from '@egen-civitas/esm-framework';
import type { ConfigSchema } from '../config-schema';
import { DIRECTORY_EMPLOYEES } from '../data/directory-data';
import { formatAnnouncement, openAnnouncementLevel } from './announcement';

// =============================================================================
//  Déclencheur de test : à l'ouverture de l'annuaire, ajoute à chaud un niveau à la TopBar (sans savoir combien
//  il y en a) pour annoncer l'arrivée d'un nouveau collaborateur. Ne rend rien.
//  Étape suivante prévue : dates/heures de début et de fin précises (`expiresAt` est déjà pris en charge).
// =============================================================================

export const WelcomeAnnouncement = () => {
  const { welcomeBanner: cfg } = useConfig<ConfigSchema>();

  useEffect(() => {
    if (!cfg?.enabled) return;
    const newest = DIRECTORY_EMPLOYEES[DIRECTORY_EMPLOYEES.length - 1];
    const text = formatAnnouncement(cfg.message, {
      name: cfg.collaboratorName || newest?.fullName || 'un nouveau collaborateur',
      role: cfg.collaboratorRole || newest?.role || '',
    });
    openAnnouncementLevel({
      text,
      ttl: cfg.durationSeconds * 1000,
      background: cfg.background,
      textColor: cfg.textColor,
    });
    // Une seule ouverture par montage de l'annuaire ; l'id fixe évite tout empilement si le composant est remonté.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
