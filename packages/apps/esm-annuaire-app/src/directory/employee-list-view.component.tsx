import React from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  QrCode, 
  ExternalLink 
} from 'lucide-react';
import { type DirectoryEmployee } from '../data/directory-data';
import { playXboxSound } from '@egen-civitas/esm-framework';

interface EmployeeListViewProps {
  employees: DirectoryEmployee[];
  onSelect: (emp: DirectoryEmployee) => void;
  onOpenQr: (emp: DirectoryEmployee, e: React.MouseEvent) => void;
}

export const EmployeeListView: React.FC<EmployeeListViewProps> = ({
  employees,
  onSelect,
  onOpenQr
}) => {
  return (
    <div className="w-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden text-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Collaborateur</th>
              <th className="py-3 px-4">Fonction / Titre</th>
              <th className="py-3 px-4">Site (Location)</th>
              <th className="py-3 px-4">Poste Fixe</th>
              <th className="py-3 px-4">Téléphone Mobile</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {employees.map((emp) => (
              <tr
                key={emp.id}
                onClick={() => {
                  playXboxSound('select');
                  onSelect(emp);
                }}
                className="hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={emp.avatar}
                        alt={emp.fullName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                          emp.status === 'available'
                            ? 'bg-emerald-400'
                            : emp.status === 'busy'
                            ? 'bg-rose-500'
                            : 'bg-amber-400'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-teal-300">
                        {emp.fullName}
                      </div>
                      {emp.badge && (
                        <span className="text-[9px] font-semibold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full border border-amber-400/30">
                          {emp.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-300 font-medium">
                  {emp.role}
                </td>
                <td className="py-3 px-4 text-teal-300 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{emp.site}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-200 font-semibold">
                  {emp.extension}
                </td>
                <td className="py-3 px-4 font-mono text-slate-300">
                  {emp.phone}
                </td>
                <td className="py-3 px-4">
                  <a
                    href={`mailto:${emp.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-teal-300 hover:text-teal-200 underline truncate max-w-[170px] inline-block"
                  >
                    {emp.email}
                  </a>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQr(emp, e);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                      title="vCard & QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelect(emp)}
                      className="p-1 rounded text-slate-400 hover:text-teal-300 hover:bg-white/10"
                      title="Détails"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
