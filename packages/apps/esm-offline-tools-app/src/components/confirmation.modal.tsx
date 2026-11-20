import type { ReactNode } from 'react';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@egen-civitas/esm-framework';
import React from 'react';

export interface ConfirmationModalProps {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  children?: ReactNode;
  closeModal: () => void;
  onConfirm?(): void;
  onCancel?(): void;
}

/**
 * A confirmation modal provided globally by the offline tools.
 * Used by extensions providing offline tools UI elements.
 *
 * The modal can be configured with the above props.
 * Several design aspects (e.g. the color and the general content) are preconfigured to match the
 * design linked below.
 *
 * Designs: https://egen.alpha.vercel.com/design-system
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  confirmText,
  cancelText,
  children,
  closeModal,
  onConfirm,
  onCancel,
}) => {
  return (
    <>
      <ModalHeader title={title} onClose={closeModal} />
      <ModalBody>{children}</ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onCancel ?? closeModal}>
          {cancelText}
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            closeModal?.();
            onConfirm?.();
          }}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </>
  );
};

export default ConfirmationModal;
