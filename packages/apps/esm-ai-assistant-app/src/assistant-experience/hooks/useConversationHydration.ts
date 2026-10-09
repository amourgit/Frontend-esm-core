import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { getConversationClient, useAIChannelState, type HistoryMessagePayload } from '@egen-civitas/esm-ai-framework';
import type { AssistantMode } from '@egen-civitas/esm-styleguide';
import type { ConversationHistoryMessage } from '../services/agentConversationService';

function toUiMessage(m: HistoryMessagePayload): ConversationHistoryMessage {
  const transcript = m.transcript || (m.type === 'audio' ? m.content : undefined);
  return {
    id: m.id,
    role: m.role,
    content: transcript || m.content,
    type: m.type ?? 'text',
    timestamp: m.timestamp ?? '',
    mode: m.mode as AssistantMode | undefined,
    transcript,
  };
}

/**
 * L'historique de référence est tenu par le backend : à chaque (re)connexion, si l'écran est
 * vide, on le réhydrate depuis le backend ; un historique poussé spontanément remplace l'affichage.
 * Aucune copie locale n'est conservée (ni localStorage, ni mémoire côté frontend).
 */
export function useConversationHydration(
  isEmpty: boolean,
  setMessages: Dispatch<SetStateAction<ConversationHistoryMessage[]>>,
): void {
  const { status } = useAIChannelState();
  const emptyRef = useRef(isEmpty);
  emptyRef.current = isEmpty;

  useEffect(() => {
    if (status !== 'ready') return;
    const client = getConversationClient();
    if (!client) return;
    let cancelled = false;

    if (emptyRef.current) {
      client
        .fetchHistory(5000)
        .then((history) => {
          if (!cancelled && emptyRef.current && history.length > 0) setMessages(history.map(toUiMessage));
        })
        .catch(() => undefined); // backend sans historique : écran vide, sans bruit
    }

    const off = client.onHistory((history) => setMessages(history.map(toUiMessage)));
    return () => {
      cancelled = true;
      off();
    };
  }, [status, setMessages]);
}
