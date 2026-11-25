import type { HostProviders, Unsub } from '@egen-civitas/esm-embed-host';

/**
 * Services du Core dont les apps embarquées ont besoin. Injectés (testables sans le Shell) ;
 * l'implémentation réelle est dans `core-services.ts`.
 */
export interface CoreServices {
  /** Session courante, ou `null` tant qu'elle n'est pas chargée. Le filtrage par champs est fait par l'hôte (grant `session.fields`). */
  getSession(): Record<string, unknown> | null;
  subscribeSession(cb: (session: Record<string, unknown> | null) => void): Unsub;
  getLocale(): string;
  subscribeLocale?(cb: (locale: string) => void): Unsub;
  getTenantId(): string | undefined;
  isFeatureEnabled(name: string): boolean;
  userHasAccess(privilege: string): boolean;
  notify(n: { kind: 'info' | 'success' | 'warning' | 'error'; title: string; subtitle?: string; timeoutMs?: number }): void;
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ctx: Record<string, unknown> | undefined, from: string): void;
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

/**
 * Fournisseurs servis aujourd'hui : session, langue, tenant, drapeaux, permissions, événements, notifications, télémétrie.
 * Volontairement absents (donc refusés `UNAVAILABLE` à la négociation, jamais promis puis cassés) :
 *  - `theme`      : en attente du moteur de thème retenu par la réforme (contrat `{ mode, tokens }` indépendant du moteur) ;
 *  - `api`        : en attente du contrat d'authentification/tenant de `egenFetch` côté Core ;
 *  - `dialogs`, `ai-tools`, `config` : pas de contrat générique côté Core pour l'instant.
 */
export function createCoreProviders(core: CoreServices, win: Window = window): HostProviders {
  return {
    session: { get: () => core.getSession() ?? undefined, subscribe: (cb) => core.subscribeSession((s) => cb(s ?? undefined)) },
    locale: { get: () => core.getLocale(), subscribe: core.subscribeLocale ? (cb) => core.subscribeLocale!(cb) : undefined },
    tenant: { get: () => ({ id: core.getTenantId() ?? null }) },
    flags: { isEnabled: (name) => core.isFeatureEnabled(name) },
    permissions: { can: (p) => core.userHasAccess(p) },
    events: createEventBridge(win),
    notifications: { show: (n) => core.notify(n) },
    telemetry: { log: (level, message, ctx, from) => core.log(level, message, ctx, from.moduleName), metric: () => undefined },
  };
}
