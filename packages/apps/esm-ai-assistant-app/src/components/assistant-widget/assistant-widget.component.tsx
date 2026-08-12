import React, { useEffect, useState } from 'react';
import { useSession, useOnClickOutside } from '@egen-civitas/esm-framework';
import { useAIEnabled } from '@egen-civitas/esm-ai-framework';
import AssistantLauncher from '../assistant-launcher/assistant-launcher.component';
import AssistantPanel from '../assistant-panel/assistant-panel.component';
import styles from './assistant-widget.scss';

// =============================================================================
//  ASSISTANT WIDGET — Racine du widget flottant
//
//  RESPONSABILITÉS :
//    • N'affiche rien tant que l'utilisateur n'est pas connecté (même garde
//      que Footer / TopBar).
//    • N'affiche rien si la Couche 1 IA est désactivée (EGEN_AI_ENABLED=false)
//      — dégradation propre, aucune erreur, juste une absence silencieuse.
//    • Ferme le panneau au clic extérieur (même hook que QuickAccessButton
//      dans esm-primary-navigation-app).
// =============================================================================

const AssistantWidget: React.FC = () => {
  const session = useSession();
  const aiEnabled = useAIEnabled();
  const [open, setOpen] = useState(false);
  const wrapperRef = useOnClickOutside<HTMLDivElement>(() => setOpen(false), open);

  // Ferme le panneau si l'utilisateur navigue (single-spa routing event) —
  // évite qu'une conversation reste ouverte au-dessus d'une nouvelle page
  // sans rapport, tout en conservant l'historique (la conversation n'est
  // pas effacée, juste masquée).
  useEffect(() => {
    const handleRouting = () => setOpen(false);
    window.addEventListener('single-spa:routing-event', handleRouting);
    return () => window.removeEventListener('single-spa:routing-event', handleRouting);
  }, []);

  if (!session?.authenticated || !session?.user?.person) return null;
  if (!aiEnabled) return null;

  return (
    <div ref={wrapperRef} className={styles.widgetWrapper}>
      {open && (
        <div className={styles.panelSlot}>
          <AssistantPanel onClose={() => setOpen(false)} />
        </div>
      )}
      <AssistantLauncher open={open} onToggle={() => setOpen((v) => !v)} />
    </div>
  );
};

export default AssistantWidget;
