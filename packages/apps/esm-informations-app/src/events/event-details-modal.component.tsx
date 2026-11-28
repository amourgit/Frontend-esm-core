import React, { useRef, useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  CalendarPlus,
  Share2,
  Check,
  ExternalLink,
  Sparkles,
  Download,
} from 'lucide-react';
import { type EventItem } from '../types/events';
import { AudienceBadge } from '../audience/audience-badge.component';
import { CardModal, playXboxSound } from '@egen-civitas/esm-framework';

interface EventDetailsModalProps {
  event: EventItem | null;
  onClose: () => void;
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function EventDetailsModal({ event: eventProp, onClose, onShowNotification }: EventDetailsModalProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [copied, setCopied] = useState(false);

  // Conserve le dernier événement affiché : le contenu reste monté pendant l'animation de sortie du CardModal.
  const lastEventRef = useRef<EventItem | null>(eventProp);
  if (eventProp) lastEventRef.current = eventProp;
  const event = eventProp ?? lastEventRef.current;

  if (!event) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      playXboxSound('back');
      onClose();
    }
  };

  const handleRegister = () => {
    playXboxSound('select');
    setIsRegistered(!isRegistered);
    if (!isRegistered) {
      onShowNotification?.(`Votre participation à « ${event.title} » est confirmée !`, 'success');
    } else {
      onShowNotification?.(`Votre désinscription à « ${event.title} » a été prise en compte.`, 'info');
    }
  };

  const handleCopyLink = () => {
    playXboxSound('select');
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    onShowNotification?.(`Lien de l'événement copié dans le presse-papiers.`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadICS = () => {
    playXboxSound('select');
    // Generate basic iCalendar (.ics) string
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EGEN Intranet//Events//FR',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      `DTSTART:${event.isoDate.replace(/-/g, '')}T${event.startTime.replace(':', '')}00Z`,
      `DTEND:${event.isoDate.replace(/-/g, '')}T${(event.endTime || '18:00').replace(':', '')}00Z`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowNotification?.(`Fichier calendrier (.ics) téléchargé pour ${event.title}.`, 'success');
  };

  return (
    <CardModal
      open={eventProp !== null}
      onOpenChange={handleOpenChange}
      cardVariant="glass"
      animation="scale"
      className="w-full max-w-2xl"
      cardProps={{ contentClassName: '!p-0 overflow-hidden' }}
    >
      <div className="flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar text-foreground">
        {/* Top Banner Image with Date Badge */}
        <div className="relative aspect-[16/8] sm:aspect-[16/7] w-full overflow-hidden shrink-0">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-foreground/30" />

          {/* Overlaid Date Badge */}
          <div className="absolute bottom-4 left-6 flex flex-col items-start leading-none drop-shadow-lg">
            <span className="text-xs font-bold tracking-widest uppercase text-success-500 font-mono">
              {event.month}
            </span>
            <span className="text-4xl sm:text-5xl font-extrabold text-foreground mt-1">{event.day}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-success-500 font-mono">
                {event.category}
              </span>
              <AudienceBadge audience={event.audience} />
              {event.isOnline && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info-500/80 text-info-500 border border-info-500/30">
                  <Video className="w-3 h-3 text-info-500" />
                  <span>Format Hybride / Teams</span>
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 leading-tight">{event.title}</h2>
          </div>

          {/* Meta Grid (Date, Time, Location, Capacity) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/10 text-xs">
            <div className="flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-xl bg-success-500/10 text-success-500">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{event.dateLabel}</div>
                <div className="text-muted-foreground text-[11px]">
                  {event.startTime} - {event.endTime || '17:00'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{event.location}</div>
                <div className="text-muted-foreground text-[11px]">
                  {event.isOnline ? 'Accessible en présentiel et distanciel' : 'Présentiel uniquement'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-xl bg-warning-500/10 text-warning-500">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {event.attendeesCount + (isRegistered ? 1 : 0)} inscrits
                </div>
                <div className="text-muted-foreground text-[11px]">
                  {event.maxAttendees ? `Capacité maximale : ${event.maxAttendees} personnes` : 'Accès libre'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-foreground">
              {event.organizer.avatar ? (
                <img
                  src={event.organizer.avatar}
                  alt={event.organizer.name}
                  className="w-8 h-8 rounded-xl object-cover border border-foreground/10"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  {event.organizer.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-semibold text-foreground">{event.organizer.name}</div>
                <div className="text-muted-foreground text-[11px]">{event.organizer.role || 'Organisateur'}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">
              À propos de l'événement
            </h3>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg text-xs bg-foreground/5 text-foreground border border-foreground/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-foreground/10">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadICS}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Télécharger l'événement pour Outlook / Google Calendar"
              >
                <Download className="w-4 h-4 text-success-500" />
                <span>Exporter (.ics)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground hover:text-foreground font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Partager"
              >
                {copied ? <Check className="w-4 h-4 text-success-500" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'Copié' : 'Partager'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {event.meetingUrl && (
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-info-500/80 hover:bg-info-500/90 text-foreground font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Video className="w-4 h-4" />
                  <span>Lien Teams</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleRegister}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  isRegistered
                    ? 'bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30'
                    : 'bg-success-500 hover:bg-success-500/90 text-primary-foreground shadow-success-500/20'
                }`}
              >
                {isRegistered ? (
                  <>
                    <X className="w-4 h-4" />
                    <span>Se désinscrire</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>S'inscrire à l'événement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </CardModal>
  );
}
