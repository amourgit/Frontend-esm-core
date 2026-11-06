import { type NavItem } from '../components/shell/DropdownNavigation';
import { type IntranetApp } from '../data/intranetAppsMock';

export type WorkspaceCategory = 'public' | 'organisationnel' | 'personnel';

export type WorkspaceId = 'public' | 'intranet' | 'extranet' | 'personnel' | 'rh';

/** Définition d'un espace. La navigation n'en fait pas partie : elle vient du slot. */
export interface WorkspaceDefinition {
  id: WorkspaceId;
  name: string;
  category: WorkspaceCategory;
  categoryLabel: string;
  subtitle: string;
  badge: string;
  iconName: 'Users' | 'Globe' | 'Radio' | 'User' | 'Briefcase' | 'Building2';
  apps: IntranetApp[];
}

/** Espace courant, enrichi de la navigation déclarée par les apps pour cet espace. */
export interface Workspace extends WorkspaceDefinition {
  navItems: NavItem[];
}
