export interface DirectoryEmployee {
  id: string;
  uuid?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  department: string;
  site: string; // Location = Site
  extension: string; // Numéro interne fixe (ex: 987-765-3210)
  phone: string;
  email: string;
  avatar: string;
  coverImage?: string;
  status: 'available' | 'busy' | 'meeting' | 'away' | 'offline';
  statusLabel: string;
  badge?: 'MVP' | 'Business Lead' | 'Admin' | 'HR' | 'Tech Lead' | 'Expert';
  skills: string[];
  group: string;
  bio?: string;
  manager?: string;
  customerSource?: string;
  lastOnline?: string;
  shippingAddress?: string;
  shippingName?: string;
  businessRole?: string;
  rating?: number;
  reviewsCount?: number;
}

export interface DirectorySite {
  id: string;
  name: string;
  city: string;
  address: string;
  employeeCount: number;
}

export const DIRECTORY_SITES: DirectorySite[] = [
  { id: 'site-siege', name: 'Siège Central • Gombe', city: 'Kinshasa', address: 'Boulevard du 30 Juin, Tour EGEN', employeeCount: 14 },
  { id: 'site-limete', name: 'Pôle Numérique & Datacenter', city: 'Limete', address: '7ème Rue Industrielle', employeeCount: 8 },
  { id: 'site-maluku', name: 'Centre Opérationnel & Logistique', city: 'Maluku', address: 'Zone Économique Spéciale', employeeCount: 6 },
  { id: 'site-matadi', name: 'Antenne Portuaire & Transit', city: 'Matadi', address: 'Avenue de la Douane', employeeCount: 4 },
  { id: 'site-lubumbashi', name: 'Direction Régionale Katanga', city: 'Lubumbashi', address: 'Avenue Kasavubu', employeeCount: 5 },
  { id: 'site-goma', name: 'Antenne Grand Kivu', city: 'Goma', address: 'Boulevard Kanyamuhanga', employeeCount: 3 },
];

export const DIRECTORY_DEPARTMENTS = [
  { id: 'all', name: 'Tous', count: 40 },
  { id: 'ged', name: 'Direction GED & Numérique', count: 9 },
  { id: 'dsi', name: 'DSI Central & Infra', count: 8 },
  { id: 'doc', name: 'Gestion Documentaire', count: 6 },
  { id: 'rh', name: 'Ressources Humaines', count: 5 },
  { id: 'finance', name: 'Finance & Comptabilité', count: 4 },
  { id: 'sec-gen', name: 'Secrétariat Général', count: 4 },
  { id: 'juridique', name: 'Affaires Juridiques', count: 4 },
];

export function getEmployeeUuid(emp: DirectoryEmployee): string {
  return emp.uuid || `collab-${emp.id}`;
}

export function getEmployeeCover(emp: DirectoryEmployee): string {
  if (emp.coverImage) return emp.coverImage;
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&auto=format&fit=crop&q=80';
}

export function findEmployeeByParam(idOrUuid: string): DirectoryEmployee | undefined {
  if (!idOrUuid) return undefined;
  const clean = idOrUuid.trim().toLowerCase();
  return DIRECTORY_EMPLOYEES.find(
    (e) =>
      e.id.toLowerCase() === clean ||
      (e.uuid && e.uuid.toLowerCase() === clean) ||
      getEmployeeUuid(e).toLowerCase() === clean
  );
}

