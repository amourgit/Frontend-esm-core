import { Building2, CalendarCheck, Contact, Layers, Megaphone, Newspaper } from 'lucide-react';
import type {
  SiteActivity,
  SiteApplication,
  SiteMember,
  SiteResource,
  SiteSummary,
  SiteTask,
  SiteTeam,
} from '@egen-civitas/esm-framework';

// =============================================================================
//  DONNÉES D'EXEMPLE — portées de Civitas---GED (data/sitesData.ts et onglets de
//  views/sites). Elles seront remplacées par l'API : les pages ne consomment que
//  les types du styleguide, rien d'autre n'est à changer au branchement.
// =============================================================================

export const SITE_TABS = ['applications', 'membres', 'ressources', 'taches', 'activite', 'parametres'] as const;
export type SiteTabId = (typeof SITE_TABS)[number];

export const isSiteTab = (value: string | undefined): value is SiteTabId => SITE_TABS.includes(value as SiteTabId);

export const SITES: SiteSummary[] = [
  { uuid: 'srv-8f92a10b', name: "Direction des Systèmes d'Information", shortName: 'DSI', category: 'Technologies & Infras', description: "Infrastructures cloud, sécurité IAM, réseaux d'entreprise, support utilisateur et gouvernance GED.", head: 'M. Jean-Luc BIKANGA', memberCount: 18, appCount: 6, status: 'Opérationnel' },
  { uuid: 'srv-3c71e92d', name: 'Direction des Ressources Humaines', shortName: 'DRH', category: 'Administration & Personnel', description: 'Gestion des talents, paie, mobilités internes, carrières et formations professionnelles.', head: 'Mme Marie-Claire MBUYI', memberCount: 12, appCount: 4, status: 'Actif' },
  { uuid: 'srv-6a10f44e', name: 'Direction de la Logistique & Bâtiments', shortName: 'DLB', category: 'Moyens Généraux', description: 'Gestion des véhicules, approvisionnements, maintenance du patrimoine et accès physiques.', head: 'M. Serge KABEYA', memberCount: 25, appCount: 3, status: 'Actif' },
  { uuid: 'srv-9d82b51c', name: 'Direction Financière & Comptabilité', shortName: 'DFC', category: 'Finances & Budget', description: 'Engagements budgétaires, trésorerie, facturation, contrôle de gestion et audits financiers.', head: 'Mme Patricia TSHILOMBA', memberCount: 15, appCount: 5, status: 'Opérationnel' },
];

export function getSiteByUuid(uuid?: string): SiteSummary | undefined {
  if (!uuid) return undefined;
  return SITES.find((site) => site.uuid.toLowerCase() === uuid.toLowerCase());
}

/** Applications du site — les liens pointent vers des routes existantes du core. */
export const SITE_APPLICATIONS: SiteApplication[] = [
  { id: 'news', name: 'Actualités & News', category: 'Communication', description: 'Diffusion de notes officielles, publications internes et reportages du site.', status: 'Mis à jour', icon: Newspaper, gradient: 'from-amber-500 to-orange-600', link: 'informations/news' },
  { id: 'annonces', name: 'Annonces & Flash Info', category: 'Communication', description: 'Annonces officielles et flash infos à destination des équipes.', status: 'En service', icon: Megaphone, gradient: 'from-rose-500 to-pink-600', link: 'informations/annonces' },
  { id: 'agenda', name: 'Agenda & Salles', category: 'Organisation', description: 'Réservations de ressources partagées, salles de réunion et visioconférences.', status: 'Synchro active', icon: CalendarCheck, gradient: 'from-indigo-500 to-purple-600', link: 'informations/agenda' },
  { id: 'annuaire', name: 'Annuaire des collaborateurs', category: 'Organisation', description: 'Recherche par nom, poste, e-mail et téléphone dans tout l’annuaire.', status: 'Actif', icon: Contact, gradient: 'from-teal-500 to-emerald-600', link: 'annuaire/contacts' },
  { id: 'organigramme', name: 'Organigramme', category: 'Organisation', description: 'Structure hiérarchique, directions et rattachements.', status: 'Actif', icon: Layers, gradient: 'from-cyan-500 to-blue-600', link: 'annuaire/organigramme' },
  { id: 'structures', name: 'Pôles & Directions', category: 'Organisation', description: 'Départements administratifs et opérationnels de l’organisation.', status: 'Actif', icon: Building2, gradient: 'from-emerald-500 to-teal-700', link: 'annuaire/structures' },
];

export const SITE_RESOURCES: SiteResource[] = [
  { id: 'r1', title: 'Guide d’Utilisation du Portail Intranet GED', type: 'PDF Document', size: '2.4 MB', updated: '18 Sept. 2026', category: 'Procédures' },
  { id: 'r2', title: 'Charte de Sécurité Informatique & IAM 2026', type: 'PDF Document', size: '1.8 MB', updated: '05 Sept. 2026', category: 'Sécurité' },
  { id: 'r3', title: 'Formulaire de Demande d’Accès Réseau & VPN', type: 'DOCX Formulaire', size: '450 KB', updated: '12 Août 2026', category: 'Formulaires' },
  { id: 'r4', title: 'Guide des Bonnes Pratiques de Classement Archivistique 3D', type: 'PDF Manuel', size: '5.1 MB', updated: '01 Juil. 2026', category: 'Archives' },
];

