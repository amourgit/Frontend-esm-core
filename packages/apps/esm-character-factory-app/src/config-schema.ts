import { Type } from '@egen-civitas/esm-framework';

export const configSchema = {
  assetBaseUrl: {
    _type: Type.String,
    _default: '',
    _description:
      "URL de base des assets (manifestes, modèles). Vide = assets embarqués dans l'application (character-factory-assets).",
  },
};

export interface CharacterFactoryConfig {
  assetBaseUrl: string;
}
