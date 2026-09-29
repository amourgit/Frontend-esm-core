import { NavItem } from '../components/shell/DropdownNavigation';
import { IntranetApp } from '../data/intranetAppsMock';

export type WorkspaceCategory = 'public' | 'organisationnel' | 'personnel';

export type WorkspaceId = 'public' | 'intranet' | 'extranet' | 'personnel' | 'rh';

export interface Workspace {
  id: WorkspaceId;
  name: string;
  category: WorkspaceCategory;
  categoryLabel: string;
  subtitle: string;
  badge: string;
  iconName: 'Users' | 'Globe' | 'Radio' | 'User' | 'Briefcase' | 'Building2';
  navItems: NavItem[];
  apps: IntranetApp[];
}
