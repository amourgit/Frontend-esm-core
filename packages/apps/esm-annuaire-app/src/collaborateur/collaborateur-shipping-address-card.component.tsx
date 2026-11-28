import React, { useState } from 'react';
import { Pencil, MapPin, ExternalLink, Navigation } from 'lucide-react';
import { type DirectoryEmployee } from '../data/directory-data';
import { playXboxSound } from '@egen-civitas/esm-framework';

interface CollaborateurShippingAddressCardProps {
  employee: DirectoryEmployee;
  onEdit?: () => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export function CollaborateurShippingAddressCard({
  employee,
  onEdit,
  onShowToast,
}: CollaborateurShippingAddressCardProps) {
  const [showFullMap, setShowFullMap] = useState(false);

  const name = employee.shippingName || employee.fullName;
  const address = employee.shippingAddress || `${employee.site}, Kinshasa`;

  const handleViewMap = () => {
    playXboxSound('select');
    onShowToast?.(`Ouverture de la localisation : ${address}`, 'info');
  };

  return (
    <div className="w-full flex flex-col gap-3.5 p-4 sm:p-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] hover:bg-foreground/[0.05] backdrop-blur-md transition-all shadow-sm select-none">
      {/* Header: Title + Edit button */}
      <div className="w-full flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">Shipping Address</h3>
        <button
          type="button"
          onClick={() => {
            playXboxSound('select');
            onEdit?.();
            onShowToast?.("Modification de l'adresse...", 'info');
          }}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
          title="Modifier l'adresse"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mini Map View Representation */}
      <div
        onClick={handleViewMap}
        className="w-full h-28 rounded-xl overflow-hidden relative border border-foreground/15 bg-card group cursor-pointer shadow-inner"
      >
        {/* Stylized vector map grid */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            backgroundImage: `radial-gradient(var(--info) 1px, transparent 1px), linear-gradient(to right, color-mix(in srgb, var(--foreground) 5%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 5%, transparent) 1px, transparent 1px)`,
            backgroundSize: '20px 20px, 40px 40px, 40px 40px',
          }}
        />

        {/* Map stylized roads */}
        <svg className="absolute inset-0 w-full h-full opacity-60" preserveAspectRatio="none">
          <path
            d="M -10 40 Q 80 80 160 20 T 360 70"
            fill="none"
            strokeWidth="3"
            strokeOpacity="0.4"
            style={{ stroke: 'var(--info)' }}
          />
          <path
            d="M 50 -10 Q 90 60 180 120"
            fill="none"
            strokeWidth="2"
            strokeOpacity="0.3"
            style={{ stroke: 'var(--primary)' }}
          />
          <path
            d="M 120 10 L 260 100"
            fill="none"
            strokeWidth="1.5"
            strokeOpacity="0.2"
            style={{ stroke: 'var(--muted-foreground)' }}
          />
        </svg>

        {/* Location Marker Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <span className="w-7 h-7 rounded-full bg-warning-500/30 animate-ping absolute" />
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-warning-500 to-warning-500 flex items-center justify-center text-primary-foreground shadow-lg border border-foreground/40 z-10">
              <MapPin className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
          <span className="mt-1 px-1.5 py-0.5 rounded bg-foreground/70 backdrop-blur-sm text-[10px] font-mono text-foreground/90 border border-foreground/20 whitespace-nowrap shadow-sm">
            {employee.site || 'Localisation'}
          </span>
        </div>

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-foreground/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold text-foreground transition-opacity backdrop-blur-[1px]">
          <span className="px-2.5 py-1 rounded-lg bg-foreground/60 border border-foreground/20">Agrandir la carte</span>
        </div>
      </div>

      {/* Address Details & View on Map link */}
      <div className="flex items-start justify-between gap-3 text-xs sm:text-sm pt-1">
        <div className="flex flex-col min-w-0">
          <span className="text-foreground font-semibold">{name}</span>
          <span className="text-muted-foreground/80 leading-relaxed text-xs mt-0.5">{address}</span>
        </div>

        <button
          type="button"
          onClick={handleViewMap}
          className="text-xs text-warning-500 hover:text-warning-500 font-semibold underline underline-offset-2 shrink-0 transition-colors"
        >
          View on Map
        </button>
      </div>
    </div>
  );
}
