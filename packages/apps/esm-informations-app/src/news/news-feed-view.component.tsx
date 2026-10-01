import React, { useState, useMemo } from 'react';
import { Newspaper, Search, X, FolderTree, Tag as TagIcon, User, Sparkles, Eye, Heart } from 'lucide-react';
import { playXboxSound } from '@egen-civitas/esm-framework';
import { NewsArticleCard, type NewsArticle } from './news-article-card.component';
import { NewsArticleReaderModal } from './news-article-reader-modal.component';
import { type AudienceFilter, matchesAudience } from '../audience/audience';
import {
  FilterBar,
  useFilterSchema,
  matchesFilters,
  type Filter,
  type FilterSchema,
} from '@egen-civitas/esm-framework';

export const ALL_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news-1',
    audience: 'interne',
    title: 'Modernisation du SI Intranet : Lancement du Portail d’Entreprise v2.5',
    category: 'Systèmes d’Information',
    date: 'Aujourd’hui',
    readTime: '3 min',
    summary:
      'Déploiement global d’une nouvelle infrastructure micro-services offrant un temps de réponse divisé par trois et une réactivité hors-pair.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    author: 'Direction Générale & DSI',
    authorRole: 'DSI Intranet',
    featured: true,
    viewsCount: 1420,
    likesCount: 230,
    tags: ['Intranet', 'SI', 'Performances', 'Cloud'],
    content: [
      "Nous avons le plaisir d'annoncer la mise en ligne officielle de la version 2.5 du Portail d'Entreprise. Cette mise à jour majeure marque une étape décisive dans notre trajectoire de transformation numérique.",
      'Conçue sur une architecture distribuée hautement disponible, la nouvelle version garantit un accès instantané aux documents de travail, aux annuaires de services et aux outils de collaboration interne.',
      "Les équipes techniques ont porté une attention toute particulière à l'accessibilité, à la sobriété numérique ainsi qu'à la sécurisation renforcée des accès distants.",
    ],
  },
  {
    id: 'news-2',
    audience: 'interne',
    title: 'Adoption Globale de la Charte Graphique & Design System "EGEN"',
    category: 'Design Systems',
    date: 'Hier',
    readTime: '4 min',
    summary:
      'Harmonisation complète des composants d’interface applicative avec la charte dark-glassmorphism et typographies unifiées.',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    author: 'Ava Mitchell',
    authorRole: 'Lead UI/UX Designer',
    featured: true,
    viewsCount: 980,
    likesCount: 145,
    tags: ['UI/UX', 'Design System', 'Glassmorphism'],
    content: [
      "Le nouveau Design System EGEN est désormais la référence unique pour l'ensemble des applications web et mobiles de l'organisation.",
      'Grâce à des jetons de design (design tokens) standardisés, les développeurs peuvent assembler des interfaces cohérentes, élégantes et réactives en un temps record.',
      'Une bibliothèque de composants réutilisables est désormais disponible sur le dépôt interne pour toutes les équipes de développement.',
    ],
  },
  {
    id: 'news-3',
    audience: 'public',
    title: 'Bilan Annuel RSE : Objectif Zero Papier & Transition Énergétique 2026',
    category: 'Environnement & RSE',
    date: '18 Septembre 2026',
    readTime: '6 min',
    summary:
      'Réduction de 45% des impressions physiques grâce au déploiement systématique des workflows de signature électronique certifiée.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    author: 'Comité RSE & Développement Durable',
    authorRole: 'Direction RSE',
    viewsCount: 810,
    likesCount: 112,
    tags: ['RSE', 'Zéro Papier', 'Développement Durable'],
    content: [
      "Notre plan d'action RSE porte ses fruits avec une diminution historique de la consommation de papier et une numérisation quasi-totale des processus administratifs.",
      "L'introduction des parapheurs électroniques certifiés a permis d'économiser plus de 12 tonnes de papier sur les douze derniers mois.",
      'Nous poursuivons nos efforts avec le renouvellement du parc informatique vers des équipements reconditionnés à faible empreinte carbone.',
    ],
  },
  {
    id: 'news-4',
    audience: 'interne',
    title: 'Guide d’Organisation des Archives & Nomenclatures Documentaires',
    category: 'Articles & Dossiers',
    date: '14 Septembre 2026',
    readTime: '5 min',
    summary:
      'Publication du référentiel méthodologique pour le classement universel des pièces comptables, juridiques et administratives.',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
    author: 'Service des Archives Centrales',
    authorRole: 'Conservation & Patrimoine',
    viewsCount: 650,
    likesCount: 95,
    tags: ['GED', 'Archives', 'Nomenclature', 'Normes'],
    content: [
      "La bonne gouvernance de l'information repose sur un plan de classement clair et partagé par l'ensemble des directions opérationnelles.",
      "Ce nouveau manuel pratique définit les règles d'indexation, les durées d'utilité administrative (DUA) et les modalités de versement aux archives définitives.",
      'Des sessions de formation en visioconférence seront organisées dès la semaine prochaine pour accompagner tous les collaborateurs.',
    ],
  },
  {
    id: 'news-5',
    audience: 'public',
    title: 'Sommet Digital Régional : Présentation de l’Espace Intranet à Kinshasa',
    category: 'Événements & Réseaux',
    date: '10 Septembre 2026',
    readTime: '4 min',
    summary:
      'Retour sur la démonstration publique des capacités du portail lors du Forum e-Gouvernement & Transformation Numérique.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    author: 'Direction de la Communication',
    authorRole: 'Relations Publiques',
    viewsCount: 1120,
    likesCount: 178,
    tags: ['Kinshasa', 'Sommet Digital', 'e-Gouvernement'],
    content: [
      "Lors du Forum e-Gouvernement qui s'est tenu à Kinshasa, nos équipes ont présenté les avancées de la plateforme Intranet devant un parterre d'experts internationaux.",
      "Les démonstrations en direct ont mis en valeur la souplesse de l'interface, la gestion documentaire intégrée ainsi que les modules de travail collaboratif.",
      "Le projet a été salué comme un modèle d'innovation et d'efficience opérationnelle pour le secteur public.",
    ],
  },
  {
    id: 'news-6',
    audience: 'extranet',
    title: 'Inclusion et Accessibilité Numérique : Conformité WCAG 2.1 niveau AAA',
    category: 'Inclusion & a11y',
    date: '05 Septembre 2026',
    readTime: '5 min',
    summary:
      'Adaptation systématique des interfaces pour la navigation au clavier, la synthèse vocale et les contrastes dynamiques haute visibilité.',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
    author: 'Ethan Rodriguez',
    authorRole: 'Expert Accessibilité & UX',
    viewsCount: 620,
    likesCount: 88,
    tags: ['Accessibilité', 'a11y', 'WCAG AAA', 'Inclusion'],
    content: [
      "L'accessibilité numérique n'est pas une simple contrainte réglementaire, c'est une exigence fondamentale de respect de la personne et d'utilisabilité universelle.",
      "Toutes les sections de l'Intranet intègrent désormais des balises sémantiques strictes, des zones d'annonce dynamiques pour lecteurs d'écran et un mode de focalisation visuelle à fort contraste.",
      "Des tests réguliers avec des usagers en situation de handicap permettent d'ajuster en continu l'ergonomie applicative.",
    ],
  },
];

