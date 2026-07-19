import { Type, validators } from '@egen/esm-framework';

// =============================================================================
//  ESM HOME APP — Schéma de configuration runtime
//
//  Cette app sert désormais d'écran d'accueil authentifié — vitrine interne
//  des composants de base (@egen/esm-styleguide) en cours de développement.
//  Toutes les valeurs sont surchargables via le système de config EGEN.
// =============================================================================

export const configSchema = {
  pageTitle: {
    _type: Type.String,
    _default: 'Vitrine des composants',
    _description: "Titre affiché en haut de la page d'accueil.",
  },
  staggeredMenu: {
    position: {
      _type: Type.String,
      _default: 'right',
      _description: 'Côté depuis lequel la démo StaggeredMenuPanel de cette page glisse.',
      _validators: [validators.oneOf(['left', 'right'])],
    },
  },
};

export interface ConfigSchema {
  pageTitle: string;
  staggeredMenu: {
    position: 'left' | 'right';
  };
}
