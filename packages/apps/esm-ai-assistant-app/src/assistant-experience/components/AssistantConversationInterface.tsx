'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  X,
  Square,
  Radio,
  Mic,
} from 'lucide-react';
import { useAssistantVoice } from '../context/AssistantGlobalVoiceContext';
import { playXboxSound , PromptInput } from '@egen-civitas/esm-styleguide';

interface AssistantConversationInterfaceProps {
  onClose?: () => void;
  onOpenDedicatedVoice?: () => void;
}

export function AssistantConversationInterface({
  onClose,
  onOpenDedicatedVoice,
}: AssistantConversationInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isAgentSpeaking,
    isProcessing,
    streamingText,
    outputVolume,
    messages,
    error,
    sendTextMessage,
    stopAgentSpeech,
  } = useAssistantVoice();

  // Auto-scroll vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isProcessing]);

  const handlePromptSubmit = async (
    value: string,
    _meta: { model: string; effort: string; attachments: File[] }
  ) => {
    if (!value.trim() || isProcessing) return;
    playXboxSound('select');
    await sendTextMessage(value);
  };

  return (
    <div className="relative z-40 w-full h-full flex flex-col justify-between select-none pointer-events-auto bg-none bg-transparent">
      
      {/* Barre d'action discrète en haut à droite */}
      <div className="flex justify-end items-center gap-2 shrink-0 mb-1">
        {onOpenDedicatedVoice && (
          <button
            type="button"
            onClick={() => {
              playXboxSound('select');
              if (onClose) onClose();
              onOpenDedicatedVoice();
            }}
            className="px-2.5 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-400/25 transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md text-[11px] font-medium"
            title="Basculer vers l'Espace Audio Dédié (Sphère & Voix)"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span className="hidden sm:inline">Espace Audio Dédié</span>
          </button>
        )}

        {onClose && (
          <button
            type="button"
            onClick={() => {
              playXboxSound('toggle');
              onClose();
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all cursor-pointer border-none flex items-center justify-center backdrop-blur-md"
            title="Fermer l'overlay 3D"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Zone des Messages - Défilement fluide sans cadre */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 mb-3 scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent bg-none bg-transparent">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isAudioPending = msg.content?.startsWith('🎤 Transcription en cours');
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18 }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-teal-500/25 backdrop-blur-md text-white rounded-br-xs border border-teal-500/20'
                      : 'bg-white/10 backdrop-blur-md text-slate-100 rounded-bl-xs border border-white/10'
                  }`}
                >
                  {/* Badge Vocal si message audio */}
                  {msg.type === 'audio' && (
                    <div className="flex items-center gap-1.5 text-[10px] text-teal-300 font-semibold mb-1 select-none">
                      <Mic className="w-3 h-3 text-teal-400" />
                      <span>Message vocal transcrit</span>
                    </div>
                  )}

                  {isAudioPending ? (
                    <div className="flex items-center gap-2 text-teal-200/90 py-0.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                      <span className="italic text-xs">Transcription vocale en cours...</span>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap select-text font-normal">
                      {msg.content}
                    </p>
                  )}

                  {msg.timestamp && (
                    <div
                      className={`text-[9px] mt-1 text-right select-none ${
                        isUser ? 'text-teal-200/50' : 'text-slate-400/50'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Bulle Streaming en cours */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-2.5 bg-white/10 backdrop-blur-md text-slate-100 rounded-bl-xs">
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-teal-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                <span>En cours...</span>
              </div>
              <p className="whitespace-pre-wrap select-text text-xs sm:text-sm">
                {streamingText || "L'agent formule la réponse..."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Message d'erreur éventuel */}
        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-200 text-xs text-center backdrop-blur-md">
            ⚠️ {error.message || 'Une erreur est survenue.'}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Indicateur vocal léger si l'IA parle */}
      {isAgentSpeaking && (
        <div className="mb-2 flex items-center justify-between px-2 shrink-0 bg-none bg-transparent">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 animate-pulse text-xs">
            <Volume2 className="w-3.5 h-3.5 text-teal-300" />
            <span className="text-[11px]">En train de parler...</span>
            <div className="flex items-center gap-0.5 h-2.5 ml-1">
              {[40, 90, 60, 100, 70].map((h, i) => (
                <span
                  key={i}
                  className="w-0.5 bg-teal-300 rounded-full"
                  style={{
                    height: `${Math.max(20, Math.min(100, (outputVolume / 100) * h))}%`,
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={stopAgentSpeech}
              className="ml-1 p-0.5 text-white/70 hover:text-white cursor-pointer border-none bg-transparent"
              title="Couper la voix"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
            </button>
          </div>
        </div>
      )}

      {/* Composant de Saisie Réutilisable PromptInput positionné tout en bas */}
      <div className="relative z-50 w-full flex justify-center shrink-0 pt-1 bg-none bg-transparent">
        <PromptInput
          onSubmit={handlePromptSubmit}
          placeholder="Posez votre question..."
          className="w-full"
        />
      </div>

    </div>
  );
}

export default AssistantConversationInterface;
