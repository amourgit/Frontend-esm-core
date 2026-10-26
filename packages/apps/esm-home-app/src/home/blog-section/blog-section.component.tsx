import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Section, SectionAction, SectionGrid } from '@egen-civitas/esm-framework';
import { BlogPostCard, type BlogArticle } from './blog-post-card.component';
import { BlogArticleModal } from './blog-article-modal.component';

// =============================================================================
//  BLOG SECTION — Actualités : section complète (en-tête / grille / pied) + modal de lecture
//
//  Copié/adapté depuis Civitas-GED (PortalBlogSection.tsx). BUG CORRIGÉ AU
//  PASSAGE : la version d'origine embarquait 6 faux articles de blog
//  génériques codés EN DUR dans le composant. `articles` est maintenant une
//  prop obligatoire — aucun contenu par défaut n'est fourni.
//
//  Le composant porte désormais SON en-tête (titre, compteur, filtre
//  « Favoris ») et SON pied (compteur + lien « Toutes les actualités ») via le
//  squelette `Section` du framework : l'appelant ne l'enveloppe plus.
// =============================================================================

export type { BlogArticle };

export interface BlogSectionProps {
  articles: BlogArticle[];
  onShowToast?: (msg: string, type: 'info' | 'success' | 'warning') => void;
  /** Rend le lien « Toutes les actualités » du pied. Absent : pas de lien. */
  onSeeAll?: () => void;
  /** Nombre maximum d'articles affichés. @default 6 */
  limit?: number;
  /** @default 'Actualités' */
  title?: string;
  /** @default "Les dernières publications de l'organisation." */
  description?: string;
}

export function BlogSection({
  articles,
  onShowToast,
  onSeeAll,
  limit = 6,
  title = 'Actualités',
  description = "Les dernières publications de l'organisation.",
}: BlogSectionProps) {
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);

  const handleShare = (article: BlogArticle) => {
    setCopiedId(article.id);
    navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
    onShowToast?.(`Lien de l'article « ${article.title} » copié.`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleBookmark = (article: BlogArticle, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const already = bookmarkedIds.includes(article.id);
    onShowToast?.(
      already
        ? `Article « ${article.title} » retiré des favoris.`
        : `Article « ${article.title} » sauvegardé dans vos favoris.`,
      already ? 'warning' : 'success',
    );
    setBookmarkedIds((prev) => (already ? prev.filter((id) => id !== article.id) : [...prev, article.id]));
  };

  const pool = onlyBookmarks ? articles.filter((article) => bookmarkedIds.includes(article.id)) : articles;
  const shown = pool.slice(0, limit);

  return (
    <>
      <Section
        title={title}
        description={description}
        count={articles.length}
        actions={
          <SectionAction
            size="sm"
            active={onlyBookmarks}
            icon={<Bookmark className="size-3.5" fill={onlyBookmarks ? 'currentColor' : 'none'} />}
            onClick={() => setOnlyBookmarks((prev) => !prev)}
          >
            Favoris{bookmarkedIds.length > 0 ? ` (${bookmarkedIds.length})` : ''}
          </SectionAction>
        }
        footer={`${shown.length} article${shown.length > 1 ? 's' : ''} affiché${shown.length > 1 ? 's' : ''} sur ${pool.length}`}
        footerActions={
          onSeeAll ? (
            <SectionAction size="sm" variant="outline" onClick={onSeeAll}>
              Toutes les actualités →
            </SectionAction>
          ) : undefined
        }
      >
        {shown.length > 0 ? (
          <SectionGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="lg">
            {shown.map((article) => (
              <BlogPostCard
                key={article.id}
                article={article}
                isBookmarked={bookmarkedIds.includes(article.id)}
                onOpen={setSelectedArticle}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </SectionGrid>
        ) : (
          <p className="m-0 py-8 text-center text-sm text-white/40">Aucun article dans vos favoris.</p>
        )}
      </Section>

      <BlogArticleModal
        article={selectedArticle}
        isBookmarked={selectedArticle ? bookmarkedIds.includes(selectedArticle.id) : false}
        isLinkCopied={selectedArticle ? copiedId === selectedArticle.id : false}
        onClose={() => setSelectedArticle(null)}
        onToggleBookmark={handleToggleBookmark}
        onShare={handleShare}
      />
    </>
  );
}

export default BlogSection;

/* ============================================================================
 *  GUIDE D'UTILISATION — BlogSection
 * ============================================================================
 *    <BlogSection
 *      articles={articles}
 *      onShowToast={showToast}
 *      onSeeAll={() => navigate('/informations/news')}
 *    />
 *
 *  `articles` : aucune valeur par défaut — fournir une vraie source de
 *  contenu (API, config, ou données statiques propres à l'organisation).
 *  `onShowToast` et `onSeeAll` sont optionnels.
 * ==========================================================================*/
