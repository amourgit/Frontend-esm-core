import React, { useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  MapPin,
  Clock,
  Users,
  Video,
  Check,
  Share2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { type EventItem } from '../types/events';
import { AudienceBadge } from '../audience/audience-badge.component';
import { playXboxSound } from '@egen-civitas/esm-framework';

export interface EventCardProps {
  key?: React.Key;
  event: EventItem;
  onEventClick?: (event: EventItem) => void;
  onAddToCalendar?: (event: EventItem, e: React.MouseEvent) => void;
  onShare?: (event: EventItem, e: React.MouseEvent) => void;
  className?: string;
}

export function EventCard({ event, onEventClick, onAddToCalendar, onShare, className = '' }: EventCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCardClick = () => {
    playXboxSound('select');
    onEventClick?.(event);
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playXboxSound('select');
    setIsAdded(true);
    onAddToCalendar?.(event, e);
    setTimeout(() => setIsAdded(false), 2500);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playXboxSound('select');
    setIsCopied(true);
    navigator.clipboard?.writeText(window.location.origin + '/informations/agenda?event=' + event.id);
    onShare?.(event, e);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group relative flex flex-col w-full bg-transparent border-0 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-success-500 rounded-2xl transition-all duration-300 ${className}`}
    >
      {/* ── 1. Image Header with Overlaid Date Badge ── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-card/40 select-none">
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Gradient shadow overlay for date badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent pointer-events-none" />

        {/* Date Badge (Exact SharePoint/Intranet visual match: Month on top, large Day below) */}
        <div className="absolute bottom-3 left-4 flex flex-col items-start leading-none drop-shadow-md">
          <span className="text-[12px] font-bold tracking-wider uppercase text-foreground/95 font-mono">
            {event.month}
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-0.5 font-sans">
            {event.day}
          </span>
        </div>

        {/* Top-Right Badges: Online / Status */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {event.isOnline && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-info-500/80 backdrop-blur-md text-info-500 border border-info-500/30 shadow-md">
              <Video className="w-3 h-3 text-info-500" />
              <span>Hybride</span>
            </span>
          )}
          {event.status === 'limited' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning-500/80 backdrop-blur-md text-warning-500 border border-warning-500/30">
              Places limitées
            </span>
          )}
          {event.status === 'full' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/80 backdrop-blur-md text-destructive border border-destructive/30">
              Complet
            </span>
          )}
        </div>
      </div>

      {/* ── 2. Card Content (Transparent Background, No Borders) ── */}
      <div className="flex flex-col flex-1 pt-3.5 pb-2 text-left">
        {/* Category */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-success-500/90 font-mono">
            {event.category}
          </span>
          <AudienceBadge audience={event.audience} />

          {event.tags && event.tags.length > 0 && (
            <span className="hidden sm:inline-block text-[10px] text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-md">
              {event.tags[0]}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-1 text-base sm:text-lg font-bold text-foreground group-hover:text-success-500 transition-colors line-clamp-2 leading-snug">
          {event.title}
        </h3>

        {/* Description / Summary (Enriched info) */}
        <p className="mt-1.5 text-xs text-foreground/80 line-clamp-2 leading-relaxed">
          {event.summary || event.description}
        </p>

        {/* Date, Time & Location Section */}
        <div className="mt-3 space-y-1 text-xs text-foreground">
          {/* Date & Time */}
          <div className="flex items-center gap-1.5 text-foreground">
            <Clock className="w-3.5 h-3.5 text-success-500 shrink-0" />
            <span className="font-medium">{event.dateLabel}</span>
            {event.endTime && <span className="text-muted-foreground text-[11px]">- {event.endTime}</span>}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-destructive shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Extra Information: Organizer & Attendees */}
        <div className="mt-3 pt-2.5 flex items-center justify-between gap-2 text-xs border-t border-foreground/5">
          {/* Organizer */}
          <div className="flex items-center gap-2 min-w-0">
            {event.organizer.avatar ? (
              <img
                src={event.organizer.avatar}
                alt={event.organizer.name}
                className="w-5 h-5 rounded-full object-cover shrink-0 border border-foreground/10"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-success-500/20 text-success-500 flex items-center justify-center text-[10px] font-bold">
                {event.organizer.name.charAt(0)}
              </div>
            )}
            <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">{event.organizer.name}</span>
          </div>

          {/* Attendees Counter */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span>
              {event.attendeesCount}
              {event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
            </span>
          </div>
        </div>

        {/* ── 3. Bottom Actions (Add to Calendar & Share) ── */}
        <div className="mt-3 flex items-center justify-between pt-1">
          {/* "Add to Calendar" icon button (Exact match from the image) */}
          <button
            type="button"
            onClick={handleCalendarClick}
            title={isAdded ? 'Ajouté à votre agenda !' : 'Ajouter à mon calendrier'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isAdded
                ? 'bg-success-500/20 text-success-500'
                : 'text-foreground hover:text-foreground hover:bg-foreground/10'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 text-success-500" />
                <span className="text-[11px]">Ajouté</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-4 h-4 text-success-500 group-hover:scale-110 transition-transform" />
                <span className="text-[11px]">Ajouter à l'agenda</span>
              </>
            )}
          </button>

          {/* Right Action: Share & Details */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShareClick}
              title="Copier le lien de l'événement"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            <span className="inline-flex items-center text-xs font-semibold text-success-500 group-hover:translate-x-0.5 transition-transform ml-1">
              <span>Détails</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
