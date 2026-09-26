import React from 'react';
import { Bookmark } from 'lucide-react';
import styles from './blog-section.scss';

export interface BlogArticle {
  id: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  title: string;
  description: string;
  category: string;
  /** Paragraphes du corps de l'article, affichés dans le modal de lecture. */
  content?: string[];
}

export interface BlogPostCardProps {
  article: BlogArticle;
  isBookmarked: boolean;
  onOpen: (article: BlogArticle) => void;
  onToggleBookmark: (article: BlogArticle, e: React.MouseEvent) => void;
}

export function BlogPostCard({ article, isBookmarked, onOpen, onToggleBookmark }: BlogPostCardProps) {
  return (
    <article onClick={() => onOpen(article)} className={styles.card}>
      <div className={styles.cardImageWrap}>
        <img src={article.image} alt={article.title} loading="lazy" referrerPolicy="no-referrer" className={styles.cardImage} />
        <button
          type="button"
          onClick={(e) => onToggleBookmark(article, e)}
          title={isBookmarked ? 'Retirer des favoris' : "Sauvegarder l'article"}
          className={[styles.bookmarkBtn, isBookmarked ? styles.bookmarkBtnActive : ''].join(' ')}
        >
          <Bookmark className={styles.bookmarkIcon} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span>by {article.author}</span>
          <span className={styles.cardMetaDot}>•</span>
          <span>{article.date}</span>
          <span className={styles.cardMetaDot}>•</span>
          <span>{article.readTime}</span>
        </div>
        <h3 className={styles.cardTitle}>{article.title}</h3>
        <p className={styles.cardDescription}>{article.description}</p>
      </div>
    </article>
  );
}

export default BlogPostCard;
