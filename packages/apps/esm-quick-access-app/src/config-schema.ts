import { Type } from '@egen-civitas/esm-framework';

// Raccourcis de la section « Raccourcis » du panneau Accès rapide (surchargables via la config EGEN).
export const configSchema = {
  shortcuts: {
    _type: Type.Array,
    _elements: {
      id: { _type: Type.String },
      label: { _type: Type.String },
      icon: { _type: Type.String, _description: 'Nom d’une icône de la liste blanche (ex. House, Users, Globe).' },
      to: { _type: Type.String, _description: 'Cible de navigation, ex. ${egenSpaBase}/home.' },
    },
    _default: [
      { id: 'home', label: 'Accueil', icon: 'House', to: '${egenSpaBase}/home' },
      { id: 'informations', label: 'Informations', icon: 'Info', to: '${egenSpaBase}/informations' },
      { id: 'annuaire', label: 'Annuaire', icon: 'Users', to: '${egenSpaBase}/annuaire' },
      { id: 'sites', label: 'Sites', icon: 'Globe', to: '${egenSpaBase}/sites' },
    ],
    _description: 'Raccourcis affichés dans le panneau Accès rapide.',
  },
};

export interface QuickAccessConfig {
  shortcuts: Array<{ id: string; label: string; icon: string; to: string }>;
}
