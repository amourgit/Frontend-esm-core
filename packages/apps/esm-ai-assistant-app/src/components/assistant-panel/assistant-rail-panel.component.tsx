import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const session = useSession();
  const aiEnabled = useAIEnabled();

  if (!session?.authenticated || !session?.user?.person) return null;
  if (!aiEnabled) {
    return (
      <p style={{ padding: '1rem' }} data-ai-ignore>
        {t('assistantDisabled', "L'assistant IA n'est pas activé sur cet environnement.")}
      </p>
    );
  }

  return (
    <div data-ai-ignore style={{ height: '100%' }}>
      <AssistantPanel onClose={() => closeToolWindow('bottom', ASSISTANT_TOOL_WINDOW)} />
    </div>
  );
};

export default AssistantRailPanel;
