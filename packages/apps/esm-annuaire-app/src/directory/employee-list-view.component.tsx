import React from 'react';
import { Phone, Mail, MapPin, QrCode, ExternalLink } from 'lucide-react';
import { type DirectoryEmployee } from '../data/directory-data';
import { playXboxSound } from '@egen-civitas/esm-framework';

interface EmployeeListViewProps {
  employees: DirectoryEmployee[];
  onSelect: (emp: DirectoryEmployee) => void;
  onOpenQr: (emp: DirectoryEmployee, e: React.MouseEvent) => void;
}

export const EmployeeListView: React.FC<EmployeeListViewProps> = ({ employees, onSelect, onOpenQr }) => {
  return (
    <div className="w-full bg-muted-foreground/40 backdrop-blur-md rounded-2xl border border-foreground/10 shadow-xl overflow-hidden text-muted-foreground">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-foreground/5 border-b border-foreground/10 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Collaborateur</th>
              <th className="py-3 px-4">Fonction / Titre</th>
              <th className="py-3 px-4">Site (Location)</th>
              <th className="py-3 px-4">Poste Fixe</th>
              <th className="py-3 px-4">Téléphone Mobile</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5">
            {employees.map((emp) => (
              <tr
                key={emp.id}
                onClick={() => {
                  playXboxSound('select');
                  onSelect(emp);
                }}
                className="hover:bg-foreground/10 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={emp.avatar}
                        alt={emp.fullName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-foreground/10"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-900 ${
                          emp.status === 'available'
                            ? 'bg-success-400'
                            : emp.status === 'busy'
                              ? 'bg-error-500'
                              : 'bg-warning-400'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-foreground group-hover:text-primary-300">{emp.fullName}</div>
                      {emp.badge && (
                        <span className="text-[9px] font-semibold text-warning-300 bg-warning-500/20 px-1.5 py-0.2 rounded-full border border-warning-400/30">
                          {emp.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground font-medium">{emp.role}</td>
                <td className="py-3 px-4 text-primary-300 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                    <span>{emp.site}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-muted-foreground font-semibold">{emp.extension}</td>
                <td className="py-3 px-4 font-mono text-muted-foreground">{emp.phone}</td>
                <td className="py-3 px-4">
                  <a
                    href={`mailto:${emp.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary-300 hover:text-primary-200 underline truncate max-w-[170px] inline-block"
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
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                      title="vCard & QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelect(emp)}
                      className="p-1 rounded text-muted-foreground hover:text-primary-300 hover:bg-foreground/10"
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
