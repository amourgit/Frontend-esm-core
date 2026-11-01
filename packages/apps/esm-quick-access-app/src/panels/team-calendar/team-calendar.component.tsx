import React, { useMemo, useState } from 'react';
import { RefreshCw, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import styles from './team-calendar.scss';

// =============================================================================
//  TEAM CALENDAR — Onglets À venir/Passés + pagination (panneau latéral)
//
//  Copié/adapté depuis Civitas-GED (PortalTeamCalendar.tsx). BUGS CORRIGÉS
//  AU PASSAGE :
//  - La pagination ("Previous"/"Next") était purement décorative : le state
//    `page` changeait mais RIEN dans le rendu n'en dépendait — la liste
//    affichée ne bougeait jamais. Elle découpe maintenant réellement les
//    événements par page (`pageSize`).
//  - Le clic sur un événement ignorait l'événement cliqué et naviguait
//    toujours vers la même route fixe. `onSelectEvent` reçoit maintenant le
//    bon événement.
//  - L'onglet "Passés" retournait un unique événement fictif codé en dur ;
//    `pastEvents` est maintenant une vraie prop (vide par défaut).
//  - Système de son Xbox ("playXboxSound") non porté, spécifique à GED.
// =============================================================================

export interface CalendarEventItem {
  id: string;
  month: string;
  day: string;
  weekday: string;
  title: string;
  time: string;
  location?: string;
}

export interface TeamCalendarProps {
  upcomingEvents: CalendarEventItem[];
  pastEvents?: CalendarEventItem[];
  onSelectEvent: (event: CalendarEventItem) => void;
  onRefresh?: () => void;
  /** Nombre d'événements affichés par page. @default 4 */
  pageSize?: number;
}

export function TeamCalendar({ upcomingEvents, pastEvents = [], onSelectEvent, onRefresh, pageSize = 4 }: TeamCalendarProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [page, setPage] = useState(0);

  const allEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;
  const pageCount = Math.max(1, Math.ceil(allEvents.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const events = useMemo(
    () => allEvents.slice(currentPage * pageSize, currentPage * pageSize + pageSize),
    [allEvents, currentPage, pageSize],
  );

  const selectTab = (tab: 'upcoming' | 'past') => {
    setActiveTab(tab);
    setPage(0);
  };

  return (
    <div className={styles.root}>
      <h3 className={styles.heading}>Calendrier d'équipe</h3>

      <div className={styles.tabsRow}>
        <div className={styles.tabs}>
          <button
            type="button"
            onClick={() => selectTab('upcoming')}
            className={[styles.tab, activeTab === 'upcoming' ? styles.tabActive : ''].join(' ')}
          >
            À venir
          </button>
          <button
            type="button"
            onClick={() => selectTab('past')}
            className={[styles.tab, activeTab === 'past' ? styles.tabActive : ''].join(' ')}
          >
            Passés
          </button>
        </div>

        <button type="button" onClick={onRefresh} className={styles.refreshBtn} title="Rafraîchir">
          <RefreshCw className={styles.refreshIcon} />
        </button>
      </div>

      <div className={styles.list}>
        {events.length === 0 && <p className={styles.empty}>Aucun événement.</p>}
        {events.map((ev) => (
          <div key={ev.id} onClick={() => onSelectEvent(ev)} role="button" tabIndex={0} className={styles.eventRow}>
            <div className={styles.dateBlock}>
              <span className={styles.dateMonth}>{ev.month}</span>
              <span className={styles.dateDay}>{ev.day}</span>
              <span className={styles.dateWeekday}>{ev.weekday}</span>
            </div>

            <div className={styles.eventInfo}>
              <h4 className={styles.eventTitle}>{ev.title}</h4>
              <div className={styles.eventMetaRow}>
                <span className={styles.eventMeta}>
                  <Clock className={styles.eventMetaIcon} />
                  {ev.time}
                </span>
              </div>
              {ev.location && (
                <div className={styles.eventMetaRow}>
                  <MapPin className={styles.eventMetaIconMuted} />
                  <span className={styles.eventLocation}>{ev.location}</span>
                </div>
              )}
            </div>

            <div className={styles.eventCalIcon}>
              <CalendarIcon />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.pagination}>
        <button
          type="button"
          disabled={currentPage === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className={styles.pageBtn}
        >
          <ChevronLeft className={styles.pageIcon} />
          <span>Précédent</span>
        </button>
        <span className={styles.pageIndicator}>
          {currentPage + 1} / {pageCount}
        </span>
        <button
          type="button"
          disabled={currentPage >= pageCount - 1}
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          className={styles.pageBtn}
        >
          <span>Suivant</span>
          <ChevronRight className={styles.pageIcon} />
        </button>
      </div>
    </div>
  );
}

export default TeamCalendar;

/* ============================================================================
 *  GUIDE D'UTILISATION — TeamCalendar
 * ============================================================================
 *    <HomeSection as="div" variant="panel" title="Calendrier" bare>
 *      <TeamCalendar
 *        upcomingEvents={events}
 *        onSelectEvent={(ev) => navigate(`/calendrier?event=${ev.id}`)}
 *        onRefresh={() => refetchEvents()}
 *      />
 *    </HomeSection>
 *
 *  `pastEvents` est optionnel (liste vide par défaut) — fournir une vraie
 *  source si l'onglet "Passés" doit afficher quelque chose.
 * ==========================================================================*/
