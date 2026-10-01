import React from 'react';
import { motion } from 'framer-motion';
import type { Audience } from '../audience/audience';
import { AudienceBadge } from '../audience/audience-badge.component';
import { Clock, Bookmark, Share2, Check, ArrowRight, Eye, Heart, Tag, User, Sparkles } from 'lucide-react';
import { playXboxSound } from '@egen-civitas/esm-framework';

export interface NewsArticle {
  id: string;
  image: string;
  author: string;
  authorRole?: string;
  authorAvatar?: string;
  date: string;
  readTime: string;
  title: string;
  summary: string;
  category: string;
  tags?: string[];
  viewsCount?: number;
  likesCount?: number;
  featured?: boolean;
  content?: string[];
  /** À qui l'article est destiné (interne par défaut). */
  audience?: Audience;
}

export interface NewsArticleCardProps {
  key?: React.Key;
  article: NewsArticle;
  isBookmarked: boolean;
  copiedId: string | null;
  onArticleClick: (article: NewsArticle) => void;
  onBookmark: (article: NewsArticle, e?: React.MouseEvent) => void;
  onShare: (article: NewsArticle, e?: React.MouseEvent) => void;
}

export function NewsArticleCard({
  article,
  isBookmarked,
  copiedId,
  onArticleClick,
  onBookmark,
  onShare,
}: NewsArticleCardProps) {
  const isCopied = copiedId === article.id;

  // Truncate summary text cleanly with ellipsis if needed
  const formattedSummary =
    article.summary && article.summary.length > 150 ? article.summary.slice(0, 150).trim() + '...' : article.summary;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={() => onArticleClick(article)}
      className="group w-full py-4 transition-all duration-300 flex flex-col md:flex-row gap-5 md:gap-6 items-stretch cursor-pointer relative"
    >
      {/* Left Media Thumbnail: Conforms automatically to height driven by right content on desktop */}
      <div className="relative w-full md:w-72 lg:w-80 min-h-[180px] md:min-h-0 md:self-stretch rounded-2xl overflow-hidden shrink-0 bg-black/40 border border-white/10 shadow-lg">
        <img
          src={article.image}
          alt={article.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 z-10 flex flex-col items-start">
          <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wide uppercase bg-emerald-500/90 text-white border border-emerald-400/40 backdrop-blur-md shadow-md flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-100" />
            {article.category}
          </span>
          <AudienceBadge audience={article.audience} className="mt-1.5" />
        </div>

        {/* Quick Bookmark Button on Thumbnail */}
        <button
          type="button"
          onClick={(e) => onBookmark(article, e)}
          title={isBookmarked ? 'Retirer des favoris' : "Enregistrer l'article"}
          className={`absolute top-3 right-3 z-10 p-2 rounded-xl transition-all duration-200 shadow-lg ${
            isBookmarked
              ? 'bg-emerald-500 text-white scale-100'
              : 'bg-black/60 text-slate-200 hover:text-white border border-white/20 backdrop-blur-md opacity-90 group-hover:opacity-100 hover:bg-black/80'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>

        {/* Optional Featured Indicator */}
        {article.featured && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="px-2 py-0.5 rounded bg-amber-500/90 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow">
              À la une
            </span>
          </div>
        )}
      </div>

      {/* Right Main Content: Drives the height of the card */}
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Metadata Header line: Author & Date */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-[9px] shrink-0">
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
              <span className="text-slate-200 font-semibold group-hover:text-emerald-300 transition-colors truncate">
                {article.author}
              </span>
              {article.authorRole && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline truncate">{article.authorRole}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
              <span>{article.date}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {article.readTime}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight leading-snug group-hover:text-emerald-300 transition-colors">
            {article.title}
          </h3>

          {/* Summary / Description: Truncated cleanly with ellipsis (...) */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light line-clamp-2 sm:line-clamp-3">
            {formattedSummary}
          </p>

          {/* Tags list */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 pt-1">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1 shrink-0"
                >
                  <Tag className="w-2.5 h-2.5 text-emerald-400" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions & Stats Bar */}
        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-3 text-xs shrink-0">
          {/* Stats */}
          <div className="flex items-center gap-3.5 text-slate-400 text-[11px]">
            {article.viewsCount !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                {article.viewsCount} vues
              </span>
            )}
            {article.likesCount !== undefined && (
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400/80" />
                {article.likesCount}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => onShare(article, e)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Partager le lien"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px] hidden sm:inline">Copié</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Partager</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playXboxSound('select');
                onArticleClick(article);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Consulter</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
