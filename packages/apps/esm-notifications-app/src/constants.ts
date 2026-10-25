export const moduleName = '@egen-civitas/esm-notifications-app';

/**
 * Contrat public de cette app : les autres apps y injectent leurs entrées de notification
 * (`{ "slot": "notifications-nav-menu-slot", "component": "…" }` dans leur routes.json).
 */
export const NOTIFICATIONS_SLOT = 'notifications-nav-menu-slot';

/** Nom de l'extension du rail droit (= id de sa fenêtre d'outils, clé de sa pastille). */
export const NOTIFICATIONS_TOOL_ID = 'notifications';
