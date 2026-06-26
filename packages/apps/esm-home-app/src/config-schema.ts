import { Type } from '@egen/esm-framework';

// =============================================================================
//  ESM HOME APP — Schéma de configuration runtime
//  Toutes les valeurs sont surchargables via le système de config EIGEN/EGEN.
// =============================================================================

export const configSchema = {
  productName: {
    _type: Type.String,
    _default: 'EIGEN',
    _description: "Nom commercial du produit affiché dans la page d'accueil.",
  },
  tagline: {
    _type: Type.String,
    _default: "L'Écosystème Numérique de l'Éducation du Gabon",
    _description: 'Accroche principale affichée dans la section hero.',
  },
  contactUrl: {
    _type: Type.String,
    _default: 'mailto:contact@civitas-gabon.com',
    _description: 'URL ou lien de contact pour les CTA.',
  },
  loginUrl: {
    _type: Type.String,
    _default: '${egenSpaBase}/login',
    _description: "URL vers la page de connexion (bouton 'Se connecter').",
  },
  demoUrl: {
    _type: Type.String,
    _default: 'mailto:demo@civitas-gabon.com',
    _description: "URL pour demander une démo (bouton 'Demander une démo').",
  },
  logo: {
    src: {
      _type: Type.String,
      _default: '',
      _description: 'URL du logo. Vide = sprite SVG EIGEN intégré.',
    },
    alt: {
      _type: Type.String,
      _default: 'EIGEN Logo',
      _description: 'Texte alternatif du logo.',
    },
  },
  footer: {
    copyrightHolder: {
      _type: Type.String,
      _default: 'CIVITAS Gabon',
      _description: 'Nom de la société dans le copyright du footer.',
    },
    links: {
      _type: Type.Array,
      _default: [],
      _description: 'Liens additionnels dans le footer.',
      _elements: {
        _type: Type.Object,
        label: { _type: Type.String, _required: true },
        href: { _type: Type.String, _required: true },
      },
    },
  },
};

export interface ConfigSchema {
  productName: string;
  tagline: string;
  contactUrl: string;
  loginUrl: string;
  demoUrl: string;
  logo: {
    src: string;
    alt: string;
  };
  footer: {
    copyrightHolder: string;
    links: Array<{ label: string; href: string }>;
  };
}
