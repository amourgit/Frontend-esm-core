import {
  Globe,
  Radio,
  Users,
  User,
  ShieldCheck,
  Lock,
  FileText,
  Settings,
  Zap,
  Search,
  FolderOpen,
  CirclePlus,
  Star,
  Bookmark,
  Compass,
  SlidersHorizontal,
  Sparkles,
  Layers,
  Briefcase,
  CalendarCheck,
  HelpCircle,
  FileCheck,
  HardDrive,
  ShieldAlert,
  BookOpen,
  Megaphone,
  Bell,
  Calendar,
  Newspaper,
  Building2,
  Key,
  UserCheck,
  CheckSquare,
  Grid,
  Activity,
  Shield,
  Info,
  HelpCircle as HelpIcon,
  Share2,
  Contact,
  UserPlus,
  FileSearch,
  Library,
  Archive,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { type Workspace } from '../types/workspace';
import { INTRANET_APPS_MOCK } from './intranetAppsMock';

export const WORKSPACES_MOCK_DATA: Workspace[] = [
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
    navItems: [
      {
        id: 1,
        label: 'Accueil',
        link: '/',
      },
      {
        id: 2,
        label: 'Informations',
        link: '/informations',
        subMenus: [
          {
            title: 'News et Publications',
            items: [
              {
                label: 'À la Une',
                description: 'Les grands titres, reportages et actualités phares',
                icon: Star,
                link: '/informations/news',
              },
              {
                label: 'Articles & Dossiers',
                description: "Analyses de fond, retours d'expérience et tribunes",
                icon: BookOpen,
                link: '/informations/news',
              },
              {
                label: 'Toutes les Publications',
                description: 'Flux complet des publications internes',
                icon: Newspaper,
                link: '/informations/news',
              },
              {
                label: 'Revue de Presse',
                description: 'Veille médiatique, secteur public et écosystème',
                icon: Globe,
                link: '/informations/news',
              },
            ],
          },
          {
            title: 'Annonces',
            items: [
              {
                label: 'Salle des Annonces',
                description: "Tableau officiel d'affichage et communiqués",
                icon: Megaphone,
                link: '/informations/annonces',
              },
              {
                label: 'Communiqués Officiels',
                description: 'Notes de la Direction et décrets institutionnels',
                icon: FileCheck,
                link: '/informations/annonces',
              },
              {
                label: 'Flash Info Entreprise',
                description: 'Alertes prioritaires et alertes météo / sécurité',
                icon: Radio,
                link: '/informations/annonces',
              },
              {
                label: 'Directives & Circulaires',
                description: 'Instructions de service et règlements internes',
                icon: FileText,
                link: '/informations/annonces',
              },
            ],
          },
          {
            title: 'Agenda',
            items: [
              {
                label: "Calendrier d'Équipe",
                description: 'Planning partagé et réunions de travail',
                icon: CalendarCheck,
                link: '/informations/agenda',
              },
              {
                label: 'Événements & Séminaires',
                description: 'Conférences, salons, webinaires et ateliers',
                icon: Calendar,
                link: '/informations/agenda',
              },
              {
                label: 'Réservation de Salles',
                description: 'Salles de conférence, visioconférences et véhicules',
                icon: Compass,
                link: '/informations/agenda',
              },
              {
                label: 'Jalons & Comités',
                description: 'Comités de pilotage et échéances réglementaires',
                icon: Zap,
                link: '/informations/agenda',
              },
            ],
          },
        ],
      },
      {
        id: 3,
        label: 'Sites',
        link: '/sites',
        subMenus: [
          {
            title: 'Membres',
            items: [
              {
                label: 'Annuaire des Collaborateurs',
                description: 'Recherche de contacts, emails, postes et numéros',
                icon: Users,
                link: '/annuaire',
              },
              {
                label: 'Organigramme & Équipes',
                description: 'Structure hiérarchique, directions et pôles',
                icon: Layers,
                link: '/annuaire',
              },
              {
                label: 'Nouveaux Arrivants',
                description: 'Intégration, trombinoscope et parrainages',
                icon: UserPlus,
                link: '/annuaire',
              },
            ],
          },
          {
            title: 'Applications',
            items: [
              {
                label: 'Catalogue des Applications',
                description: "Accès à toutes les solutions numériques de l'organisation",
                icon: Grid,
                link: '/applications',
              },
              {
                label: 'EGEN GED Documents',
                description: 'Gestion Électronique des Documents & Archives',
                icon: FolderOpen,
                link: '/ged',
              },
              {
                label: 'EGEN IAM Sécurité',
                description: 'Gestion des identités, droits et accès',
                icon: ShieldCheck,
                link: '/iam',
              },
              {
                label: 'EGEN Calendrier & Événements',
                description: 'Planification collaborative et réunions',
                icon: Calendar,
                link: '/informations/agenda',
              },
            ],
          },
          {
            title: 'Ressources',
            items: [
              {
                label: 'Base Documentaire & Guides',
                description: 'Guides méthodologiques et procédures métiers',
                icon: Library,
                link: '/ged',
              },
              {
                label: 'Modèles & Formulaires',
                description: 'Modèles de courriers, bordereaux types et fiches',
                icon: FileText,
                link: '/ged',
              },
              {
                label: 'Charte Graphique & Logos',
                description: 'Kits de communication et éléments de marque',
                icon: Sparkles,
                link: '/informations/news',
              },
            ],
          },
          {
            title: 'Informations',
            items: [
              {
                label: 'Procédures de Site',
                description: 'Circuits de validation et démarches administratives',
                icon: Info,
                link: '/sites',
              },
              {
                label: 'FAQ & Assistance Interne',
                description: 'Questions fréquentes et tickets de support informatique',
                icon: HelpIcon,
                link: '/sites',
              },
              {
                label: 'Santé, Sécurité & RH',
                description: "Consignes de sécurité au travail et numéros d'urgence",
                icon: ShieldAlert,
                link: '/sites',
              },
            ],
          },
          {
            title: 'Mes tâches',
            items: [
              {
                label: 'Toutes mes Tâches',
                description: 'Tâches et livrables assignés dans vos espaces',
                icon: CheckSquare,
                link: '/sites/taches',
              },
              {
                label: 'Tâches en Cours',
                description: "Actions prioritaires et délais d'exécution",
                icon: Zap,
                link: '/sites/taches',
              },
              {
                label: 'Tâches Validées',
                description: 'Historique des livrables et revues terminées',
                icon: CheckCircle2,
                link: '/sites/taches',
              },
            ],
          },
          {
            title: 'Activité',
            items: [
              {
                label: "Flux d'Activité du Site",
                description: 'Journal en temps réel des versements et éditions',
                icon: Activity,
                link: '/sites/activite',
              },
              {
                label: 'Audit & Événements',
                description: 'Historique complet des actions des membres',
                icon: ShieldCheck,
                link: '/sites/activite',
              },
            ],
          },
          {
            title: 'Paramètres',
            items: [
              {
                label: 'Configuration du Site',
                description: "Gestion des options générales et de l'espace",
                icon: Settings,
                link: '/sites/parametres',
              },
              {
                label: 'Droits & Rôles Alfresco',
                description: 'Permissions des membres et des collaborateurs',
                icon: Key,
                link: '/sites/parametres',
              },
            ],
          },
        ],
      },
      {
        id: 35,
        label: 'Collaboration',
        link: '/collaboration',
        subMenus: [
          {
            title: 'Discussions Directes',
            items: [
              {
                label: 'Messages Récents',
                description: 'Conversations 1-à-1 avec les collaborateurs',
                icon: MessageSquare,
                link: '/collaboration',
              },
              {
                label: 'Tous les Collaborateurs',
                description: "Démarrer un chat avec n'importe quel membre",
                icon: Users,
                link: '/collaboration',
              },
            ],
          },
          {
            title: 'Groupes de Sites',
            items: [
              {
                label: 'Groupes de votre Site',
                description: 'Salons et canaux de discussion de votre espace',
                icon: Building2,
                link: '/collaboration',
              },
              {
                label: 'Canaux de Projet',
                description: 'Équipes techniques et groupes membres',
                icon: Layers,
                link: '/collaboration',
              },
            ],
          },
        ],
      },
      {
        id: 4,
        label: 'Recherche',
        link: '/recherche',
        subMenus: [
          {
            title: 'Moteurs de Recherche',
            items: [
              {
                label: 'Recherche Globale Intranet',
                description: 'Index complet actualités, annonces, personnes et documents',
                icon: Search,
                link: '/recherche',
              },
              {
                label: 'Recherche GED & Archives',
                description: 'Recherche avancée par métadonnées, cotes et séries',
                icon: FileSearch,
                link: '/ged/recherche',
              },
              {
                label: 'Recherche de Contacts',
                description: 'Trouver un collègue par nom, site ou compétence',
                icon: Contact,
                link: '/annuaire',
              },
            ],
          },
          {
            title: 'Filtres Rapides',
            items: [
              {
                label: 'Documents Récents',
                description: 'Derniers fichiers consultés et modifiés',
                icon: FolderOpen,
                link: '/ged',
              },
              {
                label: 'Bordereaux en Cours',
                description: 'Bordereaux de versement et élimination actifs',
                icon: Zap,
                link: '/suivi',
              },
              {
                label: 'Archives Validées',
                description: 'Documents officiellement scellés et classés',
                icon: Archive,
                link: '/ged',
              },
            ],
          },
        ],
      },
      {
        id: 5,
        label: 'Annuaire',
        link: '/annuaire',
        subMenus: [
          {
            title: 'Collaborateurs',
            items: [
              {
                label: 'Tous les Contacts',
                description: 'Recherche par nom, poste, email et téléphone',
                icon: Contact,
                link: '/annuaire',
              },
              {
                label: 'Organigramme',
                description: 'Structure hiérarchique et directions',
                icon: Layers,
                link: '/annuaire',
              },
              {
                label: 'Trombinoscope',
                description: 'Photos et profils des équipes',
                icon: Users,
                link: '/annuaire',
              },
              {
                label: 'Nouveaux Arrivants',
                description: "Dernières intégrations dans l'organisation",
                icon: UserPlus,
                link: '/annuaire',
              },
            ],
          },
          {
            title: 'Structures & Sites',
            items: [
              {
                label: 'Pôles & Directions',
                description: 'Départements administratifs et opérationnels',
                icon: Building2,
                link: '/annuaire',
              },
              {
                label: 'Sites & Immeubles',
                description: 'Adresses des bureaux et salles de réunion',
                icon: Globe,
                link: '/annuaire',
              },
              {
                label: 'Permanences & Astreintes',
                description: "Contacts de garde et numéros d'urgence",
                icon: ShieldAlert,
                link: '/annuaire',
              },
            ],
          },
        ],
      },
      {
        id: 6,
        label: 'Administration',
        link: '/administration',
        subMenus: [
          {
            title: 'Accès & Identités (IAM)',
            items: [
              {
                label: 'Gestion des Utilisateurs',
                description: 'Création, modification et désactivation des comptes',
                icon: UserCheck,
                link: '/iam',
              },
              {
                label: 'Rôles & Groupes de Sécurité',
                description: 'Matrice des permissions et droits granulaires',
                icon: Lock,
                link: '/iam',
              },
              {
                label: 'Politiques de Sécurité',
                description: 'Règles de mots de passe, sessions et 2FA',
                icon: Shield,
                link: '/iam',
              },
            ],
          },
          {
            title: 'Système & Traçabilité',
            items: [
              {
                label: "Journaux d'Audit",
                description: 'Traçabilité complète des versements et consultations',
                icon: FileText,
                link: '/administration',
              },
              {
                label: 'Configuration Globale',
                description: 'Paramètres serveurs, connecteurs et stockage',
                icon: Settings,
                link: '/administration',
              },
              {
                label: 'Circuits de Validation',
                description: 'Workflows de validation de versements et éliminations',
                icon: Layers,
                link: '/administration',
              },
            ],
          },
        ],
      },
    ],
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
    navItems: [
      {
        id: 1,
        label: 'Accueil',
        link: '/',
      },
      {
        id: 2,
        label: 'Projets Partenaires',
        subMenus: [
          {
            title: 'Suivi Collaboratif',
            items: [
              {
                label: 'Livrables Partagés',
                description: 'Consulter les livrables déposés par les partenaires',
                icon: FileCheck,
                link: '/informations/news',
              },
              {
                label: 'Planning Inter-entreprises',
                description: 'Calendrier des jalons et réunions de suivi',
                icon: CalendarCheck,
                link: '/informations/agenda',
              },
            ],
          },
        ],
      },
      {
        id: 3,
        label: 'Dépôts Sécurisés',
        subMenus: [
          {
            title: 'Échanges de Fichiers',
            items: [
              {
                label: 'Déposer un Document',
                description: 'Téléverser des bordereaux et contrats certifiés',
                icon: CirclePlus,
                link: '/ged/scanner',
              },
              {
                label: 'Historique des Transferts',
                description: 'Journal des réceptions et envois externes',
                icon: HardDrive,
                link: '/ged',
              },
            ],
          },
        ],
      },
      {
        id: 4,
        label: 'Support Extranet',
        subMenus: [
          {
            title: 'Assistance',
            items: [
              {
                label: 'Ouvrir un Ticket',
                description: 'Support technique pour les comptes partenaires',
                icon: HelpCircle,
                link: '/informations/annonces',
              },
              {
                label: 'Guide de Sécurité & RGPD',
                description: 'Consignes de confidentialité et conformité',
                icon: ShieldAlert,
                link: '/informations/annonces',
              },
            ],
          },
        ],
      },
    ],
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
    navItems: [
      {
        id: 1,
        label: 'Accueil',
        link: '/',
      },
      {
        id: 2,
        label: 'Publications & Presse',
        subMenus: [
          {
            title: 'Informations Publiques',
            items: [
              {
                label: 'Communiqués de Presse',
                description: 'Annonces publiques et déclarations officielles',
                icon: FileText,
                link: '/informations/news',
              },
              {
                label: 'Événements Publics',
                description: 'Agenda des réunions et conférences ouvertes',
                icon: CalendarCheck,
                link: '/informations/agenda',
              },
            ],
          },
        ],
      },
      {
        id: 3,
        label: 'Actes & Transparence',
        subMenus: [
          {
            title: 'Documents Ouverts',
            items: [
              {
                label: 'Registres Publics',
                description: 'Consultation libre des délibérations et arrêtés',
                icon: BookOpen,
                link: '/ged',
              },
              {
                label: 'Rapports Annuels',
                description: "Bilan d'activité et publications réglementaires",
                icon: FileCheck,
                link: '/ged',
              },
            ],
          },
        ],
      },
    ],
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
    navItems: [
      {
        id: 1,
        label: 'Accueil',
        link: '/',
      },
      {
        id: 2,
        label: 'Coffre-fort Privé',
        subMenus: [
          {
            title: 'Stockage Sécurisé',
            items: [
              {
                label: 'Mes Documents Personnels',
                description: 'Fichiers confidentiels, attestations et contrats',
                icon: Lock,
                link: '/ged',
              },
              {
                label: 'Mes Notes & Pense-bêtes',
                description: 'Espace de rédaction individuel et brouillons',
                icon: FileText,
                link: '/informations/annonces',
              },
            ],
          },
        ],
      },
      {
        id: 3,
        label: 'Mon Compte & Sécurité',
        subMenus: [
          {
            title: 'Paramètres de Profil',
            items: [
              {
                label: 'Authentification & 2FA',
                description: 'Gérer mes clés de sécurité et mots de passe',
                icon: ShieldCheck,
                link: '/iam',
              },
              {
                label: 'Préférences Générales',
                description: 'Langues, notifications et préférences de thème',
                icon: Settings,
                link: '/informations/annonces',
              },
            ],
          },
        ],
      },
    ],
  },
];
