import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff } from 'lucide-react';
import { QuickAccessSection } from './quick-access-section.component';
import styles from './quick-access.scss';

// Informations visibles d'un coup d'œil : date/heure (rafraîchies chaque minute) et état de connexion.
const GlanceSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => new Date());
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  const locale = i18n?.language || 'fr';

  return (
    <QuickAccessSection title={t('glance', 'En un coup d’œil')}>
      <div className={styles.glance}>
        <span className={styles.time}>{now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>
        <span className={styles.date}>
          {now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <span className={styles.status} data-online={online}>
          {online ? <Wifi size={14} aria-hidden /> : <WifiOff size={14} aria-hidden />}
          {online ? t('online', 'En ligne') : t('offline', 'Hors ligne')}
        </span>
      </div>
    </QuickAccessSection>
  );
};

export default GlanceSection;
