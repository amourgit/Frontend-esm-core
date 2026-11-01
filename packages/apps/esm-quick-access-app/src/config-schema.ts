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
      { id: 'news', label: 'News & Publications', icon: 'Megaphone', to: '${egenSpaBase}/informations/news' },
      { id: 'annonces', label: 'Salle des Annonces', icon: 'Files', to: '${egenSpaBase}/informations/annonces' },
      { id: 'agenda', label: 'Agenda & Réunions', icon: 'CalendarDays', to: '${egenSpaBase}/informations/agenda' },
      { id: 'applications', label: 'Catalogue Applications', icon: 'Presentation', to: '${egenSpaBase}/applications' },
      { id: 'recherche', label: 'Recherche Globale', icon: 'Briefcase', to: '${egenSpaBase}/ged/recherche' },
      { id: 'iam', label: 'Droits & Permissions', icon: 'User', to: '${egenSpaBase}/iam' },
      { id: 'ged', label: 'GED & Ressources', icon: 'Files', to: '${egenSpaBase}/ged' },
      { id: 'admin', label: 'Administration Système', icon: 'GraduationCap', to: '${egenSpaBase}/ged/administration' },
    ],
    _description: 'Raccourcis affichés dans le panneau Accès rapide.',
  },
};

export interface QuickAccessConfig {
  shortcuts: Array<{ id: string; label: string; icon: string; to: string }>;
}
