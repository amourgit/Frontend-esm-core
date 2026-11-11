import { Type, validators } from '@egen-civitas/esm-framework';

export const BACKGROUND_MODES = ['color', 'theme', 'image'] as const;
export type BackgroundMode = (typeof BACKGROUND_MODES)[number];

export const configSchema = {
  backgroundMode: {
    _type: Type.String,
    _default: 'color',
    _description:
      "Arrière-plan de la page : 'color' = couleur unie (backgroundColor), 'theme' = arrière-plan courant du shell, 'image' = image (backgroundImageUrl).",
    _validators: [validators.oneOf([...BACKGROUND_MODES])],
  },
  backgroundColor: {
    _type: Type.String,
    _default: '#000000',
    _description: "Couleur de l'arrière-plan en mode 'color' (noir par défaut).",
  },
  backgroundImageUrl: {
    _type: Type.String,
    _default: '',
    _description: "URL de l'image d'arrière-plan en mode 'image'.",
  },
  assetBaseUrl: {
    _type: Type.String,
    _default: '',
    _description:
      "URL de base des assets (manifestes, modèles). Vide = assets embarqués dans l'application (character-factory-assets).",
  },
};

export interface CharacterFactoryConfig {
  backgroundMode: BackgroundMode;
  backgroundColor: string;
  backgroundImageUrl: string;
  assetBaseUrl: string;
}
