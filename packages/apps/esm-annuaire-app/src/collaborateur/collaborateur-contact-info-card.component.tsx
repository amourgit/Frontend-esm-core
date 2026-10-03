import React, { useState } from 'react';
import { Pencil, Mail, Phone, Copy, Check } from 'lucide-react';
import { type DirectoryEmployee } from '../data/directory-data';
import { playXboxSound } from '@egen-civitas/esm-framework';

interface CollaborateurContactInfoCardProps {
  employee: DirectoryEmployee;
  onEdit?: () => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export function CollaborateurContactInfoCard({
  employee,
  onEdit,
  onShowToast,
}: CollaborateurContactInfoCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const email = employee.email || 'bagus.fikri@mail.com';
  const phone = employee.phone || '+1233-789-907';

  const handleCopy = (text: string, label: string) => {
    playXboxSound('select');
    navigator.clipboard?.writeText(text);
    setCopiedKey(label);
    onShowToast?.(`${label} copié : ${text}`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] backdrop-blur-md transition-all shadow-sm select-none">
      
      {/* Header: Title + Edit button */}
      <div className="w-full flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white tracking-tight">
          Contact Information
        </h3>
        <button
          type="button"
          onClick={() => {
            playXboxSound('select');
            onEdit?.();
            onShowToast?.("Édition des coordonnées...", 'info');
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Modifier les coordonnées"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Contact pills as shown in image */}
      <div className="flex flex-col gap-2">
        
        {/* Email Pill */}
        <button
          type="button"
          onClick={() => handleCopy(email, 'Email')}
          className="group flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs sm:text-sm text-slate-200 hover:text-white backdrop-blur-md transition-all text-left"
        >
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-300 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
          <span className="shrink-0 p-1 text-slate-400 group-hover:text-white">
            {copiedKey === 'Email' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            )}
          </span>
        </button>

        {/* Phone Pill */}
        <button
          type="button"
          onClick={() => handleCopy(phone, 'Téléphone')}
          className="group flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs sm:text-sm text-slate-200 hover:text-white backdrop-blur-md transition-all text-left"
        >
          <div className="flex items-center gap-2 truncate">
            <Phone className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-300 shrink-0" />
            <span className="font-mono text-xs">{phone}</span>
          </div>
          <span className="shrink-0 p-1 text-slate-400 group-hover:text-white">
            {copiedKey === 'Téléphone' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            )}
          </span>
        </button>

      </div>

    </div>
  );
}
