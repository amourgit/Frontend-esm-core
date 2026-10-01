import React, { useState, useMemo } from 'react';
import { CalendarDays, Calendar, Search, X, FolderTree, Tag, MapPin, Users, Video, Sparkles } from 'lucide-react';
import { ALL_EVENTS } from '../data/events-mock-data';
import { type EventItem } from '../types/events';
import { EventCard } from './event-card.component';
import { EventDetailsModal } from './event-details-modal.component';
import { type AudienceFilter, matchesAudience } from '../audience/audience';
import { playXboxSound } from '@egen-civitas/esm-framework';
import {
  FilterBar,
  useFilterSchema,
  matchesFilters,
  type Filter,
  type FilterSchema,
} from '@egen-civitas/esm-framework';

export const EVENTS_FILTER_SCHEMA: FilterSchema = {
  fields: [
    {
      id: 'category',
      label: 'Catégorie',
      type: 'select',
      icon: <FolderTree className="w-3.5 h-3.5" />,
      options: [
        { value: 'Corporate Event', label: 'Corporate Event' },
        { value: 'Formation', label: 'Formation & Outils' },
        { value: 'Tech & SI', label: 'Tech & SI' },
        { value: 'Comité & Réunion', label: 'Comité & Réunion' },
        { value: 'Environnement & RSE', label: 'Environnement & RSE' },
      ],
    },
    {
      id: 'status',
      label: "Statut d'inscription",
      type: 'select',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      options: [
        { value: 'open', label: 'Inscriptions ouvertes' },
        { value: 'limited', label: 'Places limitées' },
        { value: 'full', label: 'Complet' },
        { value: 'upcoming', label: 'À venir' },
      ],
    },
    {
      id: 'isOnline',
      label: 'En ligne / Hybride',
      type: 'boolean',
      icon: <Video className="w-3.5 h-3.5" />,
    },
    {
      id: 'isoDate',
      label: "Date de l'événement",
      type: 'date',
      icon: <CalendarDays className="w-3.5 h-3.5" />,
    },
    {
      id: 'location',
      label: 'Lieu / Salle',
      type: 'select',
      icon: <MapPin className="w-3.5 h-3.5" />,
      options: [
        { value: 'Bath, England', label: 'Bath, England' },
        { value: 'London, England', label: 'London, England' },
        { value: 'Kinshasa • Salle du Conseil', label: 'Kinshasa • Salle du Conseil' },
        { value: 'Campus Digital • Lab Innovation', label: 'Campus Digital • Lab Innovation' },
        { value: 'Auditorium Central • Paris & Replay', label: 'Auditorium Central • Paris & Replay' },
      ],
    },
    {
      id: 'tags',
      label: 'Mots-clés / Tags',
      type: 'select',
      icon: <Tag className="w-3.5 h-3.5" />,
      options: [
        { value: 'Team Building', label: 'Team Building' },
        { value: 'Séminaire', label: 'Séminaire' },
        { value: 'Corporate', label: 'Corporate' },
        { value: 'Bureautique', label: 'Bureautique' },
        { value: 'Formation', label: 'Formation' },
        { value: 'Productivité', label: 'Productivité' },
        { value: 'Sécurité', label: 'Sécurité' },
        { value: 'RSSI', label: 'RSSI' },
        { value: 'Conformité', label: 'Conformité' },
        { value: 'Innovation', label: 'Innovation' },
        { value: 'Architecture', label: 'Architecture' },
        { value: 'IA', label: 'IA' },
        { value: 'Teams', label: 'Teams' },
        { value: 'Collaboration', label: 'Collaboration' },
        { value: 'Gouvernance', label: 'Gouvernance' },
        { value: 'CODIR', label: 'CODIR' },
        { value: 'GED', label: 'GED' },
        { value: 'Hackathon', label: 'Hackathon' },
        { value: 'RSE', label: 'RSE' },
        { value: 'Climat', label: 'Climat' },
      ],
    },
    {
      id: 'attendeesCount',
      label: 'Participants',
      type: 'number',
      icon: <Users className="w-3.5 h-3.5" />,
    },
  ],
};

export function getEventFieldValue(event: EventItem, fieldId: string): unknown {
  switch (fieldId) {
    case 'category':
      return event.category;
    case 'status':
      return event.status;
    case 'isOnline':
      return !!event.isOnline;
    case 'isoDate':
      return event.isoDate;
    case 'location':
      return event.location;
    case 'tags':
      return event.tags ?? [];
    case 'attendeesCount':
      return event.attendeesCount ?? 0;
    default:
      return undefined;
  }
}

