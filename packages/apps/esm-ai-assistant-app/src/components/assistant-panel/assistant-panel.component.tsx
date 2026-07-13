import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig, CloseIcon } from '@egen/esm-framework';
import type { ConfigSchema } from '../../config-schema';
import { useAIChat } from '../../hooks/use-ai-chat';
import MessageList from '../message-list/message-list.component';
import ChatInput from '../chat-input/chat-input.component';
import styles from './assistant-panel.scss';

const ResetIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M13.5 8A5.5 5.5 0 112.9 5.5M2.5 2.5v3.5H6"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface AssistantPanelProps {
  onClose: () => void;
}

const AssistantPanel: React.FC<AssistantPanelProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const { messages, sending, error, sendMessage, clearConversation } = useAIChat();

  return (
    <div className={styles.panel} role="dialog" aria-label={config.assistant.name}>
      <header className={styles.header}>
        <div className={styles.headerIdentity}>
          <span className={styles.avatar} aria-hidden="true">
            ✦
          </span>
          <span className={styles.assistantName}>{config.assistant.name}</span>
        </div>
        <div className={styles.headerActions}>
          {messages.length > 0 && (
            <button
              type="button"
              className={styles.headerButton}
              aria-label={t('assistantNewConversation', 'Nouvelle conversation')}
              onClick={clearConversation}
            >
              <ResetIcon />
            </button>
          )}
          <button
            type="button"
            className={styles.headerButton}
            aria-label={t('assistantClose', "Fermer l'assistant")}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      <MessageList messages={messages} onSuggestionClick={sendMessage} />

      {error && (
        <div className={styles.errorBanner} role="alert">
          {t('assistantConnectionError', "Connexion à l'assistant impossible pour le moment.")}
        </div>
      )}

      <ChatInput disabled={sending} onSend={sendMessage} />

      {config.company.name && (
        <div className={styles.footer}>
          {config.company.url ? (
            <a href={config.company.url} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              {t('assistantPoweredBy', 'Propulsé par {{company}}', { company: config.company.name })}
            </a>
          ) : (
            <span>{t('assistantPoweredBy', 'Propulsé par {{company}}', { company: config.company.name })}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AssistantPanel;
