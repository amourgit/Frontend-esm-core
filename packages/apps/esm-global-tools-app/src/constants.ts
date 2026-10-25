export const moduleName = '@egen-civitas/esm-global-tools-app';

/** Slot historique des notifications : les autres apps y injectent déjà leurs entrées. */
export const NOTIFICATIONS_SLOT = 'notifications-nav-menu-slot';

/**
 * Slot des sections du panneau Paramètres. Toute app peut y injecter une section
 * (`{ "slot": "global-settings-slot", "component": "…", "order": n }` dans son routes.json).
 */
export const GLOBAL_SETTINGS_SLOT = 'global-settings-slot';

/** Nom de l'extension « Notifications » du rail droit (= id de sa fenêtre d'outils, clé de sa pastille). */
export const NOTIFICATIONS_TOOL_ID = 'global-notifications';
