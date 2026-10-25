import React, { useEffect } from 'react';
import { setToolWindowBadge, useAssignedExtensions } from '@egen-civitas/esm-framework';
import { NOTIFICATIONS_SLOT, NOTIFICATIONS_TOOL_ID } from './constants';

// =============================================================================
//  ROOT — Racine permanente des outils globaux (montée comme la TopBar et le footer)
//
//  Les fenêtres d'outils du rail droit (Notifications, Paramètres) sont des extensions
//  déclarées dans routes.json : le shell les affiche toutes seul, quelle que soit l'app active.
//  Cette racine n'a donc rien à dessiner ; elle existe pour porter ce qui doit vivre en
//  permanence, ici la pastille du bouton Notifications (nombre d'entrées du slot
//  `notifications-nav-menu-slot`), qui doit se mettre à jour même panneau fermé.
//
//  Chaque app suit le même principe pour ses propres options : une extension dans le slot de
//  rail voulu (`shell-rail-left-slot`, `shell-rail-bottom-slot`, `shell-rail-right-slot`) dont
//  le composant est le contenu de la zone, et `setToolWindowBadge` pour un éventuel compteur.
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
