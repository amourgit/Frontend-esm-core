import React from 'react';
import { Globe, Handshake, Lock } from 'lucide-react';
import { cn } from '../utils/cn';
import { type Audience, resolveAudience } from './audience';

const META: Record<Audience, { label: string; icon: React.ReactNode; className: string }> = {
  interne: {
    label: 'Interne',
    icon: <Lock className="w-3 h-3" />,
    className: 'bg-info-500/15 text-info-200 border-info-400/30',
  },
  extranet: {
    label: 'Extranet',
    icon: <Handshake className="w-3 h-3" />,
    className: 'bg-secondary-500/15 text-secondary-200 border-secondary-400/30',
  },
  public: {
    label: 'Public',
    icon: <Globe className="w-3 h-3" />,
    className: 'bg-success-500/15 text-success-200 border-success-400/30',
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
