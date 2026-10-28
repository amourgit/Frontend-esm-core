import React, { useMemo, useState } from 'react';
import { Clock, MapPin, Users, Video } from 'lucide-react';
import { Section, SectionAction, SectionGrid } from '@egen-civitas/esm-framework';
import { cx } from '../cards/card-utils';
import { CardTitleButton } from '../cards/card-title-button.component';

// =============================================================================
//  ÉVÉNEMENTS — Agenda de l'organisation (cartes à visuel)
//
//  Source des données d'exemple : esm-informations-app (events-mock-data.ts).
//  Même carte que l'agenda : visuel 16/10, pastille de date, état d'inscription.
// =============================================================================

export type HomeEventStatus = 'open' | 'limited' | 'full' | 'upcoming';

export interface HomeEvent {
  id: string;
  title: string;
  category: string;
  /** Mois abrégé (« Oct »). */
  month: string;
  /** Jour du mois (« 07 »). */
  day: string;
  weekday: string;
  /** Libellé court (« Mer 7 oct »). */
  dateLabel: string;
  startTime: string;
  endTime?: string;
  location: string;
  isOnline: boolean;
  image: string;
  summary: string;
  status: HomeEventStatus;
  attendeesCount: number;
  maxAttendees?: number;
  tags: string[];
}

export interface EventsSectionProps {
  events: HomeEvent[];
  onSelect?: (event: HomeEvent) => void;
  onSeeAll?: () => void;
  /** Nombre maximum de cartes affichées après filtrage. @default 6 */
  limit?: number;
}

type Mode = 'all' | 'onsite' | 'online';

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'all', label: 'Tous' },
  { id: 'onsite', label: 'Présentiel' },
  { id: 'online', label: 'En ligne' },
];

const STATUS_CHIP: Partial<Record<HomeEventStatus, { label: string; className: string }>> = {
  limited: { label: 'Places limitées', className: 'border-amber-400/30 bg-amber-950/80 text-amber-300' },
  full: { label: 'Complet', className: 'border-rose-400/30 bg-rose-950/80 text-rose-300' },
};

function EventCard({ event, onSelect }: { event: HomeEvent; onSelect?: (event: HomeEvent) => void }) {
  const chip = STATUS_CHIP[event.status];
  const time = event.endTime ? `${event.startTime} – ${event.endTime}` : event.startTime;

  return (
    <article className="group relative flex min-w-0 cursor-pointer flex-col rounded-2xl has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-400">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40">
        <img
          src={event.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />

        <div className="absolute bottom-3 left-4 flex flex-col items-start leading-none drop-shadow-md">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-white/95">{event.month}</span>
          <span className="mt-0.5 text-3xl font-extrabold tracking-tight text-white">{event.day}</span>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {event.isOnline ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-950/80 px-2.5 py-1 text-[10px] font-semibold text-sky-300 backdrop-blur-md">
              <Video className="size-3 text-sky-400" />
              Hybride
            </span>
          ) : null}
          {chip ? (
            <span
              className={cx(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md',
                chip.className,
              )}
            >
              {chip.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col pb-2 pt-3.5">
        <span className="truncate font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
          {event.category}
        </span>
        <h3 className="m-0 mt-1 text-base font-bold leading-snug text-white transition-colors group-hover:text-emerald-300">
          <CardTitleButton onClick={() => onSelect?.(event)} className="line-clamp-2">
            {event.title}
          </CardTitleButton>
        </h3>
        <p className="m-0 mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-300/80">{event.summary}</p>

        <div className="mt-3 flex flex-col gap-1 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0 text-emerald-400" />
            <span className="truncate font-medium">
              {event.dateLabel} · {time}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="size-3.5 shrink-0 text-rose-400" />
            <span className="truncate">{event.location}</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Users className="size-3.5 shrink-0 text-sky-400" />
            <span>
              {event.attendeesCount}
              {event.maxAttendees ? ` / ${event.maxAttendees}` : ''} inscrits
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}

export function EventsSection({ events, onSelect, onSeeAll, limit = 6 }: EventsSectionProps) {
  const [mode, setMode] = useState<Mode>('all');
  const filtered = useMemo(
    () => events.filter((event) => mode === 'all' || (mode === 'online' ? event.isOnline : !event.isOnline)),
    [events, mode],
  );
  const shown = filtered.slice(0, limit);

  return (
    <Section
      title="Événements à venir"
      count={events.length}
      actions={MODES.map(({ id, label }) => (
        <SectionAction key={id} size="sm" active={mode === id} onClick={() => setMode(id)}>
          {label}
        </SectionAction>
      ))}
      footer={`${shown.length} événement${shown.length > 1 ? 's' : ''} affiché${shown.length > 1 ? 's' : ''} sur ${filtered.length}`}
      footerActions={
        onSeeAll ? (
          <SectionAction size="sm" variant="outline" onClick={onSeeAll}>
            Voir l’agenda complet →
          </SectionAction>
        ) : undefined
      }
    >
      {shown.length > 0 ? (
        <SectionGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="lg">
          {shown.map((event) => (
            <EventCard key={event.id} event={event} onSelect={onSelect} />
          ))}
        </SectionGrid>
      ) : (
        <p className="m-0 py-8 text-center text-sm text-white/40">Aucun événement pour ce filtre.</p>
      )}
    </Section>
  );
}

export default EventsSection;
