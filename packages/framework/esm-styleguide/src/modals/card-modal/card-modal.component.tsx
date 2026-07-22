/** @category CardModal */
import React, { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import classNames from 'classnames';
import { CloseIcon } from '../../icons';
import { DecoratedCard } from '../../cards/decorated-card';
import { cardModalAnimationPresets } from './card-modal.animations';
import type { CardModalAnimationConfig, CardModalProps } from './card-modal.types';
import styles from './card-modal.module.scss';

const isPresetConfig = (
  animation: CardModalProps['animation'],
): animation is CardModalAnimationConfig => typeof animation === 'object' && animation !== null;

/**
 * `CardModal` — modal générique dont le CONTENEUR VISUEL est n'importe
 * quelle variante de `DecoratedCard` (`cardVariant` + `cardProps`, transmis
 * tels quels au `DecoratedCard` interne — exactement comme le ferait une app
 * qui l'utiliserait directement). Le modal, lui, ne gère que ce qui lui est
 * propre : ouverture/fermeture, overlay, animation d'entrée/sortie,
 * déplacement à la souris.
 *
 * Zéro code de gestion d'état requis pour un usage simple (`trigger` +
 * `children` suffisent) ; tout est surchargeable (`open`/`onOpenChange`
 * contrôlés, `animation` déclarative ou variants framer-motion 100% custom,
 * rendu du bouton de fermeture...).
 *
 * @example Usage minimal
 * ```tsx
 * <CardModal trigger={<button>Ouvrir</button>} cardVariant="glass" animation="zoom">
 *   <p>Contenu du modal</p>
 * </CardModal>
 * ```
 *
 * @example Combinaison libre
 * ```tsx
 * <CardModal
 *   cardVariant="dots"
 *   cardProps={{ title: 'Confirmation', dotsColor: 'var(--colors-warning-500)' }}
 *   animation={{ preset: 'slide-up', duration: 0.4 }}
 *   draggable
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * >
 *   <p>Voulez-vous continuer ?</p>
 * </CardModal>
 * ```
 */
export const CardModal: React.FC<CardModalProps> = ({
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  children,
  showCloseButton = true,
  renderCloseButton,
  cardVariant = 'default',
  cardProps,
  draggable = false,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showOverlay = true,
  lockScroll = true,
  animation = 'scale',
  overlayAnimation,
  className,
  style,
  overlayClassName,
  width = '32rem',
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (!isControlled) {
        setInternalOpen(next);
      }
    },
    [onOpenChange, isControlled],
  );

  const close = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen || !lockScroll) {
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, lockScroll]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, close]);

  const animationConfig: CardModalAnimationConfig = isPresetConfig(animation) ? animation : { preset: animation };
  const variants = animationConfig.variants ?? cardModalAnimationPresets[animationConfig.preset ?? 'scale'];
  const transition = {
    duration: animationConfig.duration ?? 0.25,
    ease: animationConfig.ease ?? [0.16, 1, 0.3, 1],
  };
  const overlayTransition = {
    duration: overlayAnimation?.duration ?? 0.2,
    ease: overlayAnimation?.ease ?? 'easeOut',
  };

  const modalMarkup = (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.root}>
          {showOverlay && (
            <motion.div
              className={classNames(styles.overlay, overlayClassName)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={overlayTransition}
              onClick={closeOnOverlayClick ? close : undefined}
              aria-hidden="true"
            />
          )}

          <div className={styles.centerLayer}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={cardProps?.title ? titleId : undefined}
              className={classNames(styles.panel, className)}
              style={{ width, ...style }}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              drag={draggable}
              dragMomentum={false}
              dragElastic={0.12}
              whileDrag={draggable ? { cursor: 'grabbing' } : undefined}
            >
              <DecoratedCard variant={cardVariant} {...cardProps}>
                {showCloseButton &&
                  (renderCloseButton ? (
                    renderCloseButton(close)
                  ) : (
                    <button type="button" className={styles.closeButton} onClick={close} aria-label="Fermer">
                      <CloseIcon size={18} />
                    </button>
                  ))}
                {children}
              </DecoratedCard>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {trigger && (
        <span className={styles.triggerWrap} onClick={() => setOpen(true)}>
          {trigger}
        </span>
      )}
      {mounted && createPortal(modalMarkup, document.body)}
    </>
  );
};

export default CardModal;
