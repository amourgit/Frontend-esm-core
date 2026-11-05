import React from 'react';
import { closeToolWindow, useSession } from '@egen-civitas/esm-framework';
import { useAIEnabled } from '@egen-civitas/esm-ai-framework';
import AssistantPanel from './assistant-panel.component';
import { ASSISTANT_TOOL_WINDOW } from '../../constants';

/**
 * Contenu de la zone du bas « Assistant » (rail droit, groupe bas) : le panneau de conversation.
 * Garde : rien tant que l'utilisateur n'est pas connecté ou si la Couche 1 IA est désactivée.
 * `data-ai-ignore` : l'agent ne lit pas son propre panneau (read_page, describe_screen…).
 */
const AssistantRailPanel: React.FC = () => {
  const session = useSession();
  const aiEnabled = useAIEnabled();

  if (!session?.authenticated || !session?.user?.person || !aiEnabled) return null;

  return (
    <div data-ai-ignore style={{ height: '100%' }}>
      <AssistantPanel onClose={() => closeToolWindow('bottom', ASSISTANT_TOOL_WINDOW)} />
    </div>
  );
};

export default AssistantRailPanel;
