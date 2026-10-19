import { type WorkspaceDefinition } from '../types/workspace';
import { INTRANET_APPS_MOCK } from './intranetAppsMock';

// Définition des ESPACES (niveau 1 de la TopBar). Ne contient PAS la navigation : le niveau 2 est
// fourni par les apps via le slot `topbar-level2-nav` (voir NAVIGATION.md).
export const WORKSPACES_MOCK_DATA: WorkspaceDefinition[] = [
  // 1. ESPACE ORGANISATIONNEL / INTRANET (Espace par défaut)
  {
    id: 'intranet',
    name: 'Intranet',
    category: 'organisationnel',
    categoryLabel: 'Espace Organisationnel',
    subtitle: "Portail interne, communauté et vie d'organisation",
    badge: 'Organisationnel / Intranet',
    iconName: 'Building2',
    apps: INTRANET_APPS_MOCK, // Applications: GED, Calendrier, IAM, Publication & News
  },

  // 2. ESPACE ORGANISATIONNEL / EXTRANET
  {
    id: 'extranet',
    name: 'Extranet',
    category: 'organisationnel',
    categoryLabel: 'Espace Organisationnel',
    subtitle: 'Collaboration avec partenaires externes, filiales et prestataires',
    badge: 'Organisationnel / Extranet',
    iconName: 'Globe',
    apps: [],
  },

  // 3. ESPACES PUBLIQUE (ESPACE PUBLIC)
  {
    id: 'public',
    name: 'Espaces Publique',
    category: 'public',
    categoryLabel: 'Espaces Publique',
    subtitle: "Diffusion d'informations publiques, décrets et transparence",
    badge: 'Accès Libre',
    iconName: 'Radio',
    apps: [],
  },

  // 4. ESPACE PERSONNEL
  {
    id: 'personnel',
    name: 'Espace Personnel',
    category: 'personnel',
    categoryLabel: 'Espace Personnel',
    subtitle: 'Coffre-fort numérique individuel, documents privés et réglages',
    badge: 'Espace Privé',
    iconName: 'User',
    apps: [],
  },
];
