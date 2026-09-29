export interface IntranetApp {
  id: string;
  name: string;
  description: string;
  icon: 'FolderOpen' | 'Calendar' | 'ShieldCheck' | 'Newspaper' | 'Megaphone';
  category: 'collaboration' | 'ged' | 'securite';
  status: string;
  url: string;
  badgeColor?: string;
}

export const INTRANET_APPS_MOCK: IntranetApp[] = [
  {
    id: 'ged',
    name: 'GED Documents',
    description: 'Gestion électronique et archivage des dossiers EGEN',
    icon: 'FolderOpen',
    category: 'ged',
    status: 'Actif',
    url: '/ged'
  },
  {
    id: 'actualites',
    name: 'Actualités & Publications',
    description: 'Informer et expliquer : journal interne, dossiers et articles durables',
    icon: 'Newspaper',
    category: 'collaboration',
    status: 'En direct',
    url: '/actualites'
  },
  {
    id: 'annonces',
    name: 'Annonces & Directives',
    description: 'Avertir et cibler : notes de service, alertes et diffusion ciblée',
    icon: 'Megaphone',
    category: 'collaboration',
    status: 'Direct',
    url: '/annonces'
  },
  {
    id: 'calendrier',
    name: 'Agenda & Planning',
    description: 'Planifier et synchroniser : réunions, événements et échéances',
    icon: 'Calendar',
    category: 'collaboration',
    status: 'En ligne',
    url: '/informations/agenda'
  },
  {
    id: 'iam',
    name: 'IAM & Droits d\'Accès',
    description: 'Gestion des identités, rôles, permissions et sécurité globale',
    icon: 'ShieldCheck',
    category: 'securite',
    status: 'Sécurisé',
    url: '/iam'
  }
];
