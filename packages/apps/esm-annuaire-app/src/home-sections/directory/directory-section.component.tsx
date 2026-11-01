import React, { useMemo, useState } from 'react';
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { Section, SectionAction, SectionCard, SectionCardTitleButton, SectionGrid } from '@egen-civitas/esm-framework';
import { cx } from '../shared/cx';

// =============================================================================
//  ANNUAIRE — Collaborateurs (cartes de contact) + types partagés avec « Sites »
//
//  Source des données d'exemple : esm-annuaire-app (directory-data.ts).
//  Carte compacte du même langage que l'annuaire : avatar + pastille de
//  présence, badge de distinction, rôle, site, raccourcis de contact.
// =============================================================================

export type DirectoryStatus = 'available' | 'busy' | 'meeting' | 'away' | 'offline';

export interface DirectoryMember {
  id: string;
  fullName: string;
  role: string;
  department: string;
  /** Identifiant du filtre de département (voir `DirectoryFilter`). */
  departmentId: string;
  site: string;
  avatar: string;
  status: DirectoryStatus;
  statusLabel: string;
  badge?: string;
  email: string;
  phone: string;
}

export interface DirectoryFilter {
  id: string;
  label: string;
}

export interface DirectorySectionProps {
  members: DirectoryMember[];
  /** Filtres de département affichés dans l'en-tête. Le premier est « tout » (`id: 'all'`). */
  filters: DirectoryFilter[];
  /** Effectif total de l'annuaire, si supérieur à la sélection affichée. */
  totalCount?: number;
  onSelectMember?: (member: DirectoryMember) => void;
  onOpenProfile?: (member: DirectoryMember) => void;
  onSeeAll?: () => void;
  /** Nombre maximum de cartes affichées après filtrage. @default 8 */
  limit?: number;
}

const STATUS_DOT: Record<DirectoryStatus, string> = {
  available: 'bg-emerald-400 ring-emerald-500/40',
  busy: 'bg-rose-500 ring-rose-500/40',
  meeting: 'bg-amber-400 ring-amber-500/40',
  away: 'bg-amber-300 ring-amber-400/40',
  offline: 'bg-slate-500 ring-slate-500/40',
};

const BADGE_STYLE: Record<string, string> = {
  MVP: 'border-amber-400/40 bg-amber-500/20 text-amber-300',
  'Business Lead': 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300',
  Admin: 'border-indigo-400/40 bg-indigo-500/20 text-indigo-300',
};
const BADGE_DEFAULT = 'border-teal-400/40 bg-teal-500/20 text-teal-300';

function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Avatar rond ; retombe sur les initiales si l'image ne charge pas (hors-ligne, lien mort). */
function Avatar({ member }: { member: DirectoryMember }) {
  const [failed, setFailed] = useState(false);
  const base = 'size-16 rounded-full ring-2 ring-white/10 shadow-lg transition-all group-hover:ring-teal-400/60';
  return failed || !member.avatar ? (
    <span
      className={cx(base, 'flex items-center justify-center bg-teal-500/20 text-lg font-bold text-teal-200')}
      aria-hidden="true"
    >
      {initials(member.fullName)}
    </span>
  ) : (
    <img
      src={member.avatar}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cx(base, 'object-cover')}
    />
  );
}

const CONTACT_BTN =
  'inline-flex size-8 items-center justify-center rounded-md bg-white/10 text-slate-200 outline-none transition-all hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95';

