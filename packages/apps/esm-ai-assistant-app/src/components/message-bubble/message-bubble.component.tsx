import React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import type { AssistantMessage } from '../../hooks/use-ai-chat';
import styles from './message-bubble.scss';

const NavigateGlyph: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 1.5l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5L1.5 8l4.5-2 2-4.5z"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckGlyph: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ErrorGlyph: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 4.5v5M8 12v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const SpinnerGlyph: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.spin}>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.25" />
    <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const MessageBubble: React.FC<{ message: AssistantMessage }> = ({ message }) => {
  const { t } = useTranslation();
  const isUser = message.role === 'user';

  return (
    <div className={classNames(styles.row, { [styles.rowUser]: isUser })}>
      <div className={classNames(styles.bubble, { [styles.bubbleUser]: isUser, [styles.bubbleAssistant]: !isUser })}>
        {message.content && <p className={styles.text}>{message.content}</p>}

        {!message.content && message.status === 'streaming' && (!message.toolCalls || message.toolCalls.length === 0) && (
          <span className={styles.typingDots} aria-label={t('assistantThinking', "L'assistant réfléchit…")}>
            <span />
            <span />
            <span />
          </span>
        )}

        {message.toolCalls && message.toolCalls.length > 0 && (
          <ul className={styles.toolList} aria-label={t('assistantActions', "Actions exécutées par l'assistant")}>
            {message.toolCalls.map((call) => (
              <li key={call.id} className={classNames(styles.toolItem, styles[`toolItem_${call.status}`])}>
                <span className={styles.toolIcon}>
                  {call.status === 'pending' && <SpinnerGlyph />}
                  {call.status === 'success' && <CheckGlyph />}
                  {call.status === 'error' && <ErrorGlyph />}
                </span>
                <span className={styles.toolLabel}>
                  {call.tool === 'navigate' && <NavigateGlyph />}
                  {call.resultSummary ?? call.tool}
                </span>
              </li>
            ))}
          </ul>
        )}

        {message.status === 'error' && !message.content && (
          <p className={styles.text}>{t('assistantError', "Une erreur est survenue.")}</p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