interface EventsSectionProps {
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  className?: string;
  showTitle?: boolean;
  limit?: number;
  initialCategory?: string;
  /** Audience affichée (filtre global de la page Informations). */
  audience?: AudienceFilter;
}

export function EventsSection({
  onShowNotification,
  className = '',
  showTitle = true,
  limit,
  initialCategory = 'All',
  audience = 'all',
}: EventsSectionProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const { fields, onChange: onFiltersChange } = useFilterSchema(EVENTS_FILTER_SCHEMA, filters, setFilters);

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Filter events matching text search & dynamic FilterBar schema
  const filteredEvents = useMemo(() => {
    let result = ALL_EVENTS.filter((ev) => {
      if (!matchesAudience(ev, audience)) return false;

      // 1. Text Search matching
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesLoc = ev.location.toLowerCase().includes(q);
        const matchesDesc = (ev.description || '').toLowerCase().includes(q);
        const matchesSummary = (ev.summary || '').toLowerCase().includes(q);
        const matchesOrganizer = ev.organizer?.name?.toLowerCase().includes(q);
        const matchesTags = ev.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesLoc && !matchesDesc && !matchesSummary && !matchesOrganizer && !matchesTags) {
          return false;
        }
      }

      // 2. Initial category preset if filters are empty
      if (initialCategory && initialCategory !== 'All' && filters.length === 0) {
        if (ev.category !== initialCategory) return false;
      }

      // 3. Dynamic FilterBar criteria evaluation
      return matchesFilters(ev, filters, EVENTS_FILTER_SCHEMA, getEventFieldValue);
    });

    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }, [searchQuery, filters, initialCategory, limit, audience]);

  const handleAddToCalendar = (event: EventItem, e: React.MouseEvent) => {
    playXboxSound('select');
    onShowNotification?.(`Événement « ${event.title} » ajouté à votre agenda personnel.`, 'success');
  };

  const handleResetFilters = () => {
    playXboxSound('select');
    setSearchQuery('');
    setFilters([]);
  };

  return (
    <section aria-label="Section Événements & Agenda" className={`w-full text-foreground transition-all ${className}`}>
      {/* ── 1. Section Header ── */}
      {showTitle && (
        <div className="w-full flex flex-col items-start text-left mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
            <CalendarDays className="w-4 h-4" />
            <span>Événements &amp; Agenda d’Entreprise</span>
          </div>
          <h2 className="font-mono font-bold tracking-tight text-3xl sm:text-4xl text-white leading-tight mt-1">
            Événements à Venir
          </h2>
          <p className="text-slate-300 font-normal text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
            Participez aux séminaires, sessions de formation continue, ateliers d'innovation et réunions
            institutionnelles.
          </p>
          <div className="w-full border-b border-dashed border-white/15 mt-5 mb-2" />
        </div>
      )}

      {/* ── 2. Google-Style Search Bar & FilterBar (Same as News) ── */}
      <div className="w-full flex flex-col space-y-3 pt-1 pb-6">
        {/* Full-width Search Bar */}
        <div className="w-full relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un événement, un lieu, un intervenant, un mot-clé..."
            className="w-full pl-12 pr-12 py-3 rounded-full bg-slate-900/50 hover:bg-slate-900/80 focus:bg-slate-900 border border-white/15 focus:border-emerald-400/80 text-white placeholder-slate-400 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                playXboxSound('select');
                setSearchQuery('');
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dynamic FilterBar Component */}
        <div className="dark w-full pt-0.5">
          <FilterBar
            fields={fields}
            value={filters}
            onChange={onFiltersChange}
            addLabel="Filtrer"
            emptyLabel="Ajouter un filtre"
            clearLabel="Effacer les filtres"
            aria-label="Filtrer les événements"
          />
        </div>
      </div>

      {/* ── 3. Responsive Events Cards Grid (Transparent, No borders) ── */}
      {filteredEvents.length > 0 ? (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEventClick={(ev) => setSelectedEvent(ev)}
              onAddToCalendar={handleAddToCalendar}
            />
          ))}
        </div>
      ) : (
        <div className="w-full py-16 text-center space-y-3 rounded-2xl bg-slate-900/40 border border-white/10">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
          <div className="text-base font-bold text-slate-300">Aucun événement ne correspond à vos critères</div>
          <p className="text-xs text-slate-400">Essayez de modifier votre recherche ou de réinitialiser vos filtres.</p>
          <button
            onClick={handleResetFilters}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* ── 4. Full Details Modal ── */}
      <EventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onShowNotification={onShowNotification}
      />
    </section>
  );
}
