import React from 'react';
import { Phone, Mail, MapPin, QrCode, PhoneCall, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { type DirectoryEmployee, getEmployeeUuid } from '../data/directory-data';
import { playXboxSound } from '@egen-civitas/esm-framework';

interface EmployeeCardProps {
  employee: DirectoryEmployee;
  onSelect: (emp: DirectoryEmployee) => void;
  onOpenQr: (emp: DirectoryEmployee, e: React.MouseEvent) => void;
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onSelect, onOpenQr, onShowNotification }) => {
  const navigate = useNavigate();
  const getStatusColor = () => {
    switch (employee.status) {
      case 'available':
        return 'bg-success-400 ring-success-500/40';
      case 'busy':
        return 'bg-error-500 ring-error-500/40';
      case 'meeting':
        return 'bg-warning-400 ring-warning-500/40';
      case 'away':
        return 'bg-warning-300 ring-warning-400/40';
      default:
        return 'bg-muted-foreground ring-500/40';
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
      className="group relative flex flex-col justify-between bg-muted-foreground/45 hover:bg-muted-foreground/75 text-muted-foreground rounded-2xl border border-foreground/10 hover:border-primary-400/50 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer overflow-hidden p-4 backdrop-blur-md"
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
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
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
                  ? 'bg-warning-500/20 text-warning-300 border border-warning-400/40'
                  : employee.badge === 'Business Lead'
                    ? 'bg-success-500/20 text-success-300 border border-success-400/40'
                    : employee.badge === 'Admin'
                      ? 'bg-secondary-500/20 text-secondary-300 border border-secondary-400/40'
                      : 'bg-primary-500/20 text-primary-300 border border-primary-400/40'
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
            className="w-20 h-20 rounded-full object-cover shadow-lg ring-2 ring-foreground/10 group-hover:ring-primary-400/60 transition-all"
          />
          {/* Pastille présence */}
          <span
            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-900 ring-2 ${getStatusColor()}`}
            title={`Statut : ${employee.statusLabel}`}
          />
        </div>

        <h3 className="font-bold text-foreground text-sm tracking-tight line-clamp-1 group-hover:text-primary-300 transition-colors">
          {employee.fullName}
        </h3>
        <p className="text-[11px] font-medium text-muted-foreground line-clamp-1 mt-0.5">{employee.role}</p>
      </div>

      {/* Informations de contact détaillées (Poste fixe, Site/Location, Mobile, Email) */}
      <div className="w-full space-y-1.5 text-xs text-muted-foreground mb-3 pt-2 border-t border-foreground/10">
        {/* Poste interne fixe */}
        <div className="flex items-center justify-center gap-1.5 text-[11px]">
          <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="font-mono text-muted-foreground">{employee.extension}</span>
        </div>

        {/* Site / Localisation (Location) */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-primary-300">
          <MapPin className="w-3 h-3 text-primary-400 shrink-0" />
          <span className="truncate max-w-[190px]">{employee.site}</span>
        </div>

        {/* Téléphone mobile */}
        <div className="flex items-center justify-center gap-1.5 text-[11px]">
          <PhoneCall className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="font-mono text-muted-foreground">{employee.phone}</span>
        </div>

        {/* Email */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary-300">
          <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[185px] underline underline-offset-2">{employee.email}</span>
        </div>
      </div>

      {/* Barre d'action basse : Outlook, Teams, Appel direct, Fiche */}
      <div className="flex items-center justify-center gap-2 pt-2 border-t border-foreground/10">
        {/* Bouton Outlook */}
        <button
          type="button"
          onClick={handleEmailClick}
          className="w-7 h-7 rounded flex items-center justify-center bg-info-600 hover:bg-info-500 text-foreground shadow-sm transition-transform active:scale-95"
          title={`Envoyer un email via Outlook à ${employee.fullName}`}
        >
          <span className="font-bold text-[11px]">O</span>
        </button>

        {/* Bouton Teams */}
        <button
          type="button"
          onClick={handleTeamsClick}
          className="w-7 h-7 rounded flex items-center justify-center bg-secondary-600 hover:bg-secondary-500 text-foreground shadow-sm transition-transform active:scale-95"
          title={`Démarrer un chat Teams avec ${employee.fullName}`}
        >
          <span className="font-bold text-[11px]">T</span>
        </button>

        {/* Bouton Appel direct */}
        <button
          type="button"
          onClick={handlePhoneClick}
          className="w-7 h-7 rounded flex items-center justify-center bg-foreground/10 hover:bg-foreground/20 text-muted-foreground shadow-sm transition-transform active:scale-95"
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
          className="w-7 h-7 rounded flex items-center justify-center bg-foreground/10 hover:bg-primary-500/20 text-muted-foreground hover:text-primary-300 shadow-sm transition-transform active:scale-95"
          title="Ouvrir la page détaillée du collaborateur"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
