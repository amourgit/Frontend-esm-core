import type { BlogArticle } from './blog-post-card.component';

// Source : esm-informations-app (NewsFeedView). Adapté à la forme `BlogArticle` de l'accueil.
export const informationsNews: BlogArticle[] = [
  {
    id: 'news-1',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    author: 'Direction Générale & DSI',
    date: '24 oct. 2026',
    readTime: '3 min',
    title: 'Modernisation du SI Intranet : Lancement du Portail d’Entreprise v2.5',
    description:
      'Déploiement global d’une nouvelle infrastructure micro-services offrant un temps de réponse divisé par trois et une réactivité hors-pair.',
    category: 'Systèmes d’Information',
    content: [
      "Nous avons le plaisir d'annoncer la mise en ligne officielle de la version 2.5 du Portail d'Entreprise. Cette mise à jour majeure marque une étape décisive dans notre trajectoire de transformation numérique.",
      'Conçue sur une architecture distribuée hautement disponible, la nouvelle version garantit un accès instantané aux documents de travail, aux annuaires de services et aux outils de collaboration interne.',
      "Les équipes techniques ont porté une attention toute particulière à l'accessibilité, à la sobriété numérique ainsi qu'à la sécurisation renforcée des accès distants.",
    ],
  },
  {
    id: 'news-2',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    author: 'Ava Mitchell',
    date: '23 oct. 2026',
    readTime: '4 min',
    title: 'Adoption Globale de la Charte Graphique & Design System "EGEN"',
    description:
      'Harmonisation complète des composants d’interface applicative avec la charte dark-glassmorphism et typographies unifiées.',
    category: 'Design Systems',
    content: [
      "Le nouveau Design System EGEN est désormais la référence unique pour l'ensemble des applications web et mobiles de l'organisation.",
      'Grâce à des jetons de design (design tokens) standardisés, les développeurs peuvent assembler des interfaces cohérentes, élégantes et réactives en un temps record.',
      'Une bibliothèque de composants réutilisables est désormais disponible sur le dépôt interne pour toutes les équipes de développement.',
    ],
  },
  {
    id: 'news-3',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    author: 'Comité RSE & Développement Durable',
    date: '18 oct. 2026',
    readTime: '6 min',
    title: 'Bilan Annuel RSE : Objectif Zero Papier & Transition Énergétique 2026',
    description:
      'Réduction de 45% des impressions physiques grâce au déploiement systématique des workflows de signature électronique certifiée.',
    category: 'Environnement & RSE',
    content: [
      "Notre plan d'action RSE porte ses fruits avec une diminution historique de la consommation de papier et une numérisation quasi-totale des processus administratifs.",
      "L'introduction des parapheurs électroniques certifiés a permis d'économiser plus de 12 tonnes de papier sur les douze derniers mois.",
      'Nous poursuivons nos efforts avec le renouvellement du parc informatique vers des équipements reconditionnés à faible empreinte carbone.',
    ],
  },
  {
    id: 'news-4',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
    author: 'Service des Archives Centrales',
    date: '14 oct. 2026',
    readTime: '5 min',
    title: 'Guide d’Organisation des Archives & Nomenclatures Documentaires',
    description:
      'Publication du référentiel méthodologique pour le classement universel des pièces comptables, juridiques et administratives.',
    category: 'Articles & Dossiers',
    content: [
      "La bonne gouvernance de l'information repose sur un plan de classement clair et partagé par l'ensemble des directions opérationnelles.",
      "Ce nouveau manuel pratique définit les règles d'indexation, les durées d'utilité administrative (DUA) et les modalités de versement aux archives définitives.",
      'Des sessions de formation en visioconférence seront organisées dès la semaine prochaine pour accompagner tous les collaborateurs.',
    ],
  },
  {
    id: 'news-5',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    author: 'Direction de la Communication',
    date: '10 oct. 2026',
    readTime: '4 min',
    title: 'Sommet Digital Régional : Présentation de l’Espace Intranet à Kinshasa',
    description:
      'Retour sur la démonstration publique des capacités du portail lors du Forum e-Gouvernement & Transformation Numérique.',
    category: 'Événements & Réseaux',
    content: [
      "Lors du Forum e-Gouvernement qui s'est tenu à Kinshasa, nos équipes ont présenté les avancées de la plateforme Intranet devant un parterre d'experts internationaux.",
      "Les démonstrations en direct ont mis en valeur la souplesse de l'interface, la gestion documentaire intégrée ainsi que les modules de travail collaboratif.",
      "Le projet a été salué comme un modèle d'innovation et d'efficience opérationnelle pour le secteur public.",
    ],
  },
  {
    id: 'news-6',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
    author: 'Ethan Rodriguez',
    date: '5 oct. 2026',
    readTime: '5 min',
    title: 'Inclusion et Accessibilité Numérique : Conformité WCAG 2.1 niveau AAA',
    description:
      'Adaptation systématique des interfaces pour la navigation au clavier, la synthèse vocale et les contrastes dynamiques haute visibilité.',
    category: 'Inclusion & a11y',
    content: [
      "L'accessibilité numérique n'est pas une simple contrainte réglementaire, c'est une exigence fondamentale de respect de la personne et d'utilisabilité universelle.",
      "Toutes les sections de l'Intranet intègrent désormais des balises sémantiques strictes, des zones d'annonce dynamiques pour lecteurs d'écran et un mode de focalisation visuelle à fort contraste.",
      "Des tests réguliers avec des usagers en situation de handicap permettent d'ajuster en continu l'ergonomie applicative.",
    ],
  },
];

// Contenu d'exemple sur le thème de l'écosystème (à remplacer par une vraie source d'actualités).
export const blogArticles: BlogArticle[] = [
  ...informationsNews,
  {
    id: 'article-ged',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
    author: 'Direction des Systèmes d’Information',
    date: '3 sept. 2026',
    readTime: '4 min',
    category: 'GED',
    title: 'La modernisation de la GED entre dans sa phase pilote',
    description:
      'Retour sur les premières salles migrées vers le nouvel archivage électronique et les prochaines étapes.',
    content: [
      'La direction des systèmes d’information a lancé la phase pilote de modernisation de la gestion électronique des documents.',
      'Les premières salles concernées bénéficient déjà d’un archivage plus rapide et d’une recherche par métadonnées.',
    ],
  },
  {
    id: 'article-iam',
    image: 'https://images.unsplash.com/photo-1614064548237-096d5ec9a9a5?w=800&auto=format&fit=crop&q=80',
    author: 'Pôle Sécurité & IAM',
    date: '1 sept. 2026',
    readTime: '3 min',
    category: 'Sécurité',
    title: 'Nouveau protocole de double authentification',
    description: 'Le protocole 2FA est désormais actif pour l’ensemble des comptes administrateurs.',
    content: ['Le pôle Sécurité & IAM déploie progressivement la double authentification sur les comptes sensibles.'],
  },
];
