import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface RatingBreakdownItem {
  stars: number;
  label: string;
  count: number;
  percentage: number;
}

interface CollaborateurRatingOverviewProps {
  score?: number;
  totalReviews?: number;
  breakdown?: RatingBreakdownItem[];
}

export const DEFAULT_RATING_BREAKDOWN: RatingBreakdownItem[] = [
  { stars: 5, label: '5 - Excellent', count: 1220, percentage: 62 },
  { stars: 4, label: '4 - Good', count: 580, percentage: 29 },
  { stars: 3, label: '3 - Okay', count: 160, percentage: 8 },
  { stars: 2, label: '2 - Poor', count: 42, percentage: 2 },
  { stars: 1, label: '1 - Terrible', count: 12, percentage: 1 },
];

export function CollaborateurRatingOverview({
  score = 4.8,
  totalReviews = 82,
  breakdown = DEFAULT_RATING_BREAKDOWN,
}: CollaborateurRatingOverviewProps) {
  return (
    <div className="w-full flex flex-col gap-3 py-3 select-none">
      <h3 className="text-sm font-semibold text-slate-300 tracking-wide">
        Rating
      </h3>

      <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-10">
        
        {/* Left Column: Big 4.8 + 5 Stars + 82 reviews */}
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            {score.toFixed(1)}
          </span>

          <div className="flex flex-col gap-1">
            {/* Stars row */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((idx) => {
                const filled = idx <= Math.floor(score);
                const isPartial = idx === Math.ceil(score) && score % 1 !== 0;
                return (
                  <div key={idx} className="relative">
                    <Star
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        filled
                          ? 'fill-amber-400 text-amber-400'
                          : isPartial
                          ? 'fill-amber-400/60 text-amber-400'
                          : 'fill-white/10 text-white/20'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Total reviews count */}
            <span className="text-xs sm:text-sm text-slate-400">
              {totalReviews} reviews
            </span>
          </div>
        </div>

        {/* Right Column: Rating breakdown bars */}
        <div className="flex-1 w-full max-w-xl flex flex-col gap-2.5">
          {breakdown.slice(0, 3).map((item) => (
            <div key={item.stars} className="flex items-center gap-3 text-xs">
              {/* Star label */}
              <span className="w-24 sm:w-28 text-slate-300 font-medium shrink-0">
                {item.label}
              </span>

              {/* Progress bar (black/dark track with filled indicator) */}
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-slate-900 border-r border-white/20 rounded-full"
                />
              </div>

              {/* Count */}
              <span className="w-12 text-right text-slate-400 font-mono shrink-0">
                {item.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
