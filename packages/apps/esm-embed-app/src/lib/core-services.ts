import {
  getAssignedExtensions,
  getExtensionRegistration,
  getExtensionStore,
  getFeatureFlag,
  getLocale,
  getSessionStore,
  getTenantId,
  hasTool,
  registerTool,
  removeTool,
  showSnackbar,
  userHasAccess,
} from '@egen-civitas/esm-framework';
import { confirmDialog } from './confirm';
import { embedToolId, toToolDefinition } from './ai-tools';
import type { CoreServices, ExtensionInfo } from './providers';

/** Clone JSON-sûr (une `meta` d'extension peut contenir des valeurs non transmissibles par postMessage). */
function jsonSafe<T>(v: T): T {
  try {
    return JSON.parse(JSON.stringify(v)) as T;
  } catch {
    return {} as T;
  }
}

/** L'utilisateur peut-il voir cette extension ? Le Core reste l'autorité d'affichage : privilèges et drapeau de l'enregistrement. */
function isVisible(extensionId: string): boolean {
  const reg = getExtensionRegistration(extensionId);
  if (!reg) return false;
  if (reg.featureFlag && !getFeatureFlag(reg.featureFlag)) return false;
  const privileges = reg.privileges;
  if (privileges === undefined || (Array.isArray(privileges) && privileges.length === 0)) return true;
  const s = getSessionStore().getState();
  return s.loaded && !!s.session.user ? userHasAccess(privileges, s.session.user) : false;
}

export function listExtensions(slot: string): ExtensionInfo[] {
  return getAssignedExtensions(slot)
    .filter((e) => isVisible(e.id))
    .map((e) => ({ name: e.name, moduleName: e.moduleName, order: getExtensionRegistration(e.id)?.order, meta: jsonSafe(e.meta as Record<string, unknown>) }));
}

/** Branchement réel sur les services du Core (esm-framework). */
export const coreServices: CoreServices = {
  getLocale: () => getLocale(),
  subscribeLocale(cb) {
    const i18n = (window as unknown as { i18next?: { on?: (e: string, f: (l: string) => void) => void; off?: (e: string, f: (l: string) => void) => void } }).i18next;
    if (!i18n?.on || !i18n.off) return () => undefined;
    i18n.on('languageChanged', cb);
    return () => i18n.off!('languageChanged', cb);
  },
  getTenantId: () => getTenantId(),
  isFeatureEnabled: (name) => getFeatureFlag(name),
  notify: (n) => showSnackbar({ title: n.title, subtitle: n.subtitle, kind: n.kind, timeoutInMs: n.timeoutMs }),
  confirm: (d) => confirmDialog(d),
  log(level, message, ctx, from) {
    // eslint-disable-next-line no-console
    (console[level] ?? console.log)(`[embed:${from}] ${message}`, ctx ?? '');
  },
  listExtensions,
  subscribeExtensions(slot, cb) {
    // On ne notifie que si la liste visible a réellement changé (le store d'extensions bouge pour bien d'autres raisons).
    let last = JSON.stringify(listExtensions(slot));
    return getExtensionStore().subscribe(() => {
      const next = JSON.stringify(listExtensions(slot));
      if (next !== last) {
        last = next;
        cb();
      }
    });
  },
  registerAiTools(moduleName, tools, invoke) {
    for (const t of tools) {
      const def = toToolDefinition(moduleName, t, invoke);
      if (hasTool(def.id)) removeTool(def.id); // réenregistrement après rechargement de l'iframe
      registerTool(def);
    }
  },
  unregisterAiTools(moduleName, names) {
    for (const n of names) removeTool(embedToolId(moduleName, n));
  },
};
