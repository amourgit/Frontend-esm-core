'use client';

import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AssistantRobotScene } from '../robot/lazy';
import { RobotController, type AssistantState } from '../robot/controller';
import { AssistantConversationInterface } from './AssistantConversationInterface';
import { type AssistantMode } from '@egen-civitas/esm-styleguide';
import { useAssistantVoice } from '../context/AssistantGlobalVoiceContext';
import { ASSISTANT_ROBOT_FRAMING } from '../constants';

interface AssistantPageOverlayProps {
  isActive: boolean;
  mode?: AssistantMode;
  onSelectMode?: (mode: AssistantMode) => void;
  onClose?: () => void;
  onOpenDedicatedVoice?: () => void;
}

/**
 * Traduit ce que fait l'assistant (voix) en comportement du robot :
 * il parle → gestes d'accompagnement ; il réfléchit → main au menton ; l'utilisateur parle → il écoute.
 */
function toRobotState(s: { isAgentSpeaking: boolean; isProcessing: boolean; isListening: boolean; isSpeaking: boolean }): AssistantState {
  if (s.isAgentSpeaking) return 'speaking';
  if (s.isProcessing) return 'thinking';
  if (s.isListening || s.isSpeaking) return 'listening';
  return 'idle';
}

export function AssistantPageOverlay({ isActive, onClose, onOpenDedicatedVoice }: AssistantPageOverlayProps) {
  const voice = useAssistantVoice();
  // Un seul contrôleur pour toute la vie de l'overlay : il garde position, regard et geste en cours.
  const controller = useMemo(() => new RobotController(), []);

  // À l'ouverture, le robot salue.
  useEffect(() => {
    if (isActive) void controller.play('greet');
    else controller.stopGesture();
  }, [isActive, controller]);

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: isActive ? 1 : 0,
        scale: isActive ? 1 : 0.98,
      }}
      transition={{
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`fixed inset-0 z-30 bg-[#030708] overflow-hidden ${
        isActive ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
      }`}
      aria-hidden={!isActive}
    >
      {/* 1. Robot 3D : prend TOUTE LA PAGE ; le rendu est suspendu quand l'overlay est fermé. */}
      <div
        className="absolute inset-0 w-full h-full z-0 select-none overflow-hidden bg-transparent pointer-events-auto md:pr-[480px] lg:pr-[540px]"
        style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 62%, rgba(45,212,191,0.12), rgba(3,7,8,0) 70%)' }}
      >
        <AssistantRobotScene
          controller={controller}
          state={toRobotState(voice)}
          speechLevel={Math.min(1, Math.max(0, voice.outputVolume))}
          framing={ASSISTANT_ROBOT_FRAMING}
          paused={!isActive}
        />
      </div>

      {/* 2. Interface de Conversation : Positionnée sur la DROITE DU CANVAS avec transparence totale */}
      <div className="relative z-10 ml-auto w-full md:w-[480px] lg:w-[540px] max-w-full h-full flex flex-col justify-between pt-20 sm:pt-24 pb-3 sm:pb-4 px-4 sm:px-6 md:px-8 bg-transparent pointer-events-none">
        {isActive && (
          <AssistantConversationInterface
            onClose={onClose}
            onOpenDedicatedVoice={onOpenDedicatedVoice}
          />
        )}
      </div>
    </motion.div>
  );
}

export default AssistantPageOverlay;
