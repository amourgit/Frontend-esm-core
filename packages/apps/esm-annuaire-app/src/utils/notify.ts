import { showToast } from '@egen-civitas/esm-framework';

// =============================================================================
//  NOTIFY — Pont entre les callbacks `onShowNotification` / `onShowToast`
//  copiés de Civitas---GED et le système de toasts du framework (showToast).
// =============================================================================

type GedToastType = 'success' | 'info' | 'warning' | 'error';

export function notify(message: string, type: GedToastType = 'info') {
  showToast({ description: message, kind: type });
}
