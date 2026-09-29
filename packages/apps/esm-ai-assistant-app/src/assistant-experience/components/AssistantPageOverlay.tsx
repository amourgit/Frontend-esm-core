'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SplineScene } from '@egen-civitas/esm-styleguide';
import { AssistantConversationInterface } from './AssistantConversationInterface';
import { type AssistantMode } from '@egen-civitas/esm-styleguide';

interface AssistantPageOverlayProps {
  isActive: boolean;
  mode?: AssistantMode;
  onSelectMode?: (mode: AssistantMode) => void;
  onClose?: () => void;
  onOpenDedicatedVoice?: () => void;
  sceneUrl?: string;
}

export function AssistantPageOverlay({ 
  isActive, 
  onClose,
  onOpenDedicatedVoice,
  sceneUrl = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
}: AssistantPageOverlayProps) {
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
      {/* 1. Canvas 3D Spline Scene : Prend TOUTE LA PAGE (absolute inset-0 w-full h-full) */}
      <div className="absolute inset-0 w-full h-full z-0 select-none overflow-hidden flex items-center justify-center bg-transparent pointer-events-auto">
        <SplineScene
          scene={sceneUrl}
          className="w-full h-full"
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
