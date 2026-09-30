'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  SlidersHorizontal,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Sparkles,
  Radio,
  RotateCcw,
} from 'lucide-react';
import { RecursiveErosionBackground, RECURSIVE_EROSION_DEFAULTS , playXboxSound } from '@egen-civitas/esm-styleguide';
import { useAssistantVoice } from '../context/AssistantGlobalVoiceContext';
import { ASSISTANT_MODES, type AssistantMode } from '@egen-civitas/esm-styleguide';

interface DedicatedAudioVisualSpaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DedicatedAudioVisualSpace({
  isOpen,
  onClose,
}: DedicatedAudioVisualSpaceProps) {
  const {
    assistantMode,
    setAssistantMode,
    isVoiceActive,
    isListening,
    isSpeaking,
    isPausing,
    isAgentSpeaking,
    isProcessing,
    streamingText,
    messages,
    audioVolume,
    outputVolume,
    silenceToleranceMs,
    setSilenceToleranceMs,
    startVoiceSession,
    stopVoiceSession,
    toggleVoiceSession,
    stopAgentSpeech,
  } = useAssistantVoice();

  // Paramètres visuels personnalisables pour l'effet de sphère de particules
  const [effectMode, setEffectMode] = useState<'dark' | 'light'>(
    RECURSIVE_EROSION_DEFAULTS.mode
  );
  const [hue, setHue] = useState<number>(RECURSIVE_EROSION_DEFAULTS.hue);
  const [saturation, setSaturation] = useState<number>(
    RECURSIVE_EROSION_DEFAULTS.saturation
  );
  const [brightness, setBrightness] = useState<number>(
    RECURSIVE_EROSION_DEFAULTS.brightness
  );

  // Panneau de configuration discret
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'audio' | 'visual'>(
    'audio'
  );
  const settingsRef = useRef<HTMLDivElement>(null);

  // Démarrage automatique du canal audio lorsque l'espace dédié s'ouvre
  useEffect(() => {
    if (isOpen) {
      if (!isVoiceActive) {
        startVoiceSession().catch(() => {});
      }
    }
  }, [isOpen, isVoiceActive, startVoiceSession]);

  // Fermeture du menu de configuration lors d'un clic extérieur
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSettingsOpen]);

  // Gestion de la touche Echap pour fermer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSettingsOpen]);

  const handleClose = () => {
    playXboxSound('toggle');
    setIsSettingsOpen(false);
    onClose();
  };

  const handleResetVisuals = () => {
    playXboxSound('select');
    setEffectMode(RECURSIVE_EROSION_DEFAULTS.mode);
    setHue(RECURSIVE_EROSION_DEFAULTS.hue);
    setSaturation(RECURSIVE_EROSION_DEFAULTS.saturation);
    setBrightness(RECURSIVE_EROSION_DEFAULTS.brightness);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] w-screen h-screen bg-[#0a0908] text-white select-none overflow-hidden"
    >
      {/* 1. ARRIÈRE-PLAN PLEIN ÉCRAN : Sphère de particules Recursive Erosion */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto">
        <RecursiveErosionBackground
          mode={effectMode}
          hue={hue}
          saturation={saturation}
          brightness={brightness}
          className="w-full h-full"
        />
      </div>

      {/* 2. BOUTONS DISCRETS EN HAUT À DROITE */}
      <div className="fixed top-5 right-5 z-20 flex items-center gap-2.5 pointer-events-auto">
        {/* Bouton Paramètres discret */}
        <div className="relative" ref={settingsRef}>
          <button
            type="button"
            onClick={() => {
              playXboxSound('select');
              setIsSettingsOpen((prev) => !prev);
            }}
            className={`p-2.5 rounded-full transition-all duration-300 cursor-pointer border border-white/10 backdrop-blur-xl ${
              isSettingsOpen
                ? 'bg-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                : 'bg-black/30 hover:bg-white/10 text-white/50 hover:text-white/90 shadow-sm'
            }`}
            title="Paramètres de l'espace audio"
            aria-label="Paramètres"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Panneau de configuration flottant en verre translucide */}
          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-3 w-80 p-4 rounded-2xl bg-[#0e0c0b]/80 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.8)] text-white text-xs z-30"
              >
                {/* Onglets Paramètres */}
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl mb-4 border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      playXboxSound('select');
                      setActiveSettingsTab('audio');
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                      activeSettingsTab === 'audio'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/50 hover:text-white/80 bg-transparent'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Audio & Voix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playXboxSound('select');
                      setActiveSettingsTab('visual');
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                      activeSettingsTab === 'visual'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/50 hover:text-white/80 bg-transparent'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Visuel & Effet</span>
                  </button>
                </div>

                {/* Contenu Onglet Audio */}
                {activeSettingsTab === 'audio' && (
                  <div className="space-y-3.5">
                    {/* Statut & Toggle du canal vocal */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isVoiceActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-white/5 text-white/40'
                          }`}
                        >
                          {isVoiceActive ? (
                            <Mic className="w-3.5 h-3.5 animate-pulse" />
                          ) : (
                            <MicOff className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">
                            Microphone IA
                          </div>
                          <div className="text-[10px] text-white/50">
                            {isVoiceActive ? 'Canal duplex actif' : 'Désactivé'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playXboxSound('toggle');
                          toggleVoiceSession();
                        }}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
                          isVoiceActive
                            ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {isVoiceActive ? 'Actif' : 'Activer'}
                      </button>
                    </div>

                    {/* Mode de fonctionnement de l'agent */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                        Mode Opérationnel
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.values(ASSISTANT_MODES).map((mode) => {
                          const isSelected = assistantMode === mode.id;
                          return (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => {
                                playXboxSound('select');
                                setAssistantMode(mode.id);
                              }}
                              className={`p-2 rounded-xl text-left transition-all cursor-pointer border flex flex-col gap-0.5 ${
                                isSelected
                                  ? `${mode.color.bg} ${mode.color.border} text-white`
                                  : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 text-white/60'
                              }`}
                            >
                              <span className="text-[11px] font-semibold">
                                {mode.shortName}
                              </span>
                              <span className="text-[9px] text-white/40 truncate">
                                {mode.tagline}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tolérance de silence & respiration */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                          Tolérance silence & respiration
                        </label>
                        <span className="font-mono text-[11px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                          {(silenceToleranceMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        Délai d'attente avant la fin de parole pour vous laisser respirer et marquer des pauses sans coupure.
                      </p>
                      <div className="grid grid-cols-4 gap-1 pt-0.5">
                        {[
                          { label: 'Rapide', ms: 1200 },
                          { label: 'Naturel', ms: 1600 },
                          { label: 'Posé', ms: 2200 },
                          { label: 'Patient', ms: 2800 },
                        ].map((preset) => (
                          <button
                            key={preset.ms}
                            type="button"
                            onClick={() => {
                              playXboxSound('select');
                              setSilenceToleranceMs(preset.ms);
                            }}
                            className={`py-1.5 px-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer text-center ${
                              Math.abs(silenceToleranceMs - preset.ms) < 50
                                ? 'bg-amber-500/25 border-amber-400/50 text-amber-200 shadow-sm'
                                : 'bg-white/[0.03] border-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white'
                            }`}
                          >
                            <div>{preset.label}</div>
                            <div className="text-[9px] opacity-70">{(preset.ms / 1000).toFixed(1)}s</div>
                          </button>
                        ))}
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="3200"
                        step="100"
                        value={silenceToleranceMs}
                        onChange={(e) => setSilenceToleranceMs(Number(e.target.value))}
                        className="w-full mt-1.5 accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Interruption de parole */}
                    {isAgentSpeaking && (
                      <button
                        type="button"
                        onClick={() => {
                          playXboxSound('back');
                          stopAgentSpeech();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Interrompre la voix de l'IA</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Contenu Onglet Visuel */}
                {activeSettingsTab === 'visual' && (
                  <div className="space-y-3">
                    {/* Thème clair / sombre */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/70">Thème Fond</span>
                      <button
                        type="button"
                        onClick={() => {
                          playXboxSound('toggle');
                          setEffectMode((prev) =>
                            prev === 'dark' ? 'light' : 'dark'
                          );
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        {effectMode === 'dark' ? (
                          <>
                            <Moon className="w-3 h-3 text-sky-400" />
                            <span>Sombre</span>
                          </>
                        ) : (
                          <>
                            <Sun className="w-3 h-3 text-amber-400" />
                            <span>Clair</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Curseur Teinte (Hue) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white/60">Teinte (Hue)</span>
                        <span className="font-mono text-white/80">{hue}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={hue}
                        onChange={(e) => setHue(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Curseur Saturation */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white/60">Saturation</span>
                        <span className="font-mono text-white/80">
                          {Math.round(saturation * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Curseur Luminosité */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white/60">Luminosité</span>
                        <span className="font-mono text-white/80">
                          {Math.round(brightness * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.35"
                        max="1.65"
                        step="0.05"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Bouton Réinitialiser */}
                    <button
                      type="button"
                      onClick={handleResetVisuals}
                      className="w-full mt-1 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Réinitialiser les réglages visuels</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bouton Fermer discret */}
        <button
          type="button"
          onClick={handleClose}
          className="p-2.5 rounded-full bg-black/30 hover:bg-white/15 text-white/50 hover:text-white/90 border border-white/10 backdrop-blur-xl transition-all duration-300 cursor-pointer shadow-sm"
          title="Quitter l'espace audio"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3. MINIMAL LIVE AUDIO STATUS & SUBTITLES DISCRETS (au bas de l'écran, sans gêner) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 max-w-xl w-[90%] pointer-events-none select-none">
        {/* Bulle de transcription ou de réponse streaming en direct */}
        {(streamingText || isProcessing) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-white text-xs leading-relaxed text-center shadow-2xl max-w-full"
          >
            <p className="line-clamp-3 select-text font-normal text-amber-200/95">
              {streamingText || "L'assistant analyse votre message vocal..."}
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/[0.08] text-white/70 shadow-lg text-xs"
        >
          {isAgentSpeaking ? (
            <div className="flex items-center gap-2 text-amber-300">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-medium tracking-wide">
                L'Assistant parle...
              </span>
              <div className="flex items-center gap-0.5 h-2.5 ml-1">
                {[40, 90, 60, 100, 50].map((h, i) => (
                  <span
                    key={i}
                    className="w-0.5 bg-amber-300 rounded-full"
                    style={{
                      height: `${Math.max(
                        25,
                        Math.min(100, (outputVolume / 100) * h)
                      )}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : isSpeaking ? (
            isPausing ? (
              <div className="flex items-center gap-2 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-medium tracking-wide">
                  En pause (reprise du souffle)...
                </span>
                <span className="text-[10px] text-amber-200/70 hidden sm:inline">
                  L'assistant attend
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-medium tracking-wide">
                  Voix détectée...
                </span>
                <span className="font-mono text-[10px] text-emerald-400/80">
                  {audioVolume}%
                </span>
              </div>
            )
          ) : isListening ? (
            <div className="flex items-center gap-2 text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
              <span className="text-[11px] tracking-wide">
                Parlez librement, l'assistant vous écoute
              </span>
            </div>
          ) : isProcessing ? (
            <div className="flex items-center gap-2 text-sky-300">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">Réflexion en cours...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/40 text-[11px]">
              <MicOff className="w-3 h-3" />
              <span>Micro en pause</span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default DedicatedAudioVisualSpace;
