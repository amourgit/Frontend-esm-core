import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  MoreHorizontal, 
  Send, 
  CheckCircle2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { type DirectoryEmployee, getEmployeeUuid } from '../data/directory-data';
import { playXboxSound } from '@egen-civitas/esm-framework';

export type CollaborateurTabKey = 
  | 'purchase-history' 
  | 'wishlist' 
  | 'review' 
  | 'loyalty' 
  | 'support' 
  | 'insight' 
  | 'activity';

interface CollaborateurDetailHeaderProps {
  employee: DirectoryEmployee;
  activeTab: CollaborateurTabKey;
  onTabChange: (tab: CollaborateurTabKey) => void;
  onPrevEmployee?: () => void;
  onNextEmployee?: () => void;
  onSendMessage?: () => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export const COLLABORATEUR_TABS: Array<{ key: CollaborateurTabKey; label: string; count?: number }> = [
  { key: 'purchase-history', label: 'Purchase History' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'review', label: 'Review', count: 82 },
  { key: 'loyalty', label: 'Loyalty Program' },
  { key: 'support', label: 'Support Ticket' },
  { key: 'insight', label: 'Insight' },
  { key: 'activity', label: 'Activity' },
];

export function CollaborateurDetailHeader({
  employee,
  activeTab,
  onTabChange,
  onPrevEmployee,
  onNextEmployee,
  onSendMessage,
  onShowToast
}: CollaborateurDetailHeaderProps) {
  const navigate = useNavigate();

  const handleBackToAnnuaire = () => {
    playXboxSound('back');
    navigate('/annuaire');
  };

  const employeeUuid = employee.uuid || getEmployeeUuid(employee);

  return (
    <div className="w-full flex flex-col gap-5 pt-3 pb-2 select-none">
      {/* ── Top Bar: Back Button, Avatar, Name & ID, Action Controls ── */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Back button + Avatar + Name + Active Status + ID */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Back button */}
          <button
            type="button"
            onClick={handleBackToAnnuaire}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-sm shrink-0"
            title="Retour à l'annuaire"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Avatar with Status Ring */}
          <div className="relative shrink-0">
            <img
              src={employee.avatar}
              alt={employee.fullName}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white/20 shadow-md"
            />
            <span 
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0a0f12] ${
                employee.status === 'busy' ? 'bg-rose-500' : 'bg-emerald-400 ring-2 ring-emerald-500/30'
              }`}
              title={employee.statusLabel || 'En ligne'}
            />
          </div>

          {/* Name & Metadata */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {employee.fullName}
              </h1>
              {employee.badge && (
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-white/10 text-white/90 border border-white/15">
                  {employee.badge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300/80 mt-0.5">
              {/* Active Status Pill */}
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active</span>
              </div>

              <span className="text-white/30">•</span>

              {/* Customer / Collaborator ID */}
              <span className="font-mono text-slate-300">
                Customer ID <strong className="text-white font-semibold">#{employeeUuid}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Options, Send Message, Previous/Next arrows) */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Options button */}
          <button
            type="button"
            onClick={() => onShowToast?.(`Options du profil #${employeeUuid}`, 'info')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-sm"
            title="Options supplémentaires"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Send Message Button */}
          <button
            type="button"
            onClick={() => {
              playXboxSound('select');
              if (onSendMessage) {
                onSendMessage();
              } else {
                onShowToast?.(`Discussion initiée avec ${employee.fullName}`, 'success');
              }
            }}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all shadow-sm active:scale-95"
          >
            <Mail className="w-4 h-4 text-white/90" />
            <span>Send Message</span>
          </button>

          {/* Previous / Next arrows for quick navigation */}
          <div className="flex items-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-md overflow-hidden p-0.5">
            <button
              type="button"
              onClick={() => {
                playXboxSound('toggle');
                onPrevEmployee?.();
              }}
              disabled={!onPrevEmployee}
              className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
              title="Collaborateur précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-white/15" />
            <button
              type="button"
              onClick={() => {
                playXboxSound('toggle');
                onNextEmployee?.();
              }}
              disabled={!onNextEmployee}
              className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
              title="Collaborateur suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Horizontal Navigation Tabs (Purchase History, Wishlist, Review, Loyalty Program, etc.) ── */}
      <div className="w-full border-b border-white/10 mt-1">
        <nav className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar scroll-smooth">
          {COLLABORATEUR_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  playXboxSound('select');
                  onTabChange(tab.key);
                }}
                className={`relative py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-white/10 text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}

                {/* Active Indicator Underline */}
                {isActive && (
                  <motion.div
                    layoutId="collaborateur-tab-active-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-400 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
