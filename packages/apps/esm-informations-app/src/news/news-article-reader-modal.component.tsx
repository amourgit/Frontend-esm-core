import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudienceBadge } from '../audience/audience-badge.component';
import { X, Bookmark, Share2, Check, Clock, Sparkles, Eye, Heart, Tag } from 'lucide-react';
import { playXboxSound } from '@egen-civitas/esm-framework';
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
  article,
  isBookmarked,
  copiedId,
  onClose,
  onBookmark,
  onShare,
}: NewsArticleReaderModalProps) {
  if (!article) return null;

  const isCopied = copiedId === article.id;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl my-auto bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/15 text-white max-h-[90vh]"
        >
          {/* Header Banner Image */}
          <div className="relative h-56 sm:h-72 w-full shrink-0 overflow-hidden bg-slate-950">
            <img
              src={article.image}
              alt={article.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-black/30" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                playXboxSound('back');
                onClose();
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-colors cursor-pointer z-20"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Banner Overlay Info */}
            <div className="absolute bottom-4 left-5 right-5 text-white z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md mb-2">
                <Sparkles className="w-3 h-3" />
                {article.category}
              </div>
              <AudienceBadge audience={article.audience} className="ml-2 mb-2 align-top" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight drop-shadow-md">
                {article.title}
              </h2>
            </div>
          </div>

          {/* Scrollable Article Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-200">
            {/* Author, Date & Actions Bar */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
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
                  <div className="font-semibold text-sm text-white">{article.author}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
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
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'border-white/15 bg-white/5 hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  <span>{isBookmarked ? 'Enregistré' : 'Enregistrer'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onShare(article)}
                  className="p-2 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Lien copié</span>
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
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-sm sm:text-base font-medium text-slate-200 leading-relaxed italic">
                "{article.summary}"
              </p>
            </div>

            {/* Content Paragraphs */}
            <div className="space-y-4 text-slate-300 leading-relaxed text-sm sm:text-base">
              {article.content && article.content.length > 0 ? (
                article.content.map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
              ) : (
                <>
                  <p>
                    Cette publication s'inscrit dans la feuille de route stratégique de la direction pour la
                    modernisation des processus d'archivage, la numérisation haute sécurité et la gouvernance des
                    données.
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
              <div className="pt-4 border-t border-white/10 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Mots-clés :</span>
                {article.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-emerald-400" />
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:px-7 bg-slate-950/80 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">EGEN Intranet &bull; News & Publications</span>
            <button
              type="button"
              onClick={() => {
                playXboxSound('back');
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Fermer la lecture
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
