import React from 'react';
import { go } from '../shared/go';
import { EventsSection } from './events-section.component';
import { upcomingEvents } from './events.data';

// Extension du slot `home-sections` : Événements à venir.
export default function EventsSectionExtension() {
  return (
    <EventsSection
      events={upcomingEvents}
      onSelect={(event) => go(`/informations/agenda?event=${event.id}`)}
      onSeeAll={() => go('/informations/agenda')}
    />
  );
}
