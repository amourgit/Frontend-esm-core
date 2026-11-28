import React, { Suspense, lazy } from 'react';
import { CardModal } from '@egen-civitas/esm-framework';
import styles from './change-language-card-modal.module.css';

const ChangeLanguageModalContent = lazy(() => import('./change-language.modal'));

interface ChangeLanguageCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Fenêtre de choix de la langue — `CardModal` (variante de carte `plus`, animation d'ouverture/fermeture
 * `zoom`). Le contenu reste chargé à la demande (lazy) comme l'ancienne route `modals`.
 */
export function ChangeLanguageCardModal({ open, onOpenChange }: ChangeLanguageCardModalProps) {
  return (
    <CardModal
      open={open}
      onOpenChange={onOpenChange}
      cardVariant="plus"
      animation="zoom"
      showCloseButton={false}
      style={{ width: '100%', maxWidth: '32rem' }}
      overlayClassName={styles.overlay}
      cardProps={{ contentStyle: { padding: 0 } }}
    >
      <Suspense fallback={null}>
        <ChangeLanguageModalContent close={() => onOpenChange(false)} />
      </Suspense>
    </CardModal>
  );
}

export default ChangeLanguageCardModal;
