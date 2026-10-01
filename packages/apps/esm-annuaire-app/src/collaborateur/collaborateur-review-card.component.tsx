import React, { useState } from 'react';
import { 
  Star, 
  ExternalLink, 
  Archive, 
  Share2, 
  MoreHorizontal, 
  Check, 
  Copy,
  ChevronDown,
  Eye,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playXboxSound } from '@egen-civitas/esm-framework';

export interface CollaborateurReviewItem {
  id: string;
  orderNumber: string;
  rating: number;
  status: 'Published' | 'Unpublished' | 'Archived';
  itemName: string;
  content: string;
  images?: string[];
  postedDate: string;
  authorName?: string;
  authorAvatar?: string;
}

export interface CollaborateurReviewCardProps {
  key?: React.Key;
  review: CollaborateurReviewItem;
  onArchive?: (id: string) => void;
  onShare?: (review: CollaborateurReviewItem) => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export function CollaborateurReviewCard({
  review,
  onArchive,
  onShare,
  onShowToast,
}: CollaborateurReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isPublished = review.status === 'Published';

  const handleCopyOrderId = () => {
    playXboxSound('select');
    navigator.clipboard?.writeText(review.orderNumber);
    onShowToast?.(`Référence ${review.orderNumber} copiée`, 'success');
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md transition-all shadow-sm">
      
      {/* ── Line 1: Order/Item ID + Stars + Status Pill ── */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        
        {/* Order ID & Star Rating */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyOrderId}
            className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-white hover:text-teal-300 transition-colors group"
            title="Copier la référence"
          >
            <span>{review.orderNumber}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-300" />
          </button>

          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((idx) => (
              <Star
                key={idx}
                className={`w-3.5 h-3.5 ${
                  idx <= review.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-white/10 text-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isPublished
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : 'bg-slate-500/20 text-slate-300 border border-white/15'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPublished ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
            />
            <span>{review.status}</span>
          </span>
        </div>

      </div>

      {/* ── Line 2: Item Name ── */}
      <div className="text-xs sm:text-sm text-slate-300">
        <span className="text-slate-400">Item: </span>
        <span className="text-white/90 font-medium underline-offset-2 hover:underline cursor-pointer">
          {review.itemName}
        </span>
      </div>

      {/* ── Line 3: Review Comment Text ── */}
      <div className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
        <p className="inline">
          {isExpanded || review.content.length <= 150
            ? review.content
            : `${review.content.slice(0, 150)}... `}
        </p>
        {review.content.length > 150 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-amber-400 hover:text-amber-300 font-medium ml-1 underline transition-colors"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* ── Line 4: Attached Photos Gallery (if any) ── */}
      {review.images && review.images.length > 0 && (
        <div className="flex items-center gap-3 pt-1">
          {review.images.map((img, i) => (
            <div
              key={i}
              onClick={() => {
                playXboxSound('select');
                setSelectedImage(img);
              }}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/15 bg-black/40 group cursor-pointer hover:border-white/35 transition-all shadow-sm"
            >
              <img
                src={img}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Line 5: Footer (Posted date, Archive, Share, Options) ── */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400">
        
        {/* Date */}
        <span>Posted on {review.postedDate}</span>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playXboxSound('select');
              onArchive?.(review.id);
              onShowToast?.(`Élément ${review.orderNumber} archivé`, 'info');
            }}
            className="hover:text-white transition-colors"
          >
            Archive
          </button>

          <button
            type="button"
            onClick={() => {
              playXboxSound('select');
              onShare?.(review);
              onShowToast?.(`Lien de ${review.orderNumber} partagé`, 'success');
            }}
            className="hover:text-white transition-colors p-1"
            title="Partager"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onShowToast?.(`Options pour ${review.orderNumber}`, 'info')}
            className="hover:text-white transition-colors p-1"
            title="Plus d'actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Full-view Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Aperçu agrandi"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 text-white text-xs font-semibold backdrop-blur-md border border-white/20 hover:bg-black/90"
              >
                Fermer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
