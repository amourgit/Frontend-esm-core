import { Type } from '@egen-civitas/esm-framework';

// =============================================================================
//  ESM ANNUAIRE APP — Schéma de configuration runtime
//
//  `welcomeBanner` : bandeau « nouveau collaborateur » ouvert comme niveau éphémère de la TopBar à l'arrivée sur
//  l'annuaire (test du système de niveaux à chaud). Tout est paramétrable par l'entreprise qui déploie la solution.
// =============================================================================

export const configSchema = {
  welcomeBanner: {
    enabled: {
      _type: Type.Boolean,
      _default: true,
      _description: "Affiche le bandeau d'accueil d'un nouveau collaborateur à l'ouverture de l'annuaire.",
    },
    durationSeconds: {
      _type: Type.Number,
      _default: 10,
      _description: 'Durée de vie du bandeau, en secondes (le niveau se referme ensuite avec animation).',
    },
    message: {
      _type: Type.String,
      _default: 'Bienvenue à {name}, {role} : un nouveau collaborateur rejoint l’entreprise !',
      _description: 'Message affiché. Variables : {name} et {role}.',
    },
    collaboratorName: {
      _type: Type.String,
      _default: '',
      _description: 'Nom du nouveau collaborateur. Vide : dernier collaborateur de la liste de l’annuaire.',
    },
    collaboratorRole: {
      _type: Type.String,
      _default: '',
      _description: 'Poste du nouveau collaborateur. Vide : celui de la fiche de l’annuaire.',
    },
    background: {
      _type: Type.String,
      _default: '#dc2626',
      _description: 'Arrière-plan CSS du niveau (rouge plein par défaut).',
    },
    textColor: {
      _type: Type.String,
      _default: '#ffffff',
      _description: 'Couleur CSS du texte.',
    },
  },
};

export interface WelcomeBannerConfig {
  enabled: boolean;
  durationSeconds: number;
  message: string;
  collaboratorName: string;
  collaboratorRole: string;
  background: string;
  textColor: string;
}

export interface ConfigSchema {
  welcomeBanner: WelcomeBannerConfig;
}