function MemberCard({
  member,
  onSelect,
  onOpenProfile,
}: {
  member: DirectoryMember;
  onSelect?: (member: DirectoryMember) => void;
  onOpenProfile?: (member: DirectoryMember) => void;
}) {
  return (
    <SectionCard as="article" className="items-center gap-3 text-center">
      {member.badge ? (
        <span
          className={cx(
            'absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
            BADGE_STYLE[member.badge] ?? BADGE_DEFAULT,
          )}
        >
          {member.badge}
        </span>
      ) : null}

      <div className="relative mt-5">
        <Avatar member={member} />
        <span
          title={member.statusLabel}
          className={cx(
            'absolute bottom-0 right-0 size-4 rounded-full border-2 border-slate-900 ring-2',
            STATUS_DOT[member.status],
          )}
        />
        <span className="sr-only">{member.statusLabel}</span>
      </div>

      <div className="min-w-0 max-w-full">
        <h3 className="m-0 text-sm font-bold tracking-tight text-white transition-colors group-hover:text-teal-300">
          <SectionCardTitleButton onClick={() => onSelect?.(member)} className="truncate">
            {member.fullName}
          </SectionCardTitleButton>
        </h3>
        <p className="m-0 mt-0.5 line-clamp-2 min-h-8 text-[11px] font-medium leading-snug text-slate-400">
          {member.role}
        </p>
        <p className="m-0 mt-1.5 flex items-center justify-center gap-1 text-[11px] text-teal-300">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{member.site}</span>
        </p>
      </div>

      <div className="relative mt-auto flex w-full items-center justify-center gap-2 border-t border-white/10 pt-3">
        <a
          href={`mailto:${member.email}`}
          title={`Écrire à ${member.fullName}`}
          aria-label={`Écrire à ${member.fullName}`}
          className={CONTACT_BTN}
        >
          <Mail className="size-3.5" />
        </a>
        <a
          href={`tel:${member.phone.replace(/\s+/g, '')}`}
          title={`Appeler ${member.fullName}`}
          aria-label={`Appeler ${member.fullName}`}
          className={CONTACT_BTN}
        >
          <Phone className="size-3.5" />
        </a>
        {onOpenProfile ? (
          <button
            type="button"
            onClick={() => onOpenProfile(member)}
            title={`Ouvrir la fiche de ${member.fullName}`}
            aria-label={`Ouvrir la fiche de ${member.fullName}`}
            className={cx(CONTACT_BTN, 'cursor-pointer border-0 p-0 hover:bg-teal-500/20 hover:text-teal-300')}
          >
            <ExternalLink className="size-3.5" />
          </button>
        ) : null}
      </div>
    </SectionCard>
  );
}

export function DirectorySection({
  members,
  filters,
  totalCount,
  onSelectMember,
  onOpenProfile,
  onSeeAll,
  limit = 8,
}: DirectorySectionProps) {
  const [filter, setFilter] = useState(filters[0]?.id ?? 'all');
  const filtered = useMemo(
    () => members.filter((member) => filter === 'all' || member.departmentId === filter),
    [members, filter],
  );
  const shown = filtered.slice(0, limit);
  const total = filter === 'all' ? (totalCount ?? members.length) : filtered.length;

  return (
    <Section
      title="Annuaire"
      count={totalCount ?? members.length}
      actions={filters.map(({ id, label }) => (
        <SectionAction key={id} size="sm" active={filter === id} onClick={() => setFilter(id)}>
          {label}
        </SectionAction>
      ))}
      footer={`${shown.length} collaborateur${shown.length > 1 ? 's' : ''} affiché${shown.length > 1 ? 's' : ''} sur ${total}`}
      footerActions={
        onSeeAll ? (
          <SectionAction size="sm" variant="outline" onClick={onSeeAll}>
            Ouvrir l’annuaire →
          </SectionAction>
        ) : undefined
      }
    >
      {shown.length > 0 ? (
        <SectionGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="md">
          {shown.map((member) => (
            <MemberCard key={member.id} member={member} onSelect={onSelectMember} onOpenProfile={onOpenProfile} />
          ))}
        </SectionGrid>
      ) : (
        <p className="m-0 py-8 text-center text-sm text-white/40">Aucun collaborateur dans ce département.</p>
      )}
    </Section>
  );
}

export default DirectorySection;
