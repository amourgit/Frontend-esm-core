import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useConfig, useSession } from '@egen/esm-framework';
import type { ConfigSchema } from '../../config-schema';
import { useSpeechRecognition } from '../../hooks/use-speech-recognition';
import styles from './chat-input.scss';

const SendIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 8l12-6-4 6 4 6-12-6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
  </svg>
);

const MicIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="6" y="1.5" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M3.5 7.5a4.5 4.5 0 009 0M8 12v2.5M5.5 14.5h5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const StopIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" />
  </svg>
);

interface ChatInputProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ disabled, onSend }) => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const session = useSession();
  const [value, setValue] = useState('');

  const handleFinalTranscript = useCallback((text: string) => {
    setValue((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const { supported: micSupported, listening, start, stop } = useSpeechRecognition(
    session?.locale ?? 'fr',
    handleFinalTranscript,
  );

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }, [value, disabled, onSend]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const showMic = config.assistant.micEnabled && micSupported;

  return (
    <div className={styles.wrapper}>
      {listening && (
        <div className={styles.listeningIndicator} aria-live="polite">
          {t('assistantListening', 'Je vous écoute…')}
        </div>
      )}
      <div className={styles.inputRow}>
        <textarea
          className={styles.textarea}
          rows={1}
          value={value}
          placeholder={config.assistant.placeholder}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={t('assistantMessageInput', 'Message à envoyer à l’assistant')}
        />

        {showMic && (
          <button
            type="button"
            className={classNames(styles.iconButton, { [styles.iconButtonActive]: listening })}
            aria-label={
              listening
                ? t('assistantStopListening', "Arrêter l'écoute")
                : t('assistantStartListening', 'Dicter un message')
            }
            aria-pressed={listening}
            onClick={() => (listening ? stop() : start())}
          >
            {listening ? <StopIcon /> : <MicIcon />}
          </button>
        )}

        <button
          type="button"
          className={classNames(styles.iconButton, styles.sendButton)}
          aria-label={t('assistantSend', 'Envoyer')}
          disabled={disabled || value.trim().length === 0}
          onClick={submit}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
