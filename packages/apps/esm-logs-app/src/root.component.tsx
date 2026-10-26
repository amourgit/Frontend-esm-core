import { useEffect } from 'react';
import { setToolWindowBadge } from '@egen-civitas/esm-framework';
import { LOGS_TOOL_ID } from './constants';
import { useLogStats } from './logs/log-store';

// Racine permanente, sans rendu : publie le nombre d'erreurs sur le bouton du rail, zone fermée comprise.
const Root: React.FC = () => {
  const { error } = useLogStats();

  useEffect(() => {
    setToolWindowBadge(LOGS_TOOL_ID, error);
    return () => setToolWindowBadge(LOGS_TOOL_ID, null);
  }, [error]);

  return null;
};

export default Root;
