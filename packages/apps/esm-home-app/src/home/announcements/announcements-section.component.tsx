import React, { useMemo, useState } from 'react';
import { BadgeCheck, Info, TriangleAlert } from 'lucide-react';
import { Section, SectionAction, SectionGrid } from '@egen-civitas/esm-framework';
import { GLASS_CARD, cx } from '../cards/card-utils';
import { CardTitleButton } from '../cards/card-title-button.component';

// =============================================================================
//  ANNONCES — Salle des annonces (flash info, circulaires, communiqués)
//
//  Source des données d'exemple : esm-informations-app (announcements-data.ts).
//  Section = en-tête (titre + filtres par niveau) / corps (grille de cartes) /
//  pied (compteur + lien vers la salle des annonces).
// =============================================================================

export type AnnouncementLevel = 'Alerte' | 'Officiel' | 'Info';

export interface AnnouncementItem {
  id: string;
  title: string;
  category: string;
  level: AnnouncementLevel;
  date: string;
  author: string;
  body: string;
}

export interface AnnouncementsSectionProps {
  items: AnnouncementItem[];
  onSelect?: (item: AnnouncementItem) => void;
  onSeeAll?: () => void;
  /** Nombre maximum de cartes affichées après filtrage. @default 6 */
  limit?: number;
}

type LevelFilter = 'all' | AnnouncementLevel;

const LEVEL_STYLE: Record<
  AnnouncementLevel,
  { Icon: React.ComponentType<{ className?: string }>; badge: string; bar: string }
> = {
  Alerte: { Icon: TriangleAlert, badge: 'border-rose-400/40 bg-rose-500/15 text-rose-300', bar: 'bg-rose-400' },
  Officiel: { Icon: BadgeCheck, badge: 'border-indigo-400/40 bg-indigo-500/15 text-indigo-300', bar: 'bg-indigo-400' },
  Info: { Icon: Info, badge: 'border-teal-400/40 bg-teal-500/15 text-teal-300', bar: 'bg-teal-400' },
};

const FILTERS: Array<{ id: LevelFilter; label: string }> = [
  { id: 'all', label: 'Toutes' },
  { id: 'Alerte', label: 'Alertes' },
  { id: 'Officiel', label: 'Officielles' },
  { id: 'Info', label: 'Infos' },
];

function AnnouncementCard({ item, onSelect }: { item: AnnouncementItem; onSelect?: (item: AnnouncementItem) => void }) {
  const { Icon, badge, bar } = LEVEL_STYLE[item.level];
  return (
    <article className={cx(GLASS_CARD, 'gap-2.5 pl-5')}>
      <span aria-hidden="true" className={cx('absolute bottom-4 left-0 top-4 w-0.5 rounded-full', bar)} />

      <div className="flex items-center justify-between gap-2">
        <span
          className={cx(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
            badge,
          )}
        >
          <Icon className="size-3" />
          {item.level}
        </span>
        <span className="truncate font-mono text-[11px] uppercase tracking-wider text-slate-400">{item.category}</span>
      </div>

      <h3 className="m-0 text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-teal-300">
        <CardTitleButton onClick={() => onSelect?.(item)} className="line-clamp-2">
          {item.title}
        </CardTitleButton>
      </h3>
      <p className="m-0 line-clamp-2 text-xs leading-relaxed text-slate-300/80">{item.body}</p>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-white/10 pt-2.5 text-[11px] text-slate-400">
        <span className="truncate font-medium text-slate-300">{item.author}</span>
        <span className="truncate">{item.date}</span>
      </div>
    </article>
  );
}

export function AnnouncementsSection({ items, onSelect, onSeeAll, limit = 6 }: AnnouncementsSectionProps) {
  const [filter, setFilter] = useState<LevelFilter>('all');
  const filtered = useMemo(() => items.filter((item) => filter === 'all' || item.level === filter), [items, filter]);
  const shown = filtered.slice(0, limit);

  return (
    <Section
      title="Annonces"
      count={items.length}
      actions={FILTERS.map(({ id, label }) => (
        <SectionAction key={id} size="sm" active={filter === id} onClick={() => setFilter(id)}>
          {label}
        </SectionAction>
      ))}
      footer={`${shown.length} annonce${shown.length > 1 ? 's' : ''} affichée${shown.length > 1 ? 's' : ''} sur ${filtered.length}`}
      footerActions={
        onSeeAll ? (
          <SectionAction size="sm" variant="outline" onClick={onSeeAll}>
            Salle des annonces →
          </SectionAction>
        ) : undefined
      }
    >
      {shown.length > 0 ? (
        <SectionGrid columns={{ base: 1, md: 2, xl: 3 }} gap="md">
          {shown.map((item) => (
            <AnnouncementCard key={item.id} item={item} onSelect={onSelect} />
          ))}
        </SectionGrid>
      ) : (
        <p className="m-0 py-8 text-center text-sm text-white/40">Aucune annonce pour ce filtre.</p>
      )}
    </Section>
  );
}

export default AnnouncementsSection;
