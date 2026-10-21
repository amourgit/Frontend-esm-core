import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { type ConfigSchema } from '../config-schema';

type Announcement = ConfigSchema['announcements'][number];

const KIND_STYLES: Record<string, { box: string; Icon: React.ElementType }> = {
  info: { box: 'border-primary-500/40 bg-primary-500/15', Icon: Info },
  'info-square': { box: 'border-primary-500/40 bg-primary-500/15', Icon: Info },
  success: { box: 'border-green-500/40 bg-green-500/15', Icon: CheckCircle2 },
  warning: { box: 'border-amber-500/40 bg-amber-500/15', Icon: AlertTriangle },
  'warning-alt': { box: 'border-amber-500/40 bg-amber-500/15', Icon: AlertTriangle },
  error: { box: 'border-error-500/40 bg-error-500/15', Icon: XCircle },
};

/** Bannières d'annonce configurables (`announcements`), empilées au-dessus du formulaire. */
export const LoginAnnouncements: React.FC<{ announcements: Announcement[] }> = ({ announcements }) => {
  const { t } = useTranslation();

  if (!announcements.length) {
    return null;
  }

  return (
    <div className="absolute left-1/2 top-16 z-20 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
      {announcements.map((announcement, i) => {
        const { box, Icon } = KIND_STYLES[announcement.kind] ?? KIND_STYLES.info;
        return (
          <div
            key={i}
            role={announcement.kind === 'error' ? 'alert' : 'status'}
            className={cn(
              'flex items-start gap-3 rounded-2xl border p-3 text-sm text-foreground backdrop-blur-md',
              box,
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <div>
              {announcement.title && <p className="font-semibold">{t(announcement.title)}</p>}
              <p className="text-foreground/80">{t(announcement.text)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
