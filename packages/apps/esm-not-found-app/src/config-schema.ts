import { Type } from '@egen/esm-framework';

// =============================================================================
//  ESM NOT FOUND APP — Schéma de configuration runtime
// =============================================================================

export const configSchema = {
  pageTitle: {
    _type: Type.String,
    _default: '404',
    _description: 'Titre affiché sur la page 404.',
  },
};

export interface ConfigSchema {
  pageTitle: string;
}
