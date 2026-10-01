import React from 'react';
import { Pencil, Briefcase, Award } from 'lucide-react';
import { DirectoryEmployee } from '../data/directory-data';
import { playXboxSound } from '@egen-civitas/esm-framework';

interface CollaborateurRoleCardProps {
  employee: DirectoryEmployee;
  onEdit?: () => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export function CollaborateurRoleCard({
  employee,
  onEdit,
  onShowToast,
}: CollaborateurRoleCardProps) {
  const roleName = employee.businessRole || employee.role || 'Business Owner';

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
            onShowToast?.("Édition du rôle...", 'info');
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Modifier le rôle"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Role Pill as shown in image */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm font-medium text-slate-200">
          <Briefcase className="w-3.5 h-3.5 text-amber-400" />
          <span>{roleName}</span>
        </span>
      </div>

    </div>
  );
}
