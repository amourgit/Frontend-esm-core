import type { Audience } from '../audience/audience';

export interface EventOrganizer {
  name: string;
  role?: string;
  avatar?: string;
}

export interface EventItem {
  id: string;
  title: string;
  category: string;
  month: string; // e.g. 'SEP', 'OCT', 'NOV'
  day: string | number; // e.g. '18', '28', '3'
  dateLabel: string; // e.g. 'Sam, 18 Sept, 11:00'
  isoDate: string; // e.g. '2026-09-18'
  startTime: string; // e.g. '11:00'
  endTime?: string; // e.g. '16:30'
  location: string; // e.g. 'Bath, England' or 'Salle Plénière A'
  isOnline?: boolean;
  meetingUrl?: string;
  image: string;
  description: string;
  summary?: string;
  organizer: EventOrganizer;
  attendeesCount: number;
  maxAttendees?: number;
  status: 'open' | 'limited' | 'full' | 'upcoming';
  tags: string[];
  /** À qui l'événement est destiné (interne par défaut). */
  audience?: Audience;
}
