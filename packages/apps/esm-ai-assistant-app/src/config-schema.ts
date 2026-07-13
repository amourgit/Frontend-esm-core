import { Type, validators } from '@egen/esm-framework';

// =============================================================================
//  CONFIG SCHEMA — App Assistant IA
//
//  Deux familles de configuration, volontairement séparées :
//    • Le comportement du moteur IA lui-même (provider, backend, sécurité,
//      mémoire, contexte) est piloté par @egen/esm-ai-config (variables
//      d'environnement EGEN_AI_*) — voir docs/theme-system-status.md et
//      .env.development. Cette app ne redéfinit RIEN de ce périmètre.
//    • Ce qui relève de la PRÉSENTATION du widget (identité affichée,
//      message d'accueil, entreprise à l'origine du projet, suggestions
//      rapides) est piloté ici, par tenant si besoin — même logique que
//      `company` dans esm-footer-app.
// =============================================================================

export const configSchema = {
  assistant: {
    name: {
      _type: Type.String,
      _default: 'Assistant EGEN',
      _description: "Nom affiché de l'assistant IA dans l'en-tête du panneau de conversation.",
    },
    welcomeMessage: {
      _type: Type.String,
      _default: 'Bonjour 👋 Comment puis-je vous aider aujourd’hui ?',
      _description: 'Message affiché au premier ouverture du panneau, avant tout échange.',
    },
    placeholder: {
      _type: Type.String,
      _default: 'Écrivez un message…',
      _description: 'Texte indicatif affiché dans le champ de saisie du chat.',
    },
    micEnabled: {
      _type: Type.Boolean,
      _default: true,
      _description:
        "Afficher le bouton microphone (dictée vocale via l'API Web Speech du navigateur). " +
        "Masqué automatiquement si le navigateur ne supporte pas la reconnaissance vocale, " +
        'indépendamment de cette option.',
    },
    suggestions: {
      _type: Type.Array,
      _elements: { _type: Type.String },
      _default: [],
      _description:
        'Suggestions de messages rapides affichées sous le message de bienvenue (cliquables). Vide = aucune.',
    },
  },
  company: {
    name: {
      _type: Type.String,
      _default: 'CIVITAS',
      _description: "Nom de l'entreprise à l'origine du projet, affiché en pied du panneau de l'assistant.",
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
};

export type AssistantSuggestion = string;

export type ConfigSchema = {
  assistant: {
    name: string;
    welcomeMessage: string;
    placeholder: string;
    micEnabled: boolean;
    suggestions: AssistantSuggestion[];
  };
  company: {
    name: string;
    tagline: string;
    url: string;
  };
};
