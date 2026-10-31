import React, { useRef } from 'react';
import { Bookmark, Share2, Check } from 'lucide-react';
import { CardModal } from '@egen-civitas/esm-framework';
import type { BlogArticle } from './blog-post-card.component';
import styles from './blog-section.scss';

export interface BlogArticleModalProps {
  article: BlogArticle | null;
  isBookmarked: boolean;
  isLinkCopied: boolean;
  onClose: () => void;
  onToggleBookmark: (article: BlogArticle) => void;
  onShare: (article: BlogArticle) => void;
}

export function BlogArticleModal({
  article: articleProp,
  isBookmarked,
  isLinkCopied,
  onClose,
  onToggleBookmark,
  onShare,
}: BlogArticleModalProps) {
  // Conserve le dernier article affiché : le contenu reste monté pendant l'animation de sortie du CardModal.
  const lastArticleRef = useRef<BlogArticle | null>(articleProp);
  if (articleProp) lastArticleRef.current = articleProp;
  const article = articleProp ?? lastArticleRef.current;

  if (!article) return null;

  return (
    <CardModal
      open={articleProp !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      cardVariant="glass"
      animation="scale"
      className="w-full max-w-3xl"
      cardProps={{ contentClassName: '!p-0 overflow-hidden' }}
    >
      <div className={styles.modalLayout}>
        <div className={styles.modalBanner}>
          <img
            src={article.image}
            alt={article.title}
            referrerPolicy="no-referrer"
            className={styles.modalBannerImage}
          />
          <div className={styles.modalBannerGradient} />
          <div className={styles.modalBannerMeta}>
            <span className={styles.modalCategory}>{article.category}</span>
            <h2 className={styles.modalTitle}>{article.title}</h2>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalAuthorRow}>
            <div className={styles.modalAuthorLeft}>
              <div className={styles.modalAvatar}>
                {article.author
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <div className={styles.modalAuthorName}>{article.author}</div>
                <div className={styles.modalAuthorMeta}>
                  <span>{article.date}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" onClick={() => onToggleBookmark(article)} className={styles.modalActionBtn}>
                <Bookmark className={styles.modalActionIcon} fill={isBookmarked ? 'currentColor' : 'none'} />
                <span>{isBookmarked ? 'Enregistré' : 'Enregistrer'}</span>
              </button>
              <button type="button" onClick={() => onShare(article)} className={styles.modalActionBtn}>
                {isLinkCopied ? (
                  <>
                    <Check className={styles.modalActionIconSuccess} />
                    <span className={styles.modalActionSuccessLabel}>Lien copié</span>
                  </>
                ) : (
                  <>
                    <Share2 className={styles.modalActionIcon} />
                    <span>Partager</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className={styles.modalLead}>« {article.description} »</p>

          <div className={styles.modalContent}>
            {article.content?.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <span className={styles.modalFooterLabel}>Accueil &bull; Actualités</span>
          <button type="button" onClick={onClose} className={styles.modalFooterBtn}>
            Fermer la lecture
          </button>
        </div>
      </div>
    </CardModal>
  );
}

export default BlogArticleModal;
