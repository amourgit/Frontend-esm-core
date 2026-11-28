import React, { useRef, useState } from 'react';
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
  Maximize2,
} from 'lucide-react';
import { CardModal, playXboxSound } from '@egen-civitas/esm-framework';

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

export function CollaborateurReviewCard({ review, onArchive, onShare, onShowToast }: CollaborateurReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // Garde la dernière image affichée pour que l'animation de sortie du CardModal conserve son contenu.
  const lastImageRef = useRef<string | null>(null);
  if (selectedImage) lastImageRef.current = selectedImage;

  const isPublished = review.status === 'Published';

  const handleCopyOrderId = () => {
    playXboxSound('select');
    navigator.clipboard?.writeText(review.orderNumber);
    onShowToast?.(`Référence ${review.orderNumber} copiée`, 'success');
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] hover:bg-foreground/[0.06] backdrop-blur-md transition-all shadow-sm">
      {/* ── Line 1: Order/Item ID + Stars + Status Pill ── */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        {/* Order ID & Star Rating */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyOrderId}
            className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors group"
            title="Copier la référence"
          >
            <span>{review.orderNumber}</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
          </button>

          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((idx) => (
              <Star
                key={idx}
                className={`w-3.5 h-3.5 ${
                  idx <= review.rating ? 'fill-warning-500 text-warning-500' : 'fill-foreground/10 text-foreground/20'
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
                ? 'bg-success-500/20 text-success-500 border border-success-500/30'
                : 'bg-muted-foreground/20 text-muted-foreground border border-foreground/15'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-success-500' : 'bg-muted-foreground'}`} />
            <span>{review.status}</span>
          </span>
        </div>
      </div>

      {/* ── Line 2: Item Name ── */}
      <div className="text-xs sm:text-sm text-muted-foreground">
        <span className="text-muted-foreground">Item: </span>
        <span className="text-foreground/90 font-medium underline-offset-2 hover:underline cursor-pointer">
          {review.itemName}
        </span>
      </div>

      {/* ── Line 3: Review Comment Text ── */}
      <div className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed">
        <p className="inline">
          {isExpanded || review.content.length <= 150 ? review.content : `${review.content.slice(0, 150)}... `}
        </p>
        {review.content.length > 150 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-warning-500 hover:text-warning-500 font-medium ml-1 underline transition-colors"
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
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-foreground/15 bg-foreground/40 group cursor-pointer hover:border-foreground/35 transition-all shadow-sm"
            >
              <img
                src={img}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-foreground/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Line 5: Footer (Posted date, Archive, Share, Options) ── */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-foreground/10 text-xs text-muted-foreground">
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
            className="hover:text-foreground transition-colors"
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
            className="hover:text-foreground transition-colors p-1"
            title="Partager"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onShowToast?.(`Options pour ${review.orderNumber}`, 'info')}
            className="hover:text-foreground transition-colors p-1"
            title="Plus d'actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aperçu image agrandi */}
      <CardModal
        open={selectedImage !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedImage(null);
        }}
        cardVariant="glass"
        animation="zoom"
        className="w-full max-w-2xl"
        cardProps={{ contentClassName: '!p-0 overflow-hidden' }}
      >
        <img
          src={selectedImage ?? lastImageRef.current ?? ''}
          alt="Aperçu agrandi"
          className="w-full max-h-[80vh] object-contain"
        />
      </CardModal>
    </div>
  );
}
