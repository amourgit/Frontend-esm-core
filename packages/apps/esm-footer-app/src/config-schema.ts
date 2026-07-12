import { Type, validators } from '@egen/esm-framework';

// =============================================================================
//  CONFIG SCHEMA — App Footer
//
//  Toute l'information affichée est pilotable par configuration (globale ou
//  surchargée par tenant), rien n'est en dur dans les composants — même
//  logique que `logo` / `externalRefLinks` dans esm-primary-navigation-app.
// =============================================================================

export const configSchema = {
  company: {
    name: {
      _type: Type.String,
      _default: 'CIVITAS',
      _description: "Nom de l'entreprise à l'origine du projet, affiché dans le footer.",
    },
    tagline: {
      _type: Type.String,
      _default: "Solutions d'intégration IA",
      _description: 'Courte accroche affichée à côté du nom de l’entreprise (laisser vide pour la masquer).',
    },
    url: {
      _type: Type.String,
      _default: '',
      _description:
        "Lien externe vers le site de l'entreprise. Si renseigné, le nom de l'entreprise devient cliquable.",
      _validators: [validators.isUrl],
    },
  },
  copyright: {
    showYear: {
      _type: Type.Boolean,
      _default: true,
      _description: "Afficher l'année courante avant le nom de l'entreprise (ex. « © 2026 CIVITAS »).",
    },
    text: {
      _type: Type.String,
      _default: '',
      _description:
        'Texte additionnel affiché après le nom de l’entreprise (ex. « Tous droits réservés »). Laisser vide pour ne rien afficher.',
    },
  },
  links: {
    _type: Type.Array,
    _elements: {
      _type: Type.Object,
      title: {
        _type: Type.String,
        _description: 'Libellé du lien (ex. « Mentions légales », « Contact »).',
      },
      url: {
        _type: Type.String,
        _description: 'Cible du lien. Externe (http/https) ou interne (chemin relatif de la SPA).',
      },
    },
    _default: [],
    _description: 'Liens secondaires optionnels affichés dans le footer (mentions légales, contact, etc.).',
  },
};

export type FooterLink = {
  title: string;
  url: string;
};

export type ConfigSchema = {
  company: {
    name: string;
    tagline: string;
    url: string;
  };
  copyright: {
    showYear: boolean;
    text: string;
  };
  links: Array<FooterLink>;
};
