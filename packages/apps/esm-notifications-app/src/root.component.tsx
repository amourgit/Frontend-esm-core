import React, { useEffect } from 'react';
import { setToolWindowBadge, useAssignedExtensions } from '@egen-civitas/esm-framework';
import { NOTIFICATIONS_SLOT, NOTIFICATIONS_TOOL_ID } from './constants';

// =============================================================================
//  ROOT — Racine permanente de l'app Notifications
//
//  Le bouton du rail droit et la zone « Notifications » sont une extension (routes.json) que le
//  shell affiche dans toutes les apps. Cette racine ne dessine rien : elle porte la pastille du
//  bouton (nombre d'entrées du slot `notifications-nav-menu-slot`), qui doit se mettre à jour
//  même zone fermée.
//
//  Cette app est la seule à connaître la logique des notifications : les autres apps y injectent
//  leurs entrées via le slot, sans jamais toucher à son code.
// =============================================================================

export const NotificationsBadgeSync: React.FC = () => {
  const entries = useAssignedExtensions(NOTIFICATIONS_SLOT);
  const count = entries.length;

  useEffect(() => {
    setToolWindowBadge(NOTIFICATIONS_TOOL_ID, count);
    return () => setToolWindowBadge(NOTIFICATIONS_TOOL_ID, null);
  }, [count]);

  return null;
};

const Root: React.FC = () => <NotificationsBadgeSync />;

export default Root;
