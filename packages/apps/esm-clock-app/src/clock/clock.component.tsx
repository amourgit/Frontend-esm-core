import React, { useEffect, useState } from 'react';
import styles from './clock.scss';

// =============================================================================
//  HORLOGE — extension de la TopBar : l'heure (12 h) et la date longue, en français. Se met à jour toutes les 15 s.
// =============================================================================

/** L'heure et la date affichées pour un instant donné. */
export function formatClock(now: Date = new Date()) {
  const hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hours % 12 || 12}:${mins} ${hours >= 12 ? 'PM' : 'AM'}`;
  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return { timeStr, dateLongStr: date.charAt(0).toUpperCase() + date.slice(1) };
}

const Clock: React.FC = () => {
  const [{ timeStr, dateLongStr }, setClock] = useState(() => formatClock());
  useEffect(() => {
    const id = setInterval(() => setClock(formatClock()), 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={styles.clock} aria-live="off">
      <span className={styles.clockTime}>{timeStr}</span>
      <span className={styles.clockDate}>{dateLongStr}</span>
    </div>
  );
};

export default Clock;
