import React, { useState } from 'react';
import { Search, ChevronDown, Check, SlidersHorizontal, X } from 'lucide-react';
import { playXboxSound } from '@egen-civitas/esm-framework';

interface CollaborateurReviewFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDuration: string;
  onDurationChange: (duration: string) => void;
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
}

export const DURATION_OPTIONS = [
  { id: 'all', label: 'All duration' },
  { id: '30d', label: 'Last 30 days' },
  { id: '6m', label: 'Last 6 months' },
  { id: '1y', label: 'This year' },
];

export const CHANNEL_OPTIONS = [
  { id: 'all', label: 'All channels' },
  { id: 'online', label: 'Online Store' },
  { id: 'internal', label: 'Internal Portal' },
  { id: 'projects', label: 'Project Commits' },
];

export function CollaborateurReviewFilterBar({
  searchQuery,
  onSearchChange,
  selectedDuration,
  onDurationChange,
  selectedChannel,
  onChannelChange,
}: CollaborateurReviewFilterBarProps) {
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [isChannelOpen, setIsChannelOpen] = useState(false);

  const durationLabel = DURATION_OPTIONS.find(d => d.id === selectedDuration)?.label || 'Duration';
  const channelLabel = CHANNEL_OPTIONS.find(c => c.id === selectedChannel)?.label || 'Channels';

  return (
    <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 select-none">
      
      {/* Search Input (Transparent pill/box) */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="w-full pl-10 pr-9 py-2 rounded-xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-white/35 text-sm text-white placeholder-slate-400 outline-none backdrop-blur-md transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Duration Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              playXboxSound('toggle');
              setIsDurationOpen(prev => !prev);
              setIsChannelOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs sm:text-sm font-medium text-slate-200 hover:text-white backdrop-blur-md transition-all"
          >
            <span>{selectedDuration === 'all' ? 'Duration' : durationLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDurationOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDurationOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-black/75 border border-white/20 backdrop-blur-xl shadow-2xl p-1.5 z-40 flex flex-col gap-0.5">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    playXboxSound('select');
                    onDurationChange(opt.id);
                    setIsDurationOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                    selectedDuration === opt.id
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedDuration === opt.id && <Check className="w-3.5 h-3.5 text-teal-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Channels Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              playXboxSound('toggle');
              setIsChannelOpen(prev => !prev);
              setIsDurationOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs sm:text-sm font-medium text-slate-200 hover:text-white backdrop-blur-md transition-all"
          >
            <span>{selectedChannel === 'all' ? 'Channels' : channelLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isChannelOpen ? 'rotate-180' : ''}`} />
          </button>

          {isChannelOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-black/75 border border-white/20 backdrop-blur-xl shadow-2xl p-1.5 z-40 flex flex-col gap-0.5">
              {CHANNEL_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    playXboxSound('select');
                    onChannelChange(opt.id);
                    setIsChannelOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                    selectedChannel === opt.id
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedChannel === opt.id && <Check className="w-3.5 h-3.5 text-teal-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
