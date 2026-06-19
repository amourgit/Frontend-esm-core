import { validators, Type, validator } from '@egen/esm-framework';

export const configSchema = {
  provider: {
    type: {
      _type: Type.String,
      _default: 'basic',
      _description:
        "Selects the login mechanism to use. Choices are 'basic', 'oauth2' and 'custom'. On log out, the user is redirected to the login Url in 'custom' mode, but NOT in 'oauth2' mode. " +
        "For 'custom' and 'oauth2', you'll also need to set the 'loginUrl' property.",
      _validators: [validators.oneOf(['basic', 'custom', 'oauth2'])],
    },
    loginUrl: {
      _type: Type.String,
      _default: '${egenSpaBase}/login',
      _description: "The URL to use to login. This is only used if the login type is 'oauth2' or 'custom'.",
      _validators: [validators.isUrl],
    },
  },
  _validators: [
    validator(
      (provider: { type: string; loginUrl: string }) => {
        if (provider.type === 'custom' || provider.type === 'oauth2') {
          return provider.loginUrl !== '${egenSpaBase}/login';
        }
        return true;
      },
      (provider: { type: string }) =>
        `Provider type '${provider.type}' requires an explicit loginUrl that is not the default SPA login route.`,
    ),
  ],
  chooseLocation: {
    enabled: {
      _type: Type.Boolean,
      _default: true,
      _description:
        "Whether to show a 'Choose Location' screen after login. " +
        "If true, the user will be taken to the URL set in the 'links.loginSuccess' config property after choosing a location.",
    },
    numberToShow: {
      _type: Type.Number,
      _default: 8,
      _description: 'The number of locations displayed in the location picker.',
      _validators: [validator((v: unknown) => typeof v === 'number' && v > 0, 'Must be greater than zero')],
    },
    locationsPerRequest: {
      _type: Type.Number,
      _default: 50,
      _description: 'The number of results to fetch in each cycle of infinite scroll.',
      _validators: [validator((v: unknown) => typeof v === 'number' && v > 0, 'Must be greater than zero')],
    },
    useLoginLocationTag: {
      _type: Type.Boolean,
      _default: true,
      _description:
        "Whether to display only locations with the 'Login Location' tag. If false, all locations are shown.",
    },
  },
  links: {
    loginSuccess: {
      _type: Type.String,
      _default: '${egenSpaBase}/home',
      _description: 'The URL to redirect the user to after a successful login.',
      _validators: [validators.isUrl],
    },
  },
  logo: {
    src: {
      _type: Type.String,
      _default: '',
      _description:
        'The path or URL to the logo image. If set to an empty string, the default Egen SVG sprite will be used.',
      _validators: [validators.isUrl],
    },
    alt: {
      _type: Type.String,
      _default: 'Logo',
      _description: 'The alternative text for the logo image, displayed when the image cannot be loaded or on hover.',
    },
  },
  footer: {
    additionalLogos: {
      _type: Type.Array,
      _elements: {
        _type: Type.Object,
        src: {
          _type: Type.String,
          _required: true,
          _description: 'The source URL of the logo image',
          _validators: [validators.isUrl],
        },
        alt: {
          _type: Type.String,
          _required: true,
          _description: 'The alternative text for the logo image',
        },
      },
      _default: [],
      _description: 'An array of logos to be displayed in the footer next to the Egen logo.',
    },
  },
  showPasswordOnSeparateScreen: {
    _type: Type.Boolean,
    _default: true,
    _description:
      'Whether to show the password field on a separate screen. If false, the password field will be shown on the same screen.',
  },
  background: {
    _type: Type.Object,
    _description:
      'Customizes the login page background. Either a background image URL or a CSS color may be set. ' +
      'If both are set, the image is used.',
    image: {
      _type: Type.String,
      _default: '',
      _description:
        'URL to a background image. Relative paths are interpolated via ${egenBase} / ${egenSpaBase}.',
      _validators: [validators.isUrl],
    },
    color: {
      _type: Type.String,
      _default: '',
      _description: 'CSS color value (e.g. "#0066cc" or "rgb(0,102,204)"). Used when no image is set.',
    },
  },

  carousel: {
    intervalMs: {
      _type: Type.Number,
      _default: 5500,
      _description: 'Durée en ms entre deux slides du carrousel de connexion.',
    },
    slides: {
      _type: Type.Array,
      _default: [],
      _description:
        'Slides du carrousel côté gauche de la page de connexion. ' +
        'Si vide, les slides par défaut intégrés dans le code sont utilisés.',
      _elements: {
        _type: Type.Object,
        accent: {
          _type: Type.String,
          _default: '',
          _description: 'Petit label coloré affiché au-dessus du titre (optionnel).',
        },
        headline: {
          _type: Type.String,
          _required: true,
          _description: 'Titre principal du slide.',
        },
        body: {
          _type: Type.String,
          _required: true,
          _description: 'Texte descriptif du slide.',
        },
      },
    },
  },
  announcements: {
    _type: Type.Array,
    _description:
      'Message banners displayed above the login form, e.g. for planned downtime notices. ' +
      'Each entry renders as a Carbon InlineNotification. `title` and `text` may be either ' +
      'literal strings or translation keys.',
    _elements: {
      _type: Type.Object,
      title: {
        _type: Type.String,
        _default: '',
        _description: 'Optional title shown at the top of the banner. May be a translation key.',
      },
      text: {
        _type: Type.String,
        _required: true,
        _description: 'Banner body text. May be a translation key.',
      },
      kind: {
        _type: Type.String,
        _default: 'info',
        _description: 'The visual style of the banner. One of: info, warning, error, success.',
        _validators: [validators.oneOf(['info', 'warning', 'error', 'success'])],
      },
    },
    _default: [],
  },
};

export interface ConfigSchema {

  carousel: {
    intervalMs: number;
    slides: Array<{
      accent?: string;
      headline: string;
      body: string;
    }>;
  };
  announcements: Array<{
    title: string;
    text: string;
    kind: 'info' | 'warning' | 'error' | 'success';
  }>;
  background: {
    image: string;
    color: string;
  };
  chooseLocation: {
    enabled: boolean;
    locationsPerRequest: number;
    numberToShow: number;
    useLoginLocationTag: boolean;
  };
  footer: {
    additionalLogos: Array<{
      alt: string;
      src: string;
    }>;
  };
  links: {
    loginSuccess: string;
  };
  logo: {
    alt: string;
    src: string;
  };
  provider: {
    loginUrl: string;
    type: 'basic' | 'oauth2' | 'custom';
  };
  showPasswordOnSeparateScreen: boolean;
}
