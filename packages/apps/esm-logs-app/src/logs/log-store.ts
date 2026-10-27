/* eslint-disable no-console -- la capture de la console est le but de ce module */
import { useSyncExternalStore } from 'react';
import { stripAnsi } from './ansi';

// =============================================================================
//  STORE DES LOGS — source unique de l'app Logs système
//
//  Deux origines alimentent le même flux :
//   · terminal  : sortie complète de `egen develop` (processus principal + serveur de dev de
//                 chaque app), diffusée en SSE via window.egenLogsUrl (voir @egen-civitas/egen) ;
//   · navigateur : console.*, erreurs non interceptées et promesses rejetées.
//  Le store vit au niveau du module : il capte même zone fermée, et sert la zone basse à l'ouverture.
// =============================================================================

export type LogLevel = 'error' | 'warn' | 'success' | 'info' | 'debug';
export const LOG_LEVELS: readonly LogLevel[] = ['error', 'warn', 'success', 'info', 'debug'];

export type LogConnection = 'connecting' | 'live' | 'unavailable' | 'disabled';

export interface LogLine {
  uid: number;
  ts: number;
  source: string;
  level: LogLevel;
  /** Ligne brute (séquences ANSI conservées pour le terminal). */
  message: string;
  origin: 'terminal' | 'browser';
}

export const MAX_LINES = 5000;
export const BROWSER_SOURCE = 'navigateur';

export interface LogState {
  lines: readonly LogLine[];
  /** Nombre de lignes par niveau (sur tout le tampon). */
  counts: Readonly<Record<LogLevel, number>>;
  /** Flux terminal : `disabled` hors `egen develop` (aucune URL de logs). */
  connection: LogConnection;
  /** Lignes reçues depuis la mise en pause, non encore affichées. */
  paused: boolean;
  pending: number;
}

const emptyCounts = (): Record<LogLevel, number> => ({ error: 0, warn: 0, success: 0, info: 0, debug: 0 });

let lines: LogLine[] = [];
let held: LogLine[] = [];
let counts = emptyCounts();
let connection: LogConnection = 'disabled';
let paused = false;
let uid = 1;
let lastTerminalId = 0;
let snapshot: LogState = build();
const listeners = new Set<() => void>();
let scheduled = false;

function build(): LogState {
  return { lines, counts, connection, paused, pending: held.length };
}

function emit() {
  if (scheduled) return;
  scheduled = true;
  // Regroupe les rafales (build, HMR) en un seul rendu par frame.
  const run = () => {
    scheduled = false;
    snapshot = build();
    listeners.forEach((listener) => listener());
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  else setTimeout(run, 16);
}

function append(batch: LogLine[]) {
  if (batch.length === 0) return;
  const next = lines.concat(batch);
  const dropped = next.length > MAX_LINES ? next.splice(0, next.length - MAX_LINES) : [];
  lines = next;
  for (const line of batch) counts[line.level]++;
  if (dropped.length > 0) for (const line of dropped) counts[line.level]--;
  counts = { ...counts };
}

function ingest(line: Omit<LogLine, 'uid'>) {
  const entry = { ...line, uid: uid++ };
  if (paused) held.push(entry);
  else append([entry]);
  emit();
}

/** Niveau déduit du texte (même logique que le hub du terminal). */
export function detectLevel(message: string): LogLevel {
  const text = stripAnsi(message);
  if (/\b(error|erreur|fatal|failed|exception)\b|✖|✘/i.test(text)) return 'error';
  if (/\b(warn|warning|avertissement|deprecated)\b|⚠/i.test(text)) return 'warn';
  if (/\b(success|succeeded|compiled|ready|done|listening|built)\b|✔|✓/i.test(text)) return 'success';
  if (/\b(debug|trace|verbose)\b/i.test(text)) return 'debug';
  return 'info';
}

// -- API publique -----------------------------------------------------------------------

export const logStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => snapshot,
};

