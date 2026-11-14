/** Mode d'affichage édité dans le Studio. */
export type Mode = 'light' | 'dark';

/** Niveau d'exposition de l'interface : Simple → Avancé → Expert. */
export type StudioLevel = 'simple' | 'advanced' | 'expert';
export const LEVELS: StudioLevel[] = ['simple', 'advanced', 'expert'];

/**
 * Document de thème EGEN (le `ThemeSchema` de `@egen-civitas/esm-theme`). C'est la SEULE source de vérité :
 * le Studio ne définit aucun modèle concurrent. Typé de façon ouverte volontairement (schéma extensible).
 */
export type ThemeDoc = Record<string, unknown>;

/** Chemin d'un token dans le document (ex: ['colors','primary','500']). */
export type TokenPath = readonly string[];
