'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Square,
  Bot,
  Sparkles,
  PhoneCall,
  X,
} from 'lucide-react';
import { useAgentConversationContext } from '../context/AgentConversationContext';
import { playXboxSound } from '@egen-civitas/esm-styleguide';

interface FloatingVoiceWidgetProps {
  isFullscreenActive: boolean;
  onToggleFullscreen: () => void;
}

export function FloatingVoiceWidget({
  isFullscreenActive,
  onToggleFullscreen,
}: FloatingVoiceWidgetProps) {
  const {
    isListening,
    isSpeaking,
    isPausing,
    isProcessing,
    isAgentSpeaking,
    audioVolume,
    outputVolume,
    isAudioOutputEnabled,
    isContinuousVoiceMode,
    setIsAudioOutputEnabled,
    setIsContinuousVoiceMode,
    startVoiceListening,
    stopVoiceListening,
    stopAgentSpeech,
    cancelVoiceListening,
    messages,
  } = useAgentConversationContext();

  const [isMinimized, setIsMinimized] = useState(false);

  // If already in fullscreen 3D overlay, hide the floating pill
  if (isFullscreenActive) return null;

  // Active state : when listening, speaking, processing, or if messages exist
  const isSessionActive = isListening || isAgentSpeaking || isProcessing;

  const lastMessage = messages.slice(-1)[0];

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none pointer-events-auto">
      <AnimatePresence>
        {isSessionActive && !isMinimized ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex flex-col gap-2 p-3 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.6)] text-white w-72 sm:w-80"
          >
            {/* Header & Statut Vocal */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative">
                  <div className="w-7 h-7 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
                    <Bot className="w-4 h-4" />
                  </div>
                  {isSessionActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white flex items-center gap-1.5 truncate">
                    <span>Assistant Vocal Actif</span>
                    {isContinuousVoiceMode && (
                      <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Duplex
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-teal-200/80 truncate">
                    {isAgentSpeaking
                      ? "L'Assistant vous parle..."
                      : isSpeaking
                      ? isPausing
                        ? '⏳ En pause (reprise du souffle)'
                        : '🗣️ Voix détectée'
                      : isListening
                      ? '🎙️ En écoute (VAD actif)'
                      : isProcessing
                      ? 'Génération Gemini...'
                      : 'En veille'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playXboxSound('select');
                    onToggleFullscreen();
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer border-none"
                  title="Agrandir en Plein Écran 3D"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer border-none"
                  title="Réduire"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visualiseur de Volume / Onde */}
            <div className="flex items-center justify-between bg-black/30 rounded-xl px-3 py-2 border border-white/5">
              <div className="flex items-center gap-1.5 h-4">
                {isAgentSpeaking ? (
                  [30, 80, 50, 100, 70, 90, 40].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-teal-400 rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(20, Math.min(100, (outputVolume / 100) * h))}%`,
                      }}
                    />
                  ))
                ) : isListening ? (
                  [20, 60, 40, 90, 50, 80, 30].map((h, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        isSpeaking ? 'bg-rose-400' : 'bg-slate-500'
                      }`}
                      style={{
                        height: `${Math.max(20, Math.min(100, (audioVolume / 100) * h))}%`,
                      }}
                    />
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">Micro en pause</span>
                )}
              </div>

              {/* Contrôles Rapides */}
              <div className="flex items-center gap-1.5">
                {isAgentSpeaking && (
                  <button
                    type="button"
                    onClick={stopAgentSpeech}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/30 text-rose-300 transition-all cursor-pointer border-none"
                    title="Couper la voix de l'agent"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    playXboxSound('toggle');
                    if (isListening) stopVoiceListening();
                    else startVoiceListening();
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer border-none flex items-center justify-center ${
                    isListening
                      ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                      : 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
                  }`}
                  title={isListening ? 'Mettre en pause' : 'Réactiver micro'}
                >
                  {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Dernier Message Audio/Texte Transcrit */}
            {lastMessage && (
              <div className="text-[10.5px] text-slate-300 leading-tight line-clamp-2 px-1 select-text">
                <span className="text-teal-300 font-bold">{lastMessage.role === 'user' ? 'Vous' : 'IA'}: </span>
                {lastMessage.content}
              </div>
            )}
          </motion.div>
        ) : (
          /* Bouton Flottant Compact Réduit */
          <motion.button
            type="button"
            onClick={() => {
              playXboxSound('select');
              if (isMinimized) setIsMinimized(false);
              else onToggleFullscreen();
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl border shadow-2xl transition-all cursor-pointer ${
              isSessionActive
                ? 'bg-teal-600/40 backdrop-blur-2xl border-teal-400/50 text-white ring-2 ring-teal-400/30'
                : 'bg-black/35 backdrop-blur-2xl border-white/15 text-slate-200 hover:text-white hover:bg-black/50'
            }`}
            title="Ouvrir l'Assistant Vocal Permanent"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-4 h-4 text-teal-300" />
              {isSessionActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              )}
            </div>
            <span className="text-xs font-semibold">
              {isAgentSpeaking ? 'IA Parle...' : isListening ? 'En écoute...' : 'Assistant IA'}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
