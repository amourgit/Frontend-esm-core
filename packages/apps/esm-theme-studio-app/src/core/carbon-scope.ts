import { CARBON_BRIDGE } from './carbon-bridge.generated';

/**
 * Variables `--cds-*` à poser sur le conteneur de prévisualisation. Elles pointent vers les variables EGEN
 * (`var(--colors-…)`) qui, elles, sont posées sur le MÊME conteneur : les composants Carbon réels suivent alors
 * le thème en cours d'édition, sans toucher au thème de l'application.
 */
export const carbonScopeVars = (): Record<string, string> => ({ ...CARBON_BRIDGE });

/** Style complet d'un conteneur de prévisualisation : variables du thème édité + pont Carbon scopé. */
export const previewStyle = (themeVars: Record<string, string>): Record<string, string> => ({ ...carbonScopeVars(), ...themeVars });
