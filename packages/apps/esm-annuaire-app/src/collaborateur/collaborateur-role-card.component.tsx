import React from 'react';
import { Pencil, Briefcase, Award } from 'lucide-react';
import { type DirectoryEmployee } from '../data/directory-data';
import { playXboxSound } from '@egen-civitas/esm-framework';

interface CollaborateurRoleCardProps {
  employee: DirectoryEmployee;
  onEdit?: () => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export function CollaborateurRoleCard({ employee, onEdit, onShowToast }: CollaborateurRoleCardProps) {
  const roleName = employee.businessRole || employee.role || 'Business Owner';

  return (
    <div className="w-full flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] hover:bg-foreground/[0.05] backdrop-blur-md transition-all shadow-sm select-none">
      {/* Header: Title + Edit button */}
      <div className="w-full flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">Contact Information</h3>
        <button
          type="button"
          onClick={() => {
            playXboxSound('select');
            onEdit?.();
            onShowToast?.('Édition du rôle...', 'info');
          }}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
          title="Modifier le rôle"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Role Pill as shown in image */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground/10 border border-foreground/15 text-xs sm:text-sm font-medium text-muted-foreground">
          <Briefcase className="w-3.5 h-3.5 text-warning-500" />
          <span>{roleName}</span>
        </span>
      </div>
    </div>
  );
}
