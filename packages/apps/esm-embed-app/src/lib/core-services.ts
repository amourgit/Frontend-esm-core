import { getFeatureFlag, getLocale, getSessionStore, getTenantId, showSnackbar, userHasAccess } from '@egen-civitas/esm-framework';
import type { CoreServices } from './providers';

/** Branchement réel sur les services du Core (esm-framework). */
export const coreServices: CoreServices = {
  getSession() {
    const s = getSessionStore().getState();
    return s.loaded ? (s.session as unknown as Record<string, unknown>) : null;
  },
  subscribeSession(cb) {
    return getSessionStore().subscribe((s) => cb(s.loaded ? (s.session as unknown as Record<string, unknown>) : null));
  },
  getLocale: () => getLocale(),
  subscribeLocale(cb) {
    const i18n = (window as unknown as { i18next?: { on?: (e: string, f: (l: string) => void) => void; off?: (e: string, f: (l: string) => void) => void } }).i18next;
    if (!i18n?.on || !i18n.off) return () => undefined;
    i18n.on('languageChanged', cb);
    return () => i18n.off!('languageChanged', cb);
  },
  getTenantId: () => getTenantId(),
  isFeatureEnabled: (name) => getFeatureFlag(name),
  userHasAccess(privilege) {
    const s = getSessionStore().getState();
    return s.loaded && !!s.session.user ? userHasAccess(privilege, s.session.user) : false;
  },
  notify: (n) => showSnackbar({ title: n.title, subtitle: n.subtitle, kind: n.kind, timeoutInMs: n.timeoutMs }),
  log(level, message, ctx, from) {
    // eslint-disable-next-line no-console
    (console[level] ?? console.log)(`[embed:${from}] ${message}`, ctx ?? '');
  },
};
