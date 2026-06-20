// ============================================================================
//  EIGEN THEME ENGINE — Instance singleton + API globale
// ============================================================================

import { ThemeEngine } from './engine';
import type { ThemeEngineOptions, ThemeEngineState } from './types';

/**
 * Instance singleton du moteur de thème.
 * Elle est initialisée par `setupThemeEngine()` au boot du shell.
 */
let _engine: ThemeEngine | null = null;

/**
 * Initialise et démarre le moteur de thème global.
 * À appeler une seule fois, au démarrage de l'app shell (run.ts).
 *
 * @example
 * ```ts
 * // dans esm-app-shell/src/run.ts
 * await setupThemeEngine({
 *   themeUrls: ['/themes/glass-dark.json'],
 *   pollIntervalMs: 5000,
 * });
 * ```
 */
export async function setupThemeEngine(
  options: ThemeEngineOptions,
): Promise<ThemeEngine> {
  // Nettoyer un moteur précédent si ré-appelé (HMR dev)
  if (_engine) {
    _engine.destroy();
  }

  _engine = new ThemeEngine(options);
  await _engine.apply();
  return _engine;
}

/**
 * Retourne l'instance singleton.
 * Lance une erreur si `setupThemeEngine()` n'a pas encore été appelé.
 */
export function getThemeEngine(): ThemeEngine {
  if (!_engine) {
    throw new Error(
      '[eigen/esm-theme] ThemeEngine non initialisé. Appelez setupThemeEngine() au boot du shell.',
    );
  }
  return _engine;
}

/**
 * Retourne l'état courant du thème actif (sans abonnement).
 * Retourne null si le moteur n'est pas encore initialisé.
 */
export function getThemeState(): ThemeEngineState | null {
  return _engine?.getState() ?? null;
}

/**
 * Raccourci pour recharger manuellement le thème (ex: après upload d'un fichier).
 */
export async function reloadTheme(): Promise<void> {
  await _engine?.apply();
}
