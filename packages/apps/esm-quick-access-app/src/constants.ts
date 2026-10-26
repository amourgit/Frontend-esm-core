export const moduleName = '@egen-civitas/esm-quick-access-app';

/**
 * Contrat public de cette app : toute app injecte sa section d'accès rapide dans ce slot
 * (`{ "slot": "quick-access-section-slot", "component": "…", "order": n }` dans son routes.json).
 */
export const QUICK_ACCESS_SECTION_SLOT = 'quick-access-section-slot';