export const NEWS_FILTER_SCHEMA: FilterSchema = {
  fields: [
    {
      id: 'category',
      label: 'Catégorie',
      type: 'select',
      icon: <FolderTree className="w-3.5 h-3.5" />,
      options: [
        { value: 'Systèmes d’Information', label: 'Systèmes d’Information' },
        { value: 'Design Systems', label: 'Design Systems' },
        { value: 'Environnement & RSE', label: 'Environnement & RSE' },
        { value: 'Articles & Dossiers', label: 'Articles & Dossiers' },
        { value: 'Événements & Réseaux', label: 'Événements & Réseaux' },
        { value: 'Inclusion & a11y', label: 'Inclusion & a11y' },
      ],
    },
    {
      id: 'tags',
      label: 'Tags',
      type: 'select',
      icon: <TagIcon className="w-3.5 h-3.5" />,
      options: [
        { value: 'Intranet', label: 'Intranet' },
        { value: 'SI', label: 'SI' },
        { value: 'Performances', label: 'Performances' },
        { value: 'Cloud', label: 'Cloud' },
        { value: 'UI/UX', label: 'UI/UX' },
        { value: 'Design System', label: 'Design System' },
        { value: 'Glassmorphism', label: 'Glassmorphism' },
        { value: 'RSE', label: 'RSE' },
        { value: 'Zéro Papier', label: 'Zéro Papier' },
        { value: 'Développement Durable', label: 'Développement Durable' },
        { value: 'GED', label: 'GED' },
        { value: 'Archives', label: 'Archives' },
        { value: 'Nomenclature', label: 'Nomenclature' },
        { value: 'Normes', label: 'Normes' },
        { value: 'Kinshasa', label: 'Kinshasa' },
        { value: 'Sommet Digital', label: 'Sommet Digital' },
        { value: 'e-Gouvernement', label: 'e-Gouvernement' },
        { value: 'Accessibilité', label: 'Accessibilité' },
        { value: 'a11y', label: 'a11y' },
        { value: 'WCAG AAA', label: 'WCAG AAA' },
        { value: 'Inclusion', label: 'Inclusion' },
      ],
    },
    {
      id: 'author',
      label: 'Auteur',
      type: 'select',
      icon: <User className="w-3.5 h-3.5" />,
      options: [
        { value: 'Direction Générale & DSI', label: 'Direction Générale & DSI' },
        { value: 'Ava Mitchell', label: 'Ava Mitchell' },
        { value: 'Comité RSE & Développement Durable', label: 'Comité RSE & Développement Durable' },
        { value: 'Service des Archives Centrales', label: 'Service des Archives Centrales' },
        { value: 'Direction de la Communication', label: 'Direction de la Communication' },
        { value: 'Ethan Rodriguez', label: 'Ethan Rodriguez' },
      ],
    },
    {
      id: 'featured',
      label: 'À la une',
      type: 'boolean',
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    {
      id: 'viewsCount',
      label: 'Nombre de vues',
      type: 'number',
      icon: <Eye className="w-3.5 h-3.5" />,
    },
    {
      id: 'likesCount',
      label: 'Mentions J’aime',
      type: 'number',
      icon: <Heart className="w-3.5 h-3.5" />,
    },
  ],
};

function getNewsArticleFieldValue(article: NewsArticle, fieldId: string): unknown {
  switch (fieldId) {
    case 'category':
      return article.category;
    case 'tags':
      return article.tags ?? [];
    case 'author':
      return article.author;
    case 'featured':
      return !!article.featured;
    case 'viewsCount':
      return article.viewsCount ?? 0;
    case 'likesCount':
      return article.likesCount ?? 0;
    default:
      return undefined;
  }
}

interface NewsFeedViewProps {
  /** Audience affichée (filtre global de la page Informations). */
  audience?: AudienceFilter;
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function NewsFeedView({ onShowNotification, audience = 'all' }: NewsFeedViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const { fields, onChange: onFiltersChange } = useFilterSchema(NEWS_FILTER_SCHEMA, filters, setFilters);

  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['news-1']);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter articles based on text search & FilterBar criteria
  const filteredArticles = useMemo(() => {
    return ALL_NEWS_ARTICLES.filter((art) => {
      if (!matchesAudience(art, audience)) return false;

      const matchesSearch =
        !searchQuery ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      return matchesFilters(art, filters, NEWS_FILTER_SCHEMA, getNewsArticleFieldValue);
    });
  }, [searchQuery, filters, audience]);

  const handleBookmarkToggle = (article: NewsArticle, e?: React.MouseEvent) => {
    e?.stopPropagation();
    playXboxSound('select');
    const isBookmarked = bookmarkedIds.includes(article.id);
    if (isBookmarked) {
      setBookmarkedIds((prev) => prev.filter((id) => id !== article.id));
      if (onShowNotification) onShowNotification(`Article retiré des favoris.`, 'warning');
    } else {
      setBookmarkedIds((prev) => [...prev, article.id]);
      if (onShowNotification) onShowNotification(`Article sauvegardé dans vos favoris.`, 'success');
    }
  };

  const handleShareArticle = (article: NewsArticle, e?: React.MouseEvent) => {
    e?.stopPropagation();
    playXboxSound('select');
    setCopiedId(article.id);
    navigator.clipboard?.writeText(window.location.href);
    if (onShowNotification) onShowNotification(`Lien de l'article « ${article.title} » copié.`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="w-full flex flex-col space-y-5 text-slate-100 py-1">
      {/* ── 1. Google-Style Search Bar & FilterBar ── */}
      <div className="w-full flex flex-col space-y-3 pt-1 pb-1">
        {/* Full-width Google-like Search Bar */}
        <div className="w-full relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une actualité, un mot-clé, un auteur..."
            className="w-full pl-12 pr-12 py-3 rounded-full bg-slate-900/50 hover:bg-slate-900/80 focus:bg-slate-900 border border-white/15 focus:border-emerald-400/80 text-white placeholder-slate-400 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                playXboxSound('select');
                setSearchQuery('');
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* FilterBar Component */}
        <div className="dark w-full pt-0.5">
          <FilterBar
            fields={fields}
            value={filters}
            onChange={onFiltersChange}
            addLabel="Filtrer"
            emptyLabel="Ajouter un filtre"
            clearLabel="Effacer les filtres"
            aria-label="Filtrer les actualités"
          />
        </div>
      </div>

      {/* ── 2. Single Column Infinite Feed Grid (1 Article per line, 100% width) ── */}
      <div className="w-full flex flex-col space-y-5 sm:space-y-6">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <NewsArticleCard
              key={article.id}
              article={article}
              isBookmarked={bookmarkedIds.includes(article.id)}
              copiedId={copiedId}
              onArticleClick={(art) => {
                playXboxSound('select');
                setSelectedArticle(art);
              }}
              onBookmark={handleBookmarkToggle}
              onShare={handleShareArticle}
            />
          ))
        ) : (
          <div className="w-full py-16 text-center space-y-3 rounded-2xl bg-slate-900/40 border border-white/10">
            <Newspaper className="w-10 h-10 text-slate-500 mx-auto" />
            <div className="text-base font-bold text-slate-300">Aucun article ne correspond à vos critères</div>
            <p className="text-xs text-slate-400">
              Essayez de modifier votre recherche ou de réinitialiser vos filtres.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters([]);
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Full Article Reader Modal ── */}
      <NewsArticleReaderModal
        article={selectedArticle}
        isBookmarked={selectedArticle ? bookmarkedIds.includes(selectedArticle.id) : false}
        copiedId={copiedId}
        onClose={() => setSelectedArticle(null)}
        onBookmark={handleBookmarkToggle}
        onShare={handleShareArticle}
      />
    </div>
  );
}
