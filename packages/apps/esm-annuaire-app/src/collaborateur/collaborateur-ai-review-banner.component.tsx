import React from 'react';
import { Sparkles, MessageSquareQuote, CheckCircle, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface CollaborateurAiReviewBannerProps {
  title?: string;
  description?: string;
  onShowDetails?: () => void;
}

export function CollaborateurAiReviewBanner({
  title = "Customer are satisfied",
  description = "The customer was satisfied with the product, noting its quality, durability, and quick, helpful support.",
  onShowDetails
}: CollaborateurAiReviewBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full relative rounded-2xl border border-purple-400/25 bg-gradient-to-r from-purple-500/10 via-purple-600/5 to-fuchsia-500/10 backdrop-blur-md p-4 sm:p-5 flex items-center justify-between gap-4 overflow-hidden shadow-lg select-none"
    >
      {/* Background soft ambient glow */}
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left content: Badge + Title + Description */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 min-w-0 z-10">
        
        {/* AI Review Analysis Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-semibold shadow-sm shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
          <span>AI Review Analysis</span>
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight leading-snug">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mt-0.5 max-w-2xl">
            {description}
          </p>
        </div>
      </div>

      {/* Right Icon Widget (Purple badge with quote / thumbs up) */}
      <div className="shrink-0 z-10 hidden sm:flex">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/35 flex items-center justify-center text-purple-200 shadow-md backdrop-blur-md">
          <MessageSquareQuote className="w-6 h-6 text-purple-300" />
        </div>
      </div>
    </motion.div>
  );
}
