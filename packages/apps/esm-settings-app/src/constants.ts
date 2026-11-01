export const moduleName = '@egen-civitas/esm-settings-app';

/**
 * Contrat public de cette app : toute app injecte sa section de paramètres dans ce slot
 * (`{ "slot": "global-settings-slot", "component": "…", "order": n }` dans son routes.json).
 */
export const GLOBAL_SETTINGS_SLOT = 'global-settings-slot';
