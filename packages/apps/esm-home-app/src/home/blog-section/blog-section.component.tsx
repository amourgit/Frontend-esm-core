import React, { useState } from 'react';
import { BlogPostCard, type BlogArticle } from './blog-post-card.component';
import { BlogArticleModal } from './blog-article-modal.component';
import styles from './blog-section.scss';

// =============================================================================
//  BLOG SECTION — Grille d'articles + modal de lecture
//
//  Copié/adapté depuis Civitas-GED (PortalBlogSection.tsx). BUG CORRIGÉ AU
//  PASSAGE : la version d'origine embarquait 6 faux articles de blog
//  génériques (auteurs anglophones fictifs, sujets de design system sans
//  rapport avec CIVITAS) codés EN DUR dans le composant. `articles` est
//  maintenant une prop obligatoire — aucun contenu par défaut n'est fourni.
// =============================================================================

export type { BlogArticle };

export interface BlogSectionProps {
  articles: BlogArticle[];
  onShowToast?: (msg: string, type: 'info' | 'success' | 'warning') => void;
}

export function BlogSection({ articles, onShowToast }: BlogSectionProps) {
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const handleShare = (article: BlogArticle) => {
    setCopiedId(article.id);
    navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
    onShowToast?.(`Lien de l'article « ${article.title} » copié.`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleBookmark = (article: BlogArticle, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarkedIds((prev) => {
      const already = prev.includes(article.id);
      onShowToast?.(
        already ? `Article « ${article.title} » retiré des favoris.` : `Article « ${article.title} » sauvegardé dans vos favoris.`,
        already ? 'warning' : 'success',
      );
      return already ? prev.filter((id) => id !== article.id) : [...prev, article.id];
    });
  };

  return (
    <>
      <div className={styles.grid}>
        {articles.map((article) => (
          <BlogPostCard
            key={article.id}
            article={article}
            isBookmarked={bookmarkedIds.includes(article.id)}
            onOpen={setSelectedArticle}
            onToggleBookmark={handleToggleBookmark}
          />
        ))}
      </div>

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
 *    <HomeSection
 *      title="Actualités"
 *      description="Les dernières publications de l'organisation."
 *    >
 *      <BlogSection articles={articles} onShowToast={showToast} />
 *    </HomeSection>
 *
 *  `articles` : aucune valeur par défaut — fournir une vraie source de
 *  contenu (API, config, ou données statiques propres à l'organisation).
 *  `onShowToast` est optionnel ; sans lui, les actions (favoris, partage)
 *  restent silencieuses mais fonctionnelles.
 * ==========================================================================*/
