import { Type, validators } from '@egen-civitas/esm-framework';

// =============================================================================
//  ESM INFORMATIONS APP — Schéma de configuration runtime
//  Toutes les valeurs sont surchargables via le système de config EGEN.
// =============================================================================

export const configSchema = {
  defaultAudience: {
    _type: Type.String,
    _default: 'all',
    _description: "Audience présélectionnée dans les filtres : 'all' (tout), 'interne', 'extranet' ou 'public'.",
    _validators: [validators.oneOf(['all', 'interne', 'extranet', 'public'])],
  },
  agendaPageSize: {
    _type: Type.Number,
    _default: 50,
    _description: "Nombre maximum d'événements chargés dans l'agenda.",
    _validators: [validators.inRange(1, 500)],
  },
};

export interface ConfigSchema {
  defaultAudience: 'all' | 'interne' | 'extranet' | 'public';
  agendaPageSize: number;
}