export const SITE_TEAMS: SiteTeam[] = [
  { id: 'team-ged', name: 'Pôle GED & Numérique' },
  { id: 'team-infra', name: 'Unité Systèmes & Datacenter' },
  { id: 'team-app', name: 'Équipe Applications & Projets' },
  { id: 'team-sec', name: 'Gouvernance & Sécurité' },
  { id: 'team-support', name: 'Support Utilisateurs & Exploitation' },
];

export const SITE_MEMBERS: SiteMember[] = [
  { id: 'm1', name: 'Claire BERNARD', role: 'Gestionnaire de site', teamId: 'team-ged' },
  { id: 'm2', name: 'Christian LUKUSA', role: 'Administrateur IAM', teamId: 'team-sec' },
  { id: 'm3', name: 'Alain BOKETSU', role: 'Ingénieur Systèmes', teamId: 'team-infra' },
  { id: 'm4', name: 'Thomas KANKU', role: 'Responsable Juridique', teamId: 'team-sec' },
  { id: 'm5', name: 'Jean-Luc BIKANGA', role: 'Directeur des Systèmes d’Information', teamId: 'team-app' },
  { id: 'm6', name: 'Marc LEROY', role: 'Analyste Financier', teamId: 'team-support' },
  { id: 'm7', name: 'Amour Samuel NZILA NGALA', role: 'Directeur Général', teamId: 'team-app' },
];

export const INITIAL_SITE_TASKS: SiteTask[] = [
  { id: 'tsk-01', title: 'Validation du bordereau de versement BV-2026-0042', description: 'Vérifier la conformité des séries documentaires et scellement d’archive avant archivage définitif.', priority: 'haute', status: 'todo', dueDate: '28 Septembre 2026', assignedBy: 'Claire BERNARD', assignedTo: 'Amour Samuel NZILA NGALA', tags: ['GED', 'Bordereaux', 'Conformité'] },
  { id: 'tsk-02', title: 'Revue des habilitations des nouveaux membres du Pôle', description: 'Attribuer les rôles (Collaborateur vs Gestionnaire) aux 3 nouveaux arrivants.', priority: 'haute', status: 'in_progress', dueDate: '29 Septembre 2026', assignedBy: 'Amour Samuel NZILA NGALA', assignedTo: 'Christian LUKUSA', tags: ['Sécurité', 'IAM', 'Membres'] },
  { id: 'tsk-03', title: 'Indexation OCR et métadonnées du fonds historique', description: 'Superviser le lot de 1 240 dossiers numérisés sur le site Limete.', priority: 'moyenne', status: 'in_progress', dueDate: '02 Octobre 2026', assignedBy: 'Jean-Luc BIKANGA', assignedTo: 'Alain BOKETSU', tags: ['OCR', 'Numérisation'] },
  { id: 'tsk-04', title: 'Rapport mensuel d’activité et d’audit du site', description: 'Générer le récapitulatif des flux documentaires pour la Direction Générale.', priority: 'moyenne', status: 'todo', dueDate: '05 Octobre 2026', assignedBy: 'Claire BERNARD', assignedTo: 'Amour Samuel NZILA NGALA', tags: ['Reporting', 'Direction'] },
  { id: 'tsk-05', title: 'Contrôle d’intégrité des signatures électroniques', description: 'Vérification de la chaîne de certification des contrats cadres 2026.', priority: 'basse', status: 'done', dueDate: '24 Septembre 2026', assignedBy: 'Thomas KANKU', assignedTo: 'Amour Samuel NZILA NGALA', tags: ['Signatures', 'Audit'] },
];

export const SITE_ACTIVITIES: SiteActivity[] = [
  { id: 'act-1', userName: 'Claire BERNARD', userRole: 'Gestionnaire de site', action: 'upload', actionLabel: 'a téléversé le document', targetTitle: 'Bordereau_Versement_Finances_Q3_2026.pdf', targetType: 'Document GED', timeAgo: 'Il y a 15 minutes' },
  { id: 'act-2', userName: 'Amour Samuel NZILA NGALA', userRole: 'Directeur Général', action: 'validate', actionLabel: 'a visé et scellé électroniquement', targetTitle: 'Convention_Cadre_Interministerielle_v2.pdf', targetType: 'Archive Certifiée', timeAgo: 'Il y a 45 minutes' },
  { id: 'act-3', userName: 'Christian LUKUSA', userRole: 'Administrateur IAM', action: 'member_join', actionLabel: 'a accordé le rôle Collaborateur à', targetTitle: 'Marc LEROY (Direction Financière)', targetType: 'Habilitation', timeAgo: 'Il y a 2 heures' },
  { id: 'act-4', userName: 'Alain BOKETSU', userRole: 'Ingénieur Systèmes', action: 'edit', actionLabel: 'a mis à jour les métadonnées de la série', targetTitle: 'Fonds_Historique_Archives_Limete_Lot04', targetType: 'Série Documentaire', timeAgo: 'Hier à 16:30' },
  { id: 'act-5', userName: 'Thomas KANKU', userRole: 'Responsable Juridique', action: 'security', actionLabel: 'a vérifié la conformité juridique du versement', targetTitle: 'Acte_Reglementaire_DG_2026_09.pdf', targetType: 'Contrôle Légal', timeAgo: 'Le 24/09/2026' },
];
