"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useSite } from '../../context/SiteContext';
import { playXboxSound } from '../../utils/xboxAudio';
import { SiteItem } from '../../data/sitesData';

interface WorkspaceAndSiteSelectorsColumnProps {
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function WorkspaceAndSiteSelectorsColumn({
  onShowNotification,
}: WorkspaceAndSiteSelectorsColumnProps) {
  const navigate = useNavigate();
  const { currentWorkspace, setWorkspaceId, availableWorkspaces } = useWorkspace();
  const { selectedSite, setSelectedSiteUuid, availableSites, clearSite } = useSite();

  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsWorkspaceDropdownOpen(false);
        setIsSiteDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group workspaces
  const workspaceGroups = React.useMemo(() => {
    const categories = [
      {
        key: 'public',
        label: 'Espaces Publique',
        items: availableWorkspaces.filter((ws) => ws.category === 'public'),
      },
      {
        key: 'organisationnel',
        label: 'Espace Organisationnel',
        items: availableWorkspaces.filter((ws) => ws.category === 'organisationnel'),
      },
      {
        key: 'personnel',
        label: 'Espace Personnel',
        items: availableWorkspaces.filter((ws) => ws.category === 'personnel'),
      },
    ];
    return categories.filter((cat) => cat.items.length > 0);
  }, [availableWorkspaces]);

  const handleSelectSite = (site: SiteItem | null) => {
    playXboxSound('select');
    setIsSiteDropdownOpen(false);
    if (!site) {
      clearSite();
      navigate('/sites');
      if (onShowNotification) onShowNotification('Filtre de site réinitialisé', 'info');
    } else {
      setSelectedSiteUuid(site.uuid);
      navigate(`/sites/${site.uuid}/applications`);
      if (onShowNotification) onShowNotification(`Site activé : ${site.name}`, 'success');
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col justify-center gap-0.5 min-w-0 shrink max-w-[130px] xs:max-w-[165px] sm:max-w-[210px] md:max-w-[260px] select-none relative my-auto py-0.5"
    >
      {/* 1. ESPACE SELECTOR ROW */}
      <div className="relative min-w-0 shrink-0">
        <button
          type="button"
          onClick={() => {
            playXboxSound('toggle');
            setIsWorkspaceDropdownOpen((prev) => !prev);
            setIsSiteDropdownOpen(false);
          }}
          className="group w-full flex items-center justify-between gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white transition-all cursor-pointer text-[10px] sm:text-[11px] font-semibold leading-tight shadow-2xs"
          title={`Espace actuel : ${currentWorkspace.name}`}
        >
          <div className="flex items-center gap-1 min-w-0 truncate">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400"></span>
            </span>
            <span className="hidden sm:inline text-slate-300 font-normal shrink-0 text-[9px] sm:text-[10px]">
              Espace:
            </span>
            <span className="text-teal-300 font-bold truncate text-[10px] sm:text-[11px]">
              {currentWorkspace.name}
            </span>
          </div>
          <ChevronDown
            className={`w-2.5 h-2.5 text-teal-300 shrink-0 transition-transform duration-200 ${
              isWorkspaceDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Workspace Dropdown Panel */}
        {isWorkspaceDropdownOpen && (
          <div className="fixed sm:absolute left-2 right-2 sm:left-0 sm:right-auto top-12 sm:top-full mt-1.5 w-auto sm:w-72 max-w-sm bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-2 z-50 text-white animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/20">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-300 border-b border-white/10 mb-1 flex items-center justify-between">
              <span>Espaces & Environnements</span>
              <span className="text-[9px] font-medium text-teal-200 bg-teal-500/20 border border-teal-400/30 px-1.5 py-0.2 rounded">
                {availableWorkspaces.length} disponibles
              </span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-0.5 scrollbar-thin">
              {workspaceGroups.map((group) => (
                <div key={group.key} className="space-y-0.5">
                  <div className="px-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{group.label}</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((ws) => {
                      const isActive = ws.id === currentWorkspace.id;
                      return (
                        <button
                          key={ws.id}
                          onClick={() => {
                            playXboxSound('select');
                            setWorkspaceId(ws.id);
                            setIsWorkspaceDropdownOpen(false);
                            if (onShowNotification) {
                              onShowNotification(`Espace activé : ${ws.name}`, 'success');
                            }
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-teal-500/25 text-white font-bold border border-teal-400/40 shadow-2xs'
                              : 'hover:bg-white/10 text-slate-200 hover:text-white font-medium border border-transparent'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs truncate font-medium text-white">{ws.name}</span>
                              {ws.category === 'organisationnel' && (
                                <span className="text-[8px] px-1 py-0.2 bg-teal-500/30 text-teal-200 font-semibold rounded">
                                  Org
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 truncate">{ws.subtitle}</span>
                          </div>
                          {isActive ? (
                            <span className="text-[9px] bg-teal-500 text-white font-semibold px-1.5 py-0.2 rounded-full shrink-0">
                              Actif
                            </span>
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. SITE SELECTOR ROW */}
      <div className="relative min-w-0 shrink-0">
        <button
          type="button"
          onClick={() => {
            playXboxSound('toggle');
            setIsSiteDropdownOpen((prev) => !prev);
            setIsWorkspaceDropdownOpen(false);
          }}
          className={`group w-full flex items-center justify-between gap-1 px-2 py-0.5 rounded-full transition-all cursor-pointer text-[10px] sm:text-[11px] font-semibold leading-tight border ${
            selectedSite
              ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/40 text-amber-200 shadow-amber-500/10'
              : 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-200 hover:text-white'
          }`}
          title={selectedSite ? `Site actuel : ${selectedSite.name}` : 'Choisir un site'}
        >
          <div className="flex items-center gap-1 min-w-0 truncate">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                selectedSite ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="hidden sm:inline text-slate-300 font-normal shrink-0 text-[9px] sm:text-[10px]">
              Site:
            </span>
            <span
              className={`truncate text-[10px] sm:text-[11px] ${
                selectedSite ? 'text-amber-300 font-extrabold' : 'text-slate-300 font-medium'
              }`}
            >
              {selectedSite ? selectedSite.shortName : 'Tous les sites'}
            </span>
          </div>
          <ChevronDown
            className={`w-2.5 h-2.5 shrink-0 transition-transform duration-200 ${
              selectedSite ? 'text-amber-300' : 'text-slate-300'
            } ${isSiteDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Site Dropdown Panel */}
        {isSiteDropdownOpen && (
          <div className="fixed sm:absolute left-2 right-2 sm:left-0 sm:right-auto top-12 sm:top-full mt-1.5 w-auto sm:w-80 max-w-sm bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-2 z-50 text-white animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/20">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 border-b border-white/10 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                <span>Sélection du Site</span>
              </span>
              <span className="text-[9px] font-medium text-amber-200 bg-amber-500/20 border border-amber-400/30 px-1.5 py-0.2 rounded">
                {availableSites.length} sites
              </span>
            </div>

            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-0.5 scrollbar-thin">
              {/* Option: All Sites (No Filter) */}
              <button
                type="button"
                onClick={() => handleSelectSite(null)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                  !selectedSite
                    ? 'bg-amber-500/20 text-white font-bold border border-amber-400/30'
                    : 'hover:bg-white/10 text-slate-200 hover:text-white font-medium'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Tous les sites (Aperçu global)</span>
                  <span className="text-[10px] text-slate-400">Aucun filtre de site appliqué</span>
                </div>
                {!selectedSite && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </button>

              <div className="my-1 h-px bg-white/10" />

              {/* Site Items List */}
              {availableSites.map((site) => {
                const isActive = selectedSite?.uuid === site.uuid;
                return (
                  <button
                    key={site.uuid}
                    type="button"
                    onClick={() => handleSelectSite(site)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/25 text-white font-bold border border-amber-400/40 shadow-xs'
                        : 'hover:bg-white/10 text-slate-200 hover:text-white font-medium border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{site.name}</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-500/30 text-amber-200 rounded border border-amber-400/20 shrink-0">
                          {site.shortName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate mt-0.5">{site.head} • {site.memberCount} membres</span>
                    </div>

                    {isActive ? (
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded-full shrink-0">
                        Actif
                      </span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Alias for compatibility
export const WorkspaceAndServiceSelectorsColumn = WorkspaceAndSiteSelectorsColumn;
