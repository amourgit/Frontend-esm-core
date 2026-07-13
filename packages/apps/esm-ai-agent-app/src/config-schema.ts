import { Type } from '@egen/esm-framework';

// =============================================================================
//  CONFIG SCHEMA — App AI Agent
//
//  Textes affichés dans le widget, surchargeables globalement ou par tenant —
//  même logique que `esm-footer-app` / `esm-primary-navigation-app`.
// =============================================================================

export const configSchema = {
  assistantName: {
    _type: Type.String,
    _default: 'Assistant EGEN',
    _description: "Nom affiché en en-tête du panneau de conversation.",
  },
  greeting: {
    _type: Type.String,
    _default: 'Bonjour ! Comment puis-je vous aider aujourd’hui ?',
    _description: 'Message affiché quand la conversation est vide.',
  },
};

export type ConfigSchema = {
  assistantName: string;
  greeting: string;
};