export function clearLogs() {
  lines = [];
  held = [];
  counts = emptyCounts();
  emit();
}

export function setLogsPaused(value: boolean) {
  if (paused === value) return;
  paused = value;
  if (!value && held.length > 0) {
    const batch = held;
    held = [];
    append(batch);
  }
  emit();
}

/** Ajoute une ligne applicative (utile aux apps et aux tests). */
export function pushLog(level: LogLevel, message: string, source = BROWSER_SOURCE) {
  ingest({ ts: Date.now(), source, level, message, origin: 'browser' });
}

// -- Capture : console du navigateur -----------------------------------------------------

function format(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack || `${value.name}: ${value.message}`;
  try {
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  } catch {
    return String(value);
  }
}

const CONSOLE_LEVELS = { log: undefined, info: 'info', debug: 'debug', warn: 'warn', error: 'error' } as const;
const CAPTURE_FLAG = '__egenLogsCaptureInstalled__';

function captureBrowser() {
  const flags = window as unknown as Record<string, unknown>;
  if (flags[CAPTURE_FLAG]) return;
  flags[CAPTURE_FLAG] = true;

  for (const method of Object.keys(CONSOLE_LEVELS) as Array<keyof typeof CONSOLE_LEVELS>) {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      original(...args);
      try {
        const message = args.map(format).join(' ');
        ingest({
          ts: Date.now(),
          source: BROWSER_SOURCE,
          level: CONSOLE_LEVELS[method] ?? detectLevel(message),
          message,
          origin: 'browser',
        });
      } catch {
        // la capture ne doit jamais casser un console.*
      }
    };
  }

  window.addEventListener('error', (event) => {
    pushLog('error', event.error ? format(event.error) : event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    pushLog('error', `Promesse rejetée non gérée : ${format(event.reason)}`);
  });
}

// -- Capture : terminal (SSE) ----------------------------------------------------------

interface TerminalEntry {
  id: number;
  ts: number;
  source: string;
  level: LogLevel;
  message: string;
}

function setConnection(value: LogConnection) {
  if (connection !== value) {
    connection = value;
    emit();
  }
}

function connectTerminal(baseUrl: string) {
  if (typeof EventSource === 'undefined') return setConnection('disabled');
  setConnection('connecting');
  const source = new EventSource(`${baseUrl}/stream`);

  source.onopen = () => setConnection('live');
  // EventSource se reconnecte seul avec Last-Event-ID : le serveur ne renvoie que les lignes manquantes.
  source.onerror = () => setConnection(source.readyState === EventSource.CLOSED ? 'unavailable' : 'connecting');
  source.onmessage = (event) => {
    try {
      const entry = JSON.parse(event.data) as TerminalEntry;
      if (entry.id <= lastTerminalId) return;
      lastTerminalId = entry.id;
      ingest({ ts: entry.ts, source: entry.source, level: entry.level, message: entry.message, origin: 'terminal' });
    } catch {
      // trame illisible : ignorée
    }
  };
}

let started = false;

/** Démarre la capture (idempotent) : console du navigateur + flux terminal s'il est disponible. */
export function startLogCapture() {
  if (started || typeof window === 'undefined') return;
  started = true;
  captureBrowser();
  const url = (window as unknown as { egenLogsUrl?: string }).egenLogsUrl;
  if (url) connectTerminal(url.replace(/\/$/, ''));
}

// -- Hooks -------------------------------------------------------------------------------

export function useLogs(): LogState {
  return useSyncExternalStore(logStore.subscribe, logStore.getSnapshot, logStore.getSnapshot);
}

export function useLogStats() {
  return useLogs().counts;
}

/** Remet le store à zéro (tests uniquement). */
export function resetLogStoreForTests() {
  lines = [];
  held = [];
  counts = emptyCounts();
  paused = false;
  connection = 'disabled';
  lastTerminalId = 0;
  snapshot = build();
}
