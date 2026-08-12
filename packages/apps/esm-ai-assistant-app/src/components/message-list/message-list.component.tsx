import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@egen-civitas/esm-framework';
import type { ConfigSchema } from '../../config-schema';
import type { AssistantMessage } from '../../hooks/use-ai-chat';
import MessageBubble from '../message-bubble/message-bubble.component';
import styles from './message-list.scss';

interface MessageListProps {
  messages: AssistantMessage[];
  onSuggestionClick: (text: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, onSuggestionClick }) => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className={styles.list} role="log" aria-live="polite" aria-label={t('conversation', 'Conversation')}>
      {messages.length === 0 && (
        <div className={styles.welcome}>
          <p className={styles.welcomeText}>{config.assistant.welcomeMessage}</p>
          {config.assistant.suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {config.assistant.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={styles.suggestionChip}
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
