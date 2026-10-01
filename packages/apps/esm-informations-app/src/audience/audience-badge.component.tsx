import React from 'react';
import { Globe, Handshake, Lock } from 'lucide-react';
import { cn } from '../lib/cn';
import { type Audience, resolveAudience } from './audience';

const META: Record<Audience, { label: string; icon: React.ReactNode; className: string }> = {
  interne: {
    label: 'Interne',
    icon: <Lock className="w-3 h-3" />,
    className: 'bg-sky-500/15 text-sky-200 border-sky-400/30',
  },
  extranet: {
    label: 'Extranet',
    icon: <Handshake className="w-3 h-3" />,
    className: 'bg-violet-500/15 text-violet-200 border-violet-400/30',
  },
  public: {
    label: 'Public',
    icon: <Globe className="w-3 h-3" />,
    className: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  },
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  interne: META.interne.label,
  extranet: META.extranet.label,
  public: META.public.label,
};

interface AudienceBadgeProps {
  audience?: Audience;
  className?: string;
}

export function AudienceBadge({ audience, className }: AudienceBadgeProps) {
  const meta = META[resolveAudience(audience)];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide backdrop-blur-md',
        meta.className,
        className,
      )}
      title={`Diffusion : ${meta.label}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}
