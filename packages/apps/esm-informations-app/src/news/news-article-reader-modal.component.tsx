import React, { useRef } from 'react';
import { AudienceBadge } from '../audience/audience-badge.component';
import { Bookmark, Share2, Check, Clock, Sparkles, Eye, Heart, Tag } from 'lucide-react';
import { CardModal, playXboxSound } from '@egen-civitas/esm-framework';
import { type NewsArticle } from './news-article-card.component';

interface NewsArticleReaderModalProps {
  article: NewsArticle | null;
  isBookmarked: boolean;
  copiedId: string | null;
  onClose: () => void;
  onBookmark: (article: NewsArticle) => void;
  onShare: (article: NewsArticle) => void;
}

export function NewsArticleReaderModal({
  article: articleProp,
  isBookmarked,
  copiedId,
  onClose,
  onBookmark,
  onShare,
}: NewsArticleReaderModalProps) {
  // Conserve le dernier article affiché : le contenu reste monté pendant l'animation de sortie du CardModal.
  const lastArticleRef = useRef<NewsArticle | null>(articleProp);
  if (articleProp) lastArticleRef.current = articleProp;
  const article = articleProp ?? lastArticleRef.current;

  if (!article) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      playXboxSound('back');
      onClose();
    }
  };

  const isCopied = copiedId === article.id;

  return (
    <CardModal
      open={articleProp !== null}
      onOpenChange={handleOpenChange}
      cardVariant="glass"
      animation="scale"
      className="w-full max-w-3xl"
      cardProps={{ contentClassName: '!p-0 overflow-hidden' }}
    >
      <div className="flex flex-col max-h-[90vh] overflow-hidden text-foreground">
        {/* Header Banner Image */}
        <div className="relative h-56 sm:h-72 w-full shrink-0 overflow-hidden bg-card">
          <img
            src={article.image}
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-foreground/20" />

          {/* Banner Overlay Info */}
          <div className="absolute bottom-4 left-5 right-5 text-foreground z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success-500 text-foreground shadow-md mb-2">
              <Sparkles className="w-3 h-3" />
              {article.category}
            </div>
            <AudienceBadge audience={article.audience} className="ml-2 mb-2 align-top" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight drop-shadow-md">{article.title}</h2>
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-foreground">
          {/* Author, Date & Actions Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-foreground/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success-500/20 text-success-500 border border-success-500/30 flex items-center justify-center font-bold text-sm">
                {article.authorAvatar ? (
                  <img
                    src={article.authorAvatar}
                    alt={article.author}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  article.author
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                )}
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">{article.author}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>{article.date}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onBookmark(article)}
                className={`p-2 px-3 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                  isBookmarked
                    ? 'bg-success-500/20 border-success-500/40 text-success-500'
                    : 'border-foreground/15 bg-foreground/5 hover:bg-foreground/10 text-foreground'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>{isBookmarked ? 'Enregistré' : 'Enregistrer'}</span>
              </button>

              <button
                type="button"
                onClick={() => onShare(article)}
                className="p-2 px-3 rounded-xl border border-foreground/15 bg-foreground/5 hover:bg-foreground/10 text-foreground transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-success-500" />
                    <span className="text-success-500">Lien copié</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Partager</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Summary Lead */}
          <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/10">
            <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed italic">
              "{article.summary}"
            </p>
          </div>

          {/* Content Paragraphs */}
          <div className="space-y-4 text-foreground leading-relaxed text-sm sm:text-base">
            {article.content && article.content.length > 0 ? (
              article.content.map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
            ) : (
              <>
                <p>
                  Cette publication s'inscrit dans la feuille de route stratégique de la direction pour la modernisation
                  des processus d'archivage, la numérisation haute sécurité et la gouvernance des données.
                </p>
                <p>
                  Les équipes opérationnelles disposent désormais de flux de travail dématérialisés permettant la
                  traçabilité intégrale des documents avec signature électronique certifiée et archivage probatoire.
                </p>
                <p>
                  Pour toute information complémentaire ou demande d'accompagnement spécifique, n'hésitez pas à
                  contacter le pôle d'assistance Intranet.
                </p>
              </>
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-4 border-t border-foreground/10 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Mots-clés :</span>
              {article.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg bg-foreground/5 border border-foreground/10 text-foreground text-xs flex items-center gap-1"
                >
                  <Tag className="w-3 h-3 text-success-500" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 sm:px-7 bg-foreground/30 border-t border-foreground/10 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">EGEN Intranet &bull; News & Publications</span>
          <button
            type="button"
            onClick={() => {
              playXboxSound('back');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 border border-foreground/15 text-foreground text-xs font-semibold transition-colors cursor-pointer"
          >
            Fermer la lecture
          </button>
        </div>
      </div>
    </CardModal>
  );
}
