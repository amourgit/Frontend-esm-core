import React, { useState, useMemo } from 'react';
import { CollaborateurReviewCard, type CollaborateurReviewItem } from './collaborateur-review-card.component';
import { CollaborateurReviewFilterBar } from './collaborateur-review-filter-bar.component';
import { CollaborateurRatingOverview } from './collaborateur-rating-overview.component';
import { CollaborateurAiReviewBanner } from './collaborateur-ai-review-banner.component';

interface CollaborateurReviewListProps {
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export const INITIAL_REVIEWS_DATA: CollaborateurReviewItem[] = [
  {
    id: 'rev-01',
    orderNumber: 'Order-12587',
    rating: 5,
    status: 'Published',
    itemName: 'MacBook Pro 14 inch M1/32GB - Space Gray',
    content: 'I recently upgraded to the MacBook Pro 14 inch with the M1 Pro chip, and it has exceeded my expectations in almost every way. The performance is absolutely stellar, handling dense architectural workflows, video pipelines and container virtualization without breaking a sweat.',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=80'
    ],
    postedDate: 'Dec 4, 2023',
    authorName: 'Alex Carter'
  },
  {
    id: 'rev-02',
    orderNumber: 'Order-12901',
    rating: 4,
    status: 'Unpublished',
    itemName: 'Acer Aspire 5 Spin 14" A5SP14-51MTN',
    content: "I'm impressed. The sleek design and 360-degree hinge make it super versatile. The 14-inch Full HD display is responsive with vibrant colors, and the build quality feels sturdy for mobile productivity across sites.",
    postedDate: 'Nov 18, 2023',
    authorName: 'David Lee'
  },
  {
    id: 'rev-03',
    orderNumber: 'Order-13110',
    rating: 5,
    status: 'Published',
    itemName: 'Dell PowerEdge R750 Enterprise Cloud Server Cluster',
    content: 'Excellente intégration d\'infrastructure GED. Déploiement sans interruption de service, tolérance aux pannes certifiée et synchronisation parfaite avec les serveurs du Datacenter de Limete.',
    images: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=80'
    ],
    postedDate: 'Oct 29, 2023',
    authorName: 'Patrick Ilunga'
  },
  {
    id: 'rev-04',
    orderNumber: 'Order-13422',
    rating: 5,
    status: 'Published',
    itemName: 'Système Haute Disponibilité GED Alfresco Enterprise',
    content: 'Prestation remarquable lors de la revue d\'architecture et de l\'audit de conformité ISO. Grande rigueur documentaire et réactivité exemplaire sur les requêtes techniques.',
    postedDate: 'Sep 14, 2023',
    authorName: 'Sarah Mukendi'
  }
];

export function CollaborateurReviewList({ onShowToast }: CollaborateurReviewListProps) {
  const [reviews, setReviews] = useState<CollaborateurReviewItem[]>(INITIAL_REVIEWS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');

  const filteredReviews = useMemo(() => {
    return reviews.filter(rev => {
      const matchSearch =
        !searchQuery ||
        rev.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rev.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rev.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [reviews, searchQuery]);

  const handleArchive = (id: string) => {
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'Archived' as const } : r))
    );
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* ── 1. AI Review Analysis Banner ── */}
      <CollaborateurAiReviewBanner />

      {/* ── 2. Search & Filter Bar ── */}
      <CollaborateurReviewFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDuration={selectedDuration}
        onDurationChange={setSelectedDuration}
        selectedChannel={selectedChannel}
        onChannelChange={setSelectedChannel}
      />

      {/* ── 3. Rating & Breakdown Overview ── */}
      <CollaborateurRatingOverview score={4.8} totalReviews={82} />

      {/* ── 4. Reviews List ── */}
      <div className="w-full flex flex-col gap-4">
        {filteredReviews.length === 0 ? (
          <div className="w-full py-12 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col items-center justify-center text-center text-slate-400">
            <p className="text-sm">Aucun avis ne correspond à votre recherche.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDuration('all');
                setSelectedChannel('all');
              }}
              className="mt-2 text-xs text-amber-400 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          filteredReviews.map(review => (
            <CollaborateurReviewCard
              key={review.id}
              review={review}
              onArchive={handleArchive}
              onShowToast={onShowToast}
            />
          ))
        )}
      </div>

    </div>
  );
}
