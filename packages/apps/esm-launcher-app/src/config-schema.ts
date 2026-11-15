import { Type, validators } from '@egen-civitas/esm-framework';

export const configSchema = {
  externalRefLinks: {
    _type: Type.Array,
    _elements: {
      _type: Type.Object,
      title: {
        _type: Type.String,
        _description: 'Title of the link',
      },
      redirect: {
        _type: Type.String,
        _description: 'Link to redirect to (must be an external link)',
        _validators: [validators.isUrl],
      },
    },
    _default: [],
    _description: 'The external links to be showcased in the app menu',
  },
};

export interface ConfigSchema {
  externalRefLinks: { title: string; redirect: string }[];
}
