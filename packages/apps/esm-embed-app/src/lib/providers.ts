import type { ExtensionInfo, HostProviders, Unsub } from '@egen-civitas/esm-embed-host';

export type { ExtensionInfo };

/** Outil IA déclaré par une app embarquée (le Core le rend appelable par l'agent ; le backend garde l'autorité et la validation). */
export interface AiToolDescriptor {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

/**
 * Services dont LE CORE EST LA SOURCE, injectés (testables sans le Shell) ; l'implémentation réelle est dans `core-services.ts`.
 * Règle d'or (docs/integration-apps/17 §2) : ni identité/session, ni droits, ni thème, ni appels API relayés : l'app embarquée
 * les obtient auprès de leurs sources (Keycloak, backends, service de thèmes).
 */
export interface CoreServices {
  getLocale(): string;
  subscribeLocale?(cb: (locale: string) => void): Unsub;
  getTenantId(): string | undefined;
  isFeatureEnabled(name: string): boolean;
  notify(n: { kind: 'info' | 'success' | 'warning' | 'error'; title: string; subtitle?: string; timeoutMs?: number }): void;
  /** Dialogue de confirmation du Core (le Core garde la maîtrise de l'interface). */
  confirm(d: { title: string; message: string; danger?: boolean }): Promise<boolean>;
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ctx: Record<string, unknown> | undefined, from: string): void;
  /** Extensions attachées à un slot (déjà filtrées par privilèges et drapeaux côté Core). */
  listExtensions(slot: string): ExtensionInfo[];
  subscribeExtensions(slot: string, cb: () => void): Unsub;
  registerAiTools(moduleName: string, tools: AiToolDescriptor[], invoke: (name: string, args: Record<string, unknown>) => Promise<unknown>): void;
  unregisterAiTools(moduleName: string, names: string[]): void;
}

/** Nom de l'événement DOM qui porte le bus : le Core et les apps internes peuvent y publier/écouter sans dépendre de ce paquet. */
export const EGEN_EVENT = 'egen:event';

export interface EventDetail {
  topic: string;
  payload?: unknown;
  /** Module émetteur ; absent pour le Core lui-même. */
  from?: string;
}

/**
 * Bus d'événements : un `CustomEvent` `egen:event` sur `window` (`detail: { topic, payload, from? }`).
 * Contrat ouvert : `window.dispatchEvent(new CustomEvent('egen:event', { detail: { topic: 'core.x', payload } }))`.
 * Les droits (publier sous `app.<route>.*`, écouter `core.*`…) sont appliqués par l'hôte selon les grants ; un abonné reçoit aussi ses propres publications.
 */
export function createEventBridge(win: Window = window): NonNullable<HostProviders['events']> {
  return {
    publish(topic, payload, ctx) {
      win.dispatchEvent(new CustomEvent<EventDetail>(EGEN_EVENT, { detail: { topic, payload, from: ctx.moduleName } }));
    },
    subscribe(topic, cb) {
      const listener = (e: Event) => {
        const d = (e as CustomEvent<EventDetail>).detail;
        if (d && d.topic === topic) cb(d.payload);
      };
      win.addEventListener(EGEN_EVENT, listener);
      return () => win.removeEventListener(EGEN_EVENT, listener);
    },
  };
}

/** Fenêtre de dédoublonnage des toasts d'une même app portant le même `id` (ms). */
export const TOAST_DEDUPE_MS = 5000;
const recentToasts = new Map<string, number>();

/** `true` si ce toast (app + id) est nouveau ; mémorise sa date. Les toasts sans `id` ne sont jamais dédoublonnés. */
function isFreshToast(moduleName: string, id: string | undefined, now: number = Date.now()): boolean {
  if (!id) return true;
  for (const [k, t] of recentToasts) if (now - t >= TOAST_DEDUPE_MS) recentToasts.delete(k);
  const key = `${moduleName}:${id}`;
  if (recentToasts.has(key)) return false;
  recentToasts.set(key, now);
  return true;
}

/** Vide la mémoire de dédoublonnage (tests). */
export function resetToastDedupe(): void {
  recentToasts.clear();
}

/**
 * Les 12 capacités du SDK sont servies : langue, tenant, drapeaux, événements, notifications, dialogues, configuration publique
 * de l'app, extensions (découverte), outils IA, télémétrie, navigation et cycle de vie (ces deux dernières par l'hôte).
 */
export function createCoreProviders(core: CoreServices, entry: { config?: Record<string, unknown>; title?: string } = {}, win: Window = window): HostProviders {
  return {
    locale: { get: () => core.getLocale(), subscribe: core.subscribeLocale ? (cb) => core.subscribeLocale!(cb) : undefined },
    tenant: { get: () => ({ id: core.getTenantId() ?? null }) },
    config: { get: () => entry.config ?? {} },
    flags: { isEnabled: (name) => core.isFeatureEnabled(name) },
    events: createEventBridge(win),
    // Le Core est l'afficheur : toast attribué à son app d'origine (anti-usurpation : une iframe ne peut pas se faire passer pour le Core)
    // et dédoublonné par `id`. `false` = non affiché (doublon) : l'app en est informée.
    notifications: {
      // Le booléen retourné est lu par l'hôte (`{ displayed }`) : `true` affiché, `false` doublon.
      show: (n, ctx) => {
        if (!isFreshToast(ctx.moduleName, n.id)) return false;
        const { id: _id, ...toast } = n;
        const source = entry.title?.trim();
        core.notify({ ...toast, subtitle: source ? (toast.subtitle ? `${source} · ${toast.subtitle}` : source) : toast.subtitle });
        return true;
      },
    },
    dialogs: { confirm: (d) => core.confirm(d) },
    extensions: { list: (slot) => core.listExtensions(slot), subscribe: (slot, cb) => core.subscribeExtensions(slot, () => cb(core.listExtensions(slot))) },
    aiTools: { register: (m, tools, invoke) => core.registerAiTools(m, tools, invoke), unregister: (m, names) => core.unregisterAiTools(m, names) },
    telemetry: { log: (level, message, ctx, from) => core.log(level, message, ctx, from.moduleName), metric: () => undefined },
  };
}
