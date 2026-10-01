import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, ChevronDown, Search, X } from 'lucide-react';
import { playXboxSound } from '@egen-civitas/esm-framework';
import { cn } from '../lib/cn';
import { type AudienceFilter, matchesAudience } from '../audience/audience';
import { AudienceBadge } from '../audience/audience-badge.component';
import { ALL_ANNOUNCEMENTS, type AnnouncementLevel } from './announcements-data';

const LEVEL_STYLES: Record<AnnouncementLevel, string> = {
  Alerte: 'text-rose-300',
  Officiel: 'text-amber-300',
  Info: 'text-teal-300',
};

interface AnnouncementsViewProps {
  /** Audience affichée (filtre global de la page Informations). */
  audience?: AudienceFilter;
}

/** Annonces & Flash Info : communiqués officiels, circulaires et alertes de service. */
export function AnnouncementsView({ audience = 'all' }: AnnouncementsViewProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_ANNOUNCEMENTS.filter((a) => {
      if (!matchesAudience(a, audience)) return false;
      if (!q) return true;
      return [a.title, a.category, a.author, a.body].some((field) => field.toLowerCase().includes(q));
    });
  }, [audience, query]);

  return (
    <div className="space-y-5 text-slate-100 py-1">
      <div className="pb-4 border-b border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BellRing className="w-5 h-5 text-amber-300" aria-hidden />
          {t('announcementsTitle', 'Announcements & Flash News')}
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          {t('announcementsSubtitle', 'Official communiqués and service alerts.')}
        </p>
      </div>

      <div className="relative">
        <Search
          className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('announcementsSearch', 'Search announcements…')}
          aria-label={t('announcementsSearch', 'Search announcements…')}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400/50"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t('clear', 'Clear')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">
          {t('announcementsEmpty', 'No announcements for this selection.')}
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((ann) => {
            const open = openId === ann.id;
            return (
              <li key={ann.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => {
                    playXboxSound('select');
                    setOpenId(open ? null : ann.id);
                  }}
                  className="w-full text-left p-4 rounded-xl bg-slate-900/60 border border-white/10 hover:border-teal-400/40 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn('text-xs font-bold', LEVEL_STYLES[ann.level])}>
                      {ann.level} • {ann.category}
                    </span>
                    <span className="flex items-center gap-2">
                      <AudienceBadge audience={ann.audience} />
                      <ChevronDown
                        className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')}
                        aria-hidden
                      />
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{ann.title}</h3>
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-teal-300 font-medium">{ann.date}</span>
                    <span className="text-slate-400">{ann.author}</span>
                  </div>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-sm text-slate-300 overflow-hidden"
                      >
                        {ann.body}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
