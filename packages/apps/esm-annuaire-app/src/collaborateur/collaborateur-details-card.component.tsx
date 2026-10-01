import React from 'react';
import { Store, Globe, Clock, Laptop } from 'lucide-react';
import { DirectoryEmployee } from '../data/directory-data';

interface CollaborateurDetailsCardProps {
  employee: DirectoryEmployee;
}

export function CollaborateurDetailsCard({ employee }: CollaborateurDetailsCardProps) {
  const customerSource = employee.customerSource || 'Online Store';
  const lastOnline = employee.lastOnline || '04 Feb 2024, 13:00';

  return (
    <div className="w-full flex flex-col gap-4 p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] backdrop-blur-md transition-all shadow-sm select-none">
      
      {/* Title */}
      <h3 className="text-sm font-semibold text-white tracking-tight">
        Customer Details
      </h3>

      <div className="flex flex-col gap-3 text-xs sm:text-sm">
        
        {/* Customer Source */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400">Customer Source</span>
          <div className="flex items-center gap-1.5 text-white/90 font-medium">
            <Store className="w-3.5 h-3.5 text-slate-300" />
            <span>{customerSource}</span>
          </div>
        </div>

        {/* Last Online */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400">Last Online</span>
          <span className="text-white/90 font-medium font-mono text-xs">
            {lastOnline}
          </span>
        </div>

      </div>

    </div>
  );
}
