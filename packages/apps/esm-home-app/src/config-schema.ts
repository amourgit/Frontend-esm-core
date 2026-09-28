import { Type, validators } from '@egen-civitas/esm-framework';

// =============================================================================
//  ESM HOME APP — Schéma de configuration runtime
//
//  Écran d'accueil de l'espace authentifié (voir home/home.component.tsx).
//  L'ancienne vitrine de test des composants @egen-civitas/esm-styleguide (ex
//  home.component.tsx) a été mise de côté sous 'home/showcase' — voir
//  home/component-showcase/ — et conserve ses propres clés de config
//  (pageTitle, staggeredMenu) ci-dessous, inchangées.
//
//  Toutes les valeurs sont surchargables via le système de config EGEN.
// =============================================================================

export const configSchema = {
  pageTitle: {
    _type: Type.String,
    _default: 'Vitrine des composants',
    _description: "Titre affiché en haut de la page 'home/showcase' (vitrine de test des composants).",
  },
  staggeredMenu: {
    position: {
      _type: Type.String,
      _default: 'right',
      _description: "Côté depuis lequel la démo StaggeredMenuPanel de la vitrine ('home/showcase') glisse.",
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
