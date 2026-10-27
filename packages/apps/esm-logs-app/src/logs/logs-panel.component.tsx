import React, { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownToLine, Check, Copy, Download, Pause, Play, Search, Trash2, WrapText } from 'lucide-react';
import * as framework from '@egen-civitas/esm-framework';
import { parseAnsi, stripAnsi } from './ansi';
import {
  clearLogs,
  LOG_LEVELS,
  setLogsPaused,
  useLogs,
  type LogConnection,
  type LogLevel,
  type LogLine,
} from './log-store';
import styles from './logs-panel.scss';

// =============================================================================
//  LOGS SYSTÈME — contenu de la zone basse
//
//  Affiche, en temps réel, la sortie complète du terminal (`egen develop`) et la console du
//  navigateur : couleurs d'origine (ANSI) conservées, niveaux colorés (erreur, avertissement,
//  succès, info, debug), filtres, recherche, pause, copie et export.
//
//  Les contrôles (recherche, niveaux, source, actions) vivent dans l'EN-TÊTE de la zone, entre le
//  titre et le bouton de fermeture (ToolWindowHeader) ; la zone ne garde que la liste et la barre d'état.
// =============================================================================

/**
 * Emplacement d'en-tête de la zone (framework ≥ 2.1). Le shell fournit sa propre copie du framework :
 * s'il est plus ancien, `ToolWindowHeader` est absent et la barre d'outils reste en tête du panneau
 * plutôt que de faire planter le montage (React #130).
 */
const InlineToolbar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className={styles.inlineToolbar}>{children}</div>
);
const ToolWindowHeader: React.FC<{ children: React.ReactNode }> =
  (framework as { ToolWindowHeader?: React.FC<{ children: React.ReactNode }> }).ToolWindowHeader ?? InlineToolbar;

const PAGE = 1500;
const ALL = '*';
const COPIED_MS = 1600;

const pad = (n: number, size = 2) => String(n).padStart(size, '0');
function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

/** Copie dans le presse-papiers ; repli `execCommand` hors contexte sécurisé (http sur le réseau local). */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // refusé (permission, contexte non sécurisé) : repli ci-dessous
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

const LogRow = React.memo(function LogRow({ line }: { line: LogLine }) {
  const segments = useMemo(() => parseAnsi(line.message), [line.message]);
  return (
    <div className={styles.row} data-level={line.level} role="listitem">
      <time className={styles.time}>{formatTime(line.ts)}</time>
      <span className={styles.source} title={line.source}>
        {line.source}
      </span>
      <span className={styles.message}>
        {segments.map((segment, index) => (
          <span
            key={index}
            style={{ color: segment.color }}
            data-bold={segment.bold || undefined}
            data-dim={segment.dim || undefined}
            data-italic={segment.italic || undefined}
            data-underline={segment.underline || undefined}
          >
            {segment.text}
          </span>
        ))}
      </span>
    </div>
  );
});

/**
 * Hauteur utile de la zone du workbench qui porte le panneau (zone moins son en-tête), ou `undefined`
 * hors zone. Le contenu d'une zone n'a qu'un `min-height` : un `height: 100%` ne s'y résout pas et
 * c'est tout le panneau qui défilerait. En fixant la hauteur, seule la liste défile. L'en-tête est
 * observé aussi : ses contrôles peuvent en changer la hauteur.
 */
function useZoneHeight(ref: React.RefObject<HTMLElement>): number | undefined {
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const zone = ref.current?.closest<HTMLElement>('aside[data-anchor]');
    if (!zone) return;
    const header = zone.querySelector<HTMLElement>(':scope > header');
    const update = () => setHeight(Math.max(0, Math.floor(zone.clientHeight - (header?.offsetHeight ?? 0))));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(zone);
    if (header) observer.observe(header);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}

const LogsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { lines, counts, connection, paused, pending } = useLogs();

  const [query, setQuery] = useState('');
  const [enabled, setEnabled] = useState<Record<LogLevel, boolean>>({
    error: true,
    warn: true,
    success: true,
    info: true,
    debug: true,
  });
  const [source, setSource] = useState(ALL);
  const [wrap, setWrap] = useState(true);
  const [follow, setFollow] = useState(true);
  const [copied, setCopied] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const copiedTimer = useRef<number>();
  const zoneHeight = useZoneHeight(panelRef);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const sources = useMemo(() => Array.from(new Set(lines.map((line) => line.source))).sort(), [lines]);

  // Une source filtrée qui disparaît (logs effacés) ne doit pas laisser une liste vide inexplicable.
  useEffect(() => {
    if (source !== ALL && !sources.includes(source)) setSource(ALL);
  }, [source, sources]);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return lines.filter(
      (line) =>
        enabled[line.level] &&
        (source === ALL || line.source === source) &&
        (needle === '' ||
          stripAnsi(line.message).toLowerCase().includes(needle) ||
          line.source.toLowerCase().includes(needle)),
    );
  }, [lines, enabled, source, deferredQuery]);

  const visible = filtered.length > limit ? filtered.slice(filtered.length - limit) : filtered;

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Suivi du bas : actif tant que l'utilisateur n'a pas remonté dans la liste.
  useEffect(() => {
    if (follow) scrollToBottom();
  }, [visible, follow, scrollToBottom]);

  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (el) setFollow(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
  }, []);

  const toggleFollow = () => {
    if (!follow) scrollToBottom();
    setFollow(!follow);
  };

  const toggleLevel = (level: LogLevel) => setEnabled((current) => ({ ...current, [level]: !current[level] }));

  const asText = () =>
    filtered
      .map(
        (line) =>
          `${new Date(line.ts).toISOString()} [${line.source}] ${line.level.toUpperCase()} ${stripAnsi(line.message)}`,
      )
      .join('\n');

  const copy = async () => {
    if (filtered.length === 0 || !(await copyText(asText()))) return;
    setCopied(true);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
  };

  const download = () => {
    if (filtered.length === 0) return;
    const url = URL.createObjectURL(new Blob([asText()], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `egen-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    document.body.appendChild(link); // requis par certains navigateurs pour déclencher le téléchargement
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const label = (key: string, fallback: string) => t(key, fallback);
  const noLines = filtered.length === 0;

  return (
    <section
      ref={panelRef}
      className={styles.panel}
      style={zoneHeight ? { height: zoneHeight } : undefined}
      aria-label={t('logs', 'Logs système')}
    >
      <ToolWindowHeader>
        <div className={styles.tools}>
          <label className={styles.search}>
            <Search size={13} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('search', 'Rechercher dans les logs')}
              aria-label={t('search', 'Rechercher dans les logs')}
            />
          </label>

          <div className={styles.levels} role="group" aria-label={t('levels', 'Niveaux')}>
            {LOG_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={styles.chip}
                data-level={level}
                aria-pressed={enabled[level]}
                onClick={() => toggleLevel(level)}
              >
                {levelLabel(level, label)}
                <b>{counts[level]}</b>
              </button>
            ))}
          </div>

          <select
            className={styles.select}
            value={source}
            onChange={(event) => setSource(event.target.value)}
            aria-label={t('source', 'Source')}
          >
            <option value={ALL}>{t('allSources', 'Toutes les sources')}</option>
            {sources.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <span className={styles.separator} aria-hidden="true" />

          <div className={styles.actions} role="toolbar" aria-label={t('actions', 'Actions')}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setLogsPaused(!paused)}
              aria-pressed={paused}
              aria-label={paused ? t('resume', 'Reprendre') : t('pause', 'Pause')}
              title={paused ? t('resume', 'Reprendre') : t('pause', 'Pause')}
            >
              {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={toggleFollow}
              aria-pressed={follow}
              aria-label={t('follow', 'Suivre les nouveaux logs')}
              title={t('follow', 'Suivre les nouveaux logs')}
            >
              <ArrowDownToLine size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setWrap(!wrap)}
              aria-pressed={wrap}
              aria-label={t('wrap', 'Retour à la ligne')}
              title={t('wrap', 'Retour à la ligne')}
            >
              <WrapText size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => void copy()}
              disabled={noLines}
              data-done={copied || undefined}
              aria-label={copied ? t('copied', 'Copié') : t('copy', 'Copier')}
              title={copied ? t('copied', 'Copié') : t('copy', 'Copier')}
            >
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={download}
              disabled={noLines}
              aria-label={t('download', 'Télécharger (.log)')}
              title={t('download', 'Télécharger (.log)')}
            >
              <Download size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={clearLogs}
              disabled={lines.length === 0}
              aria-label={t('clear', 'Effacer')}
              title={t('clear', 'Effacer')}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </ToolWindowHeader>

      <div
        ref={listRef}
        className={styles.list}
        data-wrap={wrap}
        role="list"
        onScroll={onScroll}
        data-testid="logs-list"
      >
        {filtered.length > visible.length && (
          <button type="button" className={styles.more} onClick={() => setLimit(limit + PAGE)}>
            {t('older', '{{n}} lignes plus anciennes — afficher', { n: filtered.length - visible.length })}
          </button>
        )}
        {visible.map((line) => (
          <LogRow key={line.uid} line={line} />
        ))}
        {visible.length === 0 && (
          <p className={styles.empty}>
            {lines.length === 0
              ? t('empty', 'En attente de logs…')
              : t('noMatch', 'Aucun log ne correspond aux filtres')}
          </p>
        )}
      </div>

      <footer className={styles.status}>
        <span className={styles.connection} data-state={connection}>
          {connectionLabel(connection, label)}
        </span>
        <span>{t('lineCount', '{{shown}} / {{total}} lignes', { shown: filtered.length, total: lines.length })}</span>
        {paused && (
          <span className={styles.paused}>{t('pausedPending', 'En pause — {{n}} en attente', { n: pending })}</span>
        )}
      </footer>
    </section>
  );
};

type Label = (key: string, fallback: string) => string;

// Appels t() littéraux : l'extracteur i18next ne sait pas lire des clés calculées.
function levelLabel(level: LogLevel, t: Label): string {
  switch (level) {
    case 'error':
      return t('levelError', 'Erreurs');
    case 'warn':
      return t('levelWarn', 'Avertissements');
    case 'success':
      return t('levelSuccess', 'Succès');
    case 'info':
      return t('levelInfo', 'Infos');
    default:
      return t('levelDebug', 'Debug');
  }
}

function connectionLabel(state: LogConnection, t: Label): string {
  switch (state) {
    case 'live':
      return t('connLive', 'Terminal connecté — temps réel');
    case 'connecting':
      return t('connConnecting', 'Connexion au terminal…');
    case 'unavailable':
      return t('connUnavailable', 'Terminal indisponible (reconnexion impossible)');
    default:
      return t('connDisabled', 'Console du navigateur uniquement (lancer avec egen develop pour le terminal)');
  }
}

export default LogsPanel;
