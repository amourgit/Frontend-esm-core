import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import { playXboxSound } from '@egen-civitas/esm-framework';
import { cn } from '../utils/cn';
import { AUDIENCE_ORDER, type AudienceFilter } from './audience';
import { AUDIENCE_LABELS } from './audience-badge.component';

interface AudienceSwitchProps {
  value: AudienceFilter;
  onChange: (value: AudienceFilter) => void;
  /** Nombre de contenus par audience (affiché dans chaque pastille). */
  counts?: Partial<Record<AudienceFilter, number>>;
  className?: string;
}

/** Sélecteur d'audience (Tout / Interne / Extranet / Public), commun aux trois onglets. */
export function AudienceSwitch({ value, onChange, counts, className }: AudienceSwitchProps) {
  const { t } = useTranslation();
  const options: Array<{ id: AudienceFilter; label: string }> = [
    { id: 'all', label: t('audienceAll', 'All audiences') },
    ...AUDIENCE_ORDER.map((a) => ({ id: a as AudienceFilter, label: AUDIENCE_LABELS[a] })),
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t('audienceLabel', 'Audience')}
      className={cn('flex flex-wrap items-center gap-1.5', className)}
    >
      <Layers className="w-4 h-4 text-muted-foreground mr-0.5" aria-hidden />
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              playXboxSound('select');
              onChange(opt.id);
            }}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer',
              active
                ? 'bg-primary/20 text-primary border-primary/50'
                : 'bg-foreground/5 text-foreground border-foreground/10 hover:border-foreground/25 hover:text-foreground',
            )}
          >
            {opt.label}
            {counts?.[opt.id] !== undefined && <span className="ml-1.5 opacity-60">{counts[opt.id]}</span>}
          </button>
        );
      })}
    </div>
  );
}
