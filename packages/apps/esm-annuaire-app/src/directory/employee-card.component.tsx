import React from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  QrCode, 
  PhoneCall, 
  ExternalLink 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DirectoryEmployee, getEmployeeUuid } from '../data/directory-data';
import { playXboxSound } from '@egen-civitas/esm-framework';

interface EmployeeCardProps {
  employee: DirectoryEmployee;
  onSelect: (emp: DirectoryEmployee) => void;
  onOpenQr: (emp: DirectoryEmployee, e: React.MouseEvent) => void;
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onSelect,
  onOpenQr,
  onShowNotification
}) => {
  const navigate = useNavigate();
  const getStatusColor = () => {
    switch (employee.status) {
      case 'available':
        return 'bg-emerald-400 ring-emerald-500/40';
      case 'busy':
        return 'bg-rose-500 ring-rose-500/40';
      case 'meeting':
        return 'bg-amber-400 ring-amber-500/40';
      case 'away':
        return 'bg-amber-300 ring-amber-400/40';
      default:
        return 'bg-slate-500 ring-slate-500/40';
    }
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playXboxSound('select');
    window.location.href = `mailto:${employee.email}`;
    if (onShowNotification) {
      onShowNotification(`Messagerie ouverte pour ${employee.fullName}`, 'info');
    }
  };

  const handleTeamsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playXboxSound('select');
    if (onShowNotification) {
      onShowNotification(`Chat Teams initié avec ${employee.fullName}`, 'success');
    }
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playXboxSound('select');
    if (onShowNotification) {
      onShowNotification(`Appel direct vers ${employee.phone} (${employee.extension})`, 'info');
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => {
        playXboxSound('select');
        onSelect(employee);
      }}
      className="group relative flex flex-col justify-between bg-slate-900/45 hover:bg-slate-900/75 text-slate-100 rounded-2xl border border-white/10 hover:border-teal-400/50 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer overflow-hidden p-4 backdrop-blur-md"
    >
      {/* Ligne Haute : Bouton QR Code vCard à gauche + Badge Spécial à droite */}
      <div className="flex items-start justify-between w-full mb-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playXboxSound('select');
            onOpenQr(employee, e);
          }}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Afficher la vCard & QR Code"
        >
          <QrCode className="w-4 h-4" />
        </button>

        {/* Badge distinction (MVP, Admin, Business Lead, etc.) */}
        <div className="flex items-center gap-1.5">
          {employee.badge && (
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider backdrop-blur-sm ${
                employee.badge === 'MVP'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  : employee.badge === 'Business Lead'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  : employee.badge === 'Admin'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-400/40'
              }`}
            >
              {employee.badge}
            </span>
          )}
        </div>
      </div>

      {/* Centre : Avatar rond avec indicateur d'état + Nom + Titre */}
      <div className="flex flex-col items-center text-center mb-3">
        <div className="relative mb-2.5">
          <img
            src={employee.avatar}
            alt={employee.fullName}
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-full object-cover shadow-lg ring-2 ring-white/10 group-hover:ring-teal-400/60 transition-all"
          />
          {/* Pastille présence */}
          <span
            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 ring-2 ${getStatusColor()}`}
            title={`Statut : ${employee.statusLabel}`}
          />
        </div>

        <h3 className="font-bold text-white text-sm tracking-tight line-clamp-1 group-hover:text-teal-300 transition-colors">
          {employee.fullName}
        </h3>
        <p className="text-[11px] font-medium text-slate-400 line-clamp-1 mt-0.5">
          {employee.role}
        </p>
      </div>

      {/* Informations de contact détaillées (Poste fixe, Site/Location, Mobile, Email) */}
      <div className="w-full space-y-1.5 text-xs text-slate-300 mb-3 pt-2 border-t border-white/10">
        {/* Poste interne fixe */}
        <div className="flex items-center justify-center gap-1.5 text-[11px]">
          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="font-mono text-slate-200">{employee.extension}</span>
        </div>

        {/* Site / Localisation (Location) */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-teal-300">
          <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
          <span className="truncate max-w-[190px]">{employee.site}</span>
        </div>

        {/* Téléphone mobile */}
        <div className="flex items-center justify-center gap-1.5 text-[11px]">
          <PhoneCall className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="font-mono text-slate-200">{employee.phone}</span>
        </div>

        {/* Email */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300 hover:text-teal-300">
          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate max-w-[185px] underline underline-offset-2">
            {employee.email}
          </span>
        </div>
      </div>

      {/* Barre d'action basse : Outlook, Teams, Appel direct, Fiche */}
      <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10">
        {/* Bouton Outlook */}
        <button
          type="button"
          onClick={handleEmailClick}
          className="w-7 h-7 rounded flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-transform active:scale-95"
          title={`Envoyer un email via Outlook à ${employee.fullName}`}
        >
          <span className="font-bold text-[11px]">O</span>
        </button>

        {/* Bouton Teams */}
        <button
          type="button"
          onClick={handleTeamsClick}
          className="w-7 h-7 rounded flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-transform active:scale-95"
          title={`Démarrer un chat Teams avec ${employee.fullName}`}
        >
          <span className="font-bold text-[11px]">T</span>
        </button>

        {/* Bouton Appel direct */}
        <button
          type="button"
          onClick={handlePhoneClick}
          className="w-7 h-7 rounded flex items-center justify-center bg-white/10 hover:bg-white/20 text-slate-200 shadow-sm transition-transform active:scale-95"
          title={`Appeler ${employee.fullName}`}
        >
          <Phone className="w-3.5 h-3.5" />
        </button>

        {/* Bouton Voir Profil & Page Complète */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playXboxSound('select');
            navigate(`/annuaire/${getEmployeeUuid(employee)}/details`);
          }}
          className="w-7 h-7 rounded flex items-center justify-center bg-white/10 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 shadow-sm transition-transform active:scale-95"
          title="Ouvrir la page détaillée du collaborateur"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
