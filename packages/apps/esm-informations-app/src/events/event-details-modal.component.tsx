import React, { useState } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { type EventItem } from '../types/events';
import { AudienceBadge } from '../audience/audience-badge.component';
import { playXboxSound } from '@egen-civitas/esm-framework';

interface EventDetailsModalProps {
  event: EventItem | null;
  onClose: () => void;
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function EventDetailsModal({ event, onClose, onShowNotification }: EventDetailsModalProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!event) return null;

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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar bg-slate-900 border border-white/15 rounded-3xl shadow-2xl text-white z-10 flex flex-col"
        >
          {/* Top Banner Image with Date Badge */}
          <div className="relative aspect-[16/8] sm:aspect-[16/7] w-full overflow-hidden rounded-t-3xl">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-black/40" />

            {/* Close Button */}
            <button
              onClick={() => {
                playXboxSound('back');
                onClose();
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-md transition-all cursor-pointer z-10"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Overlaid Date Badge */}
            <div className="absolute bottom-4 left-6 flex flex-col items-start leading-none drop-shadow-lg">
              <span className="text-xs font-bold tracking-widest uppercase text-emerald-300 font-mono">
                {event.month}
              </span>
              <span className="text-4xl sm:text-5xl font-extrabold text-white mt-1">{event.day}</span>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                  {event.category}
                </span>
                <AudienceBadge audience={event.audience} />
                {event.isOnline && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-300 border border-sky-400/30">
                    <Video className="w-3 h-3 text-sky-400" />
                    <span>Format Hybride / Teams</span>
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 leading-tight">{event.title}</h2>
            </div>

            {/* Meta Grid (Date, Time, Location, Capacity) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">{event.dateLabel}</div>
                  <div className="text-slate-400 text-[11px]">
                    {event.startTime} - {event.endTime || '17:00'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">{event.location}</div>
                  <div className="text-slate-400 text-[11px]">
                    {event.isOnline ? 'Accessible en présentiel et distanciel' : 'Présentiel uniquement'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {event.attendeesCount + (isRegistered ? 1 : 0)} inscrits
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {event.maxAttendees ? `Capacité maximale : ${event.maxAttendees} personnes` : 'Accès libre'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                {event.organizer.avatar ? (
                  <img
                    src={event.organizer.avatar}
                    alt={event.organizer.name}
                    className="w-8 h-8 rounded-xl object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                    {event.organizer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white">{event.organizer.name}</div>
                  <div className="text-slate-400 text-[11px]">{event.organizer.role || 'Organisateur'}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                À propos de l'événement
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-slate-300 border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadICS}
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Télécharger l'événement pour Outlook / Google Calendar"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Exporter (.ics)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Partager"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  <span>{copied ? 'Copié' : 'Partager'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {event.meetingUrl && (
                  <a
                    href={event.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-sky-600/80 hover:bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
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
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