export const DIRECTORY_EMPLOYEES: DirectoryEmployee[] = [
  {
    id: 'emp-01',
    uuid: 'c9a1e803-12df-4b51-92b0-81928374a001',
    firstName: 'Amour Samuel',
    lastName: 'NZILA NGALA',
    fullName: 'Amour Samuel NZILA NGALA',
    role: 'Directeur Général de CIVITAS Gabon',
    department: 'Direction Générale',
    site: 'CIVITAS Gabon • Libreville',
    extension: '081-765-3201',
    phone: '+241 77 00 00 01',
    email: 'samuel.nzila@civitas-gabon.com',
    avatar: '/assets/moi-assis.jpg',
    coverImage: '/assets/moi-reunion.png',
    status: 'available',
    statusLabel: 'En ligne',
    badge: 'MVP',
    skills: ['Direction Générale', 'Management Stratégique', 'Transformation Numérique', 'Gouvernance & GED', 'Leadership'],
    group: 'Comité de Direction',
    bio: 'Directeur Général de CIVITAS Gabon. Pilote les orientations stratégiques, la transformation digitale et l\'excellence opérationnelle.',
    manager: 'Conseil d\'Administration',
    customerSource: 'CIVITAS Gabon',
    lastOnline: 'Aujourd\'hui à 11:45',
    shippingName: 'Amour Samuel NZILA NGALA',
    shippingAddress: 'Siège CIVITAS, Libreville, Gabon',
    businessRole: 'Directeur Général',
    rating: 5.0,
    reviewsCount: 150
  },
  {
    id: 'emp-brooklyn',
    uuid: '968579',
    firstName: 'Brooklyn',
    lastName: 'Simmons',
    fullName: 'Brooklyn Simmons',
    role: 'Lead Cloud Architect & Systems Lead',
    department: 'Direction GED & Numérique',
    site: 'Siège Central • Gombe',
    extension: '081-765-3200',
    phone: '+1 233-789-907',
    email: 'bagus.fikri@mail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    badge: 'Tech Lead',
    skills: ['Cloud Architecture', 'Infrastructure GED', 'SecOps', 'High Availability', 'Kubernetes'],
    group: 'Infrastructure & Systèmes',
    bio: 'Lead architecte sur le déploiement des infrastructures distribuées et des plateformes documentaires à haute résilience.',
    manager: 'Amour Samuel NZILA NGALA',
    customerSource: 'Online Store',
    lastOnline: '04 Feb 2024, 13:00',
    shippingName: 'Bagus Fikri',
    shippingAddress: '2118 Thornridge Cir. Syracuse, Connecticut 35624 United States',
    businessRole: 'Business Owner',
    rating: 4.8,
    reviewsCount: 82
  },
  {
    id: 'emp-02',
    firstName: 'Sarah',
    lastName: 'MUKENDI',
    fullName: 'Sarah MUKENDI',
    role: 'Responsable Archivistique Légale',
    department: 'Gestion Documentaire',
    site: 'Siège Central • Gombe',
    extension: '081-765-3202',
    phone: '+243 81 000 0002',
    email: 'sarah.mukendi@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    badge: 'MVP',
    skills: ['Nomenclature ISO 15489', 'Métadonnées Dublin Core', 'Conservation Pérenne', 'Audit Documentaire'],
    group: 'Pôle Conservation & Dématérialisation',
    bio: 'Experte en plans de classement institutionnels, conformité légale et numérisation patrimoniale.',
    manager: 'Amour Samuel NZILA NGALA'
  },
  {
    id: 'emp-03',
    firstName: 'Christian',
    lastName: 'KALONJI',
    fullName: 'Christian KALONJI',
    role: 'Ingénieur Cloud & Sécurité GED',
    department: 'DSI Central & Infra',
    site: 'Pôle Numérique & Datacenter',
    extension: '081-765-3203',
    phone: '+243 81 000 0003',
    email: 'christian.kalonji@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    status: 'meeting',
    statusLabel: 'En réunion',
    badge: 'Tech Lead',
    skills: ['Kubernetes', 'Linux Enterprise', 'Chiffrement AES-256', 'Haute Disponibilité'],
    group: 'Infrastructure & Systèmes',
    bio: 'Supervise les clusters de serveurs, les sauvegardes redondantes et la cyber-résilience de l\'intranet.',
    manager: 'Jean-Luc BIKANGA'
  },
  {
    id: 'emp-04',
    firstName: 'Grace',
    lastName: 'MBAYA',
    fullName: 'Grace MBAYA',
    role: 'Directrice des Ressources Humaines',
    department: 'Ressources Humaines',
    site: 'Siège Central • Gombe',
    extension: '081-765-3204',
    phone: '+243 81 000 0004',
    email: 'grace.mbaya@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    badge: 'HR',
    skills: ['Gestion des Talents', 'Recrutement', 'Formation Continue', 'Relations Sociales'],
    group: 'Comité de Direction',
    bio: 'Supervise l\'ensemble des politiques de développement des compétences, bien-être et accompagnement des équipes.',
    manager: 'Directeur Général'
  },
  {
    id: 'emp-05',
    firstName: 'Patrick',
    lastName: 'ILUNGA',
    fullName: 'Patrick ILUNGA',
    role: 'Contrôleur Financier & Audit',
    department: 'Finance & Comptabilité',
    site: 'Siège Central • Gombe',
    extension: '081-765-3205',
    phone: '+243 81 000 0005',
    email: 'patrick.ilunga@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    status: 'busy',
    statusLabel: 'Occupé',
    badge: 'Business Lead',
    skills: ['Contrôle Budgétaire', 'Audit Interne', 'Normes IFRS', 'ERP Finance'],
    group: 'Pôle Pilotage Budgétaire',
    bio: 'Garant de la conformité comptable, des engagements contractuels et de la modélisation analytique.',
    manager: 'Patricia TSHILOMBA'
  },
  {
    id: 'emp-06',
    firstName: 'Nathalie',
    lastName: 'TSHITENGE',
    fullName: 'Nathalie TSHITENGE',
    role: 'Responsable Communication & Relations',
    department: 'Secrétariat Général',
    site: 'Siège Central • Gombe',
    extension: '081-765-3206',
    phone: '+243 81 000 0006',
    email: 'nathalie.tshitenge@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    skills: ['Communication Interne', 'Relations Publiques', 'Édition Multimédia', 'Protocole'],
    group: 'Pôle Relations & Visibilité',
    bio: 'Diffuse l\'information interne, supervise la rédaction des circulaires et gère le portail intranet.',
    manager: 'Directeur Général'
  },
  {
    id: 'emp-07',
    firstName: 'Aaron',
    lastName: 'CAMPBELL',
    fullName: 'Aaron CAMPBELL',
    role: 'Consultant Sécurité & Intégration',
    department: 'Direction GED & Numérique',
    site: 'Pôle Numérique & Datacenter',
    extension: '081-765-3207',
    phone: '+243 81 000 0007',
    email: 'aaron.campbell@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    skills: ['SSO / OAuth2', 'Active Directory', 'SAML 2.0', 'Audit Vulnérabilités'],
    group: 'Sécurité Numérique',
    bio: 'Conçoit les passerelles de fédération d\'identités et sécurise les échanges intra et inter-sites.',
    manager: 'Amour Samuel NZILA NGALA'
  },
  {
    id: 'emp-08',
    firstName: 'Adele',
    lastName: 'VANCE',
    fullName: 'Adele VANCE',
    role: 'Responsable Opérations Sites & Guichets',
    department: 'Direction GED & Numérique',
    site: 'Centre Opérationnel & Logistique',
    extension: '081-765-3208',
    phone: '+243 81 000 0008',
    email: 'adele.vance@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    status: 'busy',
    statusLabel: 'Occupée',
    badge: 'MVP',
    skills: ['Logistique Documentaire', 'Gestion des Flux', 'Contrôle Qualité', 'Formation Utilisateurs'],
    group: 'Pôle Exploitation & Guichets',
    bio: 'Supervise l\'acheminement physique des dossiers sensibles et la traçabilité des bordereaux.',
    manager: 'Serge KABEYA'
  },
  {
    id: 'emp-09',
    firstName: 'Alex',
    lastName: 'WILBER',
    fullName: 'Alex WILBER',
    role: 'Chargé d\'Animation & Support GED',
    department: 'Gestion Documentaire',
    site: 'Siège Central • Gombe',
    extension: '081-765-3209',
    phone: '+243 81 000 0009',
    email: 'alex.wilber@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    status: 'meeting',
    statusLabel: 'En réunion',
    badge: 'MVP',
    skills: ['Support N2/N3', 'Conduite du Changement', 'Tutoriels Vidéo', 'Indexation OCR'],
    group: 'Support Utilisateurs',
    bio: 'Accompagne les agents municipaux et directeurs dans l\'usage quotidien des casiers et dossiers électroniques.',
    manager: 'Sarah MUKENDI'
  },
  {
    id: 'emp-10',
    firstName: 'Cherri',
    lastName: 'LYNN',
    fullName: 'Cherri LYNN',
    role: 'Ingénieure Qualité Logicielle & DevOps',
    department: 'DSI Central & Infra',
    site: 'Pôle Numérique & Datacenter',
    extension: '081-765-3210',
    phone: '+243 81 000 0010',
    email: 'cherri.lynn@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    skills: ['CI/CD GitHub Actions', 'TypeScript & React', 'Testing Vitest', 'Docker Swarm'],
    group: 'Développement Applicatif',
    bio: 'Maintient la stabilité continue de l\'application intranet, des scripts de synchronisation et des API.',
    manager: 'Christian KALONJI'
  },
  {
    id: 'emp-11',
    firstName: 'Chris',
    lastName: 'GREEN',
    fullName: 'Chris GREEN',
    role: 'Administrateur Systèmes & BDD PostgreSQL',
    department: 'DSI Central & Infra',
    site: 'Pôle Numérique & Datacenter',
    extension: '081-765-3211',
    phone: '+243 81 000 0011',
    email: 'chris.green@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    badge: 'Admin',
    skills: ['PostgreSQL Cluster', 'Solr Search Index', 'Optimisation SQL', 'Backup Réseau'],
    group: 'Systèmes & Bases de Données',
    bio: 'Optimise les performances de recherche plein texte et gère les bases transactionnelles de la GED.',
    manager: 'Jean-Luc BIKANGA'
  },
  {
    id: 'emp-12',
    firstName: 'Christian',
    lastName: 'KELLMAN',
    fullName: 'Christian KELLMAN',
    role: 'Conseiller Juridique & Marchés Publics',
    department: 'Affaires Juridiques',
    site: 'Siège Central • Gombe',
    extension: '081-765-3212',
    phone: '+243 81 000 0012',
    email: 'christian.kellman@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80',
    status: 'away',
    statusLabel: 'En déplacement',
    skills: ['Droit Administratif', 'Contrats Publics', 'Protection Données RGPD', 'Contentieux'],
    group: 'Cellule Juridique & Marchés',
    bio: 'Valide les clauses légales des acquisitions technologiques et assure la sécurité contractuelle.',
    manager: 'Directeur Général'
  },
  {
    id: 'emp-13',
    firstName: 'Chun',
    lastName: 'CONNIFF',
    fullName: 'Chun CONNIFF',
    role: 'Responsable Partenariats & Modernisation',
    department: 'Direction GED & Numérique',
    site: 'Direction Régionale Katanga',
    extension: '081-765-3213',
    phone: '+243 81 000 0013',
    email: 'chun.conniff@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    badge: 'Business Lead',
    skills: ['Gestion Multi-sites', 'Coordination Régionale', 'Plans Stratégiques', 'Audit GED'],
    group: 'Coordination Régionale',
    bio: 'Déploie les processus numériques dans les entités déconcentrées et forme les relais régionaux.',
    manager: 'Amour Samuel NZILA NGALA'
  },
  {
    id: 'emp-14',
    firstName: 'Clara',
    lastName: 'HUPP',
    fullName: 'Clara HUPP',
    role: 'Chargée des Ressources Numériques & Médias',
    department: 'Secrétariat Général',
    site: 'Siège Central • Gombe',
    extension: '081-765-3214',
    phone: '+243 81 000 0014',
    email: 'clara.hupp@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    skills: ['Médiathèque Numérique', 'Graphisme Institutionnel', 'Typographie', 'Publication'],
    group: 'Pôle Relations & Visibilité',
    bio: 'Supervise la banque d\'images institutionnelles, les modèles de documents types et chartes graphiques.',
    manager: 'Nathalie TSHITENGE'
  },
  {
    id: 'emp-15',
    firstName: 'Coretta',
    lastName: 'WATERS',
    fullName: 'Coretta WATERS',
    role: 'Analyste Métier & Workflows Collaboratifs',
    department: 'Direction GED & Numérique',
    site: 'Siège Central • Gombe',
    extension: '081-765-3215',
    phone: '+243 81 000 0015',
    email: 'coretta.waters@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    skills: ['BPMN 2.0', 'Circuits de Validation', 'Signature Électronique', 'Cahiers des Charges'],
    group: 'Pôle Solutions Métier',
    bio: 'Modélise les circuits de visas administratifs, d\'approbation hiérarchique et de scellement électronique.',
    manager: 'Amour Samuel NZILA NGALA'
  },
  {
    id: 'emp-16',
    firstName: 'Cynthia',
    lastName: 'CAREY',
    fullName: 'Cynthia CAREY',
    role: 'Ingénieure Systèmes & Télécoms',
    department: 'DSI Central & Infra',
    site: 'Antenne Portuaire & Transit',
    extension: '081-765-3216',
    phone: '+243 81 000 0016',
    email: 'cynthia.carey@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    skills: ['Liaisons VPN Sécurisées', 'Fibre Optique', 'VoIP Cisco', 'Monitoring Réseau'],
    group: 'Réseaux & Télécommunications',
    bio: 'Maintient la connectivité permanente haut débit entre les sites distants et le datacenter central.',
    manager: 'Christian KALONJI'
  },
  {
    id: 'emp-17',
    firstName: 'Dallas',
    lastName: 'BECKERMAN',
    fullName: 'Dallas BECKERMAN',
    role: 'Coordinateur Support Utilisateurs & Bureautique',
    department: 'DSI Central & Infra',
    site: 'Siège Central • Gombe',
    extension: '081-765-3217',
    phone: '+243 81 000 0017',
    email: 'dallas.beckerman@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    status: 'busy',
    statusLabel: 'Occupé',
    skills: ['Helpdesk ITIL', 'Gestion de Parc', 'Windows 11 Enterprise', 'Déploiement Automatisé'],
    group: 'Assistance Informatique',
    bio: 'Supervise le guichet unique d\'assistance informatique et l\'attribution des postes informatiques.',
    manager: 'Jean-Luc BIKANGA'
  },
  {
    id: 'emp-18',
    firstName: 'Danelle',
    lastName: 'WURTZ',
    fullName: 'Danelle WURTZ',
    role: 'Analyste Conformité & Protection des Données',
    department: 'Affaires Juridiques',
    site: 'Siège Central • Gombe',
    extension: '081-765-3218',
    phone: '+243 81 000 0018',
    email: 'danelle.wurtz@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    skills: ['Audit Sécurité', 'Conformité Données', 'Gestion des Risques', 'Politique de Confidentialité'],
    group: 'Cellule Juridique & Marchés',
    bio: 'Contrôle la stricte conformité des accès aux dossiers confidentiels et l\'application des chartes.',
    manager: 'Christian KELLMAN'
  },
  {
    id: 'emp-19',
    firstName: 'Daniel',
    lastName: 'BELTON',
    fullName: 'Daniel BELTON',
    role: 'Technicien Supérieur Infrastructures & Scanner 3D',
    department: 'Gestion Documentaire',
    site: 'Centre Opérationnel & Logistique',
    extension: '081-765-3219',
    phone: '+243 81 000 0019',
    email: 'daniel.belton@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    skills: ['Scanners Haute Vitesse', 'Calibration OCR', 'Maintenance Numériseurs', 'Indexation'],
    group: 'Pôle Numérisation Massive',
    bio: 'Exploite la chaîne de numérisation industrielle pour convertir les archives physiques en dossiers GED.',
    manager: 'Sarah MUKENDI'
  },
  {
    id: 'emp-20',
    firstName: 'Danika',
    lastName: 'RINGEL',
    fullName: 'Danika RINGEL',
    role: 'Assistante Ressources Humaines & Carrières',
    department: 'Ressources Humaines',
    site: 'Siège Central • Gombe',
    extension: '081-765-3220',
    phone: '+243 81 000 0020',
    email: 'danika.ringel@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    badge: 'HR',
    skills: ['Onboarding Nouveaux Collaborateurs', 'Dossiers du Personnel', 'Gestion des Congés', 'Paie'],
    group: 'Administration du Personnel',
    bio: 'Gère l\'intégration des collaborateurs, les fiches individuelles et l\'accompagnement social.',
    manager: 'Grace MBAYA'
  },
  {
    id: 'emp-21',
    firstName: 'Daren',
    lastName: 'FRIBERG',
    fullName: 'Daren FRIBERG',
    role: 'Contrôleur Budgétaire & Achats Techniques',
    department: 'Finance & Comptabilité',
    site: 'Siège Central • Gombe',
    extension: '081-765-3221',
    phone: '+243 81 000 0021',
    email: 'daren.friberg@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    skills: ['Bons de Commande', 'Validation Fournisseurs', 'Facturation Dématérialisée', 'Trésorerie'],
    group: 'Pôle Pilotage Budgétaire',
    bio: 'Suit les engagements budgétaires des licences logicielles, abonnements et matériel informatique.',
    manager: 'Patrick ILUNGA'
  },
  {
    id: 'emp-22',
    firstName: 'Jean-Luc',
    lastName: 'BIKANGA',
    fullName: 'Jean-Luc BIKANGA',
    role: 'Directeur des Systèmes d\'Information',
    department: 'DSI Central & Infra',
    site: 'Siège Central • Gombe',
    extension: '081-765-3222',
    phone: '+243 81 000 0022',
    email: 'jeanluc.bikanga@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    status: 'meeting',
    statusLabel: 'En réunion',
    badge: 'Admin',
    skills: ['Stratégie SI', 'Gouvernance Entreprise', 'Cybersécurité', 'Budget DSI'],
    group: 'Comité de Direction',
    bio: 'Définit les orientations stratégiques, pilote les grands chantiers technologiques et l\'urbanisation du SI.',
    manager: 'Directeur Général'
  },
  {
    id: 'emp-23',
    firstName: 'Marie-Claire',
    lastName: 'MBUYI',
    fullName: 'Marie-Claire MBUYI',
    role: 'Responsable Recrutement & Mobilité',
    department: 'Ressources Humaines',
    site: 'Direction Régionale Katanga',
    extension: '081-765-3223',
    phone: '+243 81 000 0023',
    email: 'marieclaire.mbuyi@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    skills: ['Sourcing Talents', 'Entretiens Métier', 'GPEC', 'Marque Employeur'],
    group: 'Administration du Personnel',
    bio: 'Coordonne les recrutements techniques et administratifs pour l\'ensemble des délégations régionales.',
    manager: 'Grace MBAYA'
  },
  {
    id: 'emp-24',
    firstName: 'Serge',
    lastName: 'KABEYA',
    fullName: 'Serge KABEYA',
    role: 'Directeur de la Logistique & Moyens Généraux',
    department: 'Direction GED & Numérique',
    site: 'Centre Opérationnel & Logistique',
    extension: '081-765-3224',
    phone: '+243 81 000 0024',
    email: 'serge.kabeya@egen.cd',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    status: 'available',
    statusLabel: 'En ligne',
    skills: ['Logistique Globale', 'Sécurité des Bâtiments', 'Maintenance Patrimoine', 'Gestion de Flotte'],
    group: 'Comité de Direction',
    bio: 'Supervise la maintenance des infrastructures physiques, les accès sécurisés et les parcs logistiques.',
    manager: 'Directeur Général'
  }
];
