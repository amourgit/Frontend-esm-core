// =============================================================================
//  Types du widget conversationnel (Layer 2)
// =============================================================================

export type ChatRole = 'user' | 'assistant' | 'system';

/** Un appel de tool effectué par l'assistant pendant un tour de conversation */
export interface ChatToolCall {
  id: string;
  toolId: string;
  args: Record<string, unknown>;
  status: 'running' | 'success' | 'error';
  resultSummary?: string;
  durationMs?: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** Texte affiché (peut être vide si le tour ne contient que des tool calls) */
  text: string;
  /** Horodatage ISO */
  createdAt: string;
  /** Tool calls déclenchés par ce message assistant, le cas échéant */
  toolCalls?: ChatToolCall[];
  /** Message d'erreur si l'appel au LLM ou l'exécution a échoué */
  error?: string;
  /** En cours de génération (streaming/attente de réponse) */
  pending?: boolean;
}
