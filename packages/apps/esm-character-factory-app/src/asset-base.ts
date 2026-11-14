// Base URL des assets de l'app (manifestes, modèles, textures, sons…), lue par le code hérité de CharacterStudio via
// `import.meta.env.VITE_ASSET_PATH` (remplacé au build par la variable globale ci-dessous).
//
//  - par défaut : assets embarqués (dist/character-factory-assets), résolus depuis l'URL de chargement du module ;
//  - si le réglage `assetBaseUrl` est renseigné : assets servis ailleurs (hébergement EGEN, CDN…).
//
// À appeler AVANT d'importer le code hérité (qui lit la variable dès l'évaluation de ses modules).
// NB : `__webpack_public_path__` doit apparaître dans un vrai module (analysé par rspack) ; dans une expression
// DefinePlugin il resterait un identifiant brut -> ReferenceError au chargement.
declare const __webpack_public_path__: string;

export const ASSET_BASE_GLOBAL = '__EGEN_CHARACTER_FACTORY_ASSETS__';

/** Valeur configurée nettoyée (sans espaces ni « / » final), ou null si aucune. */
export function normaliseAssetBase(configured?: string | null): string | null {
  const value = (configured ?? '').trim().replace(/\/+$/, '');
  return value || null;
}

export function applyAssetBase(configured?: string | null): string {
  const base = normaliseAssetBase(configured) ?? `${__webpack_public_path__}character-factory-assets`;
  (globalThis as any)[ASSET_BASE_GLOBAL] = base;
  return base;
}

/** Base d'assets courante (valeur posée par applyAssetBase). */
export function currentAssetBase(): string {
  return (globalThis as any)[ASSET_BASE_GLOBAL] ?? '';
}
