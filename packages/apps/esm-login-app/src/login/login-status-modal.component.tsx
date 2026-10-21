import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Loader, PartyPopper, X } from 'lucide-react';
import { GlassButton } from './ui/glass-button.component';
import { TextLoop } from './ui/text-loop.component';

export type LoginModalStatus = 'closed' | 'loading' | 'error' | 'success';

/** Durée (s) d'affichage de chaque message pendant l'authentification. */
export const LOADING_STEP_INTERVAL = 1.5;

interface LoginStatusModalProps {
  status: LoginModalStatus;
  errorMessage: string;
  onClose: () => void;
}

/**
 * Modal plein écran des états de connexion : vérification en cours (messages
 * qui défilent), erreur (avec retour au formulaire) et succès.
 */
export const LoginStatusModal: React.FC<LoginStatusModalProps> = ({ status, errorMessage, onClose }) => {
  const { t } = useTranslation();

  const loadingSteps = [
    t('loginVerifying', 'Verifying your credentials...'),
    t('loginSecuring', 'Securing your session...'),
    t('loginPreparing', 'Preparing your workspace...'),
  ];

  useEffect(() => {
    if (status !== 'error') {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [status, onClose]);

  return (
    <AnimatePresence>
      {status !== 'closed' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative mx-2 flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border-4 border-border bg-card/80 p-8"
          >
            {(status === 'error' || status === 'success') && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t('close', 'Close')}
                className="absolute right-2 top-2 p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            {status === 'error' && (
              <>
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-center text-lg font-medium text-foreground">{errorMessage}</p>
                <GlassButton onClick={onClose} size="sm" className="mt-4">
                  {t('tryAgain', 'Try again')}
                </GlassButton>
              </>
            )}

            {status === 'loading' && (
              <TextLoop interval={LOADING_STEP_INTERVAL} stopOnEnd>
                {loadingSteps.map((message) => (
                  <div key={message} className="flex flex-col items-center gap-4">
                    <Loader className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium text-foreground">{message}</p>
                  </div>
                ))}
              </TextLoop>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-4">
                <PartyPopper className="h-12 w-12 text-green-500" />
                <p className="text-lg font-medium text-foreground">{t('loginSuccess', 'Welcome aboard!')}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
