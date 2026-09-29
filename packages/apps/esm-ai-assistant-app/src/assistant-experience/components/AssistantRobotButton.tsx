'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Zap,
  Cpu,
  Check,
  Radio,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { type AssistantMode, ASSISTANT_MODES, type AssistantModeConfig } from '@egen-civitas/esm-styleguide';
import { playXboxSound } from '@egen-civitas/esm-styleguide';
import { WaterGlassModal } from '@egen-civitas/esm-styleguide';
import { useAssistantBridge } from '../assistant-bridge';
import { LiveOrb } from '@egen-civitas/esm-styleguide';

interface AssistantRobotButtonProps {
  currentMode?: AssistantMode;
  onSelectMode?: (mode: AssistantMode) => void;
  isFullscreenActive: boolean;
  onToggleFullscreen: () => void;
  onOpenDedicatedVoice?: () => void;
  className?: string;
}

const BADGE_ICONS: Record<AssistantModeConfig['iconName'], React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Search,
  Zap,
  Cpu,
};

const LONG_PRESS_DURATION = 3000; // 3 seconds

export function AssistantRobotButton({
  isFullscreenActive,
  onToggleFullscreen,
  onOpenDedicatedVoice,
  className = '',
}: AssistantRobotButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const {
    assistantMode,
    isVoiceActive,
    isListening,
    isSpeaking,
    isAgentSpeaking,
    audioVolume,
    outputVolume,
    toggleVoiceSession,
    stopAgentSpeech,
    setAssistantMode,
  } = useAssistantBridge();

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const modeConfig = ASSISTANT_MODES[assistantMode] || ASSISTANT_MODES.conversation;
  const BadgeIcon = BADGE_ICONS[modeConfig.iconName] || MessageSquare;

  // Fermeture automatique au clic en dehors
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, []);

  // Gestion du maintien 3s
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Uniquement clic gauche / touch principal

    startTimeRef.current = performance.now();
    setIsHolding(true);
    setHoldProgress(0);

    const step = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(100, (elapsed / LONG_PRESS_DURATION) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        playXboxSound('toastSuccess');
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 500);

        onToggleFullscreen();
        setIsHolding(false);
        setHoldProgress(0);
        timerRef.current = null;
        return;
      }

      timerRef.current = requestAnimationFrame(step);
    };

    timerRef.current = requestAnimationFrame(step);
  };

  const handlePointerUp = () => {
    const wasShortClick = holdProgress < 25 && isHolding;

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    setIsHolding(false);
    setHoldProgress(0);

    // Clic court standard : bascule le menu rapide
    if (wasShortClick) {
      playXboxSound('toggle');
      setIsOpen((prev) => !prev);
    }
  };

  const handlePointerLeave = () => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  };

  const strokeDashoffset = 100 - holdProgress;

  return (
    <div ref={containerRef} className={`relative inline-flex items-center justify-center select-none h-full ${className}`}>
      {/* Trigger Button Libre, sans bordure ni background restrictif, prenant 100% de la hauteur disponible */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative h-10 w-10 sm:h-11 sm:w-11 p-0 m-0 border-0 bg-transparent shadow-none outline-none flex items-center justify-center cursor-pointer select-none touch-none transition-transform duration-200 ${
          isHolding ? 'scale-95' : justCompleted ? 'scale-110' : 'hover:scale-105 active:scale-95'
        }`}
        title={`Assistant IA [${modeConfig.name}] — ${isVoiceActive ? 'Vocal ACTIF (Audio Duplex)' : 'Clic pour configurer / Maintien 3s Overlay 3D'}`}
        aria-label={`Assistant IA Mode ${modeConfig.name}`}
      >
        {/* Halo d'aura lumineuse subtile lors de l'activité vocale */}
        {isVoiceActive && (
          <div
            className={`absolute inset-0 rounded-full blur-md pointer-events-none transition-opacity duration-300 ${
              isAgentSpeaking
                ? 'bg-emerald-400/35 animate-pulse'
                : isSpeaking
                ? 'bg-teal-400/40 animate-pulse'
                : 'bg-white/20'
            }`}
          />
        )}

        {/* Agent WebGL LiveOrb Blanc prenant 100% de la hauteur disponible */}
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          <LiveOrb
            size={38}
            variant="white"
            interactive={true}
            blink={true}
          />
        </div>

        {/* Anneau de maintien 3 secondes */}
        {isHolding && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
            viewBox="0 0 36 36"
          >
            <path
              className="text-white/10"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-teal-400"
              strokeDasharray="100, 100"
              strokeDashoffset={strokeDashoffset}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
        )}

        {/* Badge Indicateur de Mode discret */}
        <span
          className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold shadow-md transition-colors duration-200 z-10 ${
            isVoiceActive
              ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-500/50 animate-pulse'
              : `${modeConfig.color.badgeBg} ${modeConfig.color.badgeText}`
          }`}
          title={`Mode: ${modeConfig.name}`}
        >
          {isVoiceActive ? (
            <Radio className="w-2 h-2" />
          ) : (
            <BadgeIcon className="w-2 h-2 stroke-[2.5]" />
          )}
        </span>
      </button>

      {/* Mode Selector & Audio Channel Modal via WaterGlassModal */}
      {isOpen && (
        <WaterGlassModal
          align="right"
          width="w-72"
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-black/40 border border-white/20 shrink-0">
                  <LiveOrb size={32} variant="white" interactive={true} blink={true} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white leading-tight">
                    Assistant EGEN
                  </h3>
                  <p className="text-[10px] text-teal-300 font-medium">
                    Avatar LiveOrb Blanc & Vocal
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    playXboxSound('toggle');
                    onToggleFullscreen();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border-none"
                  title={isFullscreenActive ? "Fermer l'overlay 3D" : "Ouvrir l'overlay 3D plein écran"}
                >
                  {isFullscreenActive ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          }
          onClose={() => setIsOpen(false)}
        >
          <div className="space-y-3">
            {/* CANAL VOCAL PERMANENT (DUAL-DUPLEX) */}
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Radio className={`w-3.5 h-3.5 ${isVoiceActive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold text-white">Canal Vocal IA</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playXboxSound('toggle');
                    toggleVoiceSession();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none flex items-center gap-1 ${
                    isVoiceActive
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {isVoiceActive ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                  <span>{isVoiceActive ? 'ACTIF' : 'ACTIVER'}</span>
                </button>
              </div>

              {/* Statut live du micro & synthèse */}
              {isVoiceActive && (
                <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    {isAgentSpeaking ? (
                      <>
                        <Volume2 className="w-3 h-3 text-teal-300 animate-pulse" />
                        <span className="text-teal-300 font-medium">L'IA parle</span>
                        <div className="flex items-center gap-0.5 h-2.5 ml-1">
                          {[40, 80, 50, 100, 60].map((h, i) => (
                            <span
                              key={i}
                              className="w-0.5 bg-teal-300 rounded-full"
                              style={{ height: `${Math.max(20, Math.min(100, (outputVolume / 100) * h))}%` }}
                            />
                          ))}
                        </div>
                      </>
                    ) : isListening ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-emerald-300 font-medium">
                          {isSpeaking ? '🗣️ Voix détectée' : '🎙️ En écoute (VAD)'}
                        </span>
                        {isSpeaking && (
                          <span className="font-mono text-[9px] text-emerald-400 ml-1">
                            {audioVolume}%
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">Prêt</span>
                    )}
                  </div>

                  {isAgentSpeaking && (
                    <button
                      type="button"
                      onClick={stopAgentSpeech}
                      className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer border-none bg-transparent"
                    >
                      Couper
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SÉLECTION DU MODE DE FONCTIONNEMENT */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Modes Opérationnels
                </span>
                <span className="text-[10px] text-teal-400 font-mono">
                  {modeConfig.name}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {Object.values(ASSISTANT_MODES).map((mode) => {
                  const isSelected = assistantMode === mode.id;
                  const ModeIcon = BADGE_ICONS[mode.iconName] || MessageSquare;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        playXboxSound('select');
                        setAssistantMode(mode.id);
                      }}
                      className={`w-full p-2 rounded-xl text-left transition-all cursor-pointer border flex items-center justify-between ${
                        isSelected
                          ? `${mode.color.bg} ${mode.color.border} ${mode.color.ring} ring-1`
                          : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isSelected ? `${mode.color.badgeBg} ${mode.color.badgeText}` : 'bg-white/5 text-slate-400'
                          }`}
                        >
                          <ModeIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white leading-tight">
                            {mode.name}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight">
                            {mode.tagline}
                          </div>
                        </div>
                      </div>

                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RACCOURCIS MODES */}
            <div className="space-y-1.5 pt-1">
              {onOpenDedicatedVoice && (
                <button
                  type="button"
                  onClick={() => {
                    playXboxSound('select');
                    onOpenDedicatedVoice();
                    setIsOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Espace Audio Dédié (Sphère & Voix)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  playXboxSound('select');
                  onToggleFullscreen();
                  setIsOpen(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/30 text-teal-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isFullscreenActive ? "Fermer l'Overlay 3D" : "Ouvrir l'Overlay 3D (ou maintenir 3s)"}</span>
              </button>
            </div>
          </div>
        </WaterGlassModal>
      )}
    </div>
  );
}

export default AssistantRobotButton;
